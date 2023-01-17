#version 300 es

#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform sampler2D uDepthTexture[12];

#define MAX_MIPMAP_LEVEL 11

in vec2 vTextureCoord;
out vec4 FragColor;


vec4 getDepthTextureColor(int level){
  if(level == 0){
    return texture(uDepthTexture[0], vTextureCoord);
  }
  else if(level == 1){
    return texture(uDepthTexture[1], vTextureCoord);
  }
  else if(level == 2){
    return texture(uDepthTexture[2], vTextureCoord);
  }
    else if(level == 3){
    return texture(uDepthTexture[3], vTextureCoord);
  }
    else if(level == 4){
    return texture(uDepthTexture[4], vTextureCoord);
  }
    else if(level == 5){
    return texture(uDepthTexture[5], vTextureCoord);
  }
    else if(level == 6){
    return texture(uDepthTexture[6], vTextureCoord);
  }
    else if(level == 7){
    return texture(uDepthTexture[7], vTextureCoord);
  }
    else if(level == 8){
    return texture(uDepthTexture[8], vTextureCoord);
  }
    else if(level == 9){
    return texture(uDepthTexture[9], vTextureCoord);
  }
    else if(level == 10){
    return texture(uDepthTexture[10], vTextureCoord);
  }
    else if(level == 11){
    return texture(uDepthTexture[11], vTextureCoord);
  }

  return texture(uDepthTexture[0], vTextureCoord);
}

void main() {
  int showLevel = int(uTime) % MAX_MIPMAP_LEVEL;
  FragColor = vec4(getDepthTextureColor(showLevel));
}
