#version 300 es
#ifdef GL_ES
// #extension GL_EXT_draw_buffers: enable
precision highp float;
#endif

layout(location = 0) out vec4 Frag0;  
layout(location = 1) out vec4 Frag1;  
layout(location = 2) out vec4 Frag2;
layout(location = 3) out vec4 Frag3;
layout(location = 4) out vec4 Frag4;
// layout(location = 5) out vec4 Frag5;

uniform sampler2D uKd;
uniform sampler2D uNt;
uniform sampler2D uShadowMap;

// varying mat4 vWorldToLight;
// varying highp vec2 vTextureCoord;
// varying highp vec4 vPosWorld;
// varying highp vec3 vNormalWorld;
// varying highp float vDepth;

in mat4 vWorldToLight;
in vec2 vTextureCoord;
in vec4 vPosWorld;
in vec3 vNormalWorld;
in float vDepth;

float SimpleShadowMap(vec3 posWorld,float bias){
  vec4 posLight = vWorldToLight * vec4(posWorld, 1.0);
  vec2 shadowCoord = clamp(posLight.xy * 0.5 + 0.5, vec2(0.0), vec2(1.0));
  float depthSM = texture(uShadowMap, shadowCoord).x;
  float depth = (posLight.z * 0.5 + 0.5) * 100.0;
  return step(0.0, depthSM - depth + bias);
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

vec3 ApplyTangentNormalMap() {
  vec3 t, b;
  LocalBasis(vNormalWorld, t, b);
  vec3 nt = texture(uNt, vTextureCoord).xyz * 2.0 - 1.0;
  nt = normalize(nt.x * t + nt.y * b + nt.z * vNormalWorld);
  return nt;
}

#define u_Near 1e-2
#define u_Far 1000.0f

float LinearizeDepth(float depth)
{
    float z = depth * 2.0 - 1.0; 
    return (2.0 * u_Near * u_Far) / (u_Far + u_Near - z * (u_Far - u_Near));
}

void main(void) {
  vec3 kd = texture(uKd, vTextureCoord).rgb;
  // gl_FragData[0] = vec4(kd, 1.0);
  // gl_FragData[1] = vec4(vec3(vDepth), 1.0);
  // gl_FragData[2] = vec4(ApplyTangentNormalMap(), 1.0);
  // gl_FragData[3] = vec4(vec3(SimpleShadowMap(vPosWorld.xyz, 1e-2)), 1.0);
  // gl_FragData[4] = vec4(vec3(vPosWorld.xyz), 1.0);
  Frag0 = vec4(kd, 1.0);
  Frag1 = vec4(vec3(vDepth), 1.0);
  Frag2 = vec4(ApplyTangentNormalMap(), 1.0);
  Frag3 = vec4(vec3(SimpleShadowMap(vPosWorld.xyz, 1e-2)), 1.0);
  Frag4 = vec4(vec3(vPosWorld.xyz), 1.0);
  // Frag5 = vec4(vec3(vDepth), 1.0);
  // Frag5 = vec4(vec3(LinearizeDepth(gl_FragCoord.z)/150.), 1.0);
}
