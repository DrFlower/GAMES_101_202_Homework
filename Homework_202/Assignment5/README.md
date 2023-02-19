![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_top.png)

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_joint_bilateral_filtering.png)

## 作业总览

1. 使用联合双边滤波实现单帧降噪。
2. 实现两帧间的投影。
3. 实现两帧间的累积（时域上降噪）。
4. Bouns 1：实现A-Trous Wavelet加速单帧降噪。

## 源码

[GAMES101&202 Homework](https://github.com/DrFlower/GAMES_101_202_Homework)

## 作业流程

使用作业内的``build.bat``文件构建出作业工程，作业所有内容只需要在构建出来的工程的``denoiser.cpp``文件里实现，其中``Filter``函数实现单帧降噪，``Reprojection``函数实现两帧之间投影，``TemporalAccumulation``函数实现时域上降噪，而提高部分也是在这个文件中基于``Filter``函数来修改即可。

作业输入的数据需要另外在论坛下载[GAMES BBS-作业5发布公告](http://games-cn.org/forums/topic/zuoye5fabugonggao/)，下载后把examples文件夹放到与工程同一个目录下。

工程输入和输出都是一张张``.exr``图片格式的文件，为了方便观察结果，我们可以用作业内的``image2video``脚本把输出结果转换为视频，脚本同样要放在与工程同一个目录下。另外这个脚本要求我们电脑装有[ffmpeg](https://ffmpeg.org/)，没装的可以到官网上下载。

## 实现


### 联合双边滤波

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_ppt_joint_bilateral_filtering.png)

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_ppt_joint_bilateral_filtering_example.png)


对于降噪，我们可以通过滤波把噪声信号过滤掉，最简单的一种是高斯滤波，高斯滤波对于某个像素的最终颜色会考虑其周围所有像素的颜色贡献，且贡献权重随着像素距离而减少，最终达到去除高频信号的目的。但这种滤波会把物体的边界也模糊掉，我们通常希望只去掉噪声而维持物体边界锐利，所以进一步有了双边滤波，跨越物体的边界常常伴随着颜色的剧烈变化，基于这一点，双边滤波在距离的基础上，考虑上了颜色，若两个像素之间颜色差距越大，则贡献越小，从而保留边缘信息。而联合双边滤波则是考虑更多的参考信息，如深度和法线，从而更好地指导过滤操作。

作业中，我们使用的联合双边滤波核定义如下：

$$
J(i,j) = \exp(-\frac{\lVert i-j\lVert ^2}{2\sigma_{p}^2} - \frac{\lVert \widetilde{C}[i] - \widetilde{C}[j] \lVert ^2 }{2\sigma_{c}^2} - \frac{D_{normal}(i,j)^2}{2\sigma_{n}^2} - \frac{D_{plane}(i,j)^2}{2\sigma_{d}^2})
$$

其中

$$
D_{normal}(i,j) = arccos(Normal[i] \cdot Normal[j])
$$

$$
D_{plane}(i,j) = Normal[i]\cdot \frac{Position[j] - Position[i]}{\lVert Position[j] - Positon[i] \lVert}
$$

其中$\widetilde{C}$为有噪声的输入图像，$D_{normal}$为两法线夹角，$D_{plane}$为深度差值指标。

公式中的各个σ值在``Denoiser``类中有提供。

```cpp
Buffer2D<Float3> Denoiser::Filter(const FrameInfo &frameInfo) {
    int height = frameInfo.m_beauty.m_height;
    int width = frameInfo.m_beauty.m_width;
    Buffer2D<Float3> filteredImage = CreateBuffer2D<Float3>(width, height);
    int kernelRadius = 32;
#pragma omp parallel for
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            // TODO: Joint bilateral filter
            // filteredImage(x, y) = frameInfo.m_beauty(x, y);

            int x_start = std::max(0, x - kernelRadius);
            int x_end = std::min(width - 1, x + kernelRadius);
            int y_start = std::max(0, y - kernelRadius);
            int y_end = std::min(height - 1, y + kernelRadius);

            auto center_postion = frameInfo.m_position(x, y);
            auto center_normal = frameInfo.m_normal(x, y);
            auto center_color = frameInfo.m_beauty(x, y);

            Float3 final_color;
            auto total_weight = .0f;

            for (int m = x_start; m <= x_end; m++) {
                for (int n = y_start; n <= y_end; n++) {

                    auto postion = frameInfo.m_position(m, n);
                    auto normal = frameInfo.m_normal(m, n);
                    auto color = frameInfo.m_beauty(m, n);

                    auto d_position = SqrDistance(center_postion, postion) /
                                      (2.0f * m_sigmaCoord * m_sigmaCoord);
                    auto d_color = SqrDistance(center_color, color) /
                                   (2.0f * m_sigmaColor * m_sigmaColor);
                    auto d_normal = SafeAcos(Dot(center_normal, normal));
                    d_normal *= d_normal;
                    d_normal / (2.0f * m_sigmaNormal * m_sigmaNormal);

                    float d_plane = .0f;
                    if (d_position > 0.f) {
                        d_plane = Dot(center_normal, Normalize(postion - center_postion));
                    }
                    d_plane *= d_plane;
                    d_plane /= (2.0f * m_sigmaPlane * m_sigmaPlane);

                    float weight = std::exp(-d_plane - d_position - d_color - d_normal);
                    total_weight += weight;
                    final_color += color * weight;
                }
            }

            filteredImage(x, y) = final_color / total_weight;
        }
    }
    return filteredImage;
}
```

降噪前：

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_input.png)

降噪后：

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_joint_bilateral_filtering.png)


### 两帧间的投影

这一步主要是找出当前帧的每个像素在上一帧对应是哪个像素（若物体或摄像机移动，对应的像素位置会发生变化），以方便我们后续累积帧信息。

$$
Screen_{i-1} = P_{i-1}V_{i-1}M_{i-1}M_{i}^{-1}World_{i}
$$

我们可以按照以上变换来求上一帧对应的像素点，框架已经提供了公式中必要的数据。

这个过程我们是通过矩阵变换来找的，这可能会发生一些情况导致变换后上一帧的像素点是不会累积到当前像素点的，例如当前像素点是新的物体进入屏幕内的情况、当前像素点对应的物体和变换后上一帧的像素点对应的物体不是同一个物体的情况，若这些情况不处理，在做多帧累积时会造成拖影现象。

需要引入像素点是否合法判断：

1. 上一帧是否在屏幕内。
2. 上一帧和当前帧的物体的标号。

```cpp
void Denoiser::Reprojection(const FrameInfo &frameInfo) {
    int height = m_accColor.m_height;
    int width = m_accColor.m_width;
    Matrix4x4 pre_World_To_Screen =
        m_preFrameInfo.m_matrix[m_preFrameInfo.m_matrix.size() - 1];
#pragma omp parallel for
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            // TODO: Reproject
            m_valid(x, y) = false;
            m_misc(x, y) = Float3(0.f);

            int id = frameInfo.m_id(x, y);
            if (id == -1) {
                continue;
            }
            Matrix4x4 world_to_local = Inverse(frameInfo.m_matrix[id]);
            Matrix4x4 pre_local_to_world = m_preFrameInfo.m_matrix[id];
            auto world_position = frameInfo.m_position(x, y);
            auto pre_local_position =
                world_to_local(world_position, Float3::EType::Point);
            auto pre_world_position =
                pre_local_to_world(pre_local_position, Float3::EType::Point);
            auto pre_screen_position =
                pre_World_To_Screen(pre_world_position, Float3::EType::Point);

            if (pre_screen_position.x < 0 || pre_screen_position.x >= width ||
                pre_screen_position.y < 0 || pre_screen_position.y >= height) {
                continue;
            } else {
                int pre_id =
                    m_preFrameInfo.m_id(pre_screen_position.x, pre_screen_position.y);
                if (pre_id == id) {
                    m_valid(x, y) = true;
                    m_misc(x, y) =
                        m_accColor(pre_screen_position.x, pre_screen_position.y);
                }
            }
        }
    }
    std::swap(m_misc, m_accColor);
}

```

代码中一共做了3步变换，其中world_to_local对应$M_{i}^{-1}$，pre_local_to_world对应$M_{i-1}$，pre_World_To_Screen对应$P_{i-1}V_{i-1}$。

### 两帧间的累积

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_ppt_temporal_clamping.png)

把已降噪的当前帧与已降噪的上一帧结合，公式如下：

$$
\overline{C}_{i} \leftarrow \alpha \overline{C}_{i} + (1-\alpha) Clamp(\overline{C}_{i-1})
$$

对于Clamp部分，首先需要计算$\overline{C}_{i}$在7x7的邻域内的均值μ和方差σ，然后把上一帧的颜色$\overline{C}_{i-1}$Clamp在$(\mu - k\sigma, \mu + k \sigma)$范围内。

```cpp
void Denoiser::TemporalAccumulation(const Buffer2D<Float3> &curFilteredColor) {
    int height = m_accColor.m_height;
    int width = m_accColor.m_width;
    int kernelRadius = 3;
#pragma omp parallel for
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            // TODO: Temporal clamp
            Float3 color = m_accColor(x, y);
            // TODO: Exponential moving average
            float alpha = 1.0f;

            if (m_valid(x, y)) {
                alpha = m_alpha;

                int x_start = std::max(0, x - kernelRadius);
                int x_end = std::min(width - 1, x + kernelRadius);
                int y_start = std::max(0, y - kernelRadius);
                int y_end = std::min(height - 1, y + kernelRadius);

                Float3 mu(0.f);
                Float3 sigma(0.f);

                for (int m = x_start; m <= x_end; m++) {
                    for (int n = y_start; n <= y_end; n++) {
                        mu += curFilteredColor(m, n);
                        sigma += Sqr(curFilteredColor(x, y) - curFilteredColor(m, n));
                    }
                }

                int count = kernelRadius * 2 + 1;
                count *= count;

                mu /= float(count);
                sigma = SafeSqrt(sigma / float(count));
                color = Clamp(color, mu - sigma * m_colorBoxK, mu + sigma * m_colorBoxK);
            }

            m_misc(x, y) = Lerp(color, curFilteredColor(x, y), alpha);
        }
    }
    std::swap(m_misc, m_accColor);
}
```

直接用代码实现公式即可。

TemporalAccumulation实现前：

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_Filter.gif)

TemporalAccumulation实现后：

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_TemporalAccumulation.gif)

### A-Trous Wavelet 加速单帧降噪

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_ppt_progressively_growing_sizes.png)

课程PPT给的这个图不好理解，一个方面是用一维来演示，另一方面是i=2的情况下是没画完的，很容易被误导了，我另外补充一张图给大家参考理解下。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_A-Trous_Wavelet.png)

以$16^2$大小的滤波为例，我们拆成3次$5^2$的滤波，虽然每次采样的像素点都是$5^2$个，但是每轮采样像素点的间隔不一样，间隔以$2^i$增长，且i从0开始。

我们参照原本的Filter实现修改一下选取像素点的逻辑。

```cpp
Buffer2D<Float3> Denoiser::ATrousWaveletFilter(const FrameInfo &frameInfo) {
    int height = frameInfo.m_beauty.m_height;
    int width = frameInfo.m_beauty.m_width;
    Buffer2D<Float3> filteredImage = CreateBuffer2D<Float3>(width, height);
#pragma omp parallel for
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            // TODO: Joint bilateral filter
            // filteredImage(x, y) = frameInfo.m_beauty(x, y);

            auto center_postion = frameInfo.m_position(x, y);
            auto center_normal = frameInfo.m_normal(x, y);
            auto center_color = frameInfo.m_beauty(x, y);

            Float3 final_color;
            auto total_weight = .0f;

            int passes = 5;
            for (int pass = 0; pass < passes; pass++) {

                for (int filterX = -2; filterX <= 2; filterX++) {
                    for (int filterY = -2; filterY <= 2; filterY++) {

                        int m = x + std::pow(2, pass) * filterX;
                        int n = y + std::pow(2, pass) * filterY;

                        auto postion = frameInfo.m_position(m, n);
                        auto normal = frameInfo.m_normal(m, n);
                        auto color = frameInfo.m_beauty(m, n);

                        auto d_position = SqrDistance(center_postion, postion) /
                                          (2.0f * m_sigmaCoord * m_sigmaCoord);
                        auto d_color = SqrDistance(center_color, color) /
                                       (2.0f * m_sigmaColor * m_sigmaColor);
                        auto d_normal = SafeAcos(Dot(center_normal, normal));
                        d_normal *= d_normal;
                        d_normal / (2.0f * m_sigmaNormal * m_sigmaNormal);

                        float d_plane = .0f;
                        if (d_position > 0.f) {
                            d_plane =
                                Dot(center_normal, Normalize(postion - center_postion));
                        }
                        d_plane *= d_plane;
                        d_plane /= (2.0f * m_sigmaPlane * m_sigmaPlane);

                        float weight =
                            std::exp(-d_plane - d_position - d_color - d_normal);
                        total_weight += weight;
                        final_color += color * weight;
                    }
                }
            }

            filteredImage(x, y) = final_color / total_weight;
        }
    }
    return filteredImage;
}
```

效果如下：

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_A-Trous_Wavelet_frist_frame.png)

接上累积帧信息的话，动态效果如下：

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment5/README_IMG/games202-homework5_A-Trous_Wavelet_final.gif)

可以看到一开始几帧有比较明显的噪声，后面效果则明显变好。

总的来说，A-Trous Wavelet优化后，单帧降噪效果是明显比优化前差的，但是在时域降噪的作用下还是可以得到不错的效果，最主要是在耗时上得到了非常明显的优化，在我电脑上测试生成耗时，对于box这套资源，在$64^2$大小的滤波下，优化前需要104秒，而优化后仅仅需要6秒。
