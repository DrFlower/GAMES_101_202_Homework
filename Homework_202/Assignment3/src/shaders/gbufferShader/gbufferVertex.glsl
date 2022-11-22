#version 300 es

// attribute vec3 aVertexPosition;
// attribute vec3 aNormalPosition;
// attribute vec2 aTextureCoord;

layout (location = 0) in vec3 aVertexPosition;
layout (location = 1) in vec3 aNormalPosition;
layout (location = 2) in vec2 aTextureCoord;

uniform mat4 uLightVP;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

// varying mat4 vWorldToLight;

// varying highp vec2 vTextureCoord;
// varying highp vec3 vNormalWorld;
// varying highp vec4 vPosWorld;
// varying highp float vDepth;

out mat4 vWorldToLight;

out vec2 vTextureCoord;
out vec3 vNormalWorld;
out vec4 vPosWorld;
out float vDepth;

void main(void) {
  vec4 posWorld = uModelMatrix * vec4(aVertexPosition, 1.0);
  vPosWorld = posWorld.xyzw / posWorld.w;
  vec4 normalWorld = uModelMatrix * vec4(aNormalPosition, 0.0);
  vNormalWorld = normalize(normalWorld.xyz);
  vTextureCoord = aTextureCoord;
  vWorldToLight = uLightVP;

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
  vDepth = gl_Position.w;
}