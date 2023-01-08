#version 300 es

#ifdef GL_ES
precision highp float;
#endif

uniform vec3 uLightDir;
uniform vec3 uCameraPos;
uniform vec3 uLightRadiance;
uniform sampler2D uGDiffuse;
uniform sampler2D uGDepth;
uniform sampler2D uGNormalWorld;
uniform sampler2D uGShadow;
uniform sampler2D uGPosWorld;

uniform sampler2D uDepthTexture[12];

// varying mat4 vWorldToScreen;
// varying highp vec4 vPosWorld;

in mat4 vWorldToScreen;
in vec4 vPosWorld;

#define M_PI 3.1415926535897932384626433832795
#define TWO_PI 6.283185307
#define INV_PI 0.31830988618
#define INV_TWO_PI 0.15915494309

#define MAX_MIPMAP_LEVEL 11
#define MAX_THICKNESS 0.0017

out vec4 FragColor;

float Rand1(inout float p) {
  p = fract(p * .1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec2 Rand2(inout float p) {
  return vec2(Rand1(p), Rand1(p));
}

float InitRand(vec2 uv) {
	vec3 p3  = fract(vec3(uv.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 SampleHemisphereUniform(inout float s, out float pdf) {
  vec2 uv = Rand2(s);
  float z = uv.x;
  float phi = uv.y * TWO_PI;
  float sinTheta = sqrt(1.0 - z*z);
  vec3 dir = vec3(sinTheta * cos(phi), sinTheta * sin(phi), z);
  pdf = INV_TWO_PI;
  return dir;
}

vec3 SampleHemisphereCos(inout float s, out float pdf) {
  vec2 uv = Rand2(s);
  float z = sqrt(1.0 - uv.x);
  float phi = uv.y * TWO_PI;
  float sinTheta = sqrt(uv.x);
  vec3 dir = vec3(sinTheta * cos(phi), sinTheta * sin(phi), z);
  pdf = z * INV_PI;
  return dir;
}

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

vec4 Project(vec4 a) {
  return a / a.w;
}

float GetDepth(vec3 posWorld) {
  float depth = (vWorldToScreen * vec4(posWorld, 1.0)).w;
  return depth;
}

/*
 * Transform point from world space to screen space([0, 1] x [0, 1])
 *
 */
vec2 GetScreenCoordinate(vec3 posWorld) {
  vec2 uv = Project(vWorldToScreen * vec4(posWorld, 1.0)).xy * 0.5 + 0.5;
  return uv;
}

vec3 GetScreenCoordinate3(vec3 posWorld) {
  return Project(vWorldToScreen * vec4(posWorld, 1.0)).xyz * 0.5 + 0.5;
}

float GetGBufferDepth(vec2 uv) {
  float depth = texture(uGDepth, uv).x;
  if (depth < 1e-2) {
    depth = 1000.0;
  }
  return depth;
}

vec3 GetGBufferNormalWorld(vec2 uv) {
  vec3 normal = texture(uGNormalWorld, uv).xyz;
  return normal;
}

vec3 GetGBufferPosWorld(vec2 uv) {
  vec3 posWorld = texture(uGPosWorld, uv).xyz;
  return posWorld;
}

float GetGBufferuShadow(vec2 uv) {
  float visibility = texture(uGShadow, uv).x;
  return visibility;
}

vec3 GetGBufferDiffuse(vec2 uv) {
  vec3 diffuse = texture(uGDiffuse, uv).xyz;
  diffuse = pow(diffuse, vec3(2.2));
  return diffuse;
}

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
  vec3 Le = vec3(0.0);
  Le = texture(uGShadow, uv).x * uLightRadiance;
  return Le;
}

bool RayMarch(vec3 ori, vec3 dir, out vec3 hitPos) {
  float step = 0.05;
  const int totalStepTimes = 500; 
  int curStepTimes = 0;

  vec3 stepDir = normalize(dir) * step;
  vec3 curPos = ori;
  for(int curStepTimes = 0; curStepTimes < totalStepTimes; curStepTimes++)
  {
    vec2 screenUV = GetScreenCoordinate(curPos);
    float rayDepth = GetDepth(curPos);
    float gBufferDepth = GetGBufferDepth(screenUV);
//  hitPos = curPos;
    if(rayDepth - gBufferDepth > 0.0001){
      hitPos = curPos;
      return true;
    }

    curPos += stepDir;
  }

  return false;
  // return true;
}

//todo
ivec2 getCellCount(int level){
  if(level == 0){
    return textureSize(uDepthTexture[0], level);
  }
  else if(level == 1){
    return textureSize(uDepthTexture[1], level);
  }
  else if(level == 2){
    return textureSize(uDepthTexture[2], level);
  }
    else if(level == 3){
    return textureSize(uDepthTexture[3], level);
  }
    else if(level == 4){
    return textureSize(uDepthTexture[4], level);
  }
    else if(level == 5){
    return textureSize(uDepthTexture[5], level);
  }
    else if(level == 6){
    return textureSize(uDepthTexture[6], level);
  }
    else if(level == 7){
    return textureSize(uDepthTexture[7], level);
  }
    else if(level == 8){
    return textureSize(uDepthTexture[8], level);
  }
    else if(level == 9){
    return textureSize(uDepthTexture[9], level);
  }
    else if(level == 10){
    return textureSize(uDepthTexture[10], level);
  }
    else if(level == 11){
    return textureSize(uDepthTexture[11], level);
  }

  return textureSize(uDepthTexture[0], level);
}

ivec2 getCell(vec2 pos, ivec2 startCellCount){
 return ivec2(floor(pos*vec2(startCellCount)));
}

vec2 getCellCount2(int level){
    return vec2(textureSize(uDepthTexture[0], level));
}

vec2 getCell2(vec2 pos,vec2 startCellCount){
 return vec2(floor(pos*startCellCount));
}


vec3 intersectDepthPlane(vec3 o, vec3 d, float t){
    return o + d * t;
}
// vec3 intersectCellBoundary(vec3 o,vec3  d, ivec2 cell,ivec2 cell_count, vec2 crossStep, vec2 crossOffset){
// 	vec3 intersection = vec3(0.);
	
// 	vec2 index = vec2(cell) + crossStep;
// 	vec2 boundary = index / vec2(cell_count);
// 	boundary += crossOffset;
	
// 	vec2 delta = boundary - o.xy;
// 	delta /= d.xy;
// 	float t = min(delta.x, delta.y);
	
// 	intersection = intersectDepthPlane(o, d, t);
	
// 	return intersection;
// }

vec3 intersectCellBoundary(vec3 o,vec3  d, ivec2 rayCell,ivec2 cell_count, vec2 crossStep, vec2 crossOffset){
    // vec2 nextPos = vec2(rayCell) + crossStep ;
    // nextPos = nextPos/vec2(cell_count);
    // nextPos = nextPos+crossOffset;

    // vec2 dis  = nextPos - o.xy;

    // vec2 delta = dis/d.xy;

    // float t = min(delta.x,delta.y);

    // return intersectDepthPlane(o,d,t);

    	vec3 intersection = vec3(0);
	
      vec2 index = vec2(rayCell) + crossStep;
      vec2 boundary = index / vec2(cell_count);
      boundary += crossOffset;
      
      vec2 delta = boundary - o.xy;
      delta /= d.xy;
      float t = min(delta.x, delta.y);
      
      intersection = intersectDepthPlane(o, d, t);
      
      return intersection;
}

vec3 intersectCellBoundary2(vec3 o,vec3  d, vec2 rayCell,vec2 cell_count, vec2 crossStep, vec2 crossOffset){
    vec2 nextPos = rayCell + crossStep;
    nextPos = nextPos/vec2(cell_count);
    nextPos = nextPos+crossOffset;

    vec2 dis  = nextPos - o.xy;

    vec2 delta = dis/d.xy;

    float t = min(delta.x,delta.y);
    // return vec3(nextPos, 0.);
    // return intersectDepthPlane(o,vec3(d.x,d.y,0),t*50.);
    return intersectDepthPlane(o,d,t);
}


//todo
float getMinimumDepthPlane2(vec2 pos , int level){

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
    // return GetGBufferDepth(pos);
}

float getMinimumDepthPlane(vec2 pos , int level){
    if(level == 0){
    return texture(uDepthTexture[0], pos).x;
  }
  else if(level == 1){
    return texture(uDepthTexture[1], pos).x;
  }
  else if(level == 2){
    return texture(uDepthTexture[2], pos).x;
  }
    else if(level == 3){
    return texture(uDepthTexture[3], pos).x;
  }
    else if(level == 4){
    return texture(uDepthTexture[4], pos).x;
  }
    else if(level == 5){
    return texture(uDepthTexture[5], pos).x;
  }
    else if(level == 6){
    return texture(uDepthTexture[6], pos).x;
  }
    else if(level == 7){
    return texture(uDepthTexture[7], pos).x;
  }
    else if(level == 8){
    return texture(uDepthTexture[8], pos).x;
  }
    else if(level == 9){
    return texture(uDepthTexture[9], pos).x;
  }
    else if(level == 10){
    return texture(uDepthTexture[10], pos).x;
  }
    else if(level == 11){
    return texture(uDepthTexture[11], pos).x;
  }

    return texture(uDepthTexture[0], pos).x;
    // return GetGBufferDepth(pos);
}

// bool crossedCellBoundary(ivec2 oldCellIdx,ivec2 newCellIdx){
//     return (oldCellIdx.x!=newCellIdx.x)||(oldCellIdx.y!=newCellIdx.y);
// }

bool crossedCellBoundary(ivec2 oldCellIdx,ivec2 newCellIdx){
    return (oldCellIdx.x!=newCellIdx.x)||(oldCellIdx.y!=newCellIdx.y);
}

bool crossedCellBoundary2(vec2 oldCellIdx,vec2 newCellIdx){
    return (oldCellIdx.x!=newCellIdx.x)||(oldCellIdx.y!=newCellIdx.y);
}

bool RayMarch2(vec3 start, vec3 rayDir,float maxTraceDistance, out vec3 hitPos){
     vec2 crossStep = vec2(rayDir.x>=0.?1:-1,rayDir.y>=0.?1:-1);
    // vec2 crossOffset = crossStep / vec2(1024.0,1024.0) / 128.;
    vec2 crossOffset = crossStep / vec2(2560.0,1440.0) / 128.;
    crossStep = clamp(crossStep,0.0,1.0);
    // crossStep = vec2(clamp(crossStep.x,0.0,1.0),clamp(crossStep.y,0.0,1.0));

    vec3 ray = start;
    float minZ = ray.z;
    float maxZ = ray.z+rayDir.z*maxTraceDistance;
    float deltaZ = (maxZ-minZ);

    vec3 o = ray;
    vec3 d = rayDir*maxTraceDistance;
    vec2 startCellCount = getCellCount2(0);
    vec2 rayCell = getCell2(ray.xy,startCellCount);
    ray = intersectCellBoundary2(o, d, rayCell, startCellCount, crossStep, crossOffset * 64.);

    int iter = 0;
    bool isBackwardRay = rayDir.z < 0.;

    if(isBackwardRay)
      return false;
    
    float Dir = isBackwardRay ? -1. : 1.;

    while(ray.z*Dir <= maxZ*Dir && iter<1000){
        vec2 cellCount = getCellCount2(0);
        vec2 oldCellIdx = getCell2(ray.xy,cellCount);

        float cell_minZ = getMinimumDepthPlane(ray.xy, 0);
        // float cell_minZ = getMinimumDepthPlane((vec2(oldCellIdx)+vec2(0.5))/vec2(cellCount), 0);

        // vec3 tmpRay = ((cell_minZ>ray.z) && !isBackwardRay) ? intersectDepthPlane(o,d,(cell_minZ-minZ)/deltaZ) :ray;
        vec3 tmpRay = cell_minZ>ray.z ? intersectDepthPlane(o,d,(cell_minZ-minZ)/deltaZ) :ray;


        vec2 newCellIdx = getCell2(tmpRay.xy,cellCount);

        float thickness =  (ray.z - cell_minZ);
        bool crossed  = (isBackwardRay&&(cell_minZ>ray.z))||(thickness>MAX_THICKNESS)|| crossedCellBoundary2(oldCellIdx, newCellIdx);
       
        // bool crossed  = (isBackwardRay&&(cell_minZ>ray.z))|| crossedCellBoundary(oldCellIdx, newCellIdx);
        // bool crossed  = crossedCellBoundary2(oldCellIdx, newCellIdx);
        
        ray = crossed ? intersectCellBoundary2(o, d, oldCellIdx, cellCount, crossStep, crossOffset):tmpRay;

        ++iter;

    }
    bool intersected = ray.z*Dir > maxZ*Dir;
    // hitPos = intersected ? ray : vec3(0.0);
    hitPos = ray;
    return intersected;
}

// bool RayMarch3(vec3 start, vec3 rayDir,float maxTraceDistance, out vec3 hitPos){
//     // HiZ_Max_Level = clamp(HiZ_Max_Level, 0.0, 7.0);
//     int HiZ_Start_Level = 0;
//     int HiZ_Max_Level = 0;
//     int HiZ_Stop_Level = 0;
//     int NumSteps = 500;

//     start = start * 2. - 1.;
//     rayDir = rayDir *2. - 1.;

//     float Thickness = MAX_THICKNESS;
//     vec2 screenSize = vec2(2560, 1440);
//     vec3 rayOrigin = vec3(start.x, start.y, -start.z);
//     rayDir = vec3(rayDir.x, rayDir.y, -rayDir.z);

//     // Texture2D SceneDepth

//     // rayOrigin = half3(rayOrigin.x, rayOrigin.y, -rayOrigin.z); rayDir = half3(rayDir.x, rayDir.y, -rayDir.z);

//     int level = HiZ_Start_Level; 
//     vec3 ray = rayOrigin;

//     vec2 cross_step = vec2(rayDir.x >= 0.0 ? 1.0 : -1.0, rayDir.y >= 0.0 ? 1.0 : -1.0);
//     vec2 cross_offset = cross_step * 0.00001;
//     // cross_step = saturate(cross_step);
//     cross_step = clamp(cross_step, 0.0, 1.0);

//     // float2 hi_z_size = cell_count(level, screenSize);
//     vec2 hi_z_size = getCellCount2(level);

//     // float2 ray_cell = cell(ray.xy, hi_z_size.xy);
//     vec2 ray_cell = getCell2(ray.xy, hi_z_size);
//     ray = intersectCellBoundary2(ray, rayDir, ray_cell, hi_z_size, cross_step, cross_offset);

//     int iterations = 0; 
//     bool result = false;
//     while(level >= HiZ_Stop_Level && iterations < NumSteps) {
//         // float3 tmp_ray = ray;
//         // float2 current_cell_count = cell_count(level, screenSize);
//         // float2 old_cell_id = cell(ray.xy, current_cell_count);
//         vec3 tmp_ray = ray;
//         vec2 current_cell_count = getCellCount2(level);
//         vec2 old_cell_id = getCell2(ray.xy, current_cell_count);
//         // float min_z = minimum_depth_plane(ray.xy, level, current_cell_count, SceneDepth);
//         float min_z = getMinimumDepthPlane(ray.xy, level);
//         if(rayDir.z > 0.0) 
//         {
//             float min_minus_ray = min_z - ray.z;
//             tmp_ray = min_minus_ray > 0.0 ? ray + (rayDir / rayDir.z) * min_minus_ray : tmp_ray;
//             // float2 new_cell_id = cell(tmp_ray.xy, current_cell_count);
//             vec2 new_cell_id = getCell2(tmp_ray.xy, current_cell_count);
//             // if(crossed_cell_boundary(old_cell_id, new_cell_id)) {
//             if(crossedCellBoundary2(old_cell_id, new_cell_id)) {
//                 tmp_ray = intersectCellBoundary2(ray, rayDir, old_cell_id, current_cell_count, cross_step, cross_offset);
//                 level = min(HiZ_Max_Level, level + 2);
//             }/* else {
//                 if(level == 1.0 && abs(min_minus_ray) > 0.0001) {
//                     tmp_ray = intersect_cell_boundary(ray, rayDir, old_cell_id, current_cell_count, cross_step, cross_offset);
//                     level = 2.0;
//                 }
//             }*/
//         } else if(ray.z < min_z) {
//             tmp_ray = intersectCellBoundary2(ray, rayDir, old_cell_id, current_cell_count, cross_step, cross_offset);
//             level = min(HiZ_Max_Level, level + 2);
//         }

//         ray.xyz = tmp_ray.xyz;
//         level--;
//         iterations++;
// hitPos = ray;
//         // mask = ( -LinearEyeDepth(-min_z) ) - ( -LinearEyeDepth(-ray.z) ) < Thickness && iterations > 0.0;
//         result =  (min_z - ray.z)  < Thickness && iterations > 0;
//     }
// // hitPos = vec3(ray.xy, -ray.z);
// result = true;
// // hitPos = hitPos * 0.5 + 0.5;
//     // return half4(ray.xy, -ray.z, mask);
//     return result;
// }

bool RayMarch_Hiz(vec3 start, vec3 rayDir,float maxTraceDistance, out vec3 hitPos){

    vec2 crossStep = vec2(rayDir.x >= 0. ? 1 : -1, rayDir.y >= 0. ? 1 : -1);
    // vec2 crossOffset = crossStep / vec2(1024.0, 1024.0) / 128.;
    vec2 crossOffset = crossStep / vec2(2560.0,1440.0) / 128.;
    crossStep = clamp(crossStep, 0.0, 1.0);

    vec3 ray = start;
    float minZ = ray.z;
    float maxZ = ray.z + rayDir.z * maxTraceDistance;
    float deltaZ = (maxZ - minZ);

    vec3 o = ray;
    vec3 d = rayDir * maxTraceDistance;

    int startLevel = 0;
    int stopLevel = 0;
    ivec2 startCellCount = getCellCount(startLevel);


    ivec2 rayCell = getCell(ray.xy, startCellCount);
    ray = intersectCellBoundary(o, d, rayCell, startCellCount, crossStep, crossOffset * 64.);

    int level = startLevel;
    int iter = 0;
    bool isBackwardRay = rayDir.z < 0.;

    float Dir = isBackwardRay ? -1. : 1.;

    while( level >= stopLevel && ray.z * Dir <= maxZ * Dir && iter < 100){
        ivec2 cellCount = getCellCount(level);
        ivec2 oldCellIdx = getCell(ray.xy, cellCount);

        float cell_minZ = getMinimumDepthPlane2(ray.xy, level);

        vec3 tmpRay = ((cell_minZ > ray.z) && !isBackwardRay) ? intersectDepthPlane(o, d, (cell_minZ - minZ) / deltaZ) : ray;

        ivec2 newCellIdx = getCell(tmpRay.xy, cellCount);

        float thickness = level == 0 ? (ray.z - cell_minZ) : 0.;
        bool crossed  = (isBackwardRay && (cell_minZ > ray.z))||(thickness > MAX_THICKNESS)|| crossedCellBoundary(oldCellIdx, newCellIdx);
        // bool crossed  = (isBackwardRay&&(cell_minZ>ray.z))|| crossedCellBoundary(oldCellIdx, newCellIdx);
        ray = crossed ? intersectCellBoundary(o, d, oldCellIdx, cellCount, crossStep, crossOffset) : tmpRay;

        level = crossed ? min(MAX_MIPMAP_LEVEL, level + 1): level - 1;
        ++iter;
    }
    bool intersected = (level < stopLevel);
    intersected = true;
    hitPos = intersected ? ray : vec3(0.0);
    return intersected;
}

bool RayMarch5(vec3 ori, vec3 dir, out vec3 hitPos) {
    float step = 0.05;
    dir = normalize(dir);
    const int totalStepTimes = 150; 
    int curStepTimes = 0;

    int startLevel = 2;
    int stopLevel = 0;

    float maxTraceX = dir.x >= 0. ? (1. - ori.x) / dir.x : -ori.x / dir.x;
    float maxTraceY = dir.y >= 0. ? (1. - ori.y) / dir.y : -ori.y / dir.y;
    float maxTraceZ = dir.z >= 0. ? (1. - ori.z) / dir.z : -ori.z / dir.z;
    float maxTraceDistance = min(maxTraceX, min(maxTraceY, maxTraceZ));
    float maxZ = ori.z + dir.z * maxTraceDistance;
    bool isBackwardRay = dir.z < 0.;
    float Dir = isBackwardRay ? -1. : 1.;

    vec3 curPos = ori;
    int level = startLevel;
    while( level >= stopLevel /**&& curPos.z * Dir <= maxZ * Dir*/ && curStepTimes < totalStepTimes){
        float rayDepth = GetDepth(curPos);
        vec2 screenUV = GetScreenCoordinate(curPos);
        float gBufferDepth = getMinimumDepthPlane2(screenUV, level);

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
          float zFactor = (1. - abs(dir.z));
          vec3 stepDir = (dir * step * float(level + 1));// / (zFactor * zFactor);
          curPos += stepDir;
        }


        curStepTimes++;
    }
    return false;
}

// test Screen Space Ray Tracing 
vec3 EvalReflect(vec3 wi, vec3 wo, vec2 uv) {
  vec3 worldNormal = GetGBufferNormalWorld(uv);
  vec3 relfectDir = normalize(reflect(-wo, worldNormal));
  vec3 hitPos;
  if(RayMarch(vPosWorld.xyz, relfectDir, hitPos)){
      vec2 screenUV = GetScreenCoordinate(hitPos);
      // return vec3(1.0,0.,0.);
      return GetGBufferDiffuse(screenUV);
  }
  else{
    return vec3(0.); 
  }
}

// vec3 GetScreenCoord(vec3  Point){

// 	vec4 positionInScreen = projection*vec4(Point,1.0);
// 	positionInScreen.xyzw /= positionInScreen.w;
// 	positionInScreen .xyz = positionInScreen.xyz*0.5+0.5;
//     return positionInScreen.xyz;


// }

#define SAMPLE_NUM 3

void main() {
  float s = InitRand(gl_FragCoord.xy);

  vec3 L = vec3(0.0);
  // 无光照
  // L = GetGBufferDiffuse(GetScreenCoordinate(vPosWorld.xyz));

  vec2 screenUV = GetScreenCoordinate(vPosWorld.xyz);
  // vec3 worldPos = GetGBufferPosWorld(screenUV);
  vec3 worldPos = vPosWorld.xyz;
  vec3 wi = normalize(uLightDir);
  vec3 wo = normalize(uCameraPos - worldPos);
  
  // 直接光照
  L = EvalDiffuse(wi, wo, screenUV) * EvalDirectionalLight(screenUV);

  // Screen Space Ray Tracing 的反射测试
  // L = (GetGBufferDiffuse(screenUV) + EvalReflect(wi, wo, screenUV))/2.;

  vec3 L_ind = vec3(0.0);
  for(int i = 0; i < SAMPLE_NUM; i++){
    float pdf;
    Rand1(s);
    vec3 localDir = SampleHemisphereUniform(s, pdf);
    vec3 normal = GetGBufferNormalWorld(screenUV);
    vec3 b1, b2;
    LocalBasis(normal, b1, b2);
    // vec3 dir = normalize(mat3(b1, b2, normal) * localDir); // ssgi
    vec3 dir = normalize(reflect(-wo, normal)); // ssr
    // vec3 dir = normalize(reflect(worldPos, normal)); // ??
    vec3 position_1;
    if(RayMarch5(worldPos, dir, position_1)){
      // ssgi
      vec2 hitScreenUV = GetScreenCoordinate(position_1);
      // L_ind += EvalDiffuse(dir, wo, screenUV) / pdf * EvalDiffuse(wi, dir, hitScreenUV) * EvalDirectionalLight(hitScreenUV);

      // ssr
      L_ind += GetGBufferDiffuse(hitScreenUV);
    }

    vec3 endPosInWorld = worldPos + dir * 1000.;
    vec3 start = GetScreenCoordinate3(worldPos);
    vec3 end = GetScreenCoordinate3(endPosInWorld);
    vec3 rayDir = normalize(end - start);

    float maxTraceX = rayDir.x >= 0. ? (1. - start.x) / rayDir.x : -start.x / rayDir.x;
    float maxTraceY = rayDir.y >= 0. ? (1. - start.y) / rayDir.y : -start.y / rayDir.y;
    float maxTraceZ = rayDir.z >= 0. ? (1. - start.z) / rayDir.z : -start.z / rayDir.z;
    float maxTraceDistance = min(maxTraceX, min(maxTraceY, maxTraceZ));

    if(RayMarch_Hiz(start, rayDir, maxTraceDistance, position_1)){
    // if(RayMarch3(start, rayDir, maxTraceDistance, position_1)){
      // vec2 hitScreenUV = GetScreenCoordinate(position_1);

      // ssgi
      // L_ind += EvalDiffuse(dir, wo, screenUV) / pdf * EvalDiffuse(wi, dir, position_1.xy) * EvalDirectionalLight(position_1.xy);

      // ssr
      // L_ind += GetGBufferDiffuse(position_1.xy);
    }
  }

  L_ind /= float(SAMPLE_NUM);

  L = L + L_ind;
  
  vec3 color = pow(clamp(L, vec3(0.0), vec3(1.0)), vec3(1.0 / 2.2));
  // gl_FragColor = vec4(vec3(color.rgb), 1.0);

  // vec3 test = texture(uDepthTexture[0], screenUV).xyz;

  // vec2 aaa = vec2(textureSize(uDepthTexture[0], 0));
  // // color = vec3(aaa.x/1000., aaa.y/1000.,0.);

  // vec2 bbb= getCell(screenUV, aaa);
  // color = vec3(bbb/255./10., 0.);

  // color = L;

  FragColor = vec4(vec3(color.rgb), 1.0);
}
