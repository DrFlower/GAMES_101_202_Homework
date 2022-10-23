class WebGLRenderer {
    meshes = [];
    shadowMeshes = [];
    lights = [];

    constructor(gl, camera) {
        this.gl = gl;
        this.camera = camera;
    }

    addLight(light) {
        this.lights.push({
            entity: light,
            meshRender: new MeshRender(this.gl, light.mesh, light.mat)
        });
    }
    addMeshRender(mesh) { this.meshes.push(mesh); }
    addShadowMeshRender(mesh) { this.shadowMeshes.push(mesh); }

    render(time, deltaime) {
        const gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        gl.clearDepth(1.0); // Clear everything
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Near things obscure far things

        // gl.disable(gl.POLYGON_OFFSET_FILL);
        //Edit Start
        // gl.blendFunc(gl.ONE, gl.ONE);

        console.assert(this.lights.length != 0, "No light");
        //console.assert(this.lights.length == 1, "Multiple lights");
        // Edit End

        for (let l = 0; l < this.lights.length; l++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.lights[l].entity.fbo);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            

            for (let i = 0; i < this.meshes.length; i++) {
                // 角色旋转，地面不转(用面数筛选)
                if(this.meshes[i].mesh.count > 10 && this.meshes[i].mesh.transform.rotate[1] < degrees2Radians(36000))
                {
                    this.meshes[i].mesh.transform.rotate[1] = this.meshes[i].mesh.transform.rotate[1] + degrees2Radians(5) * deltaime;
                }

            }

            // Draw light
            // TODO: Support all kinds of transform
            let lightRotateSpped = [10, 80]
            let lightPos = this.lights[l].entity.oriLightPos;
            lightPos = vec3.rotateY(lightPos, lightPos, this.lights[l].entity.focalPoint, degrees2Radians(lightRotateSpped[l]) * deltaime);

            this.lights[l].entity.lightPos = lightPos;
            this.lights[l].meshRender.mesh.transform.translate = lightPos;
            this.lights[l].meshRender.draw(this.camera);

            // Shadow pass
            if (this.lights[l].entity.hasShadowMap == true) {
                for (let i = 0; i < this.shadowMeshes.length; i++) {
                    // Edit Start
                    this.gl.useProgram(this.shadowMeshes[i].shader.program.glShaderProgram);
                    let translation = this.shadowMeshes[i].mesh.transform.translate;
                    let rotation = this.shadowMeshes[i].mesh.transform.rotate;
                    let scale = this.shadowMeshes[i].mesh.transform.scale;
                    let lightMVP = this.lights[l].entity.CalcLightMVP(translation, rotation, scale);
                    this.shadowMeshes[i].material.uniforms.uLightMVP = { type: 'matrix4fv', value: lightMVP };
                    // Edit End
                    this.shadowMeshes[i].draw(this.camera);
                }
            }

            if(l != 0)
            {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE);
                gl.enable(gl.POLYGON_OFFSET_FILL);
                gl.polygonOffset(-2, -2); 
            }

            // Camera pass
            for (let i = 0; i < this.meshes.length; i++) {
                // Edit Start
                this.gl.useProgram(this.meshes[i].shader.program.glShaderProgram);
                // this.gl.uniform3fv(this.meshes[i].shader.program.uniforms.uLightPos, this.lights[l].entity.lightPos);
                let translation = this.meshes[i].mesh.transform.translate;
                let rotation = this.meshes[i].mesh.transform.rotate;
                let scale = this.meshes[i].mesh.transform.scale;
                let lightMVP = this.lights[l].entity.CalcLightMVP(translation, rotation, scale);
                this.meshes[i].material.uniforms.uLightMVP = { type: 'matrix4fv', value: lightMVP };
                this.meshes[i].material.uniforms.uLightPos = { type: '3fv', value: this.lights[l].entity.lightPos };
                this.meshes[i].material.uniforms.uShadowMap = { type: 'texture', value: this.lights[l].entity.fbo };
                // Edit End
                this.meshes[i].draw(this.camera);
            }
            // Edit Start
            gl.disable(gl.BLEND);
            gl.disable(gl.POLYGON_OFFSET_FILL);
            // gl.depthMask(true); 
            // gl.depthFunc(gl.LEQUAL);
            // gl.enable(gl.DEPTH_TEST); 
            // Edit End
        }
    }
}