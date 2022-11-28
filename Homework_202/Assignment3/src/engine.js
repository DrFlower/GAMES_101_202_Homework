var gl, gl_draw_buffers;

var bufferFBO;
var bumpMap;

var windowWidth = 1024;
var windowHeight = 1024;
var depthMeshRender;

var mipMapLevel;

function main() {
	const gl = document.querySelector('canvas').getContext('webgl2');
	if (!gl) {
	  return alert('need webgl2');
	}
	
	const vs = `#version 300 es
	void main() {
	  // just draw an 8x8 pixel point in the center of the target
	  // this shader needs/uses no attributes
	  gl_Position = vec4(0, 0, 0, 1);
	  gl_PointSize = 8.0;
	}
	`;
	const fsColor = `#version 300 es
	precision mediump float;
	uniform vec4 color;
	out vec4 outColor;
	void main() {
	  outColor = color;
	  outColor = vec4(1.0);
	}
	`;
	const fsTexture = `#version 300 es
	precision mediump float;
	uniform sampler2D tex;
	out vec4 outColor;
	void main() {
	  // this shader needs no texcoords since we just
	  // use gl_PoitnCoord provided by rendering a point with gl.POINTS
	  // bias lets select the mip level so no need for 
	  // some fancier shader just to show that it's working.        
	  float bias = gl_PointCoord.x * gl_PointCoord.y * 4.0;
	  outColor = texture(tex, gl_PointCoord.xy, bias);
	}
	`;
	
	// compile shaders, link into programs, look up attrib/uniform locations
	// const colorProgramInfo = twgl.createProgramInfo(gl, [vs, fsColor]);
	// const textureProgramInfo = twgl.createProgramInfo(gl, [vs, fsTexture]);
	let colorProgramInfo = new Shader(gl, vs, fsColor,
		{
			// uniforms: this.#flatten_uniforms,
			// attribs: this.#flatten_attribs
		});
	let textureProgramInfo = new Shader(gl, vs, fsTexture,
		{
			// uniforms: this.#flatten_uniforms,
			// attribs: this.#flatten_attribs
		});
	const tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	const levels = 4;
	const width = 8;
	const height = 8;
	gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, width, height);
	
	// make a framebuffer for each mip level
	const fbs = [];
	for (let level = 0; level < levels; ++level) {
	  const fb = gl.createFramebuffer();
	  fbs.push(fb);
	  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	  gl.framebufferTexture2D(
		  gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
		  gl.TEXTURE_2D, tex, level);
	}
	
	// render a different color to each level
	const colors = [
	  [1, 0, 0, 1],  // red
	  [0, 1, 0, 1],  // green
	  [0, 0, 1, 1],  // blue
	  [1, 1, 0, 1],  // yellow
	];
	// gl.useProgram(colorProgramInfo.program);
	gl.useProgram(colorProgramInfo.program.glShaderProgram);
	for (let level = 0; level < levels; ++level) {
	  gl.bindFramebuffer(gl.FRAMEBUFFER, fbs[level]);
	  const size = width >> level;
	  gl.viewport(0, 0, size, size);
	//   gl.uniform4fv(
	// 	"color",
	// 	colors[level]);
	//   twgl.setUniforms(colorProgramInfo, { color: colors[level] });
	  const offset = 0;
	  const count = 1;
	  gl.drawArrays(gl.POINTS, offset, count);  // draw 1 point
	}
	
	// draw the texture's mips to the canvas
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	// gl.useProgram(textureProgramInfo.program);
	gl.useProgram(textureProgramInfo.program.glShaderProgram);
	// no need to bind the texture it's already bound
	// no need to set the uniform it defaults to 0
	gl.drawArrays(gl.POINT, 0, 1);  // draw 1 point
  }
//   main();

GAMES202Main();

function GAMES202Main() {
	// Init canvas
	const canvas = document.querySelector('#glcanvas');
	// canvas.width = window.screen.width;
	// canvas.height = window.screen.height;
	windowWidth = window.screen.width;
	windowHeight = window.screen.height;
	
	canvas.width = windowWidth;
	canvas.height = windowHeight;
	// Init gl
	gl = canvas.getContext('webgl2');
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}
	// gl.getExtension('OES_texture_float');
	// gl_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
	// var maxdb = gl.getParameter(gl_draw_buffers.MAX_DRAW_BUFFERS_WEBGL);
    // console.log('MAX_DRAW_BUFFERS_WEBGL: ' + maxdb);

	let ext1 = gl.getExtension('EXT_color_buffer_float')
	if (!ext1) {
		alert("Need EXT_color_buffer_float");
		return;
	  }

	//   let ext2 = gl.getExtension('EXT_FRAMEBUFFER')
	//   if (!ext2) {
	// 	  alert("Need GL_EXT_FRAMEBUFFER");
	// 	  return;
	// 	}

	// let ext2 = gl.getExtension("GL_ARB_framebuffer_object");
	// if (!ext2) {
	//   alert("Need GL_ARB_framebuffer_object");
	//   return;
	// }

	// Add camera
	const camera = new THREE.PerspectiveCamera(75, gl.canvas.clientWidth / gl.canvas.clientHeight, 1e-3, 1000);
	let cameraPosition, cameraTarget;

	// Cube
	cameraPosition = [6, 1, 0]
	cameraTarget = [0, 0, 0]

	
	// Cave
	cameraPosition = [4.18927, 1.0313, 2.07331]
	cameraTarget = [2.92191, 0.98, 1.55037]
	
	camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
	camera.fbo = new FBO(gl, 6);

	// Add resize listener
	function setSize(width, height) {
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}
	setSize(canvas.clientWidth, canvas.clientHeight);
	window.addEventListener('resize', () => setSize(canvas.clientWidth, canvas.clientHeight));

	// Add camera control
	const cameraControls = new THREE.OrbitControls(camera, canvas);
	cameraControls.enableZoom = true;
	cameraControls.enableRotate = true;
	cameraControls.enablePan = true;
	cameraControls.rotateSpeed = 0.3;
	cameraControls.zoomSpeed = 1.0;
	cameraControls.panSpeed = 0.8;
	cameraControls.target.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);

	// Add renderer
	const renderer = new WebGLRenderer(gl, camera);

	// Add light
	let lightPos, lightDir, lightRadiance;
	
	// Cave
	lightRadiance = [20, 20, 20];
	lightPos = [-0.45, 5.40507, 0.637043];
	lightDir = {
		'x': 0.39048811,
		'y': -0.89896828,
		'z': 0.19843153,
	};
	
	// Cube
	// lightRadiance = [1, 1, 1];
	// lightPos = [-2, 4, 1];
	// lightDir = {
	// 	'x': 0.4,
	// 	'y': -0.9,
	// 	'z': -0.2,
	// };
	let lightUp = [1, 0, 0];
	const directionLight = new DirectionalLight(lightRadiance, lightPos, lightDir, lightUp, renderer.gl);
	renderer.addLight(directionLight);

	mipMapLevel = 5;
	mipMapLevel = 1 + Math.floor(Math.log2(Math.max(window.screen.width, window.screen.height)));

	// Add shapes
	// loadGLTF(renderer, 'assets/cube/', 'cube1', 'SSRMaterial');
	// loadGLTF(renderer, 'assets/cube/', 'cube2', 'SSRMaterial');
	loadGLTF(renderer, 'assets/cave/', 'cave', 'SSRMaterial');

	
	let currentWidth = window.screen.width;
	let currentHeight = window.screen.height;
	let depthTexture = camera.fbo.textures[5];
	
	// let depthTexture = gl.createTexture();

	// // let depthTexture = camera.fbo.textures[5];
	// // let lastDepthTexture = depthTexture;
	// gl.bindTexture(gl.TEXTURE_2D, depthTexture);


	// gl.texStorage2D(gl.TEXTURE_2D, mipMapLevel, gl.RGBA32F, currentWidth, currentHeight);
	// for (let i = 0; i < mipMapLevel; i++) {
	// 	if(i >0){
	// 		// calculate next viewport size
	// 		currentWidth /= 2;
	// 		currentHeight /= 2;

	// 		currentWidth = Math.floor(currentWidth);
	// 		currentHeight = Math.floor(currentHeight);

	// 		// ensure that the viewport size is always at least 1x1
	// 		currentWidth = currentWidth > 0 ? currentWidth : 1;
	// 		currentHeight = currentHeight > 0 ? currentHeight : 1;
	// 	}
	// 	console.log("MipMap Level", i, ":", currentWidth, "x", currentHeight);
	// 	// let depthTexture = gl.createTexture();
	// 	// gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	// 	// // gl.texStorage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, currentWidth, currentHeight);
	// 	let fb = gl.createFramebuffer();
	// 	fb.width = currentWidth;
	// 	fb.height = currentHeight;
	// 	fb.depthTexture = depthTexture;
	// 	renderer.addDepthFBO(fb);
	// 	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	// 	gl.framebufferTexture2D(
	// 		gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
	// 		gl.TEXTURE_2D, depthTexture, i);
	// }

	// depthMaterial = buildSceneDepthMaterial(camera.fbo.textures[5], null, mipMapLevel, [window.screen.width, window.screen.height], "./src/shaders/sceneDepthShader/depthVertex.glsl", "./src/shaders/sceneDepthShader/depthFragment.glsl");
	// depthMaterial.then((data) => {
	// 	depthMeshRender = new MeshRender(renderer.gl, Mesh.Quad(setTransform(0, 0, 0, 1, 1, 1)), data);
	// 	renderer.addDepthMeshRender(depthMeshRender);
	// });

	for (let i = 0; i < mipMapLevel; i++) {
		let lastWidth = currentWidth;
		let lastHeight = currentHeight;

		if(i >0){
			// calculate next viewport size
			currentWidth /= 2;
			currentHeight /= 2;

			currentWidth = Math.floor(currentWidth);
			currentHeight = Math.floor(currentHeight);

			// ensure that the viewport size is always at least 1x1
			currentWidth = currentWidth > 0 ? currentWidth : 1;
			currentHeight = currentHeight > 0 ? currentHeight : 1;
		}
		console.log("MipMap Level", i, ":", currentWidth, "x", currentHeight);
		let fb = new FBO(gl, 1, currentWidth, currentHeight, 0);
		// if(i >0){
		// 	depthTexture = fb.textures[0];
		// }
		fb.lastWidth = lastWidth;
		fb.lastHeight = lastHeight;
		fb.width = currentWidth;
		fb.height = currentHeight;
		fb.depthTexture = depthTexture;
		renderer.addDepthFBO(fb);

		// gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		// gl.framebufferTexture2D(
		// 	gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
		// 	gl.TEXTURE_2D, depthTexture, 0);

	}

	depthMaterial = buildSceneDepthMaterial(camera.fbo.textures[5], null, mipMapLevel, [window.screen.width, window.screen.height], "./src/shaders/sceneDepthShader/depthVertex.glsl", "./src/shaders/sceneDepthShader/depthFragment.glsl");
	depthMaterial.then((data) => {
		depthMeshRender = new MeshRender(renderer.gl, Mesh.Quad(setTransform(0, 0, 0, 1, 1, 1)), data);
		renderer.addDepthMeshRender(depthMeshRender);
	});

	// for(let lv = 0; lv < mipMapLevel; lv++ ){
	// 	if(lv >0){
	// 		// calculate next viewport size
	// 		currentWidth /= 2;
	// 		currentHeight /= 2;
	// 		// ensure that the viewport size is always at least 1x1
	// 		currentWidth = currentWidth > 0 ? currentWidth : 1;
	// 		currentHeight = currentHeight > 0 ? currentHeight : 1;
	// 	}

	// 	// let depthTexture = gl.createTexture();
	// 	// gl.bindTexture(gl.TEXTURE_2D, depthTexture);
	// 	// gl.texStorage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, currentWidth, currentHeight);
	// 	let fb = new FBO(gl, 1, currentWidth, currentHeight);
	// 	fb.width = currentWidth;
	// 	fb.height = currentHeight;
	// 	// fb.depthTexture = depthTexture;
	// 	renderer.addDepthFBO(fb);
	// }



	// console.log(gl.getError());

	function createGUI() {
		const gui = new dat.gui.GUI();
		const lightPanel = gui.addFolder('Directional Light');
		lightPanel.add(renderer.lights[0].entity.lightDir, 'x', -10, 10, 0.1);
		lightPanel.add(renderer.lights[0].entity.lightDir, 'y', -10, 10, 0.1);
		lightPanel.add(renderer.lights[0].entity.lightDir, 'z', -10, 10, 0.1);
		lightPanel.open();
	}
	createGUI();

	function mainLoop(now) {
		cameraControls.update();

		renderer.render();
		requestAnimationFrame(mainLoop);
	}
	requestAnimationFrame(mainLoop);
}

function setTransform(t_x, t_y, t_z, s_x, s_y, s_z, r_x = 0, r_y = 0, r_z = 0) {
	return {
		modelTransX: t_x,
		modelTransY: t_y,
		modelTransZ: t_z,
		modelScaleX: s_x,
		modelScaleY: s_y,
		modelScaleZ: s_z,
		modelRotateX: r_x,
		modelRotateY: r_y,
		modelRotateZ: r_z,
	};
}
