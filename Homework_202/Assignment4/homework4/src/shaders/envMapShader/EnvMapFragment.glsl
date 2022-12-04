#ifdef GL_ES
precision mediump float;
#endif

// The texture.
uniform samplerCube uCubeTexture;

// The position of the camera
uniform vec3 uCameraPos;

// Passed in from the vertex shader.
varying highp vec2 vTextureCoord;
varying highp vec3 vFragPos;
varying highp vec3 vNormal;

void main() {
  vec3 worldNormal = normalize(vNormal);
  vec3 eyeToSurfaceDir = normalize(vFragPos - uCameraPos);
  vec3 direction = reflect(eyeToSurfaceDir, worldNormal);

  gl_FragColor = textureCube(uCubeTexture, direction);
  //gl_FragColor = vec4(1,0,0,1);
}