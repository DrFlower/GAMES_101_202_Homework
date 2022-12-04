const LightCubeVertexShader = `
attribute vec3 aVertexPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;


void main(void) {

  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);

}
`;

const LightCubeFragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float uLigIntensity;
uniform vec3 uLightColor;

void main(void) {

  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;


const EnvMapVertexShader = `
attribute vec3 aVertexPosition;

varying vec3 vWorldPos;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

void main()
{
    vWorldPos = aVertexPosition;
    gl_Position =  uProjectionMatrix * uViewMatrix * vec4(vWorldPos, 1.0);
}
`;

const EnvMapFragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vWorldPos;

uniform sampler2D uEquirectangularMap;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 SampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main()
{		
    vec2 uv = SampleSphericalMap(normalize(vWorldPos));
    vec3 color = texture2D(uEquirectangularMap, uv).rgb;
    
    gl_FragColor = vec4(color, 1.0);
    //gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}
`;

const EnvMapBackVertexShader = `
attribute vec3 aVertexPosition;

varying vec3 vWorldPos;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

void main()
{
  vWorldPos = aVertexPosition;

	mat4 rotView = mat4(mat3(uViewMatrix));
	vec4 clipPos = uProjectionMatrix * rotView * vec4(vWorldPos, 1.0);

	gl_Position = clipPos.xyww;
}
`;

const EnvMapBackFragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vWorldPos;

uniform samplerCube uEnvironmentMap;

void main()
{		
  vec3 envColor = textureCube(uEnvironmentMap, vWorldPos).rgb;
    
  // HDR tonemap and gamma correct
  envColor = envColor / (envColor + vec3(1.0));
  envColor = pow(envColor, vec3(1.0/2.2)); 
  
  gl_FragColor = vec4(envColor, 1.0);
  //gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}
`;