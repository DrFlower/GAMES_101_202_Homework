![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_top.jpg)

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_final.png)

## 作业总览

1. 实现对场景直接光照着色（考虑阴影）。
2. 实现屏幕空间下光线的求交（SSR）。
3. 实现对场景间接光照的着色。
4. Bonus 1：实现Mipmap优化的 Screen Space Ray Tracing（Hiz优化）。

## 源码

[GAMES101&202 Homework](https://github.com/DrFlower/GAMES_101_202_Homework)

## 作业流程

只看基础部分的话，本次作业流程很简单，框架同样沿用作业1、作业2相同的框架，有了前面对这个框架熟悉的经验，我们直接看``WebGLRenderer.js``中的渲染流程后，就可以上手去完成这个作业了。渲染流程是这样的，第一个Shadow Pass先绘制场景的shadow map，第二个是GBuffer Pass，把shadow map，和模型的diffuse map、normal map传入shader，最后生成diffuse、depth、normal、shadow、worldPos五个GBuffer信息，最后到Camera Pass渲染最终显示内容，对应的fragment shader是``ssrFragment.glsl``，基础部分要实现的内容都在这个shader中实现。

作业框架也提供了3个场景供以切换，验证不同阶段的效果，其中前两个都是Cube场景，第三个是Cave场景，Cube和Cave之前切换时，注意有灯光和摄像机两套参数需要切换，在``engine.js``修改即可。

至于提高部分，有点过于麻烦了，本文后面再具体说。

## 实现

### 直接光照

```c
//ssrFragment.glsl

/*
 * Evaluate diffuse bsdf value.
 *
 * wi, wo are all in world space.
 * uv is in screen space, [0, 1] x [0, 1].
 *
 */
vec3 EvalDiffuse(vec3 wi, vec3 wo, vec2 uv) {
  vec3 albedo  = GetGBufferDiffuse(uv);
  vec3 normal = GetGBufferNormalWorld(uv);
  float cos = max(0., dot(normal, wi));
  return albedo * cos * INV_PI;
}

/*
 * Evaluate directional light with shadow map
 * uv is in screen space, [0, 1] x [0, 1].
 *
 */
vec3 EvalDirectionalLight(vec2 uv) {
  vec3 Le = GetGBufferuShadow(uv) * uLightRadiance;
  return Le;
}

```

EvalDiffuse和EvalDirectionalLight其实对应了渲染方程中的$f_{r}$和$L_{i}$。

对于EvalDiffuse，需要注意的是这里使用的是Lambertian漫反射，需要除以π，另外Lambertian漫反射本身其实与wi和wo无关，但函数参数传入了wi和wo，而作业的间接光照部分给出的伪代码也没有cos项，所以这里实现直接把cos项放EvalDiffuse里了，这里感觉作业没有说得太清楚。

EvalDirectionalLight则注意考虑上阴影的visibility项，否则没有阴影。

```c
//ssrFragment.glsl

void main() {
  float s = InitRand(gl_FragCoord.xy);

  vec3 L = vec3(0.0);
  // L = GetGBufferDiffuse(GetScreenCoordinate(vPosWorld.xyz));

  vec3 worldPos = vPosWorld.xyz;
  vec2 screenUV = GetScreenCoordinate(vPosWorld.xyz);
  vec3 wi = normalize(uLightDir);
  vec3 wo = normalize(uCameraPos - worldPos);

  // 直接光照
  L = EvalDiffuse(wi, wo, screenUV) * EvalDirectionalLight(screenUV);

  vec3 color = pow(clamp(L, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
  gl_FragColor = vec4(vec3(color.rgb), 1.0);
}
```

main函数中计算出EvalDiffuse和EvalDirectionalLight所需要的参数，并调用他们计算出最终的光照结果即可，由于我们需要从GBuffer中用屏幕坐标取值，用GetScreenCoordinate可以计算出世界坐标对应的屏幕坐标，而wi为入射光方向，wo为出射方向（光线从物体到摄像机的方向）。

结果如下：

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_direct_light.png)


### Screen Space Ray Tracing

Screen Space Ray Tracing似乎是闫老师的个人喜好叫法，其实就是SSR，我们需要实现RayMarch然后用镜面反射来检查我们的步进方向对不对。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_ppt_linear_raymarch.png)

RayMarch目的是求光线与物体交点，原理就是模拟光线从给定一个起点沿着某个方向每次步进一定的距离，用步进后光线的深度对比光线所在的屏幕坐标的场景物体深度，若光线深度大于场景物体深度，则相交，实现如下：

```c
//ssrFragment.glsl

bool RayMarch(vec3 ori, vec3 dir, out vec3 hitPos) {
  float step = 0.05;
  const int totalStepTimes = 150; 
  int curStepTimes = 0;

  vec3 stepDir = normalize(dir) * step;
  vec3 curPos = ori;
  for(int curStepTimes = 0; curStepTimes < totalStepTimes; curStepTimes++)
  {
    vec2 screenUV = GetScreenCoordinate(curPos);
    float rayDepth = GetDepth(curPos);
    float gBufferDepth = GetGBufferDepth(screenUV);

    if(rayDepth - gBufferDepth > 0.0001){
      hitPos = curPos;
      return true;
    }

    curPos += stepDir;
  }

  return false;
}
```

步长取多少需要根据场景实际情况来决定，步长取大了，效果会变差，因为求出来的交点会在物体后面，步长越大误差越大，反射出来的画面会有“断层”的瑕疵，而步长取短了会影响性能，这里步长我们固定取0.05，能得到比较好的效果。

另外还需要设定最大步进次数，避免不相交时计算没有退出条件的问题，另一方面也可以把RayMarch的性能消耗在一定程度上做限制，步进太远还没有交点时，就认为没有交点。

```c
//ssrFragment.glsl

// test Screen Space Ray Tracing 
vec3 EvalReflect(vec3 wi, vec3 wo, vec2 uv) {
  vec3 worldNormal = GetGBufferNormalWorld(uv);
  vec3 relfectDir = normalize(reflect(-wo, worldNormal));
  vec3 hitPos;
  if(RayMarch(vPosWorld.xyz, relfectDir, hitPos)){
      vec2 screenUV = GetScreenCoordinate(hitPos);
      return GetGBufferDiffuse(screenUV);
  }
  else{
    return vec3(0.); 
  }
}
```

补充一个专门用来测试SSR的函数。

```c
//ssrFragment.glsl

void main() {
  float s = InitRand(gl_FragCoord.xy);

  vec3 L = vec3(0.0);
  // L = GetGBufferDiffuse(GetScreenCoordinate(vPosWorld.xyz));

  vec3 worldPos = vPosWorld.xyz;
  vec2 screenUV = GetScreenCoordinate(vPosWorld.xyz);
  vec3 wi = normalize(uLightDir);
  vec3 wo = normalize(uCameraPos - worldPos);

  // 直接光照
  // L = EvalDiffuse(wi, wo, screenUV) * EvalDirectionalLight(screenUV);

  // Screen Space Ray Tracing 的反射测试
  L = (GetGBufferDiffuse(screenUV) + EvalReflect(wi, wo, screenUV))/2.;

  vec3 color = pow(clamp(L, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
  gl_FragColor = vec4(vec3(color.rgb), 1.0);
}
```

最后在main函数中把之前实现的直接光照换成要测SSR的函数，最后反射效果如下图，RayMarch实现正确。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_ssr.png)


### 间接光照

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_indirect_light.png)

参考作业给出的伪代码实现间接光计算。

```c
//ssrFragment.glsl

void main() {
  float s = InitRand(gl_FragCoord.xy);

  vec3 L = vec3(0.0);
  // L = GetGBufferDiffuse(GetScreenCoordinate(vPosWorld.xyz));

  vec3 worldPos = vPosWorld.xyz;
  vec2 screenUV = GetScreenCoordinate(vPosWorld.xyz);
  vec3 wi = normalize(uLightDir);
  vec3 wo = normalize(uCameraPos - worldPos);

  // 直接光照
  L = EvalDiffuse(wi, wo, screenUV) * EvalDirectionalLight(screenUV);

  // Screen Space Ray Tracing 的反射测试
  // L = (GetGBufferDiffuse(screenUV) + EvalReflect(wi, wo, screenUV))/2.;

  vec3 L_ind = vec3(0.0);
  for(int i = 0; i < SAMPLE_NUM; i++){
    float pdf;
    vec3 localDir = SampleHemisphereCos(s, pdf);
    vec3 normal = GetGBufferNormalWorld(screenUV);
    vec3 b1, b2;
    LocalBasis(normal, b1, b2);
    vec3 dir = normalize(mat3(b1, b2, normal) * localDir);

    vec3 position_1;
    if(RayMarch(worldPos, dir, position_1)){
      vec2 hitScreenUV = GetScreenCoordinate(position_1);
      L_ind += EvalDiffuse(dir, wo, screenUV) / pdf * EvalDiffuse(wi, dir, hitScreenUV) * EvalDirectionalLight(hitScreenUV);
    }
  }

  L_ind /= float(SAMPLE_NUM);

  L = L + L_ind;

  vec3 color = pow(clamp(L, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
  gl_FragColor = vec4(vec3(color.rgb), 1.0);
}
```

间接光涉及到上半球采样方向和对应pdf的计算，这里作业提供了几个现成的函数来完成这部分计算，其中``InitRand(vec2 uv)``可以理解为取得一个随机种子，用gl_FragCoord.xy可以确保每个fragment都取得不同的随机种子。作业中提到的``Rand1(inout float p)``和``Rand2(inout float p)``其实可以不用关注，我们直接调用``SampleHemisphereUniform(inout float s, out float pdf)``或``SampleHemisphereCos(inout float s, out float pdf)``取得采样方向和对应pdf即可，其中前者为均匀采样，后者为按cos加权采样，这里使用SampleHemisphereCos。

上面取得的方向，其实是单位上半球局部坐标系中的向量（位置），我们需要使用作业框架提供的函数``LocalBasis(vec3 n, out vec3 b1, out vec3 b2)``，取得两个切线向量，然后组成TBN矩阵把这个局部向量转换成世界坐标下的方向向量，也就是我们世界空间下的步进方向。

```c
void LocalBasis(vec3 n, out vec3 b1, out vec3 b2) {
  float sign_ = sign(n.z);
  if (n.z == 0.0) {
    sign_ = 1.0;
  }
  float a = -1.0 / (sign_ + n.z);
  float b = n.x * n.y * a;
  b1 = vec3(1.0 + sign_ * n.x * n.x * a, sign_ * b, -sign_ * n.x);
  b2 = vec3(b, sign_ + n.y * n.y * a, -n.y);
}
```

作业提供的LocalBasis实现是这样的，说实话，我没太看懂，whatever，先不管。

然后我们就可以直接把作业中的伪代码代入到我们实现中了，调用写好的RayMarch，若与物体有交点，则计算其间接光照，这里传入的参数需要注意一下，虽说是模拟光线步进，但这里并不是真正的从光源出发的步进，而是反过来从某个着色点出发寻找有没有光源（这个光源是指提供了间接光照的着色点），所以position0的EvalDiffuse的光线入射方向是间接光源到该着色点的方向（也就是我们的步进方向），而出射方向则仍然是position0到摄像机的方向，而后面的EvalDiffuse和EvalDirectionalLight则是计算提供间接光照的着色点（position1）在position0位置观察的直接光照结果（有一丶绕），所以这里的入射方向是真正光源方向，出射方向是步进方向。最后需要把累加的间接光除以采样数取得平均值。

以上步骤是计算间接光的步骤，而最终光照结果是由直接光照+间接光照得出的，别忘了加上原本的直接光照的计算结果。

最后我们可以切换一下场景2和场景3观察实现效果。

```js
//engine.js

// Add shapes
// loadGLTF(renderer, 'assets/cube/', 'cube1', 'SSRMaterial');// 场景1
// loadGLTF(renderer, 'assets/cube/', 'cube2', 'SSRMaterial');// 场景2
loadGLTF(renderer, 'assets/cave/', 'cave', 'SSRMaterial');// 场景3
```

另外注意如果是在cube和cave之间进行切换，还有两套摄像机和光源参数需要切换，都在``engine.js``这个脚本中，这里不罗列了。

SAMPLE_NUM为1时，场景2和场景3的间接光效果如下，可以看到噪点很多，可以自行调整SAMPLE_NUM，减少噪点。


![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_ssgi_cube.png)

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_ssgi_cave.png)


### Bonus 1：实现Mipmap优化的 Screen Space Ray Tracing（Hiz优化）

基础部分实现的固定距离步进的Raymarch，在遇到很长距离都没有交点的情况下，仍然会做很多次步进和深度比较，那么有没有办法动态调整步进距离，使得这种情况下可以减少步进次数呢？

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_ppt_generate_depth_mipmap.png)

一个简单的优化思路是，我们使用深度图Mipmap，与常见Mipmap不同，这里使用的Mipmap不是记录更大一层的Mipmap对应的四个像素的平均值，而是记录四个像素的最小值。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_ppt_why_depth_mipmap.png)

有了最小深度的Mipmap后，我们相当于有了一个场景深度的加速结构，处于上层的Mipmap中的一个像素对应的深度反映了下层的Mipmap的一片区域的最小深度，如果当前光线与较上层的Mipmap无相交，则与下层的Mipmap也无相交。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_ppt_hierachical_tracing.png)

有了这个结构后，我们就可以动态调整步进距离了，我们可以尝试先步进一个小的距离，若与场景物体无相交，则可以逐步提高当前采样的Mipmap等级，因为高层Mipmap的一个像素对应了低层Mipmap的一个区域，提高了Mipmap等级也意味着步进距离也可以跟着增大了，若在高层Mipmap判断与场景物体有相交，意味着光线在这片区域内存在与场景物体的交点，则需要降低Mipmap等级直到找到具体的相交位置点。

**题外话，只看基础部分，作业3大概是GAMES202全系列作业中最简单的一次作业，无论是理论本身和实现，相比其他作业都比较简单，也没有复杂的数学推导。虽说提高部分的理论也很简单精妙，但是要在给定的作业框架中去实现，直接把这个作业的麻烦程度提高到202全部作业中未曾有的高度（对于没太多WebGL经验的人来说）。**

实现可以分为两个部分，一个是最小深度Mipmap的构建，另外就是基于Mipmap加速的Raymarch实现。

#### 深度图的Mipmap生成

首先我们这里用的“Mipmap”与常规的Mipmap不同，是取最小值，而硬件并没有提供这种操作，所以这个Mipmap的生成还是靠我们自己写的，我的尝试顺序是这样的：先尝试直接生成Mipmap然后修改Mipmap中的值为最小深度值，但是在WebGL1中并不能设置Mipmap等级为非0值，会直接报错；然后为了能设置这个Mipmap等级，我把整个框架升级到了WebGL2，包括一系列的图形API用法和shader的语法都要改一遍，但是我仍然没成功修改Mipmap的值；最后我干脆放弃了自带的Mipmap功能，直接生成不同分辨率的framebuffer写入我们需要的值，来作为我们的深度图Mipmap，不过即使不是用硬件提供的Mipmap，用这种自己创建不同分辨率framebuffer的方式，我也没能在WebGL1上尝试成功，会报错`` GL_INVALID_FRAMEBUFFER_OPERATION: Framebuffer is incomplete: Attachments are not all the same size.``这个问题，同样的实现方式在WebGL2上没问题。所以下面我提供的实现仍然需要升级到WebGL2。

下面具体说一下作为WebGL小白摸索出来的实现方式。

```js
//engine.js

var windowWidth;
var windowHeight;
var mipMapLevel;
var depthMeshRender;
```

先在``engine.js``上加几个全局变量，后面会用到。

```js
//engine.js

// Init gl
// gl = canvas.getContext('webgl');
// if (!gl) {
// 	alert('Unable to initialize WebGL. Your browser or machine may not support it.');
// 	return;
// }
// gl.getExtension('OES_texture_float');
// gl_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
// var maxdb = gl.getParameter(gl_draw_buffers.MAX_DRAW_BUFFERS_WEBGL);
// console.log('MAX_DRAW_BUFFERS_WEBGL: ' + maxdb);

// Edit Start
windowWidth = window.screen.width;
windowHeight = window.screen.height;

gl = canvas.getContext('webgl2');
if (!gl) {
	alert('Unable to initialize WebGL. Your browser or machine may not support it.');
	return;
}

let ext = gl.getExtension('EXT_color_buffer_float')
if (!ext) {
	alert("Need EXT_color_buffer_float");
	return;
}
// Edit End
```

还是``engine.js``，我们把原本的gl的初始化注释掉，改为webgl2的环境，然后开启``EXT_color_buffer_float``扩展，这个应该是直接对应上面的``OES_texture_float``扩展，不开的话，framebuffer里的颜色附件不能用float精度的，会直接报错，被坑了好久。

然后对全局变量``windowWidth``和``windowHeight``进行了赋值，主要是方便后续访问，不用传参了。

```js
//FBO.js

class FBO{
    // Edit Start
    constructor(gl, GBufferNum, width, height){
    // Edit End
        //定义错误函数
        function error() {
            if(framebuffer) gl.deleteFramebuffer(framebuffer);
            if(texture) gl.deleteFramebuffer(texture);
            if(depthBuffer) gl.deleteFramebuffer(depthBuffer);
            return null;
        }

        function CreateAndBindColorTargetTexture(fbo, attachment, width, height) {
            //创建纹理对象并设置其尺寸和参数
            var texture = gl.createTexture();
            if(!texture){
                console.log("无法创建纹理对象");
                return error();
            }
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // Edit Start
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.screen.width, window.screen.height, 0, gl.RGBA, gl.FLOAT, null);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
            // Edit End
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // Edit Start
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture, 0);
            // Edit End

            return texture;
        };

        //创建帧缓冲区对象
        var framebuffer = gl.createFramebuffer();
        if(!framebuffer){
            console.log("无法创建帧缓冲区对象");
            return error();
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        
        // Edit Start
        // var GBufferNum = 5;
        // Edit End
        
	    framebuffer.attachments = [];
	    framebuffer.textures = []

        // Edit Start
        if(width == null){
            width = windowWidth;
        }
        if(height == null){
            height = windowHeight;
        }

        framebuffer.width = width;
        framebuffer.height = height;
        // Edit End

	    for (var i = 0; i < GBufferNum; i++) {
            // Edit Start
	    	// var attachment = gl_draw_buffers['COLOR_ATTACHMENT' + i + '_WEBGL'];
            var attachment = gl.COLOR_ATTACHMENT0 + i;
	    	// var texture = CreateAndBindColorTargetTexture(framebuffer, attachment);
            var texture = CreateAndBindColorTargetTexture(framebuffer, attachment, width, height, 0);
	    	framebuffer.attachments.push(attachment);
	    	framebuffer.textures.push(texture);

            if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
                console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));
            // Edit End
	    }
	    // * Tell the WEBGL_draw_buffers extension which FBO attachments are
	    //   being used. (This extension allows for multiple render targets.)
        // Edit Start
	    // gl_draw_buffers.drawBuffersWEBGL(framebuffer.attachments);
        gl.drawBuffers(framebuffer.attachments);
        // Edit End

        // Create depth buffer
        var depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
        // Edit Start
        // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.screen.width, window.screen.height);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        // Edit End
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        return framebuffer;
    }
}
```

然后我们对FBO类进行改造，修改部分都标记了Edit了，主要是以下几点：
1. 构造函数增加了参数GBufferNum、width、height，GBufferNum主要是控制创建的FrameBuffer里面添加多少个color attachment，默认是都添加5个，用在GBuffer上没问题，但是作业框架里ShadowMap的FBO也会使用5个color attachment，一是占用资源，二是也给截帧Debug时增加了无效信息，干脆一并改了。
2. 由于我们通过创建多个不同分辨率的FrameBuffer来构造深度图的Mipmap，所以这里分辨率从使用窗口分辨率改成使用传入的参数，主要涉及color attachments和render buffer的分辨率。
3. 创建color attachment时，texImage2D函数的第三个、第七个、第八个参数分别为internalformat、format、type，当升级为WebGL2后，internalformat需要改成``gl.RGBA32F``，但format和type不能改，且format和type是有固定搭配的，不是随便使用两个枚举都能使用，需要查官方给的表格，被坑了很久x2。
4. 升级为WebGL2后，color attachment的访问方式由``gl_draw_buffers['COLOR_ATTACHMENT' + i + '_WEBGL']``变成``gl.COLOR_ATTACHMENT0 + i``。
5. 升级为WebGL2后，``gl_draw_buffers.drawBuffersWEBGL``需要改成``gl.drawBuffers``。

```js
//MeshRender.js

draw(camera, fbo, updatedParamters) {
	// ...
	if (fbo != null) {
		// Edit Start
		// gl_draw_buffers.drawBuffersWEBGL(fbo.attachments);
		gl.drawBuffers(fbo.attachments);
		// Edit End
	}
	// ...
}
```

在``MeshRender.js``中同样有个地方需要把``gl_draw_buffers.drawBuffersWEBGL``改成``gl.drawBuffers``。

```js
//DirectionalLight.js

class DirectionalLight {
    constructor(lightRadiance, lightPos, lightDir, lightUp, gl) {
        // ...
        // Edit Start
        this.fbo = new FBO(gl, 1);
        // Edit End
        if (!this.fbo) {
            console.log("无法设置帧缓冲区对象");
            return;
        }
    }
}
```

然后我们把``DirectionalLight.js``中new FBO的那一行加一个参数1，这样ShadowMap的framebuffer就只会有一个color attachment了。

```js
//Mesh.js

static Quad(transform) {
	const positions = [
        -1.0,  1.0, 0.0,
        -1.0, -1.0, 0.0, 
        1.0,  1.0, 0.0,
        1.0, -1.0, 0.0,
	];

	const texcoords = [
		0.0, 1.0,
		0.0, 0.0,
		1.0, 1.0,
		1.0, 0.0,
	];

	const indices = [
		0, 1, 2, 1, 2, 3,    // front
	];

	return new Mesh({ name: 'aVertexPosition', array: new Float32Array(positions) }, null, { name: 'aTextureCoord', array: new Float32Array(texcoords) }, indices, transform);
}
```

对于生成深度图Mipmap的Pass，我们不需要直接用场景中的mesh作为渲染mesh，因为这个Pass中我们访问的是某一层的深度图Mipmap，我们只需要一个能覆盖整个屏幕的Quad即可，这里给Mesh类手写一个覆盖整个屏幕的Quad的静态函数，后续作为我们生成深度图Mipmap的Pass的渲染Mesh。

```js
//SceneDepthMaterial.js

class SceneDepthMaterial extends Material {

    constructor(depthTexture, vertexShader, fragmentShader) {    
        super({
            'uSampler': { type: 'texture', value: depthTexture },
            'uDepthMipMap': { type: 'texture', value: null },
            'uLastMipLevel': { type: '1i', value: -1 },
            'uLastMipSize': { type: '3fv', value: null },
            'uCurLevel': { type: '1i', value: 0 },
        }, [], vertexShader, fragmentShader);
        this.notShadow = true;
    }
}

async function buildSceneDepthMaterial(depthTexture, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SceneDepthMaterial(depthTexture, vertexShader, fragmentShader);

}
```

作业框架中是有SceneDepthMaterial这个材质的，但并没有使用到，我们就直接用他来作为我们生成深度图Mipmap的Pass的材质，并添加一些后面shader会用到的uniform参数。

```html
//index.html
<script src="src/materials/SSRMaterial.js" defer></script>
<!-- Edit Start -->
<script src="src/materials/SceneDepthMaterial.js" defer></script>
<!-- Edit End -->
```

不要忘记在``index.html``加上对``SceneDepthMaterial.js``的引用。

```js
//WebGLRenderer.js

class WebGLRenderer {
    meshes = [];
    shadowMeshes = [];
    bufferMeshes = [];
    lights = [];
    // Edit Start
    depthFBOs = [];
    // Edit End

    // ...

    addMeshRender(mesh) { this.meshes.push(mesh); }
    addShadowMeshRender(mesh) { this.shadowMeshes.push(mesh); }
    addBufferMeshRender(mesh) { this.bufferMeshes.push(mesh); }
    // Edit Start
    addDepthFBO(fbo) { this.depthFBOs.push(fbo); }
    // Edit End
}
```

因为我们要加一个Pass，那么类似其他的Pass，我们需要提供字段和函数来储存一些数据，这里储存的是FBO，而mesh则使用前面声明过的全局变量``depthMeshRender``，不作为字段添加在这，下面会说怎么使用他们。

```js
//engine.js

function GAMES202Main() {
	// ...

	// Add shapes
	// loadGLTF(renderer, 'assets/cube/', 'cube1', 'SSRMaterial');
	// loadGLTF(renderer, 'assets/cube/', 'cube2', 'SSRMaterial');
	loadGLTF(renderer, 'assets/cave/', 'cave', 'SSRMaterial');

	// Edit Start
	mipMapLevel = 1 + Math.floor(Math.log2(Math.max(window.screen.width, window.screen.height)));

	let currentWidth = window.screen.width;
	let currentHeight = window.screen.height;
	let depthTexture = camera.fbo.textures[1];

	for (let i = 0; i < mipMapLevel; i++) {
		let lastWidth = currentWidth;
		let lastHeight = currentHeight;

		if(i >0){
			// calculate next viewport size
			currentWidth /= 2;
			currentHeight /= 2;

			currentWidth = Math.floor(currentWidth);
			currentHeight = Math.floor(currentHeight);

			// ensure that the viewport size is always at least 1x1
			currentWidth = currentWidth > 0 ? currentWidth : 1;
			currentHeight = currentHeight > 0 ? currentHeight : 1;
		}
		console.log("MipMap Level", i, ":", currentWidth, "x", currentHeight);
		let fb = new FBO(gl, 1, currentWidth, currentHeight);
		fb.lastWidth = lastWidth;
		fb.lastHeight = lastHeight;
		fb.width = currentWidth;
		fb.height = currentHeight;
		renderer.addDepthFBO(fb);

	}

	depthMaterial = buildSceneDepthMaterial(depthTexture, "./src/shaders/sceneDepthShader/depthVertex.glsl", "./src/shaders/sceneDepthShader/depthFragment.glsl");
	depthMaterial.then((data) => {
		depthMeshRender = new MeshRender(renderer.gl, Mesh.Quad(setTransform(0, 0, 0, 1, 1, 1)), data);
	});
	// Edit End
}
```

有了前面的铺垫，我们现在可以生成Mipmap所用的FBO、Material、Mesh了。

先通过计算算出当前分辨率可以有多少层Mipmap，然后算出每层Mipmap的分辨率，构建出对应分辨率的FBO，然后通过我们上面给WebGLRenderer添加的``addDepthFBO``函数把创建的所有FBO储存到WebGLRenderer的depthFBOs字段中。

调用我们改造过的``buildSceneDepthMaterial``函数，创建对应材质，注意这里depthTexture指定的是GBuffer中生成好的深度GBuffer作为第一层Mipmap输入。

mesh则是通过上面添加的静态方法``Mesh.Quad``来构建，并赋值给全局变量depthMeshRender。

```js
//WebGLRenderer.js

class WebGLRenderer {
    // ...

    render() {

        // Draw light
        // ...

        // Shadow pass
        // ...

        // Buffer pass
        // ...

        // Depth Mipmap pass
        // Edit Start
        for (let lv = 0; lv < this.depthFBOs.length && depthMeshRender !=null; lv++) {
            gl.useProgram(depthMeshRender.shader.program.glShaderProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFBOs[lv]);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            let updatedParamters = {
                "uLastMipLevel": lv - 1,
                "uLastMipSize": [this.depthFBOs[lv].lastWidth, this.depthFBOs[lv].lastHeight, 0],
                "uCurLevel": lv,
            };

            if(lv != 0){
                updatedParamters.uDepthMipMap = this.depthFBOs[lv - 1].textures[0];
            }

            depthMeshRender.bindGeometryInfo();
            depthMeshRender.updateMaterialParameters(updatedParamters);
            depthMeshRender.bindMaterialParameters();
            
            gl.viewport(0, 0, this.depthFBOs[lv].width, this.depthFBOs[lv].height);
            {
				const vertexCount = depthMeshRender.mesh.count;
				const type = gl.UNSIGNED_SHORT;
				const offset = 0;
				gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
			}
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // Edit End

        // Camera pass
        // ...
    }
}
```

因为生成深度图Mipmap的pass需要使用GBuffer的深度图作为输入，而Camera pass则需要使用深度图Mipmap来加速，所以生成深度图Mipmap的pass在这两者之间进行。

这里逻辑就是有多少层Mipamp就绘制多少次，每次对应当前的Mipmap等级，并把当前的FBO和等级、分辨率等参数更新到shader中，这里有好些逻辑，其实是从``MeshRender.js``的draw函数中拷贝出来的，都是需要执行相同的逻辑，但这里多了一步需要调用gl.viewport绑定到当前FBO的分辨率。

至此js和WebGL部分工作已完成，接下来到生成深度图Mipmap的shader实现，但在这之前我们还有一个问题要解决，就是我们从WebGL1升级到WebGL2后，我们GLSL可以升级到3.0版本，然后可以使用一些像``texelFetch``、``textureSize``这些旧版本没有的API，以及像位运算等特性，升级后GLSL所用的一些语法也发生了改变，我们需要把要升级shader文件改一下，变动大概如下：

```c
#version 300 es
```

在GLSL文件第一行声明版本。

```c
// attribute vec3 aVertexPosition;
// attribute vec3 aNormalPosition;
// attribute vec2 aTextureCoord;

layout (location = 0) in vec3 aVertexPosition;
layout (location = 1) in vec3 aNormalPosition;
layout (location = 2) in vec2 aTextureCoord;
```

vertex shader 顶点属性语法修改。

```c
// varying highp vec3 vNormal;
// varying highp vec2 vTextureCoord;
// varying highp float vDepth;

out highp vec3 vNormal;
out highp vec2 vTextureCoord;
out highp float vDepth;

```

vertex shader 输出到fragment shader的变量从varying改成out。

```c
// varying highp vec3 vNormal;
// varying highp vec2 vTextureCoord;
// varying highp float vDepth;

in vec3 vNormal;
in vec2 vTextureCoord;
in float vDepth;
```

fragment shader从vertex shader接受的变量也从varying改成in。

```c
layout(location = 0) out vec4 Frag0;

void main(){
  // gl_FragData[0] = vec4(vec3(gl_FragCoord.z) * 100.0, 1.0);
  Frag0 = vec4(vec3(gl_FragCoord.z) * 100.0, 1.0);
}
```

给framebuffer的某个color attachment输出数据时，不能再用内置变量gl_FragData[]，要先layout声明，然后用声明的变量来赋值。

```c
out vec4 FragColor;

void main(){
	//gl_FragColor = vec4(vec3(color.rgb), 1.0);
    FragColor = vec4(vec3(color.rgb), 1.0);
}
```

fragment shader输出最终颜色，不能直接给gl_FragColor赋值，要先用out声明一个变量，再给该变量赋值。

并不是每一个shader都需要改，可以只改需要用到新版本功能的shader，但有些特性在新版本被废弃了的也得改，具体修改就不贴了，可以看文章开头的github链接里有源码，我是把所有shader都升了版本了。

下面是生成深度图Mipmap的shader实现：

```c
//depthVertex.glsl

#version 300 es

layout (location = 0) in vec3 aVertexPosition;
// layout (location = 1) in vec3 aNormalPosition;
layout (location = 1) in vec2 aTextureCoord;

out vec2 vTextureCoord;

void main(void) {
  vTextureCoord = aTextureCoord;
  gl_Position = vec4(aVertexPosition, 1.0);
}
```

vertex shader实现。

```c
//depthFragment.glsl

#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform sampler2D uSampler;

uniform sampler2D uDepthMipMap;
uniform int uLastMipLevel;
uniform vec3 uLastMipSize;
uniform int uCurLevel;

in vec2 vTextureCoord;

out vec4 FragColor;

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
    if(uCurLevel == 0){
        vec3 color = texture(uSampler, vTextureCoord).rgb;
        FragColor = vec4(color, 1.0);
    }else{

    ivec2 thisLevelTexelCoord = ivec2(gl_FragCoord);
    ivec2 previousLevelBaseTexelCoord = thisLevelTexelCoord * 2;

    vec4 depthTexelValues;
    depthTexelValues.x = texelFetch(uDepthMipMap,
                                      previousLevelBaseTexelCoord,
                                      0).r;
    depthTexelValues.y = texelFetch(uDepthMipMap,
                                      previousLevelBaseTexelCoord + ivec2(1, 0),
                                      0).r;
    depthTexelValues.z = texelFetch(uDepthMipMap,
                                      previousLevelBaseTexelCoord + ivec2(1, 1),
                                      0).r;
    depthTexelValues.w = texelFetch(uDepthMipMap,
                                      previousLevelBaseTexelCoord + ivec2(0, 1),
                                      0).r;

    float minDepth = min(min(depthTexelValues.x, depthTexelValues.y),
                          min(depthTexelValues.z, depthTexelValues.w));

    // Incorporate additional texels if the previous level's width or height (or both)
    // are odd.
    ivec2 u_previousLevelDimensions = ivec2(uLastMipSize.x, uLastMipSize.y);
    bool shouldIncludeExtraColumnFromPreviousLevel = ((u_previousLevelDimensions.x & 1) != 0);
    bool shouldIncludeExtraRowFromPreviousLevel = ((u_previousLevelDimensions.y & 1) != 0);
    if (shouldIncludeExtraColumnFromPreviousLevel) {
      vec2 extraColumnTexelValues;
      extraColumnTexelValues.x = texelFetch(uDepthMipMap,
                                                previousLevelBaseTexelCoord + ivec2(2, 0),
                                                0).r;
      extraColumnTexelValues.y = texelFetch(uDepthMipMap,
                                                previousLevelBaseTexelCoord + ivec2(2, 1),
                                                0).r;

      // In the case where the width and height are both odd, need to include the
          // 'corner' value as well.
      if (shouldIncludeExtraRowFromPreviousLevel) {
        float cornerTexelValue = texelFetch(uDepthMipMap,
                                                  previousLevelBaseTexelCoord + ivec2(2, 2),
                                                  0).r;
        minDepth = min(minDepth, cornerTexelValue);
      }
      minDepth = min(minDepth, min(extraColumnTexelValues.x, extraColumnTexelValues.y));
    }
    if (shouldIncludeExtraRowFromPreviousLevel) {
      vec2 extraRowTexelValues;
      extraRowTexelValues.x = texelFetch(uDepthMipMap,
                                            previousLevelBaseTexelCoord + ivec2(0, 2),
                                            0).r;
      extraRowTexelValues.y = texelFetch(uDepthMipMap,
                                            previousLevelBaseTexelCoord + ivec2(1, 2),
                                            0).r;
      minDepth = min(minDepth, min(extraRowTexelValues.x, extraRowTexelValues.y));
    }

    FragColor = vec4(vec3(minDepth), 1.0);
    }
}
```

[Hierarchical Depth Buffers](https://miketuritzin.com/post/hierarchical-depth-buffers/)

fragment shader实现，这里其实是直接“借鉴”上面这篇文章的实现，配合原文应该很好理解，不多做解释了。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_depth_mipmap.gif)

生成出来的每一层的Mipmap效果预览如上图，因为每提升一个等级，都是取之前一个等级的四周像素的最小值，所以可以看到随着等级提升，黑色像素块是会逐渐“侵占”白色像素块的。

注意这里不是深度图的原图，这里为了可视化效果，临时压缩了深度值，不然用GBuffer的原图的话，有深度的地方都是一片白的，并不好示意效果。

另外这里还有点不太对的地方时，上面空缺的那一块应该是默认白色才对，也就是没物体的地方默认最大深度。这里我暂时没改，最好应该是在给GBuffer的framebuffer调用clear的时候默认颜色是白色，但是似乎会把所有GBuffer都默认白色了，不知道能不能设定只给某个color attachment默认白色，后来我又尝试在深度生成的shader中判断如果深度值太小，就当成白色，结果测试发现帧率还降了点。这个问题暂时先不深究了。

#### 基于Mipmap加速的Raymarch实现

要在``ssrFragment``中实现基于Mipmap加速的Raymarch，我们要先把深度图Mipmap都传递过去。

```js
//SSRMaterial.js

class SSRMaterial extends Material {
    constructor(diffuseMap, specularMap, light, camera, vertexShader, fragmentShader) {
        let lightIntensity = light.mat.GetIntensity();
        let lightVP = light.CalcLightVP();
        let lightDir = light.CalcShadingDirection();

        // Edit Start
        let uniforms = {
            'uLightRadiance': { type: '3fv', value: lightIntensity },
            'uLightDir': { type: '3fv', value: lightDir },

            'uGDiffuse': { type: 'texture', value: camera.fbo.textures[0] },
            'uGDepth': { type: 'texture', value: camera.fbo.textures[1] },
            'uGNormalWorld': { type: 'texture', value: camera.fbo.textures[2] },
            'uGShadow': { type: 'texture', value: camera.fbo.textures[3] },
            'uGPosWorld': { type: 'texture', value: camera.fbo.textures[4] },
        }

        for(let i = 0; i < mipMapLevel; i++){
            uniforms['uDepthTexture' + '[' + i + ']'] = { type: 'texture', value: null };
        }

        super(uniforms, [], vertexShader, fragmentShader);
        // Edit End
    }
}

```

在材质构造时，先初始化uDepthTexture数组作为我们后续传入深度图Mipmap的容器。

```js
//WebGLRenderer.js

// Camera pass
for (let i = 0; i < this.meshes.length; i++) {
    // Edit Start
    for(let lv = 0; lv < mipMapLevel; lv++){
        if(this.depthFBOs.length > lv){
            updatedParamters['uDepthTexture' + '[' + lv + ']'] = this.depthFBOs[lv].textures[0];
        }
    }
    // Edit End
    this.meshes[i].draw(this.camera, null, updatedParamters);
}
```

在这个材质Draw的时候，再把对应等级的Mipmap传递到数组对应索引的位置上。

然后就是带Hiz优化的RayMarch实现了，这里的最佳实现应该是在当前等级的Mipmap的贴图空间中进行步进，每次步进到下一个相邻的像素，因为我们的精度是对应深度贴图的像素精度的，如果我们每次步进的是一个像素可以确保我们每次都是有效步进，而不会因为精度问题步进完还在同一个像素中，用同一个深度值重复做比较。

[Screen Space Reflections : Implementation and optimization – Part 2 : HI-Z Tracing Method](https://sugulee.wordpress.com/2021/01/19/screen-space-reflections-implementation-and-optimization-part-2-hi-z-tracing-method/)

这篇文章所说的实现方式应该是比较高效的方式，很遗憾，我这次没“借鉴”成功，最后没能正常判断与场景物体的相交，尝试实现的代码也在文章开头的github仓库中，希望有热心同学能帮忙看下。

下面是我自己的简易实现：

```c
float getMinimumDepthPlane(vec2 pos, int level){
  vec2 cellCount = vec2(getCellCount(level));
  ivec2 cell = ivec2(floor(pos * cellCount));

  if(level == 0){
    return texelFetch(uDepthTexture[0], cell, 0).x;
  }
  else if(level == 1){
    return texelFetch(uDepthTexture[1], cell, 0).x;
  }
  else if(level == 2){
    return texelFetch(uDepthTexture[2], cell, 0).x;
  }
    else if(level == 3){
    return texelFetch(uDepthTexture[3], cell, 0).x;
  }
    else if(level == 4){
    return texelFetch(uDepthTexture[4], cell, 0).x;
  }
    else if(level == 5){
    return texelFetch(uDepthTexture[5], cell, 0).x;
  }
    else if(level == 6){
    return texelFetch(uDepthTexture[6], cell, 0).x;
  }
    else if(level == 7){
    return texelFetch(uDepthTexture[7], cell, 0).x;
  }
    else if(level == 8){
    return texelFetch(uDepthTexture[8], cell, 0).x;
  }
    else if(level == 9){
    return texelFetch(uDepthTexture[9], cell, 0).x;
  }
    else if(level == 10){
    return texelFetch(uDepthTexture[10], cell, 0).x;
  }
    else if(level == 11){
    return texelFetch(uDepthTexture[11], cell, 0).x;
  }

    return texelFetch(uDepthTexture[0], cell, 0).x;
}
```

先实现一个函数，函数传入指定深度图Mipmap等级，指定位置，并返回对应深度值的，这里实现得比较挫，因为如果我直接用level去索引uDepthTexture，会报错``array index for samplers must be constant integral expressions``，所以暂时就先这样写了，不深究。

```c
#define MAX_MIPMAP_LEVEL 11

bool RayMarch_Hiz(vec3 ori, vec3 dir, out vec3 hitPos) {
    float step = 0.05;
    float maxDistance = 7.5;

    int startLevel = 2;
    int stopLevel = 0;

    vec3 curPos = ori;
    int level = startLevel;
    while(level >= stopLevel && distance(ori, curPos) < maxDistance){
        float rayDepth = GetDepth(curPos);
        vec2 screenUV = GetScreenCoordinate(curPos);
        float gBufferDepth = getMinimumDepthPlane(screenUV, level);

        if(rayDepth - gBufferDepth > 0.0001){
          if(level == 0){
            hitPos = curPos;
            return true;
          }
          else{
            level = level - 1;
          }
        }
        else{
          level = min(MAX_MIPMAP_LEVEL, level + 1);
          vec3 stepDistance = (dir * step * float(level + 1));
          curPos += stepDistance;
        }
    }
    return false;
}
```

最后我自己交出的简易实现是这样的，使用上很简单，在之前调用RayMarch的地方替换成调用这个RayMarch_Hiz即可，与没有Mipmap优化的RayMarch区别主要就两点：

1. 步进距离动态随着mipmap level增大而增大。
2. 从限制最大步进次数改成限制最大步进距离，这样才能有效吃上动态步进距离的优化。

写完新的RayMarch实现是需要在前面SSR场景中验证一下步进方向是否正确的，否则在这个cave间接光场景不好观察是否正确，写错了都不知道。把步进方向从上半球采样方向和改成镜面反射方向，把间接光计算改成直接取交点的Diffuse即可。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_raymarch_hiz_ssr_test.png)

测试OK。

下面对比一下运行效果吧，环境是2560x1440分辨率，1070ti的桌面显卡。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_cave_sample_num_1.png)

这是SAMPLE_NUM取1时的场景效果。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_raymarch_fps.png)

这是没有hiz优化的RayMarch的帧率，8.59 FPS。

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_raymarch_hiz_fps.png)

这是有hiz优化的RayMarch_Hiz的帧率，16.86 PS。

可以看到优化效果还是非常显著的，帧率基本翻倍了，由于时间预算不足，这个作业没有交出让自己满意的实现，但整体上还是完成了作业的要求的。

最后贴一张SAMPLE_NUM为32时的效果吧！

![](https://github.com/DrFlower/GAMES_101_202_Homework/blob/main/Homework_202/Assignment3/README_IMG/games202-homework3_final.png)
