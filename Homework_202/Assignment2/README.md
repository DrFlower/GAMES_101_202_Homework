![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_top.webp)

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/ganes202-homework2_final.gif)

## 作业总览

1. 预计算球谐系数
	- 预计算环境光投影到球谐函数上的对应的系数
	- 预计算diffuse unshadowed情况的漫反射传输项球谐系数
	- 预计算diffuse shadowed情况的漫反射传输项球谐系数
	- 预计算diffuse inter-reflection情况的漫反射传输项球谐系数(Bonus 1)
2. 实时球谐光照计算
3. 环境光球谐旋转(Bonus 2)

## 源码

[GAMES101&202 Homework](https://github.com/DrFlower/GAMES_101_202_Homework)

## 关于对球谐函数与PRT的理解

### 球谐函数

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_ppt_3.png)

可能很多人跟我一样第一次看到这张图时都觉得它抽象到离谱，不过问题不大，作为工程师，我们应该先着重解决工程部分问题，把关于基函数怎么来、为什么等问题先抛到一边，我们只需要知道球谐函数有哪些性质，如何使用球谐函数等即可。

如果你认为自己对球谐函数的了解还是非常欠缺，那么这篇通俗而又优秀的文章可以帮到你：

[球谐函数介绍（Spherical Harmonics）](https://zhuanlan.zhihu.com/p/351289217)

202课程本身也没讨论球谐函数的基函数是怎么来的，如果你想深究其数学本质，那么可以看以下这篇文章：

[球谐光照——球谐函数](https://zhuanlan.zhihu.com/p/153352797)
### PRT

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_ppt_1.png)

当对球谐函数有基本的了解后，就可以看如何把它应用到我们的PRT实现上了，这部分如果有不清楚的地方，建议重复观看课程第六集``1:10:00-1:25:18``部分，作业要做的基础部分的实现，都在这了，实际上我们要做的事情并不复杂。

特别补充一下我在第一次观看课程时产生过的疑问，也是弹幕里很多人提到疑问，就是``如果预计算是考虑上Visibility项的话，那岂不是不能移动摄像机？毕竟移动摄像机遮挡关系会发生变化``，出现这种疑问主要是因为误以为Visibility项的值是取决于Shading Point与摄像机方向的遮挡关系，其实不是，这里Visibility项的值是取决于Shading Point与环境光的遮挡关系，对于静态场景来说，某个Shading Point对某个方向的环境光是否被其他物体遮挡，完全取决于场景本身，跟摄像机在哪，朝向哪，甚至存不存在摄像机都没关系。

另外再补充一个非常不错的课外资料：

[Spherical Harmonic Lighting - the gritty details.pdf](http://www.cse.chalmers.se/~uffe/xjobb/Readings/GlobalIllumination/Spherical%20Harmonic%20Lighting%20-%20the%20gritty%20details.pdf)

## 作业流程

本作业框架分为两部分，一部分是nori部分，需要用cmake构建出相应工程，另一部分是与作业1一样的webgl+js实时渲染框架。我们需要在nori工程下完成预计算部分实现，并把预计算生成的``light.txt``(光照球谐系数数据)和``transport.txt``（传输线球谐系数数据）两个文件拷贝到实时渲染框架对应目录下，然后在实时渲染框架下完成利用预计算数据完成球谐光照渲染，并实现环境光旋转。

## nori框架在Windows下编译问题

在win10+vs2022环境下，cmake后，在vs编译出现了``<lambda_9ed74708f63acbd4deb1a7dc36ea3ac3>::operator()``的报错。

这个问题我在课程BBS讨论区找到了解决方案:

> MSVC 对于代码中的中文字符支持有问题（应该是会吞换行符），需要启用 utf-8 编译选项：
>
>在 prt/CMakeLists.txt 112 行添加：  
`target_compile_options(nori PUBLIC /utf-8) # MSVC unicode support`

[关于作业2开头编译的困惑 - 来自用户YunHsiao的回答](https://games-cn.org/forums/topic/guanyuzuoye2kaitoubianyidekunhuo/)


假如你编译时遇到``无法打开输入文件：nanogui.lib``的报错，可以尝试删除构建工程，重新执行camke构建后再试。

## 实现

### 环境光的球谐系数

```cpp
// prt.cpp

template <size_t SHOrder>
std::vector<Eigen::Array3f> PrecomputeCubemapSH(const std::vector<std::unique_ptr<float[]>> &images,
                                                const int &width, const int &height,
                                                const int &channel)
{
    
    // ...

    constexpr int SHNum = (SHOrder + 1) * (SHOrder + 1);
    std::vector<Eigen::Array3f> SHCoeffiecents(SHNum);
    for (int i = 0; i < SHNum; i++)
        SHCoeffiecents[i] = Eigen::Array3f(0);
    float sumWeight = 0;
    for (int i = 0; i < 6; i++)
    {
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                // TODO: here you need to compute light sh of each face of cubemap of each pixel
                // TODO: 此处你需要计算每个像素下cubemap某个面的球谐系数
                Eigen::Vector3f dir = cubemapDirs[i * width * height + y * width + x];
                int index = (y * width + x) * channel;
                Eigen::Array3f Le(images[i][index + 0], images[i][index + 1],
                                  images[i][index + 2]);

                // Edit Start
                auto delta_w = CalcArea(x, y, width, height);

                for (int l = 0; l <= SHOrder; l++) {
                    for (int m = -l; m <= l; m++) {
                        auto basic_sh_proj = sh::EvalSH(l, m, Eigen::Vector3d(dir.x(), dir.y(), dir.z()).normalized());
                        SHCoeffiecents[sh::GetIndex(l, m)] += Le * basic_sh_proj * delta_w;
                    }
                }
                // Edit End
            }
        }
    }
    return SHCoeffiecents;
}
```

$$\widehat{SH}_{coeff} = \displaystyle\sum\limits_{i} L_{env}(\omega_{i}) \mathbf S \mathbf H(\omega_{o}) \Delta \omega_{i}$$
``PrecomputeCubemapSH``整个函数就是对以上公式的实现，外层有三层i、x、y的循环，其中i对应的cubemap六个面，x和y对应cubemap的像素，并以cubemap的像素对应的立体角作为微分单位，框架给出的Le变量就是公式中的$L_{env}(\omega_{i})$，然后我们可以借助框架内的函数``double EvalSH(int l, int m, const Eigen::Vector3d& dir)``求出某个基函数在某个方向上的值，函数要求传入第l阶，编号m来指定取哪个基函数，注意球谐函数阶数从0开始，在第l阶有2l+1个的基函数，对于l阶来说，基函数编号m范围为[-l , l]，最后还需要一个方向参数，注意方向需要归一化。我们遍历所有基函数求出光照函数在基函数上的投影，并把结果累加起来即可。由于我们用于储存结果系数的结构是个一维数组，而前面我们是通过l、m两个维度来索引一个基函数，我们可以通过`` int GetIndex(int l, int m)``来转换一下某个基函数在一维结构下的索引。

另外要注意计算要算上cubemap上这个像素对应的立体角的权重，也就是乘上函数``CalcArea`` 返回的结果delta_w。关于``CalcArea``的推导，可通过这个链接[CUBEMAP TEXEL SOLID ANGLE](https://www.rorydriscoll.com/2012/01/15/cubemap-texel-solid-angle/)了解。


### Diffuse Unshadowed和Diffuse Shadowed传输项球谐系数
![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_ppt_2.png)

```cpp
// prt.cpp

virtual void preprocess(const Scene *scene) override
{
    // ...

    // Projection transport
    m_TransportSHCoeffs.resize(SHCoeffLength, mesh->getVertexCount());
    fout << mesh->getVertexCount() << std::endl;
    for (int i = 0; i < mesh->getVertexCount(); i++)
    {
        const Point3f& v = mesh->getVertexPositions().col(i);
        const Normal3f& n = mesh->getVertexNormals().col(i);
        auto shFunc = [&](double phi, double theta) -> double {
            Eigen::Array3d d = sh::ToVector(phi, theta);
            const auto wi = Vector3f(d.x(), d.y(), d.z());
            // Edit Start
            double H = wi.normalized().dot(n.normalized());
            // Edit End
            if (m_Type == Type::Unshadowed)
            {
                // TODO: here you need to calculate unshadowed transport term of a given direction
                // TODO: 此处你需要计算给定方向下的unshadowed传输项球谐函数值
                return H > 0.0 ? H : 0;
            }
            else
            {
                // TODO: here you need to calculate shadowed transport term of a given direction
                // TODO: 此处你需要计算给定方向下的shadowed传输项球谐函数值
                if (H > 0.0 && !scene->rayIntersect(Ray3f(v, wi.normalized()))) {
                    return H;
                }
                return 0;
            }
        };
        auto shCoeff = sh::ProjectFunction(SHOrder, shFunc, m_SampleCount);
        for (int j = 0; j < shCoeff->size(); j++)
        {
	        // Edit Start
            m_TransportSHCoeffs.col(i).coeffRef(j) = (*shCoeff)[j] / M_PI;
	        // Edit End
        }
    }
    
    // ...
}
```

把顶点位置作为我们的Shading Point，计算每个顶点位置的传输项球谐系数。

理解``ProjectFunction``函数是我们完成这段代码的关键，通过这个函数，只需要指定球谐阶数、需要投影在基函数上的函数、采样数，该函数内部会根据采样数来选取采样方向，把方向作为参数传递到我们需要实现的Lambda函数中，然后取Lambda函数返回的结果投影在基函数上得到系数，最后把各个样本系数累加并乘以权重，最后得出该顶点的最终系数。

那么我们要做的就是在Lambda函数中根据参数$\omega_{i}$，计算出以下两个式子即可

#### Diffuse Unshadowed

$$\mathbf L_{DU} = \frac {\rho}{\pi}\int_S L_{i}(x, \omega_{i})max(N_{x} \cdot \omega_{i}, 0)d\omega_{i}$$
$L_{i}(x, \omega_{i})$是光照辐射度项，利用球谐函数的性质，我们把积分内的光照辐射度项和传输函数项分离了，并把光照辐射度项提出积分外，在这里，积分是在``ProjectFunction``函数内完成，对于不考虑阴影的漫反射情况，我们只需要计算$max(N_{x} \cdot \omega_{i}, 0)$，并作为Lambda函数的返回值即可。

#### Diffuse Shadowed

$$\mathbf L_{DS} = \frac {\rho}{\pi}\int_S L_{i}(x, \omega_{i})V(\omega_{i})max(N_{x} \cdot \omega_{i}, 0)d\omega_{i}$$

对于考虑自阴影的漫反射传输，我们加上Visibility项即可，Visibility项在这里是一个非1即0的值，所以我们利用框架提供的``bool rayIntersect(const Ray3f &ray)``函数，从顶点位置到采样方向反射一条射线，若击中物体，则认为被遮挡，有阴影，返回0，若射线未击中物体，则仍然返回$max(N_{x} \cdot \omega_{i}, 0)$即可。

最后会把``ProjectFunction``函数的返回值，写入到``m_TransportSHCoeffs``中，返回值就是积分后的值，注意我们公式中还有$\frac {\rho}{\pi}$没乘上，我们可以在这里乘上，这里的$\rho$其实就相当于$k_{d}$，这里我们直接取1，也就是最终我们需要把积分结果除以$\pi$再写入到``m_TransportSHCoeffs``中。

### 导出数据

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_vs_config.png)

预计算实现完成后，就可以编译启动程序了，但要令程序生成我们需要的预计算数据文件，需要运行程序时传参，传入的参数要求是配置文件``prt.xml``的路径，可以通过命令行传参，也可以把参数填入VS的**命令参数**配置项，这样在VS内启动可以自动传参。

```xml
// prt.xml

<integrator type="prt">
	<string name="type" value="shadowed" />
	<integer name="bounce" value="1" />
	<integer name="PRTSampleCount" value="100" />
	<string name="cubemap" value="cubemap/Indoor" />
</integrator>
```

在配置文件``prt.xml``中，我们只需要关注上面这些参数，其中``type``的``value``可以配置为unshadowed、shadowed、 interreflection，``bounce``为interreflection类型下的光线弹射次数，目前我们还没实现interreflection，``PRTSampleCount``为传输项每个顶点的采样数，``cubemap``为环境光的所用的cubemap路径，一共有CornellBox、GraceCathedral、Indoor、Skybox可选，我们可以用shadowed模式，依次填上4个cubemap的路径并依次生成后把生成的``light.txt``和``transport.txt``拷贝到实时渲染框架的对应cubemap目录中。

### 实时球谐光照计算

先按作业提示把``engine.js``文件中把88-114行取消注释，这部分代码为我们完成预计算数据解析工作，并储存到全局变量中。

如果已经做过作业1，相信你已经对这个框架有一定了解了，本文不过多讨论细节。

```js
//PRTMaterial.js

class PRTMaterial extends Material {

    constructor(vertexShader, fragmentShader) {

        super({
            'uPrecomputeL[0]': { type: 'precomputeL', value: null},
            'uPrecomputeL[1]': { type: 'precomputeL', value: null},
            'uPrecomputeL[2]': { type: 'precomputeL', value: null},
        }, 
        ['aPrecomputeLT'], 
        vertexShader, fragmentShader, null);
    }
}

async function buildPRTMaterial(vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new PRTMaterial(vertexShader, fragmentShader);

}
```

在materials文件夹下新增``PRTMaterial.js``文件，代码如上。

```html
//index.html

<script src="src/materials/Material.js" defer></script>
<script src="src/materials/ShadowMaterial.js" defer></script>
<script src="src/materials/PhongMaterial.js" defer></script>
<script src="src/materials/SkyBoxMaterial.js" defer></script>
<!-- Edit Start -->
<script src="src/materials/PRTMaterial.js" defer></script>
<!-- Edit End -->
```

在``index.html``补上对新文件的引入。

```js
//loadOBJ.js

switch (objMaterial) {
	case 'PhongMaterial':
		material = buildPhongMaterial(colorMap, mat.specular.toArray(), light, Translation, Scale, "./src/shaders/phongShader/phongVertex.glsl", "./src/shaders/phongShader/phongFragment.glsl");
		shadowMaterial = buildShadowMaterial(light, Translation, Scale, "./src/shaders/shadowShader/shadowVertex.glsl", "./src/shaders/shadowShader/shadowFragment.glsl");
		break;
	// TODO: Add your PRTmaterial here

	//Edit Start
	case 'PRTMaterial':
		material = buildPRTMaterial("./src/shaders/prtShader/prtVertex.glsl", "./src/shaders/prtShader/prtFragment.glsl");
		break;
	//Edit End

	// ...
}
```

在``loadOBJ.js``中支持新的PRT材质加载。

```js
//engine.js

// TODO: load model - Add your Material here
// loadOBJ(renderer, 'assets/bunny/', 'bunny', 'addYourPRTMaterial', boxTransform);
// loadOBJ(renderer, 'assets/bunny/', 'bunny', 'addYourPRTMaterial', box2Transform);

// Edit Start
let maryTransform = setTransform(0, -35, 0, 20, 20, 20);
loadOBJ(renderer, 'assets/mary/', 'mary', 'PRTMaterial', maryTransform);
// Edit End
```

给场景添加mary模型，并使用新增的PRTMaterial材质。

```js
//WebGLRenderer.js

if (k == 'uMoveWithCamera') { // The rotation of the skybox
    gl.uniformMatrix4fv(
        this.meshes[i].shader.program.uniforms[k],
        false,
        cameraModelMatrix);
}

// Bonus - Fast Spherical Harmonic Rotation
//let precomputeL_RGBMat3 = getRotationPrecomputeL(precomputeL[guiParams.envmapId], cameraModelMatrix);

// Edit Start
let Mat3Value = getMat3ValueFromRGB(precomputeL[guiParams.envmapId])
for(let j = 0; j < 3; j++){
    if (k == 'uPrecomputeL['+j+']') {
        gl.uniformMatrix3fv(
            this.meshes[i].shader.program.uniforms[k],
            false,
            Mat3Value[j]);
    }
}
// Edit End
```

在渲染循环中给材质设置precomputeL实时的值。

```c
//prtVertex.glsl

attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute mat3 aPrecomputeLT;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform mat3 uPrecomputeL[3];

varying highp vec3 vNormal;
varying highp mat3 vPrecomputeLT;
varying highp vec3 vColor;

float L_dot_LT(mat3 PrecomputeL, mat3 PrecomputeLT) {
  vec3 L_0 = PrecomputeL[0];
  vec3 L_1 = PrecomputeL[1];
  vec3 L_2 = PrecomputeL[2];
  vec3 LT_0 = PrecomputeLT[0];
  vec3 LT_1 = PrecomputeLT[1];
  vec3 LT_2 = PrecomputeLT[2];
  return dot(L_0, LT_0) + dot(L_1, LT_1) + dot(L_2, LT_2);
}

void main(void) {
  // 无实际作用，避免aNormalPosition被优化后产生警告
  vNormal = (uModelMatrix * vec4(aNormalPosition, 0.0)).xyz;

  for(int i = 0; i < 3; i++)
  {
    vColor[i] = L_dot_LT(aPrecomputeLT, uPrecomputeL[i]);
  }

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
}
```

$$L(o)\approx \rho \sum l_{i}T_{i}$$

新增``prtVertex.glsl``文件，vs核心就是对上面公式的实现，上面公式其实就相当于点积，由于我们环境光系数有rgb三个通道，所以这个点积写起来略显麻烦一点，最后把结果vColor传递到fragment shader即可。

注意vNormal的赋值无实际作用，如果不使用顶点属性aNormalPosition的话，WebGL会执行优化掉这个属性，导致网页端会一直刷一个报错：

```
WebGL: INVALID_VALUE: vertexAttribPointer: index out of range
```

vNormal的赋值代码实际上就是使用上aNormalPosition，避免因优化后产生的报错。

```c
//prtFragment.glsl

#ifdef GL_ES
precision mediump float;
#endif

varying highp vec3 vColor;

void main(){
  gl_FragColor = vec4(vColor, 1.0);
}
```

新增``prtFragment.glsl``文件，fs很简单，把插值后的颜色输出为该片元颜色即可。

下面我们来看看效果：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_mary_none_pi.jfif)

如果你没有把传输项球谐系数除以π的话，你应该会得到以上结果，很多同学、甚至包括作业pdf中的图2和图3都是上图效果，这应该是一个过亮的错误效果，特别是图3，``skybox``这个cubemap环境下，显示出了与环境非常不协调的过曝效果（这里其实有个坑，``skybox``在预计算中使用的cubemap资源和实时渲染中显示出来的cubemap资源是两套不同画面的资源，所以差异会更大）。

这是一个错误的例子，如果你是根据本文来实现，在传输项球谐系数计算时，最终有把结果除以π的话，是不会得到上图效果的，而是会得到以下效果：


![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_mary_with_pi.jfif)

过亮问题没有了，但似乎又太暗了点？作为参考，我们可以找到``prt/scenes``目录下生成的``prt.png``图片来对比，实际上``prt.png``要比我们渲染出来的效果是要亮一点的，那问题出在哪呢？

```cpp
//bitmap.cpp
void Bitmap::savePNG(const std::string &filename) {
    cout << "Writing a " << cols() << "x" << rows()
         << " PNG file to \"" << filename << "\"" << endl;

    std::string path = filename + ".png";

    uint8_t *rgb8 = new uint8_t[3 * cols() * rows()];
    uint8_t *dst = rgb8;
    for (int i = 0; i < rows(); ++i) {
        for (int j = 0; j < cols(); ++j) {
            Color3f tonemapped = coeffRef(i, j).toSRGB(); //重点
            dst[0] = (uint8_t) clamp(255.f * tonemapped[0], 0.f, 255.f);
            dst[1] = (uint8_t) clamp(255.f * tonemapped[1], 0.f, 255.f);
            dst[2] = (uint8_t) clamp(255.f * tonemapped[2], 0.f, 255.f);
            dst += 3;
        }
    }

    int ret = stbi_write_png(path.c_str(), (int) cols(), (int) rows(), 3, rgb8, 3 * (int) cols());
    if (ret == 0) {
        cout << "Bitmap::savePNG(): Could not save PNG file \"" << path << "%s\"" << endl;
    }

    delete[] rgb8;
}

```

其实在nori程序中，保存图片时调用的``savePNG``这个API，内部有个把颜色``toSRGB``的处理，我们再看看``toSRGB``的实现。

```cpp
//common.cpp

Color3f Color3f::toSRGB() const {
    Color3f result;

    for (int i=0; i<3; ++i) {
        float value = coeff(i);

        if (value <= 0.0031308f)
            result[i] = 12.92f * value;
        else
            result[i] = (1.0f + 0.055f)
                * std::pow(value, 1.0f/2.4f) -  0.055f;
    }

    return result;
}
```

他似乎是做了Gamma校正+ToneMapping，有同学可能有疑问作业不是提到不需要做Gamma校正吗？作业意思应该是预计算部分的cubemap采样出来的结果就是在线性空间中的，我们不需要进行校正后再做光线计算，但当我们最后把颜色输出到sRGB颜色空间的显示器上时，我们仍然需要进行Gamma校正。

所以我们把以上``toSRGB``的实现移植并引入到fragment shader即可。

```c
//prtFragment.glsl

#ifdef GL_ES
precision mediump float;
#endif

varying highp vec3 vColor;

vec3 toneMapping(vec3 color){
    vec3 result;

    for (int i=0; i<3; ++i) {
        if (color[i] <= 0.0031308)
            result[i] = 12.92 * color[i];
        else
            result[i] = (1.0 + 0.055) * pow(color[i], 1.0/2.4) - 0.055;
    }

    return result;
}

void main(){
  vec3 color = toneMapping(vColor); 
  gl_FragColor = vec4(color, 1.0);
}
```

最后我们可以得到以下的画面效果：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework2_mary_with_gamma.jfif)

可见与nori框架下生成的png图片效果一致，到此作业2的基础部分已完成。

### 实时渲染框架支持CornellBox的Cubemap

```js
//engine.js

function createGUI() {
	const gui = new dat.gui.GUI();
	const panelModel = gui.addFolder('Switch Environemtn Map');
	// Edit Start
	panelModel.add(guiParams, 'envmapId', { 'GraceGathedral': 0, 'Indoor': 1, 'Skybox': 2, 'CornellBox': 3}).name('Envmap Name');
	// Edit End
	panelModel.open();
}
```

```js
//engine.js

var envmap = [
	'assets/cubemap/GraceCathedral',
	'assets/cubemap/Indoor',
	'assets/cubemap/Skybox',
	// Edit Start
	'assets/cubemap/CornellBox',
	// Edit End
];
```

虽然实时渲染框架内放置了CornellBox的资源，但默认情况下并不能切换到CornellBox，需要做出以上修改，CornellBox很适合用来观察我们的实现结果，其他cubemap由于没有明显的颜色方向区分，可能得出错误的结果而又没能直接观察出来，特别是对于提高部分要做的环境光旋转。

修改上面两行代码后，我们便可以切换到CornellBox了：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/ganes202-homework2_CornellBox.png)


### Diffuse Inter-reflection传输项球谐系数

```cpp
//prt.cpp

std::unique_ptr<std::vector<double>> computeInterreflectionSH(Eigen::MatrixXf* directTSHCoeffs, const Point3f& pos, const Normal3f& normal, const Scene* scene, int bounces)
{
    std::unique_ptr<std::vector<double>> coeffs(new std::vector<double>());
    coeffs->assign(SHCoeffLength, 0.0);

    if (bounces > m_Bounce)
        return coeffs;

    const int sample_side = static_cast<int>(floor(sqrt(m_SampleCount)));
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_real_distribution<> rng(0.0, 1.0);
    for (int t = 0; t < sample_side; t++) {
        for (int p = 0; p < sample_side; p++) {
            double alpha = (t + rng(gen)) / sample_side;
            double beta = (p + rng(gen)) / sample_side;
            double phi = 2.0 * M_PI * beta;
            double theta = acos(2.0 * alpha - 1.0);

            Eigen::Array3d d = sh::ToVector(phi, theta);
            const auto wi = Vector3f(d.x(), d.y(), d.z());
            double H = wi.normalized().dot(normal);
            Intersection its;
            if (H > 0.0 && scene->rayIntersect(Ray3f(pos, wi.normalized()), its))
            {
                MatrixXf normals = its.mesh->getVertexNormals();
                Point3f idx = its.tri_index;
                Point3f hitPos = its.p;
                Vector3f bary = its.bary;

                Normal3f hitNormal =
                    Normal3f(normals.col(idx.x()).normalized() * bary.x() +
                        normals.col(idx.y()).normalized() * bary.y() +
                        normals.col(idx.z()).normalized() * bary.z())
                    .normalized();

                auto nextBouncesCoeffs = computeInterreflectionSH(directTSHCoeffs, hitPos, hitNormal, scene, bounces + 1);

                for (int i = 0; i < SHCoeffLength; i++)
                {
                    auto interpolateSH = (directTSHCoeffs->col(idx.x()).coeffRef(i) * bary.x() +
                        directTSHCoeffs->col(idx.y()).coeffRef(i) * bary.y() +
                        directTSHCoeffs->col(idx.z()).coeffRef(i) * bary.z());

                    (*coeffs)[i] += (interpolateSH + (*nextBouncesCoeffs)[i]) * H;
                }
            }
        }
    }

    for (unsigned int i = 0; i < coeffs->size(); i++) {
        (*coeffs)[i] /= sample_side * sample_side;
    }

    return coeffs;
}
```

计算传输项光线多次弹射的情况，其实有点类似于做光线追踪的思路，把我们原本计算球谐系数的方法，套进光线追踪的流程即可，大概步骤如下：

1. 编写一个递归函数，该函数指定一个Shading Point，计算这个Shading Point的所有间接光的球谐系数。
2. 设定bounce次数，并以bounce次数作为递归的结束条件，超出设定bounce次数的那次弹射，认为系数是0。
3. 仿照``ProjectFunction``函数来做方向采样，对每个Shading Point采样m_SampleCount个方向。
4. 取处于Shading Point上半球方向的样本，从Shading Point向采样方向发出射线，若击中物体，则认为击中点对射线出发点有贡献，利用三角形重心坐标求出击中点的球谐系数，并以击中点作为出发点Shading Point，进行递归求击中点的间接光球谐系数，最后把原出发点的球谐系数加上击中点的间接光球谐系数，作为出发点的最终球谐系数。
5. 把结果除以采样数。

以上，对于计算某个点的间接球谐系数的函数已经完成。

```cpp
//prt.cpp

virtual void preprocess(const Scene *scene) override
{
    // ...

    if (m_Type == Type::Interreflection)
    {
        // TODO: leave for bonus

        for (int i = 0; i < mesh->getVertexCount(); i++)
        {
            const Point3f& v = mesh->getVertexPositions().col(i);
            const Normal3f& n = mesh->getVertexNormals().col(i).normalized();
            auto indirectCoeffs = computeInterreflectionSH(&m_TransportSHCoeffs, v, n, scene, 1);
            for (int j = 0; j < SHCoeffLength; j++)
            {
                m_TransportSHCoeffs.col(i).coeffRef(j) += (*indirectCoeffs)[j];
            }
            std::cout << "computing interreflection light sh coeffs, current vertex idx: " << i << " total vertex idx: " << mesh->getVertexCount() << std::endl;
        }
    }
    // ...
}
```

最后，遍历每个顶点作为计算间接光的出发点，调用我们上面实现的函数，取得间接球谐系数，并把系数加到``m_TransportSHCoeffs``里即可。

编译后，再把各个cubemap数据导出一次，拷贝到实时渲染框架中观察下效果。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/ganes202-homework2_shadowed_inter-reflection_compare.png)

上面是Shadowed和interreflection bounce两次情况下的对比，可以看到整体上没有太大差异，但阴影处可以明显看出interreflection情况下原本阴影的地方会更明亮一些。

### 环境光球谐旋转

```js
//WebGLRenderer.js

for (let k in this.meshes[i].material.uniforms) {

    let cameraModelMatrix = mat4.create();
    // Edit Start
    mat4.fromRotation(cameraModelMatrix, timer * 10, [0, 1, 0]);
    // Edit End

    if (k == 'uMoveWithCamera') { // The rotation of the skybox
        gl.uniformMatrix4fv(
            this.meshes[i].shader.program.uniforms[k],
            false,
            cameraModelMatrix);
    }

    // Bonus - Fast Spherical Harmonic Rotation
    let precomputeL_RGBMat3 = getRotationPrecomputeL(precomputeL[guiParams.envmapId], cameraModelMatrix);
    
    // Edit Start
    // let Mat3Value = getMat3ValueFromRGB(precomputeL[guiParams.envmapId])
    let Mat3Value = getMat3ValueFromRGB(precomputeL_RGBMat3);
    for(let j = 0; j < 3; j++){
        if (k == 'uPrecomputeL['+j+']') {
            gl.uniformMatrix3fv(
                this.meshes[i].shader.program.uniforms[k],
                false,
                Mat3Value[j]);
        }
    }
    // Edit End
}
```

先把天空盒旋转那行代码注释取消掉，然后调用``getRotationPrecomputeL``，把返回的环境光球谐函数传入Shader。然后我们再来看``getRotationPrecomputeL``相关该如何实现。

```js
//tools.js

function getRotationPrecomputeL(precompute_L, rotationMatrix){
	let rotationMatrix_inverse = mat4.create()
	mat4.invert(rotationMatrix_inverse, rotationMatrix)
	let r = mat4Matrix2mathMatrix(rotationMatrix_inverse)
	
	let shRotateMatrix3x3 = computeSquareMatrix_3by3(r);
	let shRotateMatrix5x5 = computeSquareMatrix_5by5(r);

	let result = [];
	for(let i = 0; i < 9; i++){
		result[i] = [];
	}
	for(let i = 0; i < 3; i++){
		let L_SH_R_3 = math.multiply([precompute_L[1][i], precompute_L[2][i], precompute_L[3][i]], shRotateMatrix3x3);
		let L_SH_R_5 = math.multiply([precompute_L[4][i], precompute_L[5][i], precompute_L[6][i], precompute_L[7][i], precompute_L[8][i]], shRotateMatrix5x5);
	
		result[0][i] = precompute_L[0][i];
		result[1][i] = L_SH_R_3._data[0];
		result[2][i] = L_SH_R_3._data[1];
		result[3][i] = L_SH_R_3._data[2];
		result[4][i] = L_SH_R_5._data[0];
		result[5][i] = L_SH_R_5._data[1];
		result[6][i] = L_SH_R_5._data[2];
		result[7][i] = L_SH_R_5._data[3];
		result[8][i] = L_SH_R_5._data[4];
	}

	return result;
}

function computeSquareMatrix_3by3(rotationMatrix){ // 计算方阵SA(-1) 3*3 

	// 1、pick ni - {ni}
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [0, 1, 0, 0];

	// 2、{P(ni)} - A  A_inverse
	let n1_sh = SHEval(n1[0], n1[1], n1[2], 3)
	let n2_sh = SHEval(n2[0], n2[1], n2[2], 3)
	let n3_sh = SHEval(n3[0], n3[1], n3[2], 3)

	let A = math.matrix(
	[
		[n1_sh[1], n2_sh[1], n3_sh[1]], 
		[n1_sh[2], n2_sh[2], n3_sh[2]], 
		[n1_sh[3], n2_sh[3], n3_sh[3]], 
	]);

	let A_inverse = math.inv(A);

	// 3、用 R 旋转 ni - {R(ni)}
	let n1_r = math.multiply(rotationMatrix, n1);
	let n2_r = math.multiply(rotationMatrix, n2);
	let n3_r = math.multiply(rotationMatrix, n3);

	// 4、R(ni) SH投影 - S
	let n1_r_sh = SHEval(n1_r[0], n1_r[1], n1_r[2], 3)
	let n2_r_sh = SHEval(n2_r[0], n2_r[1], n2_r[2], 3)
	let n3_r_sh = SHEval(n3_r[0], n3_r[1], n3_r[2], 3)

	let S = math.matrix(
	[
		[n1_r_sh[1], n2_r_sh[1], n3_r_sh[1]], 
		[n1_r_sh[2], n2_r_sh[2], n3_r_sh[2]], 
		[n1_r_sh[3], n2_r_sh[3], n3_r_sh[3]], 

	]);

	// 5、S*A_inverse
	return math.multiply(S, A_inverse)   

}

function computeSquareMatrix_5by5(rotationMatrix){ // 计算方阵SA(-1) 5*5
	
	// 1、pick ni - {ni}
	let k = 1 / math.sqrt(2);
	let n1 = [1, 0, 0, 0]; let n2 = [0, 0, 1, 0]; let n3 = [k, k, 0, 0]; 
	let n4 = [k, 0, k, 0]; let n5 = [0, k, k, 0];

	// 2、{P(ni)} - A  A_inverse
	let n1_sh = SHEval(n1[0], n1[1], n1[2], 3)
	let n2_sh = SHEval(n2[0], n2[1], n2[2], 3)
	let n3_sh = SHEval(n3[0], n3[1], n3[2], 3)
	let n4_sh = SHEval(n4[0], n4[1], n4[2], 3)
	let n5_sh = SHEval(n5[0], n5[1], n5[2], 3)

	let A = math.matrix(
	[
		[n1_sh[4], n2_sh[4], n3_sh[4], n4_sh[4], n5_sh[4]], 
		[n1_sh[5], n2_sh[5], n3_sh[5], n4_sh[5], n5_sh[5]], 
		[n1_sh[6], n2_sh[6], n3_sh[6], n4_sh[6], n5_sh[6]], 
		[n1_sh[7], n2_sh[7], n3_sh[7], n4_sh[7], n5_sh[7]], 
		[n1_sh[8], n2_sh[8], n3_sh[8], n4_sh[8], n5_sh[8]], 
	]);
	
	let A_inverse = math.inv(A);

	// 3、用 R 旋转 ni - {R(ni)}
	let n1_r = math.multiply(rotationMatrix, n1);
	let n2_r = math.multiply(rotationMatrix, n2);
	let n3_r = math.multiply(rotationMatrix, n3);
	let n4_r = math.multiply(rotationMatrix, n4);
	let n5_r = math.multiply(rotationMatrix, n5);

	// 4、R(ni) SH投影 - S
	let n1_r_sh = SHEval(n1_r[0], n1_r[1], n1_r[2], 3)
	let n2_r_sh = SHEval(n2_r[0], n2_r[1], n2_r[2], 3)
	let n3_r_sh = SHEval(n3_r[0], n3_r[1], n3_r[2], 3)
	let n4_r_sh = SHEval(n4_r[0], n4_r[1], n4_r[2], 3)
	let n5_r_sh = SHEval(n5_r[0], n5_r[1], n5_r[2], 3)

	let S = math.matrix(
	[	
		[n1_r_sh[4], n2_r_sh[4], n3_r_sh[4], n4_r_sh[4], n5_r_sh[4]], 
		[n1_r_sh[5], n2_r_sh[5], n3_r_sh[5], n4_r_sh[5], n5_r_sh[5]], 
		[n1_r_sh[6], n2_r_sh[6], n3_r_sh[6], n4_r_sh[6], n5_r_sh[6]], 
		[n1_r_sh[7], n2_r_sh[7], n3_r_sh[7], n4_r_sh[7], n5_r_sh[7]], 
		[n1_r_sh[8], n2_r_sh[8], n3_r_sh[8], n4_r_sh[8], n5_r_sh[8]], 
	]);

	// 5、S*A_inverse
	return math.multiply(S, A_inverse)  
}

function mat4Matrix2mathMatrix(rotationMatrix){

	let mathMatrix = [];
	for(let i = 0; i < 4; i++){
		let r = [];
		for(let j = 0; j < 4; j++){
			r.push(rotationMatrix[i*4+j]);
		}
		mathMatrix.push(r);
	}
	// Edit Start
	//return math.matrix(mathMatrix)
	return math.transpose(mathMatrix)
	// Edit End
}
```

由于本文不对球谐旋转性质进行证明或相关计算推导，我们只需要按照作业提供的计算公式用代码表达出来即可，以上代码基本上是对作业提供的计算方法直接翻译到代码中，``computeSquareMatrix_3by3``是求第一阶的3x3旋转矩阵$M_{1}$，而``computeSquareMatrix_5by5``是求第二阶的5x5旋转矩阵$M_{2}$，最后在``getRotationPrecomputeL``调用这两个函数并计算出整体旋转后的系数。

如果你想了解相关性质的证明，或许这篇文章能帮到你，记得看明白后回头教一下小编。

[球谐光照笔记（旋转篇）](https://zhuanlan.zhihu.com/p/140421707)

但框架代码与作业描述的计算方式似乎都存在一点问题，我在GAMES202课程BBS里找到了相关讨论[【作业2】环境光球谐旋转推导](https://games-cn.org/forums/topic/zuoye2huanjingguangqiuxiexuanzhuantuidao/)，题主提出三个问题：

1. 球谐计算旋转所用的旋转矩阵不是天空盒的旋转矩阵，而是天空盒的旋转矩阵的逆矩阵。
2. 由于框架使用到了``glMatrix``和``math.js``两个数学库，前者矩阵是列优先，后者是行优先，而框架提供的``mat4Matrix2mathMatrix``函数可以对两个库之间的矩阵类进行转换，但似乎并没有考虑这点，所以我们把这个函数的原返回矩阵做一次转置再返回，这样才能得到正确的转换。
3. 作业中的球谐旋转的步骤3应该是``原SH系数 * M``，而不是`` M * 原SH系数``。

如果你同时忽略了问题1和问题2，那么可能会因为负负得正的作用抵消了这两个问题，因为旋转矩阵是正交矩阵，他的逆矩阵正是他自身的转置。为了数学意义上更准确，上面代码实现中纠正了这两点，把两次矩阵转置写了出来。

把上面3个问题做了调整后，我们将得到作业的最终效果：


![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/ganes202-homework2_final.gif)