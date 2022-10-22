#ifdef GL_ES
precision mediump float;
#endif

// Phong related variables
uniform sampler2D uSampler;
uniform vec3 uKd;
uniform vec3 uKs;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform vec3 uLightIntensity;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

// Shadow map related variables
#define NUM_SAMPLES 50
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES
#define NUM_RINGS 10

//Edit Start
#define SHADOW_MAP_SIZE 2048.
#define FILTER_RADIUS 10.
#define FRUSTUM_SIZE  200.
#define NEAR_PLANE 0.01
#define LIGHT_Width 2.
//Edit End

#define EPS 1e-3
#define PI 3.141592653589793
#define PI2 6.283185307179586

uniform sampler2D uShadowMap;

varying vec4 vPositionFromLight;

highp float rand_1to1(highp float x ) { 
  // -1 -1
  return fract(sin(x)*10000.0);
}

highp float rand_2to1(vec2 uv ) { 
  // 0 - 1
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract(sin(sn) * c);
}

float unpack(vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    return dot(rgbaDepth, bitShift);
}

vec2 poissonDisk[NUM_SAMPLES];

void poissonDiskSamples( const in vec2 randomSeed ) {

  float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
  float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

  float angle = rand_2to1( randomSeed ) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

void uniformDiskSamples( const in vec2 randomSeed ) {

  float randNum = rand_2to1(randomSeed);
  float sampleX = rand_1to1( randNum ) ;
  float sampleY = rand_1to1( sampleX ) ;

  float angle = sampleX * PI2;
  float radius = sqrt(sampleY);

  for( int i = 0; i < NUM_SAMPLES; i ++ ) {
    poissonDisk[i] = vec2( radius * cos(angle) , radius * sin(angle)  );

    sampleX = rand_1to1( sampleY ) ;
    sampleY = rand_1to1( sampleX ) ;

    angle = sampleX * PI2;
    radius = sqrt(sampleY);
  }
}

//Edit Start
//自适应Shadow Bias算法 https://zhuanlan.zhihu.com/p/370951892
float getShadowBias(float c, float filterRadiusUV){
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPos - vFragPos);
  float fragSize = (1. + ceil(filterRadiusUV)) * (FRUSTUM_SIZE / SHADOW_MAP_SIZE / 2.);
  return max(fragSize, fragSize * (1.0 - dot(normal, lightDir))) * c;
}
//Edit End

//Edit Start
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
//Edit End

//Edit Start
float PCF(sampler2D shadowMap, vec4 coords, float biasC, float filterRadiusUV) {
  poissonDiskSamples(coords.xy);
  //uniformDiskSamples(coords.xy);
  float visibility = 0.0;
  for(int i = 0; i < NUM_SAMPLES; i++){
    vec2 offset = poissonDisk[i] * filterRadiusUV;
    float shadowDepth = useShadowMap(shadowMap, vec4(coords.x + offset.x, coords.y + offset.y, coords.z , coords.w), biasC, filterRadiusUV);
    if(coords.z > shadowDepth + EPS){
      visibility++;
    }
  }
  return 1.0 - visibility / float(NUM_SAMPLES);
}
//Edit End

float findBlocker(sampler2D shadowMap, vec2 uv, float zReceiver) {
  //Edit Start
  int blockerNum = 0;
  float blockDepth = 0.;

  float posZFromLight = vPositionFromLight.z;

  // lightRadius / posZFromLight = searchRadius / (posZFromLight - zNear)
  float searchRadius = LIGHT_Width / FRUSTUM_SIZE * (posZFromLight - NEAR_PLANE) / posZFromLight;

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

  //Edit End
}

float PCSS(sampler2D shadowMap, vec4 coords, float biasC, float filterRadiusUV){
  float zReceiver = coords.z;

  // STEP 1: avgblocker depth 
  float avgBlockerDepth = findBlocker(shadowMap, coords.xy, zReceiver);

  if(avgBlockerDepth < -EPS)
    return 1.0;

  // STEP 2: penumbra size
  float penumbra = (zReceiver - avgBlockerDepth) * LIGHT_Width / avgBlockerDepth;

  filterRadiusUV = penumbra * filterRadiusUV;

  // STEP 3: filtering
  return PCF(shadowMap, coords, biasC, filterRadiusUV);
}

vec3 blinnPhong() {
  vec3 color = texture2D(uSampler, vTextureCoord).rgb;
  color = pow(color, vec3(2.2));

  vec3 ambient = 0.05 * color;

  vec3 lightDir = normalize(uLightPos);
  vec3 normal = normalize(vNormal);
  float diff = max(dot(lightDir, normal), 0.0);
  vec3 light_atten_coff =
      uLightIntensity / pow(length(uLightPos - vFragPos), 2.0);
  vec3 diffuse = diff * light_atten_coff * color;

  vec3 viewDir = normalize(uCameraPos - vFragPos);
  vec3 halfDir = normalize((lightDir + viewDir));
  float spec = pow(max(dot(halfDir, normal), 0.0), 32.0);
  vec3 specular = uKs * light_atten_coff * spec;

  vec3 radiance = (ambient + diffuse + specular);
  vec3 phongColor = pow(radiance, vec3(1.0 / 2.2));
  return phongColor;
}

void main(void) {
  //Edit Start

  vec3 shadowCoord = vPositionFromLight.xyz / vPositionFromLight.w;
  // 需要转化到NDC，才能在纹理uv坐标中使用
  shadowCoord.xyz = (shadowCoord.xyz + 1.0) / 2.0;

  float visibility = 1.;

  float nonePCFBiasC = 0.75;
  float pcfBiasC = 0.4;   
  float filterRadiusUV = FILTER_RADIUS / SHADOW_MAP_SIZE;

  //visibility = useShadowMap(uShadowMap, vec4(shadowCoord, 1.0), nonePCFBiasC, 0.);
  //visibility = PCF(uShadowMap, vec4(shadowCoord, 1.0), pcfBiasC, filterRadiusUV);
  visibility = PCSS(uShadowMap, vec4(shadowCoord, 1.0), pcfBiasC, filterRadiusUV);

  vec3 phongColor = blinnPhong();

  gl_FragColor = vec4(phongColor * visibility, 1.0);
  //Edit End
}