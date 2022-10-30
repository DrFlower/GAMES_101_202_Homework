class Shader {

    constructor(gl, vsSrc, fsSrc, shaderLocations) {
        this.gl = gl;
        const vs = this.compileShader(vsSrc, gl.VERTEX_SHADER);
        const fs = this.compileShader(fsSrc, gl.FRAGMENT_SHADER);

        this.program = this.addShaderLocations({
            glShaderProgram: this.linkShader(vs, fs),
        }, shaderLocations);
    }

    compileShader(shaderSource, shaderType) {
        const gl = this.gl;
        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(shaderSource);
            console.error('shader compiler error:\n' + gl.getShaderInfoLog(shader));
        }

        return shader;
    };

    linkShader(vs, fs) {
        const gl = this.gl;
        var prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            abort('shader linker error:\n' + gl.getProgramInfoLog(prog));
        }
        return prog;
    };

    addShaderLocations(result, shaderLocations) {
        const gl = this.gl;
        result.uniforms = {};
        result.attribs = {};

        if (shaderLocations && shaderLocations.uniforms && shaderLocations.uniforms.length) {
            for (let i = 0; i < shaderLocations.uniforms.length; ++i) {
                result.uniforms = Object.assign(result.uniforms, {
                    [shaderLocations.uniforms[i]]: gl.getUniformLocation(result.glShaderProgram, shaderLocations.uniforms[i]),
                });
            }
        }
        if (shaderLocations && shaderLocations.attribs && shaderLocations.attribs.length) {
            for (let i = 0; i < shaderLocations.attribs.length; ++i) {
                result.attribs = Object.assign(result.attribs, {
                    [shaderLocations.attribs[i]]: gl.getAttribLocation(result.glShaderProgram, shaderLocations.attribs[i]),
                });
            }
        }

        return result;
    }
}
