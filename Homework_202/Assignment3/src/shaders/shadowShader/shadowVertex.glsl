attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uLightVP;

varying highp vec3 vNormal;
varying highp vec2 vTextureCoord;
varying highp float vDepth;

void main(void) {
  vNormal = aNormalPosition;
  vTextureCoord = aTextureCoord;

  gl_Position = uLightVP * uModelMatrix * vec4(aVertexPosition, 1.0);
  vDepth = gl_Position.z;
}