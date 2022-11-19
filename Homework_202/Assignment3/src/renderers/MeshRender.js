

class MeshRender {
	#vertexBuffer;
	#normalBuffer;
	#texcoordBuffer;
	#indicesBuffer;

	constructor(gl, mesh, material) {

		this.gl = gl;
		this.mesh = mesh;
		this.material = material;

		this.#vertexBuffer = gl.createBuffer();
		this.#normalBuffer = gl.createBuffer();
		this.#texcoordBuffer = gl.createBuffer();
		this.#indicesBuffer = gl.createBuffer();

		let extraAttribs = []
		if (mesh.hasVertices) {
			extraAttribs.push(mesh.verticesName);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}

		if (mesh.hasNormals) {
			extraAttribs.push(mesh.normalsName);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#normalBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}

		if (mesh.hasTexcoords) {
			extraAttribs.push(mesh.texcoordsName);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#texcoordBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, mesh.texcoords, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#indicesBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

		this.material.setMeshAttribs(extraAttribs);
		this.shader = this.material.compile(gl);
	}

	bindGeometryInfo() {
		const gl = this.gl;

		if (this.mesh.hasVertices) {
			const numComponents = 3;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#vertexBuffer);
			gl.vertexAttribPointer(
				this.shader.program.attribs[this.mesh.verticesName],
				numComponents,
				type,
				normalize,
				stride,
				offset);
			gl.enableVertexAttribArray(
				this.shader.program.attribs[this.mesh.verticesName]);
		}

		if (this.mesh.hasNormals && this.shader.program.attribs[this.mesh.normalsName] >= 0) {
			const numComponents = 3;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#normalBuffer);
			gl.vertexAttribPointer(
				this.shader.program.attribs[this.mesh.normalsName],
				numComponents,
				type,
				normalize,
				stride,
				offset);
			gl.enableVertexAttribArray(
				this.shader.program.attribs[this.mesh.normalsName]);
		}

		if (this.mesh.hasTexcoords && this.shader.program.attribs[this.mesh.texcoordsName] >= 0) {
			const numComponents = 2;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, this.#texcoordBuffer);
			gl.vertexAttribPointer(
				this.shader.program.attribs[this.mesh.texcoordsName],
				numComponents,
				type,
				normalize,
				stride,
				offset);
			gl.enableVertexAttribArray(
				this.shader.program.attribs[this.mesh.texcoordsName]);
		}

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#indicesBuffer);
	}

	bindCameraParameters(camera) {
		const gl = this.gl;

		let modelMatrix = mat4.create();
		let viewMatrix = mat4.create();
		let projectionMatrix = mat4.create();
		// Model transform
		mat4.identity(modelMatrix);
		mat4.translate(modelMatrix, modelMatrix, this.mesh.transform.translate);
		mat4.scale(modelMatrix, modelMatrix, this.mesh.transform.scale);
		mat4.rotateX(modelMatrix, modelMatrix, this.mesh.transform.rotate[0]);
		mat4.rotateY(modelMatrix, modelMatrix, this.mesh.transform.rotate[1]);
		mat4.rotateZ(modelMatrix, modelMatrix, this.mesh.transform.rotate[2]);

		// View transform
		camera.updateMatrixWorld();
		mat4.invert(viewMatrix, camera.matrixWorld.elements);
		// Projection transform
		mat4.copy(projectionMatrix, camera.projectionMatrix.elements);

		gl.uniformMatrix4fv(
			this.shader.program.uniforms.uProjectionMatrix,
			false,
			projectionMatrix);
		gl.uniformMatrix4fv(
			this.shader.program.uniforms.uModelMatrix,
			false,
			modelMatrix);
		gl.uniformMatrix4fv(
			this.shader.program.uniforms.uViewMatrix,
			false,
			viewMatrix);
		gl.uniform3fv(
			this.shader.program.uniforms.uCameraPos,
			[camera.position.x, camera.position.y, camera.position.z]);
	}

	bindMaterialParameters() {
		const gl = this.gl;

		let textureNum = 0;
		for (let k in this.material.uniforms) {

			if (this.material.uniforms[k].type == 'matrix4fv') {
				gl.uniformMatrix4fv(
					this.shader.program.uniforms[k],
					false,
					this.material.uniforms[k].value);
			} else if (this.material.uniforms[k].type == '3fv') {
				gl.uniform3fv(
					this.shader.program.uniforms[k],
					this.material.uniforms[k].value);
			} else if (this.material.uniforms[k].type == '1f') {
				gl.uniform1f(
					this.shader.program.uniforms[k],
					this.material.uniforms[k].value);
			} else if (this.material.uniforms[k].type == '1i') {
				gl.uniform1i(
					this.shader.program.uniforms[k],
					this.material.uniforms[k].value);
			} else if (this.material.uniforms[k].type == 'texture') {
				gl.activeTexture(gl.TEXTURE0 + textureNum);
				gl.bindTexture(gl.TEXTURE_2D, this.material.uniforms[k].value);
				gl.uniform1i(this.shader.program.uniforms[k], textureNum);
				textureNum += 1;
			}
		}
	}

	updateMaterialParameters(parameters) {
		if (parameters == null) {
			return;
		}
		for (let k in this.material.uniforms) {
			if (k in parameters) {
				this.material.uniforms[k].value = parameters[k];
			}
		}
	}

	draw(camera, fbo, updatedParamters) {
		const gl = this.gl;

		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.viewport(0.0, 0.0, window.screen.width, window.screen.height);
		if (fbo != null) {
			gl_draw_buffers.drawBuffersWEBGL(fbo.attachments);
		}
		gl.useProgram(this.shader.program.glShaderProgram);

		// Bind geometry information
		this.bindGeometryInfo();

		// Bind Camera parameters
		this.bindCameraParameters(camera);

		// Bind material parameters
		this.updateMaterialParameters(updatedParamters);
		this.bindMaterialParameters();

		// Draw
		{
			const vertexCount = this.mesh.count;
			const type = gl.UNSIGNED_SHORT;
			const offset = 0;
			gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
}