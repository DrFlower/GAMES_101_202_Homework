class WebGLRenderer {
    meshes = [];
    shadowMeshes = [];
    bufferMeshes = [];
    // Edit Start
    depthMeshs = [];
    // Edit End
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
    addBufferMeshRender(mesh) { this.bufferMeshes.push(mesh); }
    // Edit Start
    addDepthMeshRender(mesh) { this.depthMeshs.push(mesh); }
    // Edit End

    render() {
        console.assert(this.lights.length != 0, "No light");
        console.assert(this.lights.length == 1, "Multiple lights");
        var light = this.lights[0];

        const gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Update parameters
        let lightVP = light.entity.CalcLightVP();
        let lightDir = light.entity.CalcShadingDirection();
        let updatedParamters = {
            "uLightVP": lightVP,
            "uLightDir": lightDir,
        };

        // Draw light
        light.meshRender.mesh.transform.translate = light.entity.lightPos;
        light.meshRender.draw(this.camera, null, updatedParamters);

        // Shadow pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, light.entity.fbo);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < this.shadowMeshes.length; i++) {
            this.shadowMeshes[i].draw(this.camera, light.entity.fbo, updatedParamters);
            // this.shadowMeshes[i].draw(this.camera);
        }
        // return;

        // Buffer pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.camera.fbo);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (let i = 0; i < this.bufferMeshes.length; i++) {
            this.bufferMeshes[i].draw(this.camera, this.camera.fbo, updatedParamters);
            // this.bufferMeshes[i].draw(this.camera);
        }
        // return

        // depth pass
        if(this.depthMeshs.length > 0){
            let mipMapLevel = 5;
            this.depthMeshs[0].draw(this.camera, this.camera.fbo, updatedParamters, mipMapLevel);
        }

        // Edit Start Depth pass
        // gl.bindFramebuffer(gl.FRAMEBUFFER, bufferFBO);
        // // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // // for (let i = 0; i < this.depthMeshs.length; i++) {
        // //     this.depthMeshs[i].draw(this.camera, bufferFBO, updatedParamters);
        // // }
        // let depthTexture = this.camera.fbo.textures[1];
        // gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        // // gl.generateMipmap(gl.TEXTURE_2D);
        // for (let i = 1; i < bufferFBO.numLevels&& this.depthMeshs.length>0; i++) {
            
        //     let currentWidth = window.screen.width;
        //     let currentHeight = window.screen.height;
        //         // calculate next viewport size
        //         currentWidth /= 2;
        //         currentHeight /= 2;
        //         // ensure that the viewport size is always at least 1x1
        //         currentWidth = currentWidth > 0 ? currentWidth : 1;
        //         currentHeight = currentHeight > 0 ? currentHeight : 1;

        //         gl.bindRenderbuffer(gl.RENDERBUFFER, bufferFBO.depthBuffer); // Bind the object to target
        //         gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, currentWidth, currentHeight);

        //         gl.viewport(0, 0, currentWidth, currentHeight);
        //         // bind next level for rendering but first restrict fetches only to previous level
        //         // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, i-1);
        //         // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, i-1);
        //         // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
        //         // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, bufferFBO.numLevels - 1);
        //         gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, i);
        //         // draw full-screen quad
        //         // gl.drawArrays(gl.TRIANGLES, 0, 6);
        //         this.depthMeshs[0].draw(this.camera, bufferFBO, updatedParamters);
        // }
        // // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
        // // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, bufferFBO.numLevels - 1);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // gl.bindTexture(gl.TEXTURE_2D, null);
        // gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        // Edit End
        
        // Camera pass
        for (let i = 0; i < this.meshes.length; i++) {
            this.meshes[i].draw(this.camera, null, updatedParamters);
        }
    }
}