![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_top.webp)

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_final.gif)
## 作业总览

1. 实现Shadow Map。
2. 实现PCF。
3. 实现PCSS。
4. 实现多光源和动态物体。（Bonus）

## 源码

[GAMES101&202 Homework](https://github.com/DrFlower/GAMES_101_202_Homework)

## 关于作业框架加载不出模型

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_model_disapear.png)

作业框架有大概率加载不出202娘，如上图所示。

```html
//index.html
<link rel="preload" href="/assets/mary/MC003_Kozakura_Mari.png" as="image" type="image/png" crossorigin/>
```

解决方法是在``index.html``的21行加入以上代码即可，方案来自GAMES的202课程BBS帖子[GAMES202 课程BBS-作业0 结果不稳定，有时模型显示不全](https://games-cn.org/forums/topic/zuoye0-jieguobuwendingyoushimoxingxianshibuquan/)。

## 关于作业框架中的ShadowMap流程

作业框架由js+webgl实现，js可能不是问题，但对于没有opengl/webgl基础的同学，毕竟在GAMES101/202没讲过图形API的使用，某些流程可能不太理解，这里对核心流程做个简单说明。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_shadowmap_1.PNG)

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_shadowmap_2.png)

先复习一下ShadowMap的原理，相比起直接对场景进行无阴影的渲染，ShadowMap阴影流程需要多一个Pass，第一个Pass是先从光源点向光源方向作为视角渲染出一张深度图，也就是所谓的ShadowMap，第二个Pass再从当前摄像机渲染真实的场景，在渲染场景时把像素点变换到光源空间中，取其在光源空间中的深度与在ShadowMap中同一个uv坐标所记录的深度作对比，若大于ShadowMap上的深度，则该点在阴影中。

```js
//WebGLRenderer.js

// Shadow pass
if (this.lights[l].entity.hasShadowMap == true) {
    for (let i = 0; i < this.shadowMeshes.length; i++) {
        this.shadowMeshes[i].draw(this.camera);
    }
}

// Camera pass
for (let i = 0; i < this.meshes.length; i++) {
    this.gl.useProgram(this.meshes[i].shader.program.glShaderProgram);
    this.gl.uniform3fv(this.meshes[i].shader.program.uniforms.uLightPos, this.lights[l].entity.lightPos);
    this.meshes[i].draw(this.camera);
}
```

两个Pass的绘制流程体现在``WebGLRenderer.js``以上代码中。其中shadowMeshes和meshes最终其实指向的是同一堆mesh数据，只是其材质不一样，这一点可以在脚本``loadOBJ.js``中看到。

在shadow pass中，会以光源位置朝向光源方向的视角，把场景渲染一遍，其中顶点着色器使用``shadowVertex.glsl``，片元着色器使用``shadowFragment.glsl``。注意shadow pass并不会直接把结果渲染到屏幕的缓存中，而是渲染到属于该光源的FrameBuffer中，这一点在``DirectionalLight.js``可以看到有代码``this.fbo = new FBO(gl);``，这段代码会创建属于这个光源实例的FrameBuffer，最终会储存在Material中，当对应的MeshRender被调用Draw方法时，通过``gl.bindFramebuffer(gl.FRAMEBUFFER, this.material.frameBuffer);``来绑定到材质持有的FrameBuffer，所以shadow pass就会把结果渲染到自己的FrameBuffer上。

在camera pass中，会以真实摄像机视角，把场景渲染一遍，其中顶点着色器使用``phongVertex.glsl``，片元着色器使用``phongFragment.glsl``。另外提一下，用于在camera pass渲染的PhongMaterial，是没有frameBuffer参数的，也就是其Material中frameBuffer字段为空，但当他的MeshRender的Draw被调用时候，仍然会执行``gl.bindFramebuffer(gl.FRAMEBUFFER, this.material.frameBuffer);``，但绑定到空的FrameBuffer上相当于绑定到默认FrameBuffer（屏幕）上，所以最终绘制结果是在屏幕。

shadow pass的渲染结果会传递到phongFragment的uniform数据中，以贴图形式供着色器采样以渲染阴影。

```c
//shadowFragment.glsl

#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 uLightPos;
uniform vec3 uCameraPos;

varying highp vec3 vNormal;
varying highp vec2 vTextureCoord;

vec4 pack (float depth) {
    // 使用rgba 4字节共32位来存储z值,1个字节精度为1/256
    const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
    const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
    // gl_FragCoord:片元的坐标,fract():返回数值的小数部分
    vec4 rgbaDepth = fract(depth * bitShift); //计算每个点的z值
    rgbaDepth -= rgbaDepth.gbaa * bitMask; // Cut off the value which do not fit in 8 bits
    return rgbaDepth;
}

void main(){

  //gl_FragColor = vec4( 1.0, 0.0, 0.0, gl_FragCoord.z);
  gl_FragColor = pack(gl_FragCoord.z);
}
```

在shadowFragment有两个值得注意的点，一个是gl_FragCoord，另一个是pack函数。

gl_FragCoord是GLSL提供的vec4类型内置变量，其中xyz表示窗口空间坐标（window-space coordinate），窗口空间坐标是什么坐标？是NDC坐标经过viewport transformation后得到的坐标，在opengl中，其大小范围是x：[0, ScreenWidth]，y：[0, ScreenHeight]，z：[0, 1]。这里我们使用了z值，能直接表示片元的深度关系，至于此深度值是否线性，取决于投影矩阵，因为平行光使用的是正交矩阵，所以gl_FragCoord.z取得的深度值是线性的。而gl_FragCoord.w则是裁剪空间坐标中w的倒数。

pack函数的作用是把一个`[0,1)`的float值储存到RGBA四个通道中，pack的实现最早似乎可以追溯到 [Encoding floats to RGBA - the final?](https://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/)这篇文章，网上流传着255和256两个版本，作业使用的是256版本，但似乎255效果更好。相对应的在``phongFragment.glsl``中还有一个unpack函数，因为shadowmap中储存的值是pack后的值，我们在采样后需要unpack后才能使用。在引擎中其实也有这两个函数，例如在Unity中对应的就是EncodeFloatRGBA和DecodeFloatRGBA。

## 实现

### 光源生成ShadowMap所用的MVP矩阵

```js
//DirectionalLight.js
CalcLightMVP(translate, scale) {  
	let lightMVP = mat4.create();  
	let modelMatrix = mat4.create();  
	let viewMatrix = mat4.create();  
	let projectionMatrix = mat4.create();  
	
	//https://glmatrix.net/docs/module-mat4.html
	
	//Edit Start  
	
	// Model transform  
	mat4.translate(modelMatrix, modelMatrix, translate)  
	mat4.scale(modelMatrix, modelMatrix, scale)  
	  
	// View transform  
	mat4.lookAt(viewMatrix, this.lightPos, this.focalPoint, this.lightUp)  
	
	// Projection transform  
	var r = 100;  
	var l = -r;  
	var t = 100;  
	var b = -t;  
	
	var n = 0.01;  
	var f = 200;  
	
	mat4.ortho(projectionMatrix, l, r, b, t, n, f);  
	
	//Edit End  
	
	mat4.multiply(lightMVP, projectionMatrix, viewMatrix);  
	mat4.multiply(lightMVP, lightMVP, modelMatrix);  
	
	return lightMVP;  
}
```

这里需要计算的是光源生成ShadowMap所用的MVP矩阵，原理在GAMES101已经学习过，这里不再赘述。这里不需要我们自行计算矩阵变换，我们只需要调用现有接口指定对应参数即可。

这里用到的库是一个叫``glMatrix``的Javascript矩阵和矢量库，具体可参考[官方文档](https://glmatrix.net/)。

注意因为我们实现的是平行光阴影，投影矩阵可用正交矩阵，变换后仍然保持线性深度，另外注意正交矩阵的参数定义，这里应该用尽可能小的参数，以使得ShadowMap的精度尽可能大。

### useShadowMap实现

在实现useShadowMap之前，我们先来看看useShadowMap该怎么调用。

```c
//phongFragment.glsl
void main(void) {
  //vPositionFromLight为光源空间下投影的裁剪坐标，除以w结果为NDC坐标
  vec3 shadowCoord = vPositionFromLight.xyz / vPositionFromLight.w;
  //把[-1,1]的NDC坐标转换为[0,1]的坐标
  shadowCoord.xyz = (shadowCoord.xyz + 1.0) / 2.0;

  float visibility;
  visibility = useShadowMap(uShadowMap, vec4(shadowCoord, 1.0));
  //visibility = PCF(uShadowMap, vec4(shadowCoord, 1.0));
  //visibility = PCSS(uShadowMap, vec4(shadowCoord, 1.0));

  vec3 phongColor = blinnPhong();

  gl_FragColor = vec4(phongColor * visibility, 1.0);
  //gl_FragColor = vec4(phongColor, 1.0);
}
```

由于我们需要在ShadowMap上采样，采样使用的是uv坐标，那么我们传进useShadowMap的坐标的xy范围应该在[0,1]，而又因为ShadowMap储存的值unpack之后是在[0,1)的范围，我们需要在这个范围区间做深度比较，所以z分量同样也在这个区间。

为了求出这3个值，我们可以利用vPositionFromLight这个数据，它是由顶点着色器中把顶点坐标乘以uLightMVP（相当于以灯源作为摄像机的MVP矩阵）得到的，也就是光源空间下投影变换后的裁剪坐标，我们第一步把他除以自己的w值，即可得到NDC坐标，此时坐标范围在[-1,1]区间，第二步把他转换到[0,1]区间中即可。

然后我们把参数传入useShadowMap函数，函数应该返回两种值，该点处于阴影中时返回0，处于光照范围时返回1，然后我们把返回值visibility乘以着色结果phongColor并赋值给gl_FragColor输出最终结果即可。

```c
//phongFragment.glsl
float useShadowMap(sampler2D shadowMap, vec4 shadowCoord){
  float depth = unpack(texture2D(shadowMap, shadowCoord.xy));
  float cur_depth = shadowCoord.z;
  if(cur_depth > depth + EPS){
    return 0.;
  }
  else{
    return 1.0;
  }
}
```

useShadowMap的实现很简单，用texture2D传入shadowMap贴图和对应uv坐标即可，然后把结果unpack就是在光源视角的当前位置点遮挡物深度，若当前位置点的深度大于遮挡物深度，则表示处于阴影中。

完成后我们即可得到下面结果。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_useShadowMap.png)

### Shadow Bias

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_shadow_bias.png)

虽然得到了阴影的结果，但当我们换一个姿势观察的时候发现阴影有点问题，这就是课程中提到的由于ShadowMap精度不足（ShadowMap上的一个像素对应了实际渲染场景中的一片区域，但其实这片区域的深度并不相同）导致的自遮挡问题，称为Shadow Acne。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_shadowmap_3.png)

解决这个问题有很简单的办法，在对比深度时，只需要加上一个自己定义的数值的bias即可。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_shadowmap_4.png)

加上bias后效果如上图，虽然我们解决了原本的问题，但又另外引入了一个新的问题，由bias引起的漏光问题，为了优化漏光的问题，我们需要根据实际场景调整bias的值，但这个值很可能随着环境情况变化而变化，我们或许可以有根据相关参数调节bias值的方法。

[自适应Shadow Bias算法](https://zhuanlan.zhihu.com/p/370951892)

参照此文章给出的公式

$\Large A = (1 + \mathbf ceil(R))* \frac {frustumSize}{shdowMapSize * 2}$
$\large B = 1 - \mathbf dot(lightDir, normal)$
$\large Depth Bias = C_{depth} * A* B$

我们添加一个getShadowBias函数

```c
//phongFragment.glsl
float getShadowBias(float c, float filterRadiusUV){
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPos - vFragPos);
  float fragSize = (1. + ceil(filterRadiusUV)) * (FRUSTUM_SIZE / SHADOW_MAP_SIZE / 2.);
  return max(fragSize, fragSize * (1.0 - dot(normal, lightDir))) * c;
}
```

其中参数c是我们可以调节的一个最终系数，而参数filterRadiusUV是当使用PCF时，自适应还得考虑PCF的采样范围，但我们实现目前暂时用不到。

由于自适应算法与视锥体大小和ShadowMap大小有关，我们直接用#define定义这两个数据。

```
#define SHADOW_MAP_SIZE 2048.
#define FRUSTUM_SIZE  400.
```

并修改useShadowMap函数

```c
//phongFragment.glsl
float useShadowMap(sampler2D shadowMap, vec4 shadowCoord, float biasC, float filterRadiusUV){
  float depth = unpack(texture2D(shadowMap, shadowCoord.xy));
  float cur_depth = shadowCoord.z;
  float bias = getShadowBias(biasC, filterRadiusUV);
  if(cur_depth - bias >= depth + EPS){
    return 0.;
  }
  else{
    return 1.0;
  }
}
```

注意这里给useShadowMap函数添加了两个参数，最后我们还需要调整main函数中对useShadowMap函数的调用，其中bias可以执行根据效果设定，而由于我们第一步是做硬阴影（嘤嘤嘤）所以filterRadiusUV参数传0。

```glsl
float bias = .4;
// 硬阴影无PCF，最后参数传0
visibility = useShadowMap(uShadowMap, vec4(shadowCoord, 1.0), bias, 0.);
```

然后我们可以得出一下效果

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_shadow_bias2.png)

可以看到明显改善了Shadow Acne问题。

### PCF

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcf.png)

因为ShadowMap是有分辨率的，同样会因为精度问题产生走样，因为对ShadowMap采样后做深度比较是非0即1的结果，导致阴影边界非常生硬。

PCF（Percentage Closer Filtering）把在ShadowMap采样后做深度比较的结果相加后进行平均，得到一个模糊的结果，把这个模糊的结果作为visibility项，即可使得阴影边界变得柔和。

PCF一开始是用于阴影抗锯齿上，后来人们发现可以用来实现软阴影，采样范围越大，阴影越“软”。

```c
//phongFragment.glsl
float PCF(sampler2D shadowMap, vec4 coords, float biasC, float filterRadiusUV) {
  //uniformDiskSamples(coords.xy);
  poissonDiskSamples(coords.xy); //使用xy坐标作为随机种子生成
  float visibility = 0.0;
  for(int i = 0; i < NUM_SAMPLES; i++){
    vec2 offset = poissonDisk[i] * filterRadiusUV;
    float shadowDepth = useShadowMap(shadowMap, coords + vec4(offset, 0., 0.), biasC, filterRadiusUV);
    if(coords.z > shadowDepth + EPS){
      visibility++;
    }
  }
  return 1.0 - visibility / float(NUM_SAMPLES);
}
```

PCF实现首先需要两个参数，一是采样范围，二是采样数量，然后我们需要描述如何在指定范围内采样到指定数量的样本。

作业框架提供了uniformDiskSamples和poissonDiskSamples两个随机采样函数，我们调用即可，采样函数要求我们传入一个vec2变量作为随机种子，我们直接使用片元坐标即可，注意不要使用固定值，否则每次采样结果都是一样的。我们也可以调整``NUM_SAMPLES``来修改采样数，采样数越高，噪点越少，效果越好。

调用采样函数后，会把采样结果储存到数组poissonDisk中，我们把结果乘以我们指定的一个范围值（这里作为参数传入），然后把结果作为原始采样坐标的offset传入useShadowMap即可。然后把useShadowMap得到的结果做深度比较，计算出被遮掩的样本数量占总样本数量占比，就是我们需要的模糊结果，注意由于返回的是visibility项，我们需要用1减去模糊结果，把意义取反。

```c
//phongFragment.glsl
void main(void) {
  //vPositionFromLight为光源空间下投影的裁剪坐标，除以w结果为NDC坐标
  vec3 shadowCoord = vPositionFromLight.xyz / vPositionFromLight.w;
  //把[-1,1]的NDC坐标转换为[0,1]的坐标
  shadowCoord.xyz = (shadowCoord.xyz + 1.0) / 2.0;

  float visibility = 1.;

  // 无PCF时的Shadow Bias
  float nonePCFBiasC = .4;
  // 有PCF时的Shadow Bias
  float pcfBiasC = .2;
  // PCF的采样范围，因为是在Shadow Map上采样，需要除以Shadow Map大小，得到uv坐标上的范围
  float filterRadiusUV = FILTER_RADIUS / SHADOW_MAP_SIZE;

  // 硬阴影无PCF，最后参数传0
  //visibility = useShadowMap(uShadowMap, vec4(shadowCoord, 1.0), nonePCFBiasC, 0.);
  visibility = PCF(uShadowMap, vec4(shadowCoord, 1.0), pcfBiasC, filterRadiusUV);
  //visibility = PCSS(uShadowMap, vec4(shadowCoord, 1.0));

  vec3 phongColor = blinnPhong();

  gl_FragColor = vec4(phongColor * visibility, 1.0);
  //gl_FragColor = vec4(phongColor, 1.0);
}
```

然后修改main函数，以PCF函数返回值作为visibility项，并传入对应的bias和采样范围。

```glsl
#define FILTER_RADIUS 10.
```

采样范围我们直接定义，这里定义的单位是在ShadowMap大小的单位，因为采样时用的是uv单位，我们需要把采样范围除以ShadowMap大小作为参数。

使用poissonDiskSamples采样函数，并把``NUM_SAMPLES``调整为50，效果如下：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcf2.png)

### PCSS

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcss_1.png)

上图可以看出，在真实的光照阴影中，靠近遮挡物的部分，阴影边界会比较锐利，而远离遮挡物的阴影边界则比较模糊。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcss_2.png)

在游戏中，我们可以用PCSS来实现这种近实远虚的软阴影效果。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcss_4.png)

PCSS的核心在于，如何确定一个点的虚实程度，一个简单的规则，当这个点离遮挡点越远的时候，阴影显得越虚，当然这个还得跟光源大小等相关，根据相似三角形，我们可以得出公式：

$\large W_{penumbra} = (d_{Receiver} - d_{Blocker}) * W_{light} / d_{Blocker}$

得出来的这个数决定了阴影的虚实程度。

在上述公式中，receiver的深度是已知的，light的大小是我们设定的，那么剩下的是遮挡物blocker的深度了，为了结果更准确，我们在一个范围里计算这个点遮挡物的平均深度，那么我们又有了一个新的问题，这个范围取多少呢？能否根据相关联的数据计算出合适的范围？

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcss_5.png)

这张图给了我们一种方案，我们可以从shading point连接到光源，其经过Shadow Map时所截取的面积，就是我们用来求平均深度的采样面积，也就是离光源越近，我们所采样的范围就越大。

那么Light到ShadowMap的距离是一个怎样的概念？这里我们认为ShadowMap在近平面的位置，那距离就是近平面的深度了。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcss_3.png)

最后我们来总结一下PCSS的计算步骤：

1. 计算出范围内遮挡物的平均深度
2. 计算出Penumbra作为阴影虚实程度系数
3. 进行PCF（诶？怎么是PCF？前面提到过，PCF可以用来实现软阴影，其采样范围越大，阴影越“软”，而Penumbra决定了某个阴影点的虚实程度，所以我们把PCF采样范围乘以Penumbra，即可达到近实远虚的软阴影效果）

下面来看具体实现

```glsl
//phongFragment.glsl

#define NEAR_PLANE 0.01
#define LIGHT_WORLD_SIZE 5.
#define LIGHT_SIZE_UV LIGHT_WORLD_SIZE / FRUSTUM_SIZE
```

我们先定义一下需要的数据，其中NEAR_PLANE为光源所用透视矩阵的近平面数据，而LIGHT_WORLD_SIZE是我们自行设定，可根据效果调节的光源在世界空间的大小，而LIGHT_SIZE_UV则是光源在ShadowMap上的UV单位大小，可通过光源在世界空间的大小除以FRUSTUM_SIZE获得，FRUSTUM_SIZE我们在前面已经定义过。（注意这里设定ShadowMap和FRUSTUM都是正方形）

```c
//phongFragment.glsl

float findBlocker(sampler2D shadowMap, vec2 uv, float zReceiver) {
  int blockerNum = 0;
  float blockDepth = 0.;

  float posZFromLight = vPositionFromLight.z;

  float searchRadius = LIGHT_SIZE_UV * (posZFromLight - NEAR_PLANE) / posZFromLight;

  poissonDiskSamples(uv);
  for(int i = 0; i < NUM_SAMPLES; i++){
    float shadowDepth = unpack(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
    if(zReceiver > shadowDepth){
      blockerNum++;
      blockDepth += shadowDepth;
    }
  }

  if(blockerNum == 0)
    return -1.;
  else
    return blockDepth / float(blockerNum);
}
```

先实现查找一个点在某范围内的遮挡物平均深度函数findBlocker。根据上文所说的确定范围的规则，用相似三角形求出在ShadowMap上的查找范围（这里posZFromLight和NEAR_PLANE是光源空间下的单位，而LIGHT_SIZE_UV和searchRadius是ShadowMap的UV单位），然后用这个范围进行一个类似于PCF的计算，只不过PCF是计算出与深度比较结果的平均值，而这里则是计算遮挡物的深度平均值。

另外注意需要特殊处理范围内无遮挡物的情况，这里我们返回-1来表示这种情况，因为有遮挡物的情况下不会出现-1这个值，当然用别的方式表达也可以。

```c
//phongFragment.glsl

float PCSS(sampler2D shadowMap, vec4 coords, float biasC){
  float zReceiver = coords.z;

  // STEP 1: avgblocker depth 
  float avgBlockerDepth = findBlocker(shadowMap, coords.xy, zReceiver);

  if(avgBlockerDepth < -EPS)
    return 1.0;

  // STEP 2: penumbra size
  float penumbra = (zReceiver - avgBlockerDepth) * LIGHT_SIZE_UV / avgBlockerDepth;
  float filterRadiusUV = penumbra;

  // STEP 3: filtering
  return PCF(shadowMap, coords, biasC, filterRadiusUV);
}
```

然后再把PCSS的实现补充完整

1. 调用findBlocker取得结果，注意当结果是负数的时候表示范围内无遮挡物，则返回的visibility值为1。
2. 根据上文所说的penumbra的计算方法，计算出penumbra。
3. 直接使用penumbra作为PCF的采样范围进行PCF，这里复用之前的PCF的实现，注意传入bias参数。

```c
//phongFragment.glsl

void main(void) {
  //..
  float visibility = 1.;
  // 有PCF时的Shadow Bias
  float pcfBiasC = .2;
  //..
  visibility = PCSS(uShadowMap, vec4(shadowCoord, 1.0), pcfBiasC);
  vec3 phongColor = blinnPhong();

  gl_FragColor = vec4(phongColor * visibility, 1.0);
}
```

当然别忘了在main函数里改成调用PCSS。

最终结果如下：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_pcss_6.png)

可以看到能得到很不错的软阴影效果。

关于PCSS，我们可以参考Nvidia的实现[Whitepaper - Integrating Realistic Soft Shadows into Your Game Engine](https://developer.download.nvidia.cn/whitepapers/2008/PCSS_Integration.pdf)

```c

float PCSS ( Texture2D shadowMapTex, float4 coords )
{
 float2 uv = coords.xy;
 float zReceiver = coords.z; // Assumed to be eye-space z in this code

 // STEP 1: blocker search
 float avgBlockerDepth = 0;
 float numBlockers = 0;
 FindBlocker( avgBlockerDepth, numBlockers, uv, zReceiver );
 if( numBlockers < 1 )
 //There are no occluders so early out (this saves filtering)
return 1.0f;
 // STEP 2: penumbra size
 float penumbraRatio = PenumbraSize(zReceiver, avgBlockerDepth);
 float filterRadiusUV = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / coords.z;

 // STEP 3: filtering
 return PCF_Filter( uv, zReceiver, filterRadiusUV );
}
```

在Nvidia的这个白皮书中PCSS实现是这样的。

本文与Nvidia在实现基本上一样，只在penumbra的计算上有一处区别，也是202课堂上没有提到的内容。

```glsl
// 本文实现
float penumbra = (zReceiver - avgBlockerDepth) * LIGHT_SIZE_UV / avgBlockerDepth;

//Nvidia实现相当于这样(整合了一下)
float penumbra = (zReceiver - avgBlockerDepth) *  (LIGHT_SIZE_UV * NEAR_PLANE / coords.z) / avgBlockerDepth;
```

Nvidia的实现对``LIGHT_SIZE_UV``项再做了``* NEAR_PLANE / coords.z``计算，然而关于这个``coords.z``，结合上面的注释``Assumed to be eye-space z in this code``，以及在FindBlocker和PCSS中使用时的意义来看，我没搞明白这个``coords.z``是什么空间下的值，并在尝试与Nvidia实现保持一致时，并没有得出正常的结果。希望有了解的同学能解答一下。

### Bonus部分：多光源 ShadowMap 和动态物体

先明确一下我们想要实现的效果：

1. 实现多光源阴影，并且创建两个光源围绕场景原点旋转
2. 实现场景中的人物模型原地旋转

#### 模型旋转

实际上作业框架并没有完善旋转所需要的逻辑，需要我们自行补充，这部分属于GMAES101中的基础部分，不过多说明，直接贴代码修改：

```js
//engine.js

//Edit Start 添加rotate参数
function setTransform(t_x, t_y, t_z, r_x, r_y, r_z, s_x, s_y, s_z) {
//Edit End
	return {
		modelTransX: t_x,
		modelTransY: t_y,
		modelTransZ: t_z,
		//Edit Start
		modelRotateX: r_x,
		modelRotateY: r_y,
		modelRotateZ: r_z,
		//Edit End
		modelScaleX: s_x,
		modelScaleY: s_y,
		modelScaleZ: s_z,
	};
}
```

```js
//DirectionalLight.js

class DirectionalLight {

    constructor(lightIntensity, lightColor, lightPos, focalPoint, lightUp, hasShadowMap, gl) {
        //Edit Start 添加旋转参数
        this.mesh = Mesh.cube(setTransform(0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0));
        //Edit End
        this.mat = new EmissiveMaterial(lightIntensity, lightColor);
        this.lightPos = lightPos;
        this.focalPoint = focalPoint;
        this.lightUp = lightUp

        this.hasShadowMap = hasShadowMap;
        this.fbo = new FBO(gl);
        if (!this.fbo) {
            console.log("无法设置帧缓冲区对象");
            return;
        }
    }

    //Edit Start 添加旋转参数
    CalcLightMVP(translate, rotate, scale) {
    //Edit End
        let lightMVP = mat4.create();
        let modelMatrix = mat4.create();
        let viewMatrix = mat4.create();
        let projectionMatrix = mat4.create();

        //https://glmatrix.net/docs/module-mat4.html


        //Edit Start
        // Model transform
        mat4.translate(modelMatrix, modelMatrix, translate)
        mat4.rotateX(modelMatrix, modelMatrix, rotate[0])
        mat4.rotateY(modelMatrix, modelMatrix, rotate[1])
        mat4.rotateZ(modelMatrix, modelMatrix, rotate[2])
        mat4.scale(modelMatrix, modelMatrix, scale)
        
        // View transform
        mat4.lookAt(viewMatrix, this.lightPos, this.focalPoint, this.lightUp)
    
        // Projection transform
        var r = 200;
        var l = -r;
        var t = 200;
        var b = -t;

        var n = 0.01;
        var f = 500;

        mat4.ortho(projectionMatrix, l, r, b, t, n, f);

        //Edit End

        mat4.multiply(lightMVP, projectionMatrix, viewMatrix);
        mat4.multiply(lightMVP, lightMVP, modelMatrix);

        return lightMVP;
    }
}
```

```js
//PhongMaterial.js

class PhongMaterial extends Material {
//Edit Start 添加rotate参数
    constructor(color, specular, light, translate, rotate, scale, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, rotate, scale);
//Edit End
        let lightIntensity = light.mat.GetIntensity();

        super({
            // Phong
            'uSampler': { type: 'texture', value: color },
            'uKs': { type: '3fv', value: specular },
            'uLightIntensity': { type: '3fv', value: lightIntensity },
            // Shadow
            'uShadowMap': { type: 'texture', value: light.fbo },
            'uLightMVP': { type: 'matrix4fv', value: lightMVP },

        }, [], vertexShader, fragmentShader);
    }
}

//Edit Start 添加rotate参数
async function buildPhongMaterial(color, specular, light, translate, rotate, scale, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate参数
    return new PhongMaterial(color, specular, light, translate, rotate, scale, vertexShader, fragmentShader);
//Edit End
}
```

```js
//ShadowMaterial.js

class ShadowMaterial extends Material {
//Edit Start 添加rotate参数
    constructor(light, translate, rotate, scale, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, rotate, scale);
//Edit End
        super({
            'uLightMVP': { type: 'matrix4fv', value: lightMVP }
        }, [], vertexShader, fragmentShader, light.fbo);
    }
}

//Edit Start 添加rotate参数
async function buildShadowMaterial(light, translate, rotate, scale, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate参数
    return new ShadowMaterial(light, translate, rotate, scale, vertexShader, fragmentShader);
//Edit End
}
```

```js
//Mesh.js

class TRSTransform {
	//Edit Start 添加rotate参数
    constructor(translate = [0, 0, 0], rotate = [0, 0, 0], scale = [1, 1, 1]) {
        this.translate = translate;
		this.rotate = rotate;
        this.scale = scale;
    }
	//Edit End
}

//...

	const modelTranslation = [transform.modelTransX, transform.modelTransY, transform.modelTransZ];
	//Edit Start 添加旋转
	const modelRatation = [transform.modelRotateX, transform.modelRotateY, transform.modelRotateZ];
	const modelScale = [transform.modelScaleX, transform.modelScaleY, transform.modelScaleZ];
	let meshTrans = new TRSTransform(modelTranslation, modelRatation, modelScale);
	//Edit End
	this.transform = meshTrans;

//...

```

```js
//MeshRender.js

//...
// Model transform
mat4.identity(modelMatrix);
mat4.translate(modelMatrix, modelMatrix, this.mesh.transform.translate);
//Edit Start 添加旋转
mat4.rotateX(modelMatrix, modelMatrix, this.mesh.transform.rotate[0])
mat4.rotateY(modelMatrix, modelMatrix, this.mesh.transform.rotate[1])
mat4.rotateZ(modelMatrix, modelMatrix, this.mesh.transform.rotate[2])
//Edit End
mat4.scale(modelMatrix, modelMatrix, this.mesh.transform.scale);
//...
```

```js
//loadOBJ.js

//...
let material, shadowMaterial;
let Translation = [transform.modelTransX, transform.modelTransY, transform.modelTransZ];
//Edit Start 添加旋转参数
let Rotation = [transform.modelRotateX, transform.modelRotateY, transform.modelRotateZ];
//Edit End
let Scale = [transform.modelScaleX, transform.modelScaleY, transform.modelScaleZ];

let light = renderer.lights[0].entity;
switch (objMaterial) {
	case 'PhongMaterial':
		//Edit Start 添加旋转参数
		material = buildPhongMaterial(colorMap, mat.specular.toArray(), light, Translation, Rotation, Scale, "./src/shaders/phongShader/phongVertex.glsl", "./src/shaders/phongShader/phongFragment.glsl");
		shadowMaterial = buildShadowMaterial(light, Translation, Rotation, Scale, "./src/shaders/shadowShader/shadowVertex.glsl", "./src/shaders/shadowShader/shadowFragment.glsl");
		//Edit End
		break;
}
```

以上是要在模型变换中要支持旋转所需要修改的地方

```js
//engine.js

let floorTransform = setTransform(0, 0, -30, 0, 0, 0, 4, 4, 4);
let obj1Transform = setTransform(0, 0, 0, 0, 0, 0, 20, 20, 20);
let obj2Transform = setTransform(40, 0, -40, 0, 0, 0, 10, 10, 10);
```

现在已经有了旋转的支持，那么我们回头把setTransform的rotation参数补上。

这里我们把中间三个旋转参数初始化为0，因为我们要支持的是持续旋转，那么场景中的物体就需要感觉到时间的流逝，为了实现这一点我们需要在引擎mainloop中获取deltatime：
```js
//engine.js

//Edit Start deltaTime实现
let prevTime = 0;

function mainLoop(now) {
	cameraControls.update();
	let deltaime = (now - prevTime) / 1000;
	renderer.render(now, deltaime);
	requestAnimationFrame(mainLoop);
	prevTime = now;
}
//Edit End
```

然后我们在WebGLRenderer的render函数中接收时间参数即可。

```js
//WebGLRenderer.js

//Edit Start 添加time, deltaime参数
render(time, deltaime) {
//Edit End
//...
}
```

```js
//engine.js

//角度转弧度
function degrees2Radians(degrees){
	return 3.1415927 / 180 * degrees;
}
```

注意要控制旋转的时接受的是弧度参数，为了更直观我们希望使用角度，所以先``engine.js``里添加一个角度转弧度的函数实现。

```js
//WebGLRenderer.js

gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
gl.clearDepth(1.0); // Clear everything
gl.enable(gl.DEPTH_TEST); // Enable depth testing
gl.depthFunc(gl.LEQUAL); // Near things obscure far things

console.assert(this.lights.length != 0, "No light");
console.assert(this.lights.length == 1, "Multiple lights");

//Edit Start 角色旋转，地面不转(用顶点数筛选)
for (let i = 0; i < this.meshes.length; i++) {
    if(this.meshes[i].mesh.count > 10)
    {
        this.meshes[i].mesh.transform.rotate[1] = this.meshes[i].mesh.transform.rotate[1] + degrees2Radians(10) * deltaime;
    }
}
//Edit End
```

一切就绪，我们现在可以添加二次元妹妹模型旋转的实现了！实现很简单，因为我们是做绕Y轴的旋转，所以每帧把rotate的第二个参数（索引1）加上要旋转的值就OK了，注意乘上deltatime，如上面实现就是每秒绕Y轴旋转5°。

但有个问题，我只希望妹妹旋转，不希望地面旋转，然鹅这里无法直接判断这个mesh是个什么模型，如果为了做特别区分，去支持加载模型时加入tag等数据又显得很麻烦，为了加入旋转，我们已经在很多地方插入代码了。

怎么办呢？**困りますね**，后来我灵只因一动决定通过mesh的顶点数来筛选，地面的顶点数是6，我们只对``mesh.count > 10``的模型进行旋转即可。

``这里另外补充一个小说明，WebGLRenderer里包含了meshes和shadowMeshes两个数组字段，我们需要对他们都进行渲染，而我们这里只修改了meshes的旋转信息，是因为meshes和shadowMeshes并不是Mesh本身，而是两组MeshRender，这里命名不是很准确，MeshRender里才包含了真正的Mesh实例，而这两组MeshRender其实是指向同一组Mesh，所以我们只需要对其中一组进行修改即可。``

然后我们来看看效果：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_rotate_1.gif)

可以看到202娘已经在旋转了，但是阴影并没有跟着旋转，这是怎么回事呢。

```js
//WebGLRenderer.js

for (let l = 0; l < this.lights.length; l++) {

    //Edit Start 切换光源时，对当前光源的shadowmap的framebuffer做一些清理操作
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.lights[l].entity.fbo); // 绑定到当前光源的framebuffer
    gl.clearColor(1.0, 1.0, 1.0, 1.0); // shadowmap默认白色（无遮挡），解决地面边缘产生阴影的问题（因为地面外采样不到，默认值为0会认为是被遮挡）
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 清除shadowmap上一帧的颜色、深度缓存，否则会一直叠加每一帧的结果
    //Edit End

    // Draw light
    // TODO: Support all kinds of transform
    this.lights[l].meshRender.mesh.transform.translate = this.lights[l].entity.lightPos;
    this.lights[l].meshRender.draw(this.camera);
    
    // Shadow pass
    if (this.lights[l].entity.hasShadowMap == true) {
        for (let i = 0; i < this.shadowMeshes.length; i++) {
            // Edit Start 每帧更新shader中uniforms的LightMVP
            this.gl.useProgram(this.shadowMeshes[i].shader.program.glShaderProgram);
            let translation = this.shadowMeshes[i].mesh.transform.translate;
            let rotation = this.shadowMeshes[i].mesh.transform.rotate;
            let scale = this.shadowMeshes[i].mesh.transform.scale;
            let lightMVP = this.lights[l].entity.CalcLightMVP(translation, rotation, scale);
            this.shadowMeshes[i].material.uniforms.uLightMVP = { type: 'matrix4fv', value: lightMVP };
            // Edit End
            this.shadowMeshes[i].draw(this.camera);
        }
    }

    // Camera pass
    for (let i = 0; i < this.meshes.length; i++) {
        this.gl.useProgram(this.meshes[i].shader.program.glShaderProgram);
        // Edit Start 每帧更新shader中uniforms参数
        // this.gl.uniform3fv(this.meshes[i].shader.program.uniforms.uLightPos, this.lights[l].entity.lightPos); //这里改用下面写法
        let translation = this.meshes[i].mesh.transform.translate;
        let rotation = this.meshes[i].mesh.transform.rotate;
        let scale = this.meshes[i].mesh.transform.scale;
        let lightMVP = this.lights[l].entity.CalcLightMVP(translation, rotation, scale);
        this.meshes[i].material.uniforms.uLightMVP = { type: 'matrix4fv', value: lightMVP };
        this.meshes[i].material.uniforms.uLightPos = { type: '3fv', value: this.lights[l].entity.lightPos }; // 光源方向计算、光源强度衰减
        // Edit End
        this.meshes[i].draw(this.camera);
    }
}
```

如上面代码，这里我们来处理几个问题：

虽然Shadow Pass是每帧绘制的，但我们没有更新lightMVP矩阵，导致物体变动并没有反映在ShadowMap上，这里我们需要在两个Pass中都每帧更新一下shader中的参数uLightMVP，即可解决阴影不更新的问题。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_clear_shdowmap.png)

```js
//WebGLRenderer.js

gl.bindFramebuffer(gl.FRAMEBUFFER, this.lights[l].entity.fbo); // 绑定到当前光源的framebuffer
gl.clearColor(1.0, 1.0, 1.0, 1.0); // shadowmap默认白色（无遮挡），解决地面边缘产生阴影的问题（因为地面外采样不到，默认值为0会认为是被遮挡）
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 清除shadowmap上一帧的颜色、深度缓存，否则会一直叠加每一帧的结果
```

另外我们还包含了这三行图形API的调用。

第一行是表示绑定当前灯光的framebuffer，后续操作都对绑定的framebuffer生效。

第二行是为了解决上图出现的，在地面边缘有黑影的问题，因为原本ShadowMap默认为黑色，地板外的地方因为没采样到，所以值为默认值0，而这在我们的采样中会被认为visibility为0，所以会产生阴影，这里我们对ShadowMap进行设置，当执行clear操作时，默认以白色（值为1）填充即可解决。

第三行很重要，首先第三行才是真正执行清除的操作，让第二行代码生效，第二行只是一个设置，另外这也是清除掉上一帧ShadowMap数据的操作，不然阴影动起来时会发现阴影会叠加。

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_rotate_2.gif)

#### 动态多光源

要支持多光源同样需要改不少地方，不知道是框架没考虑作业的提高部分，还是故意为之，GAMES这两门渲染课程一直都是注重图形学本身，轻工程部分，尽量提供完善框架，大家只需要填空实现即可，但这个作业的提高部分目前看来需要改的地方也太多了点。

由于在WebGLRenderer中只用了两个数组区分了Shadow Pass的MeshRender和Camera Pass的MeshRender，在多光源情况下，我们把不同光源对应的MeshRender也会添加到其中，我们需要做一个区分，避免在每一轮的光源渲染中都把所有光源包含的MeshRender都Draw了一次，但框架现有代码似乎没有太好的方式可以区分，我决定给Material类添加一个lightIndex字段表示对应光源，修改如下：

```js
//Material.js

//Edit Start 添加lightIndex参数
constructor(uniforms, attribs, vsSrc, fsSrc, frameBuffer, lightIndex) {
//Edit End 
    this.uniforms = uniforms;
    this.attribs = attribs;
    this.#vsSrc = vsSrc;
    this.#fsSrc = fsSrc;
    
    this.#flatten_uniforms = ['uViewMatrix','uModelMatrix', 'uProjectionMatrix', 'uCameraPos', 'uLightPos'];
    for (let k in uniforms) {
        this.#flatten_uniforms.push(k);
    }
    this.#flatten_attribs = attribs;

    this.frameBuffer = frameBuffer;
    //Edit Start 添加lightIndex字段
    this.lightIndex = lightIndex;
    //Edit End
}
```

```js
//ShadowMaterial.js

class ShadowMaterial extends Material {
//Edit Start 添加rotate、lightIndex参数
    constructor(light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, rotate, scale);
//Edit End
        super({
            'uLightMVP': { type: 'matrix4fv', value: lightMVP }
        //Edit Start lightIndex参数
        }, [], vertexShader, fragmentShader, light.fbo, lightIndex);
        //Edit End
    }
}

//Edit Start 添加rotate、lightIndex参数
async function buildShadowMaterial(light, translate, rotate, scale, lightIndex, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate、lightIndex参数
    return new ShadowMaterial(light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader);
//Edit End
}
```

```js
//PhongMaterial.js

class PhongMaterial extends Material {
//Edit Start 添加rotate、lightIndex参数
    constructor(color, specular, light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, rotate, scale);
//Edit End
        let lightIntensity = light.mat.GetIntensity();

        super({
            // Phong
            'uSampler': { type: 'texture', value: color },
            'uKs': { type: '3fv', value: specular },
            'uLightIntensity': { type: '3fv', value: lightIntensity },
            // Shadow
            'uShadowMap': { type: 'texture', value: light.fbo },
            'uLightMVP': { type: 'matrix4fv', value: lightMVP },
        //Edit Start 添加lightIndex参数
        }, [], vertexShader, fragmentShader, null, lightIndex);
        //Edit End
    }
}

//Edit Start 添加rotate、lightIndex参数
async function buildPhongMaterial(color, specular, light, translate, rotate, scale, lightIndex, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate、lightIndex参数
    return new PhongMaterial(color, specular, light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader);
//Edit End
}
```

```js
//loadOBJ.js

let material, shadowMaterial;
let Translation = [transform.modelTransX, transform.modelTransY, transform.modelTransZ];
//Edit Start 添加旋转参数
let Rotation = [transform.modelRotateX, transform.modelRotateY, transform.modelRotateZ];
//Edit End
let Scale = [transform.modelScaleX, transform.modelScaleY, transform.modelScaleZ];

//Edit Start 原本只添加第一个light的材质，改成添加所有light的材质，并添加旋转参数
for(let i = 0; i < renderer.lights.length; i++){
	let light = renderer.lights[i].entity;
	switch (objMaterial) {
		case 'PhongMaterial':
			//Edit Start 添加旋转参数、光源索引参数
			material = buildPhongMaterial(colorMap, mat.specular.toArray(), light, Translation, Rotation, Scale, i, "./src/shaders/phongShader/phongVertex.glsl", "./src/shaders/phongShader/phongFragment.glsl");
			shadowMaterial = buildShadowMaterial(light, Translation, Rotation, Scale, i, "./src/shaders/shadowShader/shadowVertex.glsl", "./src/shaders/shadowShader/shadowFragment.glsl");
			//Edit End
			break;
	}

	material.then((data) => {
		let meshRender = new MeshRender(renderer.gl, mesh, data);
		renderer.addMeshRender(meshRender);
	});
	shadowMaterial.then((data) => {
		let shadowMeshRender = new MeshRender(renderer.gl, mesh, data);
		renderer.addShadowMeshRender(shadowMeshRender);
	});
}
//Edit End
```

以上是支持多光源的代码支撑，接下来就是添加光源了

```js
//engine.js

// Add lights
// light - is open shadow map == true
let lightPos1 = [0, 80, 80];
let focalPoint = [0, 0, 0];
let lightUp = [0, 1, 0]
//Edit Start 改一下第一个光源的亮度
const directionLight = new DirectionalLight(2500, [1, 1, 1], lightPos1, focalPoint, lightUp, true, renderer.gl);
//Edit End
renderer.addLight(directionLight);

//Edit Start 添加第二个光源
let lightPos2 = [90, 90, 0];
const directionLight2 = new DirectionalLight(2500, [1, 1, 1], lightPos2, focalPoint, lightUp, true, renderer.gl);
renderer.addLight(directionLight2);
//Edit End
```

添加第二个光源，位置可以自由调整，但注意位置太远会脱离我们定义的渲染ShadowMap的视锥体，那样就无法绘制阴影了，为了防止画面太亮，我们也调整一下两个光源的亮度。

```js
//WebGLRenderer.js

console.assert(this.lights.length != 0, "No light");
//console.assert(this.lights.length == 1, "Multiple lights"); //取消多光源检测
```

然后我们注释掉WebGLRenderer中一行光源数量检测（不知道作业框架加这个检测做什么）。

```js
//WebGLRenderer.js

for (let l = 0; l < this.lights.length; l++) {
    // set framebuffer ...

    // Draw light
    // TODO: Support all kinds of transform
    //Edit Start 灯光围绕原点旋转
    let lightRotateSpped = [10, 80]
    let lightPos = this.lights[l].entity.lightPos;
    lightPos = vec3.rotateY(lightPos, lightPos, this.lights[l].entity.focalPoint, degrees2Radians(lightRotateSpped[l]) * deltaime);
    this.lights[l].entity.lightPos = lightPos; //给DirectionalLight的lightPos赋值新的位置，CalcLightMVP计算LightMVP需要用到
    this.lights[l].meshRender.mesh.transform.translate = lightPos;
    //Edit End
    this.lights[l].meshRender.draw(this.camera);
    

    // Shadow pass
    if (this.lights[l].entity.hasShadowMap == true) {
        for (let i = 0; i < this.shadowMeshes.length; i++) {
            if(this.shadowMeshes[i].material.lightIndex != l)
                continue;// 是当前光源的材质才绘制，否则跳过

            // set shader program ...
            this.shadowMeshes[i].draw(this.camera);
        }
    }

    // Edit Start 非第一个光源Pass时进行一些设置（Base Pass和Additional Pass区分）
    if(l != 0)
    {
        // 开启混合，把Additional Pass混合到Base Pass结果上，否则会覆盖Base Pass的渲染结果
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
    }
    // Edit End

    // Camera pass
    for (let i = 0; i < this.meshes.length; i++) {
        if(this.meshes[i].material.lightIndex != l)
            continue;// 是当前光源的材质才绘制，否则跳过
        // set shader program ...
        // Edit End
        this.meshes[i].draw(this.camera);
    }

    // Edit Start 还原Additional Pass的设置
    gl.disable(gl.BLEND);
    // Edit End
}
```

最后添加动态多光源的核心实现，总结一下上面代码改动：
1. 实现光源围绕原点进行Y轴旋转，注意这里的旋转并不是模型变换里的旋转，这里旋转的结果是位置发生变化，最后真正产生了“旋转”的，是光照方向的朝向，其对应光源的观察变换。
2. 在Shadow Pass和Camera Pass中都判断一下当前MeshRender的材质的lightIndex与当前渲染中的光源的Index是否一致，不一致的跳过，不然会把不属于当前光源的MeshRender全部渲染一遍。
3. 由于是多光源绘制，我们需要把第二个及以后的光源的Camera Pass渲染结果都叠加到第一个光源的Camera Pass渲染结果上，需要开启混合，并以one one模式叠加，否则只能看到最后一个光源的渲染结果。

大功告成！这就是文章开头的最终效果：

![](https://blog-1300673521.cos.ap-guangzhou.myqcloud.com/games202-homework1_final.gif)





