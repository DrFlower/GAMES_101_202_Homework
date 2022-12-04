attribute vec3 aVertexPosition;
attribute vec3 aNormalPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

void main() {

    vNormal = aNormalPosition;
    vTextureCoord = aTextureCoord;
    mat4 viewMatrix = uViewMatrix;
    viewMatrix = mat4(mat3(viewMatrix));
     gl_Position = uProjectionMatrix * viewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
    //gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);

   vFragPos = aVertexPosition;//gl_Position.xyz;
}