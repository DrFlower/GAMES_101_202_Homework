var cameraPosition = [-20, 180, 250];

GAMES202Main();

function GAMES202Main() {
	const canvas = document.querySelector('#glcanvas');
	canvas.width = window.screen.width;
	canvas.height = window.screen.height;
	const gl = canvas.getContext('webgl');
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}

	const camera = new THREE.PerspectiveCamera(75, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 1000);
	const cameraControls = new THREE.OrbitControls(camera, canvas);
	cameraControls.enableZoom = true;
	cameraControls.enableRotate = true;
	cameraControls.enablePan = true;
	cameraControls.rotateSpeed = 0.3;
	cameraControls.zoomSpeed = 1.0;
	cameraControls.panSpeed = 2.0;

	function setSize(width, height) {
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}
	setSize(canvas.clientWidth, canvas.clientHeight);
	window.addEventListener('resize', () => setSize(canvas.clientWidth, canvas.clientHeight));

	camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
	cameraControls.target.set(0, 1, 0);

	const pointLight = new PointLight(250, [1, 1, 1]);

	const renderer = new WebGLRenderer(gl, camera);
	renderer.addLight(pointLight);
	loadOBJ(renderer, 'assets/mary/', 'Marry');

	var guiParams = {
		modelTransX: 0,
		modelTransY: 0,
		modelTransZ: 0,
		modelScaleX: 52,
		modelScaleY: 52,
		modelScaleZ: 52,
	}
	function createGUI() {
		const gui = new dat.gui.GUI();
		const panelModel = gui.addFolder('Model properties');
		const panelModelTrans = panelModel.addFolder('Translation');
		const panelModelScale = panelModel.addFolder('Scale');
		panelModelTrans.add(guiParams, 'modelTransX').name('X');
		panelModelTrans.add(guiParams, 'modelTransY').name('Y');
		panelModelTrans.add(guiParams, 'modelTransZ').name('Z');
		panelModelScale.add(guiParams, 'modelScaleX').name('X');
		panelModelScale.add(guiParams, 'modelScaleY').name('Y');
		panelModelScale.add(guiParams, 'modelScaleZ').name('Z');
		panelModel.open();
		panelModelTrans.open();
		panelModelScale.open();
	}

	createGUI();

	function mainLoop(now) {
		cameraControls.update();

		renderer.render(guiParams);
		requestAnimationFrame(mainLoop);
	}
	requestAnimationFrame(mainLoop);
}
