You're correct. [From the spec](https://www.khronos.org/registry/gles/specs/2.0/es_full_spec_2.0.25.pdf) section 2.10.4

>  When an attribute variable is declared as a `mat2`, its matrix columns are taken from the `(x, y)` components of generic attributes `i` and `i + 1`. When an attribute variable is declared as a `mat3`, its matrix columns are taken from the `(x, y, z)` components of generic attributes `i` through `i + 2`. When an attribute variable is declared as a `mat4`, its matrix columns are taken from the `(x, y, z, w)` components of generic attributes `i` through `i + 3`.

stride and offsets in WebGL are in bytes so I suspect you wanted

    gl.vertexAttribPointer(loc  , 4, gl.FLOAT, false, 64, 0);
    gl.vertexAttribPointer(loc+1, 4, gl.FLOAT, false, 64, 16);
    gl.vertexAttribPointer(loc+2, 4, gl.FLOAT, false, 64, 32);
    gl.vertexAttribPointer(loc+3, 4, gl.FLOAT, false, 64, 48);

Let's check

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    var vs = `
    attribute mat4 matrix;
    attribute vec4 color;

    varying vec4 v_color;

    void main() {
      gl_PointSize = 10.0;
      gl_Position = matrix * vec4(0, 0, 0, 1);
      v_color = color;
    }
    `;
    var fs = `
    precision mediump float;

    varying vec4 v_color;

    void main() {
      gl_FragColor = v_color;
    }
    `;

    var m4 = twgl.m4;
    var gl = document.querySelector("canvas").getContext("webgl");
    var program = twgl.createProgramFromSources(gl, [vs, fs]);

    var matrixLoc = gl.getAttribLocation(program, "matrix");
    var colorLoc = gl.getAttribLocation(program, "color");

    function r(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min;
    }

    var numPoints = 100;
    var matrices = [];
    var colors = [];
    for (var ii = 0; ii < numPoints; ++ii) {
      matrices.push.apply(matrices, m4.translation([r(-1,1), r(-1,1), 0]));
      colors.push(r(1), r(1), r(1), 1);
    }

    function makeBuffer(gl, array) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(array), gl.STATIC_DRAW);
      return buf;
    }

    var buffers = {
      matrices: makeBuffer(gl, matrices),
      colors: makeBuffer(gl, colors),
    };

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.matrices);
    for (var ii = 0; ii < 4; ++ii) {
      gl.enableVertexAttribArray(matrixLoc + ii);
      gl.vertexAttribPointer(matrixLoc + ii, 4, gl.FLOAT, 0, 64, ii * 16);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, 0, 0, 0);

    gl.drawArrays(gl.POINTS, 0, numPoints);

<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/4.x/twgl-full.js" crossorigin></script>
    <canvas></canvas>

<!-- end snippet -->

