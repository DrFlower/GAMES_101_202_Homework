#version 300 es

#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 uLightPos;
uniform vec3 uCameraPos;
uniform sampler2D uSampler;

uniform sampler2D uDepthMiMap;
uniform int uLastMipLevel;
uniform vec3 uLastMipSize;

uniform int uMaxLevel;
uniform int uCurLevel;
uniform vec3 uMaxSize;

in vec2 vTextureCoord;

out vec4 FragColor;

vec4 pack (float depth) {
    // 使用rgba 4字节共32位来存储z值,1个字节精度为1/256
    const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
    const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
    // gl_FragCoord:片元的坐标,fract():返回数值的小数部分
    vec4 rgbaDepth = fract(depth * bitShift); //计算每个点的z值
    rgbaDepth -= rgbaDepth.gbaa * bitMask; // Cut off the value which do not fit in 8 bits
    return rgbaDepth;
}



void main(){

  if(uCurLevel == 0){
      vec3 color = texture(uSampler, vTextureCoord).rgb;
      FragColor = vec4(color, 1.0);
  }else{

      // int offset = 1;
      // ivec2 thisLevelTexelCoord = ivec2(gl_FragCoord);
      // for(int lv = 0; lv < uCurLevel; lv++){
      //   offset *= 2;
      //   thisLevelTexelCoord *=2;
      // }
      // float maxDepth = 0.;
      
	    // // ivec2 previousLevelBaseTexelCoord = 2 * thisLevelTexelCoord;
      // for(int offset_x = offset -1; offset_x >= 0; offset_x--){
      //      for(int offset_y = offset -1; offset_y >= 0; offset_y--){
      //         // const ivec2 offetTexCoord = ivec2(-offset_x, -offset_y);
      //         // maxDepth = max(maxDepth, textureOffset(uSampler, vTextureCoord, offetTexCoord).x);
      //         // maxDepth = max(maxDepth, textureOffset(uSampler, vTextureCoord, ivec2(-offset_x, -offset_y)).x);
      //         maxDepth = max(maxDepth, texelFetch(uSampler, thisLevelTexelCoord + ivec2(-offset_x, -offset_y), 0).x);
      //      }
      // }

      // float maxZ = maxDepth;

      vec4 texels;
      texels.x = texture(uDepthMiMap, vTextureCoord).x;
      texels.y = textureOffset(uDepthMiMap, vTextureCoord, ivec2(-1, 0)).x;
      texels.z = textureOffset(uDepthMiMap, vTextureCoord, ivec2(-1,-1)).x;
      texels.w = textureOffset(uDepthMiMap, vTextureCoord, ivec2( 0,-1)).x;
  
      float maxZ = max(max(texels.x, texels.y), max(texels.z, texels.w));
      ivec2 LastMipSize = ivec2(uLastMipSize.x, uLastMipSize.y);
      vec3 extra;
      // if we are reducing an odd-width texture then fetch the edge texels
      if (((LastMipSize.x & 1) != 0) && (int(gl_FragCoord.x) == LastMipSize.x-3)) {
          // if both edges are odd, fetch the top-left corner texel
          if (((LastMipSize.y & 1) != 0) && (int(gl_FragCoord.y) == LastMipSize.y-3)) {
              extra.z = textureOffset(uDepthMiMap, vTextureCoord, ivec2(1, 1)).x;
              maxZ = max(maxZ, extra.z);
          }
          extra.x = textureOffset(uDepthMiMap, vTextureCoord, ivec2(1,  0)).x;
          extra.y = textureOffset(uDepthMiMap, vTextureCoord, ivec2(1, -1)).x;
          maxZ = max(maxZ, max(extra.x, extra.y));
      } else
      // if we are reducing an odd-height texture then fetch the edge texels
      if (((LastMipSize.y & 1) != 0) && (int(gl_FragCoord.y) == LastMipSize.y-3)) {
          extra.x = textureOffset(uDepthMiMap, vTextureCoord, ivec2( 0, 1)).x;
          extra.y = textureOffset(uDepthMiMap, vTextureCoord, ivec2(-1, 1)).x;
          maxZ = max(maxZ, max(extra.x, extra.y));
      }
      FragColor = vec4(maxZ, maxZ, maxZ, 1.0);
  }

  //gl_FragColor = vec4( gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);
  // gl_FragColor = pack(gl_FragCoord.z);
  // FragColor = vec4(1.0);
}