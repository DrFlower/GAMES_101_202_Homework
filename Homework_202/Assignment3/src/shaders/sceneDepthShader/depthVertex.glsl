#version 300 es

layout (location = 0) in vec3 aVertexPosition;
// layout (location = 1) in vec3 aNormalPosition;
layout (location = 1) in vec2 aTextureCoord;

out vec2 vTextureCoord;

void main(void) {
  vTextureCoord = aTextureCoord;
  gl_Position = vec4(aVertexPosition, 1.0);
}