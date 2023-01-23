![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_final.png)

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_top.webp)

## 作业总览

1. 实现预计算$E(\mu)$
2. 实现预计算$E_{avg}$
3. 正确实现PBR材质
4. 正确实现Kulla-Conty材质
5. Bonus 1：实现重要性采样的预计算方法
6. Bonus 2： 在预计算$E(\mu)$时，使用Split Sum完成预计算工作

## 源码

[GAMES101&202 Homework](https://github.com/DrFlower/GAMES_101_202_Homework)

## 作业流程

微表面模型的 BRDF(Microfacet BRDF) 存在一个根本问题，就是忽略了微平面间的多次弹射，这就导致了材质的能量损失，并且当材质的粗糙度越高时，能量的损失会越严重。通过引入一个微表面 BRDF 的补偿项，来补偿光线的多次弹射，使得材质的渲染结果可以近似保持能量守恒，这个 BRDF 的补偿模型就是本轮作业需要重点完成的 Kulla-Conty BRDF 近似模型。

作业分为预计算和实时渲染两个部分，分别在两个工程下实现。预计算使用cmake生成对应工程，Windows环境下，可以使用git直接执行lua-gen文件夹中的``test.sh``即可生成，或者直接改成``test.bat``双击执行生成。实时渲染沿用GAMES202一直用的框架。

我们需要在lut-gen工程内完成E(μ)和Eavg的预计算，工程内共有四个项目分别为``lut-Emu-MC``、``lut-Emu-IS``、``lut-Eavg-MC``、``lut-Eavg-IS`` ，后缀MC的为基础实现，后缀为IS的是提高实现，提高要求：1.实现重要性采样的预计算方法。2.在预计算 E(µ)时，使用 Split Sum 完成预计算工作。

实时渲染框架中，在``PBRFragment.glsl``和``KullaContyFragment.glsl``中补充BRDF的各项实现，并在``KullaContyFragment.glsl``中利用预计算数据完成Kulla-Conty近似模型的实现。

## 处理编译报错

预计算工程代码中可能会存在编译报错，需要修改一下。

1. “M_PI”: 未声明的标识符：把``M_Pi``改成``PI``；
2. 表达式必须含有常量值：``uint8_t data[resolution * resolution * 3];``改成``uint8_t* data = new uint8_t[resolution * resolution * 3];``

## 实现

### 预计算E(μ)

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_multiple_bounces.png)

我们要补偿损失的能量，而损失的能量是由于G项只考虑了光线一次弹射，没考虑多次弹射而导致的，而在第一次弹射没能输出的能量，会在后续的弹射中会输出，所以我们有一个基本的思想：被遮挡掉的能量就是会在多次弹射中输出的能量， 也是我们需要补偿的能量。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_Eμ.png)

先来理一下E(μ)是个什么，E(μ)其实就是某个BRDF一次弹射输出的总能量，计算方式其实就是对反射方程在半球上做积分，课程上给的这个式子写得比较绕，可参考- [GAMES202 作业BBS - [作业4]请教 E(u)的计算](https://games-cn.org/forums/topic/zuoye4qingjiao-eudejisuan/) 中，**ZETAAAAAAAA**的回答来理解。这里为了单位化我们把光照L项取1。

```cpp
//Emu_MC.cpp

Vec3f IntegrateBRDF(Vec3f V, float roughness, float NdotV) {
    float A = 0.0;
    float B = 0.0;
    float C = 0.0;
    const int sample_count = 1024;
    Vec3f N = Vec3f(0.0, 0.0, 1.0);
    
    samplePoints sampleList = squareToCosineHemisphere(sample_count);
    for (int i = 0; i < sample_count; i++) {
        // TODO: To calculate (fr * ni) / p_o here
        // Edit Start
        Vec3f L = normalize(sampleList.directions[i]);
        float pdf = sampleList.PDFs[i];
        Vec3f H = normalize(V + L);

        float NdotL = std::max(dot(N, L), 0.0f);

        float NDF = DistributionGGX(N, H, roughness);
        float G = GeometrySmith(roughness, NdotV, NdotL);
        float F = 1.0f;

        float mu = NdotL;
        float numerator = NDF * G * F;
        float denominator = 4.0 * NdotV * NdotL;
        A = B = C += numerator / denominator / pdf * mu;
        // Edit End
    }

    return {A / sample_count, B / sample_count, C / sample_count};
}
```

在``Emu_MC.cpp``补充以上实现
$$
f_{r}(i,o)=\frac{F(i,h)G(i,o,h)D(h)}{4(n\cdot i)(n \cdot o)}
$$

积分内我们把BRDF乘上cos项再算上pdf即可，注意由于我们要测总能量，BRDF的F项是取1的。

$E(\mu)$的结果是一张二维的表，以roughness和μ作为两个维度。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_E_MC_LUT.png)

生成后可以得到一张这样的图。

可以看到图片有很多噪声，这是因为低粗糙度的微表面材质接近镜面反射材质，即微表面的法线m(即半程向量h)集中分布在几何法线n附近，而我们由采样入射光方向i计算出的微表面法向量m分布并不会集中在几何法线n附近，也就是说这与实际低粗糙度的微表面法线分布相差很大，因此积分值的方差就会很大。

### 预计算Eavg

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_Eμ.png)

同样我们也先理一下$E_{avg}$是个什么，仍然是看回这张图，前面我们已经求出了某个BRDF一次弹射输出的总能量$E(\mu)$，那么丢失的能量就是$1-E(\mu)$了。

那这个$1-E(\mu)$具体是个什么呢？我们另外设计一个BRDF公式来描述他，而由于BRDF的对称性，式子里应该包括入射和出射两个方向量。那么我们公式大概是这样：

$$
c(1-E(\mu_{i})(1-E(\mu_{o}))
$$

这样公式就考虑上了这两项，而至于c具体是什么，如下图：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_Eavg.png)

上图$f_{ms}$就是我们设计的描述损失了的能量的BRDF的函数，那么c就是
$$
\frac {1}{\pi (1-E_{avg})}
$$
而这里的$E_{avg}$就是我们这里要预计算的量，计算方法很简单：
$$
E_{avg} = 2 \int_{0}^{1}E(\mu)\mu \mathrm d \mu
$$
当然这个$f_{ms}$公式也可以是别的形式，这只是其中一种设计，我们只要能设计成最终结果是$1-E(\mu)$就都可以。

```cpp
//Eavg_MC.cpp

Vec3f IntegrateEmu(Vec3f V, float roughness, float NdotV, Vec3f Ei) {
    return Ei * NdotV * 2.0f;
}
```

在``Eavg_MC.cpp``补充以上实现

看作业框架的意思是希望我们再做一次采样积分，似乎没有必要，这里直接返回$2 * E(\mu) * \mu$。

$E_{avg}$的结果是一张一维的表，以roughness作为参数。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_GGX_Eavg_MC_LUT.png)

最后会生成这样的图片。

### 在预计算中使用重要性采样

这部分在课程中没有提及，只在作业中给出了公式。

```cpp
//Emu_IS.cpp

float GeometrySchlickGGX(float NdotV, float roughness) {
    // TODO: To calculate Schlick G1 here - Bonus 1
    float a = roughness;
    float k = (a * a) / 2.0f;

    float nom = NdotV;
    float denom = NdotV * (1.0f - k) + k;

    return nom / denom;
}
```

作业框架把GeometrySchlickGGX的实现空了出来，不知道有什么用意，这个在``Emu_MC.cpp``中是直接给出实现的，我们直接拷贝过来得了。

```cpp
//Emu_IS.cpp

Vec2f Hammersley(uint32_t i, uint32_t N) { // 0-1
    uint32_t bits = (i << 16u) | (i >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    float rdi = float(bits) * 2.3283064365386963e-10;
    return {float(i) / float(N), rdi};
}
```

作业框架中出现了一个很有趣的东西——**Hammersley**函数，它的返回值会作为后面重要性采样的一个参数，这个看起来不像是人脑该理解的东西叫做Hammersley序列，属于一种低差异序列。

> 默认情况下，每次采样都是我们熟悉的完全（伪）随机，不过利用半随机序列的某些属性，我们可以生成虽然是随机样本但具有一些有趣性质的样本向量。例如，我们可以对一种名为低差异序列的东西进行蒙特卡洛积分，该序列生成的仍然是随机样本，但样本分布更均匀。
> 
> 当使用低差异序列生成蒙特卡洛样本向量时，该过程称为拟蒙特卡洛积分。拟蒙特卡洛方法具有更快的收敛速度，这使得它对于性能繁重的应用很有用。

以上内容我们可以参考[LearnOpenGL - 镜面IBL 预滤波HDR环境贴图](https://learnopengl-cn.github.io/07%20PBR/03%20IBL/02%20Specular%20IBL/#hdr)来理解。

我们甚至在LearnOpenGL这一章中找到GGX重要性采样的实现。

```cpp
//Emu_IS.cpp

Vec3f ImportanceSampleGGX(Vec2f Xi, Vec3f N, float roughness) {
    float a = roughness * roughness;
    //TODO: in spherical space - Bonus 1
    float theta = atan(a * sqrt(Xi.x) / sqrt(1.0f - Xi.x));
    float phi = 2.0 * PI * Xi.y;


    //TODO: from spherical space to cartesian space - Bonus 1
    float sinTheta = sin(theta);
    float consTheta = cos(theta);
    Vec3f H = Vec3f(cos(phi) * sinTheta, sin(phi) * sinTheta, consTheta);

    //TODO: tangent coordinates - Bonus 1
    Vec3f up = abs(N.z) < 0.999 ? Vec3f(0.0, 0.0, 1.0) : Vec3f(1.0, 0.0, 0.0);
    Vec3f tangent = normalize(cross(up, N));
    Vec3f bitangent = cross(N, tangent);

    //TODO: transform H to tangent space - Bonus 1
    Vec3f sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}
```

直接搬过来即可。

这部分内容LearnOpenGL只是讲了个大概，如果你跟我一样感觉还是一知半解，那么我们可以拜读这篇文章[知乎-tkstar： 蒙特卡洛积分](https://zhuanlan.zhihu.com/p/146144853)。

```cpp
//Emu_IS.cpp

Vec3f IntegrateBRDF(Vec3f V, float roughness) {
    const int sample_count = 1024;
    Vec3f Emu(0.0f);
    Vec3f N = Vec3f(0.0, 0.0, 1.0);
    for (int i = 0; i < sample_count; i++) {
        Vec2f Xi = Hammersley(i, sample_count);
        Vec3f H = ImportanceSampleGGX(Xi, N, roughness);
        Vec3f L = normalize(H * 2.0f * dot(V, H) - V);

        float NoL = std::max(L.z, 0.0f);
        float NoH = std::max(H.z, 0.0f);
        float VoH = std::max(dot(V, H), 0.0f);
        float NoV = std::max(dot(N, V), 0.0f);
        // Edit Start
        // TODO: To calculate (fr * ni) / p_o here - Bonus 1
        float G = GeometrySmith(roughness, NoV, NoL);
        float weight = VoH * G / (NoV * NoH);
        Emu += Vec3f(1.0, 1.0, 1.0) * weight;

        // Split Sum - Bonus 2
    }
    return Emu / sample_count;
}
```

$$
weight(i) = \frac {(o \cdot m)G(i,o,h)}{(o \cdot n)(m \cdot n)}
$$
积分部分我们代入作业给出的公式即可。

这里Bonus 2说是要使用Split Sum完成$E_{\mu}$的预计算工作，这里完全没搞懂还要Split啥，没理解错的话前面已经是Split Sum方式的实现了。

最后我们在``Eavg_IS.cpp``补充一样的ImportanceSampleGGX实现，以及与``Eavg_MC.cpp``一样的IntegrateEmu实现，然后把我们最终要用的两张图生成出来。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_GGX_E_LUT.png)

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_GGX_Eavg_LUT.png)

然鹅这张$E_{avg}$比作业上的参考图要亮一些，原因不明。
### 实时渲染

先把我们在离线端生成的``GGX_E_LUT.png``和``GGX_Eavg_LUT.png``拷贝到实时渲染端下的``assets/ball``目录下。

可以把``engine.js``脚本下的两行代码取消注释了，不然会少了roughness为0.15的模型展示。

```js
//engine.js

//..
    loadGLTF(renderer, 'assets/ball/', 'ball', 'KullaContyMaterial', Sphere0Transform, metallic, 0.15);

//..
    loadGLTF(renderer, 'assets/ball/', 'ball', 'PBRMaterial', Sphere5Transform, metallic, 0.15);
```

我们需要在``PBRFragment.glsl``，``KullaContyFragment.glsl``两个Shader中补充微表面BRD的实现。

```c
//PBRFragment.glsl、KullaContyFragment.glsl

float DistributionGGX(vec3 N, vec3 H, float roughness)
{
   // TODO: To calculate GGX NDF here

    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / max(denom, 0.0001);
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    // TODO: To calculate Smith G1 here
    
    float a = roughness;
    float k = (a * a) / 2.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    // TODO: To calculate Smith G here

    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(vec3 F0, vec3 V, vec3 H)
{
    // TODO: To calculate Schlick F here
    return F0 + (1.0 - F0) * pow(clamp(1.0 - max(dot(H, V), 0.0), 0.0, 1.0), 5.0);
}
```

两个Shader都补充同样的实现，这时我们运行起来会得到以下效果：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_brdf_implement.png)

下面一排是只有一次光线弹射的有明显能量损失的微表面BRDF模型，上面一排则是仍未实现完整的Kulla-Conty模型，待我们把实现补充完整后即可看到在roughness越低的时候，Kulla-Conty模型会相对下面那排越亮。

$$
f_{r} = f_{micro} + f_{add} * f_{ms}
$$
Kulla-Conty材质最后的BRDF为以上公式，我们需要实现MultiScatterBRDF函数，返回$f_{add} * f_{ms}$，这两项具体计算方式为：

$$
f_{ms}(\mu_{o}, \mu_{i}) = \frac {(1 - E(\mu_{0}))(1-E(\mu_{i}))}{\pi (1-E_{avg})}
$$
$$
f_{add} = \frac {F_{avg}E_{avg}}{1-F_{avg}(1-E_{avg})}
$$
其中$f_{ms}$其实就是我们前面为损失的能量$1 - E(\mu)$设计的BRDF，而这里我们还需要乘一个$f_{add}$，是因为考虑对于有颜色的材质，是有自然存在的能量损失的（这是个物理现象，物体在我们视觉中表示出某种颜色是因为他吸收了其他颜色，反射出这种颜色）。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_average_frensel.png)

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_color_term.png)

这个$f_{add}$的计算怎么理解呢，我们定义一个平均的Frensel值$F_{avg}$（Frensel在不同入射角有不同的值，这里我们定义一个在多个入射方向反射n次平均得出的值）。$E_{avg}$应该是指单次弹射出来的能量（PPT中写的是 is how much energy that you can see，个人理解这里有误），$F_{avg}E_{avg}$才是我们看到的，因为首次没出去的能量才参与后续弹射计算，所以once bounce是用$(1-E_{avg})$计算，然后再考虑多次弹射，最终得出上面的$f_{add}$。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_average_frense_reference.png)

至于$F_{avg}$是怎么来的，作业中参考了这里[Revisiting Physically Based Shading at Imageworks](https://blog.selfshadow.com/publications/s2017-shading-course/imageworks/s2017_pbs_imageworks_slides_v2.pdf)，pdf第26页。


```c
//KullaContyFragment.glsl

vec3 MultiScatterBRDF(float NdotL, float NdotV)
{
  vec3 albedo = pow(texture2D(uAlbedoMap, vTextureCoord).rgb, vec3(2.2));

  vec3 E_o = texture2D(uBRDFLut, vec2(NdotL, uRoughness)).xyz;
  vec3 E_i = texture2D(uBRDFLut, vec2(NdotV, uRoughness)).xyz;

  vec3 E_avg = texture2D(uEavgLut, vec2(0, uRoughness)).xyz;
  // copper
  vec3 edgetint = vec3(0.827, 0.792, 0.678);
  vec3 F_avg = AverageFresnel(albedo, edgetint);
  
  // TODO: To calculate fms and missing energy here


  // TODO: To calculate fms and missing energy here
  vec3 F_ms = (1.0 - E_o) * (1.0 - E_i) / (PI * (1.0 - E_avg));
  vec3 F_add = F_avg * E_avg / (1.0 - F_avg * (1.0 - E_avg));

  return F_add * F_ms;
}
```

由于$E_{\mu}$和$E_{avg}$已经预计算过了，代码实现上我们简单代入公式即可。

最后我们来修复框架的一个坑点：
```js
//KullaContyMaterial.js

class KullaContyMaterial extends Material {

    constructor(albedo, metallic, roughness, BRDFLut, EavgLut, light, vertexShader, fragmentShader) {
        super({
            'uAlbedoMap': { type: 'texture', value: albedo },
            'uMetallic': { type: '1f', value: metallic },
            'uRoughness': { type: '1f', value: roughness },
            'uBRDFLut': { type: 'texture', value: BRDFLut },
            // Edit Start
            // 'uEavgFLut': { type: 'texture', value: EavgLut },
            'uEavgLut': { type: 'texture', value: EavgLut },
            // Edit End
            
            'uCubeTexture': { type: 'CubeTexture', value: null },
            'uLightRadiance': { type: '3fv', value: light.lightRadiance },
            'uLightDir': { type: '3fv', value: light.CalcShadingDirection() },
            'uLightPos': { type: '3fv', value: light.lightPos },
        }, [], vertexShader, fragmentShader);

    }
}
```

这里传参命名错了，需要把``uEavgFLut``改成``uEavgLut``，否则$E_{avg}$的图是错的。

最后效果如下：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/GAMES202-homework4_final.png)