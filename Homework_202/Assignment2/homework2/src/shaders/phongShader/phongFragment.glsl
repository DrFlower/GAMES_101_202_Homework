#ifdef GL_ES
precision mediump float;
#endif

// Phong related variables
uniform sampler2D uSampler;
uniform vec3 uKd;
uniform vec3 uKs;
uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform vec3 uLightRadiance;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

// Shadow map related variables
#define LIGHT_WORLD_SIZE 0.05
#define LIGHT_FRUSTUM_WIDTH 10.0
#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)

#define RESOLUTION 2048.0
#define NEAR_PLANE 1.0

#define NUM_SAMPLES 10
#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES
#define PCF_NUM_SAMPLES NUM_SAMPLES
#define NUM_RINGS 10

#define EPS 1e-3
#define PI 3.141592653589793
#define PI2 6.283185307179586

uniform sampler2D uShadowMap;

varying vec4 vPositionFromLight;

highp float rand_1to1(highp float x) {
  // -1 -1
  return fract(sin(x) * 10000.0);
}

highp float rand_2to1(vec2 uv) {
  // 0 - 1
  const highp float a = 12.9898, b = 78.233, c = 43758.5453;
  highp float dt = dot(uv.xy, vec2(a, b)), sn = mod(dt, PI);
  return fract(sin(sn) * c);
}

float unpack(vec4 rgbaDepth) {
  const vec4 bitShift = vec4(1.0, 1.0 / 256.0, 1.0 / (256.0 * 256.0),
                             1.0 / (256.0 * 256.0 * 256.0));
  return dot(rgbaDepth, bitShift);
}

vec2 poissonDisk[NUM_SAMPLES];

void poissonDiskSamples(const in vec2 randomSeed) {

  float ANGLE_STEP = PI2 * float(NUM_RINGS) / float(NUM_SAMPLES);
  float INV_NUM_SAMPLES = 1.0 / float(NUM_SAMPLES);

  float angle = rand_2to1(randomSeed) * PI2;
  float radius = INV_NUM_SAMPLES;
  float radiusStep = radius;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    poissonDisk[i] = vec2(cos(angle), sin(angle)) * pow(radius, 0.75);
    radius += radiusStep;
    angle += ANGLE_STEP;
  }
}

void uniformDiskSamples(const in vec2 randomSeed) {

  float randNum = rand_2to1(randomSeed);
  float sampleX = rand_1to1(randNum);
  float sampleY = rand_1to1(sampleX);

  float angle = sampleX * PI2;
  float radius = sqrt(sampleY);

  for (int i = 0; i < NUM_SAMPLES; i++) {
    poissonDisk[i] = vec2(radius * cos(angle), radius * sin(angle));

    sampleX = rand_1to1(sampleY);
    sampleY = rand_1to1(sampleX);

    angle = sampleX * PI2;
    radius = sqrt(sampleY);
  }
}

float findBlocker(sampler2D shadowMap, vec2 uv, float zReceiver) {
  // This uses similar triangles to compute what
  // area of the shadow map we should search
  float searchRadius = LIGHT_SIZE_UV * (zReceiver - NEAR_PLANE) / zReceiver;
  float blockerDepthSum = 0.0;
  int numBlockers = 0;
  for (int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++) {
    float shadowMapDepth =
        unpack(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));

    if (shadowMapDepth < zReceiver) {
      blockerDepthSum += shadowMapDepth;
      numBlockers++;
    }
  }

  if (numBlockers == 0)
    return -1.0;

  return blockerDepthSum / float(numBlockers);
}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver,
                 float filterRadius) {
  float sum = 0.0;

  for (int i = 0; i < PCF_NUM_SAMPLES; i++) {
    float depth =
        unpack(texture2D(shadowMap, uv + poissonDisk[i] * filterRadius));
    if (zReceiver <= depth)
      sum += 1.0;
  }

  for (int i = 0; i < PCF_NUM_SAMPLES; i++) {
    float depth =
        unpack(texture2D(shadowMap, uv + -poissonDisk[i].yx * filterRadius));
    if (zReceiver <= depth)
      sum += 1.0;
  }

  return sum / (2.0 * float(PCF_NUM_SAMPLES));
}

float PCF(sampler2D shadowMap, vec4 coords) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z; // Assumed to be eye-space z in this code

  poissonDiskSamples(uv);
  return PCF_Filter(shadowMap, uv, zReceiver, 0.002);
}

float penumbraSize(float zReceiver,
                   float zBlocker) { // Parallel plane estimation
  return (zReceiver - zBlocker) / zBlocker;
}

float PCSS(sampler2D shadowMap, vec4 coords) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z; // Assumed to be eye-space z in this code
  // STEP 1: blocker search
  poissonDiskSamples(uv);
  float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver);

  // There are no occluders so early out (this saves filtering)
  if (avgBlockerDepth == -1.0)
    return 1.0;

  // STEP 2: penumbra size
  float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);
  float filterSize = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;

  // STEP 3: filtering
  // return avgBlockerDepth;
  return PCF_Filter(shadowMap, coords.xy, zReceiver, filterSize);
}

float useShadowMap(sampler2D shadowMap, vec4 shadowCoord) {
  vec4 rgbaDepth = texture2D(shadowMap, shadowCoord.xy);
  float depth = unpack(rgbaDepth);
  return (shadowCoord.z > depth + EPS) ? 0.0 : 1.0;
}

vec3 blinnPhong() {
  vec3 color = texture2D(uSampler, vTextureCoord).rgb;
  color = pow(color, vec3(2.2));

  vec3 ambient = 0.05 * color;

  vec3 lightDir = normalize(uLightPos);
  vec3 normal = normalize(vNormal);
  float diff = max(dot(lightDir, normal), 0.0);
  vec3 diffuse = diff * uLightRadiance * color;

  vec3 viewDir = normalize(uCameraPos - vFragPos);
  vec3 halfDir = normalize((lightDir + viewDir));
  float spec = pow(max(dot(halfDir, normal), 0.0), 32.0);
  vec3 specular = uKs * uLightRadiance * spec;

  vec3 radiance = (ambient + diffuse + specular);
  vec3 phongColor = pow(radiance, vec3(1.0 / 2.2));
  return phongColor;
}

void main(void) {

  vec3 shadowCoord =
      (vPositionFromLight.xyz / vPositionFromLight.w) / 2.0 + 0.5;

  float visibility;
  visibility = useShadowMap(uShadowMap, vec4(shadowCoord, 1.0));
  //visibility = PCF(uShadowMap, vec4(shadowCoord, 1.0));
  //visibility = PCSS(uShadowMap, vec4(shadowCoord, 1.0));

  vec3 phongColor = blinnPhong();

  gl_FragColor = vec4(phongColor * visibility, 1.0);
}
