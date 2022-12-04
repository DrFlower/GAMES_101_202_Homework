function loadGLTF(renderer, path, name, objMaterial, transform, metallic=1.0, roughness=0.2){
	const manager = new THREE.LoadingManager();
	manager.onProgress = function (item, loaded, total) {
		console.log(item, loaded, total);
	};

	function onProgress(xhr) {
		if (xhr.lengthComputable) {
			const percentComplete = xhr.loaded / xhr.total * 100;
			console.log('model ' + Math.round(percentComplete, 2) + '% downloaded');
		}
	}
	function onError() { }

	new THREE.GLTFLoader(manager)
		.setPath(path)
		.load(name + '.gltf', function (gltf) {
			gltf.scene.traverse(function (child) {

				if (child.isMesh) {
					let geo = child.geometry;
					let mat;
					if (Array.isArray(child.material)) mat = child.material[0];
					else mat = child.material;
					gltfTransform = setTransform(child.position.x, child.position.y, child.position.z,
						child.scale.x, child.scale.y, child.scale.z,
						child.rotation.x, child.rotation.y, child.rotation.z);
					var indices = Array.from({ length: geo.attributes.position.count }, (v, k) => k);
					let mesh = new Mesh({ name: 'aVertexPosition', array: geo.attributes.position.array },
						{ name: 'aNormalPosition', array: geo.attributes.normal.array },
						{ name: 'aTextureCoord', array: geo.attributes.uv.array },
						geo.index.array, transform);

					let colorMap = new Texture();
					if (mat.map != null) {
						colorMap.CreateImageTexture(renderer.gl, mat.map.image);
					}
					else {
						let kd = [0.7216, 0.451, 0.2]; // copper
						colorMap.CreateConstantTexture(renderer.gl, kd, true);
					}
					
					let material;
					switch (objMaterial) {
						case 'KullaContyMaterial':
							material = buildKullaContyMaterial(colorMap, metallic, roughness, brdflut, eavglut,renderer.lights[0].entity,"./src/shaders/kullaContyShader/KullaContyVertex.glsl", "./src/shaders/kullaContyShader/KullaContyFragment.glsl");
							break;
						case 'PBRMaterial':
							material = buildPBRMaterial(colorMap, metallic, roughness, brdflut, renderer.lights[0].entity,"./src/shaders/pbrShader/PBRVertex.glsl", "./src/shaders/pbrShader/PBRFragment.glsl");
							break;
					}

					material.then((data) => {
						let meshRender = new MeshRender(renderer.gl, mesh, data);
						renderer.addMeshRender(meshRender);
					});
				}
			});
		});
}
