function loadOBJ(renderer, path, name, objMaterial, transform, metallic=1.0, roughness=0.2) {

	const manager = new THREE.LoadingManager();
	manager.onProgress = function (item, loaded, total) {
		console.log(item, loaded, total);
	};

	function onProgress(xhr) {
		if (xhr.lengthComputable) {
			const percentComplete = xhr.loaded / xhr.total * 100;
			console.log('model ' + Math.round(percentComplete, 2) + '% downloaded');
			if (percentComplete == 100) {
				//console.log(renderer)
			}
		}
	}
	function onError() { }

	new THREE.MTLLoader(manager)
		.setPath(path)
		.load(name + '.mtl', function (materials) {
			materials.preload();
			new THREE.OBJLoader(manager)
				.setMaterials(materials)
				.setPath(path)
				.load(name + '.obj', function (object) {
					object.traverse(function (child) {
						if (child.isMesh) {
							let geo = child.geometry;
							let mat;
							if (Array.isArray(child.material)) mat = child.material[0];
							else mat = child.material;

							var indices = Array.from({ length: geo.attributes.position.count }, (v, k) => k);

							let mesh = new Mesh({ name: 'aVertexPosition', array: geo.attributes.position.array },
								{ name: 'aNormalPosition', array: geo.attributes.normal.array },
								//{ name: 'aTextureCoord', array: geo.attributes.uv.array },
								null,
								indices, transform);

							let colorMap = new Texture();
							if (mat.map != null) {
								colorMap.CreateImageTexture(renderer.gl, mat.map.image);
							}
							else {
								colorMap.CreateConstantTexture(renderer.gl, mat.color.toArray());
							}
							let material;

							switch (objMaterial) {
								case 'SkyBoxMaterial':
									material = buildSkyBoxMaterial("./src/shaders/skyBoxShader/SkyBoxVertex.glsl", "./src/shaders/skyBoxShader/SkyBoxFragment.glsl");
									break;
								case 'EnvMapMaterial':
									material = buildEnvMapMaterial("./src/shaders/envMapShader/EnvMapVertex.glsl", "./src/shaders/envMapShader/EnvMapFragment.glsl");
									break;
								case 'KullaContyMaterial':
									material = buildKullaContyMaterial(colorMap, metallic, roughness, brdflut, eavglut, renderer.lights[0].entity,"./src/shaders/kullaContyShader/KullaContyVertex.glsl", "./src/shaders/kullaContyShader/KullaContyFragment.glsl");
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
				}, onProgress, onError);
		});
}