var gl, gl_draw_buffers;

var bufferFBO;
var bumpMap;

GAMES202Main();

function GAMES202Main() {
	// Init canvas
	const canvas = document.querySelector('#glcanvas');
	canvas.width = window.screen.width;
	canvas.height = window.screen.height;
	// Init gl
	gl = canvas.getContext('webgl');
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}
	gl.getExtension('OES_texture_float');
	gl_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
	var maxdb = gl.getParameter(gl_draw_buffers.MAX_DRAW_BUFFERS_WEBGL);
    console.log('MAX_DRAW_BUFFERS_WEBGL: ' + maxdb);

	// Add camera
	const camera = new THREE.PerspectiveCamera(75, gl.canvas.clientWidth / gl.canvas.clientHeight, 1e-3, 1000);
	let cameraPosition, cameraTarget;
	// /*
	// Cube
	cameraPosition = [6, 1, 0]
	cameraTarget = [0, 0, 0]
	// */
	/*
	// Cave
	cameraPosition = [4.18927, 1.0313, 2.07331]
	cameraTarget = [2.92191, 0.98, 1.55037]
	*/
	camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
	camera.fbo = new FBO(gl);

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
	/*
	// Cave
	lightRadiance = [20, 20, 20];
	lightPos = [-0.45, 5.40507, 0.637043];
	lightDir = {
		'x': 0.39048811,
		'y': -0.89896828,
		'z': 0.19843153,
	};
	*/
	// /*
	// Cube
	lightRadiance = [1, 1, 1];
	lightPos = [-2, 4, 1];
	lightDir = {
		'x': 0.4,
		'y': -0.9,
		'z': -0.2,
	};
	// */
	let lightUp = [1, 0, 0];
	const directionLight = new DirectionalLight(lightRadiance, lightPos, lightDir, lightUp, renderer.gl);
	renderer.addLight(directionLight);

	// Add shapes
	loadGLTF(renderer, 'assets/cube/', 'cube1', 'SSRMaterial');
	// loadGLTF(renderer, 'assets/cube/', 'cube2', 'SSRMaterial');
	// loadGLTF(renderer, 'assets/cave/', 'cave', 'SSRMaterial');

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
