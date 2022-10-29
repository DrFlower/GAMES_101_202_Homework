function loadOBJ(renderer, path, name, objMaterial, transform) {

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
								{ name: 'aTextureCoord', array: geo.attributes.uv.array },
								indices, transform);

							let colorMap = new Texture();
							if (mat.map != null) {
								colorMap.CreateImageTexture(renderer.gl, mat.map.image);
							}
							else {
								colorMap.CreateConstantTexture(renderer.gl, mat.color.toArray());
							}

							let material, shadowMaterial;
							let Translation = [transform.modelTransX, transform.modelTransY, transform.modelTransZ];
							//Edit Start 添加旋转参数
							let Rotation = [transform.modelRotateX, transform.modelRotateY, transform.modelRotateZ];
							//Edit End
							let Scale = [transform.modelScaleX, transform.modelScaleY, transform.modelScaleZ];

							//Edit Start 原本只添加第一个light的材质，改成添加所有light的材质，并添加旋转参数
							for(let i = 0; i < renderer.lights.length; i++){
								let light = renderer.lights[i].entity;
								switch (objMaterial) {
									case 'PhongMaterial':
										//Edit Start 添加旋转参数、光源索引参数
										material = buildPhongMaterial(colorMap, mat.specular.toArray(), light, Translation, Rotation, Scale, i, "./src/shaders/phongShader/phongVertex.glsl", "./src/shaders/phongShader/phongFragment.glsl");
										shadowMaterial = buildShadowMaterial(light, Translation, Rotation, Scale, i, "./src/shaders/shadowShader/shadowVertex.glsl", "./src/shaders/shadowShader/shadowFragment.glsl");
										//Edit End
										break;
								}
							
								material.then((data) => {
									let meshRender = new MeshRender(renderer.gl, mesh, data);
									renderer.addMeshRender(meshRender);
								});
								shadowMaterial.then((data) => {
									let shadowMeshRender = new MeshRender(renderer.gl, mesh, data);
									renderer.addShadowMeshRender(shadowMeshRender);
								});
							}
							//Edit End
						}
					});
				}, onProgress, onError);
		});
}
