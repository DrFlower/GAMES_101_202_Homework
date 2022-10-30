#ifdef GL_ES
precision mediump float;
#endif

uniform float uLigIntensity;

void main(void) { gl_FragColor = vec4(uLigIntensity, 1.0); }