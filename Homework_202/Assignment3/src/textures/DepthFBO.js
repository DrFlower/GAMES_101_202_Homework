class DepthFBO{
    constructor(gl, depthTexture){
        //定义错误函数
        function error() {
            if(framebuffer) gl.deleteFramebuffer(framebuffer);
            if(texture) gl.deleteFramebuffer(texture);
            if(depthBuffer) gl.deleteFramebuffer(depthBuffer);
            return null;
        }

        //创建帧缓冲区对象
        var framebuffer = gl.createFramebuffer();
        if(!framebuffer){
            console.log("无法创建帧缓冲区对象");
            return error();
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);


	    framebuffer.attachments = [];
	    framebuffer.textures = []

	    // // * Tell the WEBgl.draw_buffers extension which FBO attachments are
	    // //   being used. (This extension allows for multiple render targets.)
	    // gl.drawBuffers(framebuffer.attachments);

        
        // ------------------
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        let numLevels = 5;
        // let currentWidth = window.screen.width;
        // let currentHeight = window.screen.height;
        // for (let i = 1; i < numLevels; i++) {
        //     // calculate next viewport size
        //     currentWidth /= 2;
        //     currentHeight /= 2;
        //     // ensure that the viewport size is always at least 1x1
        //     currentWidth = currentWidth > 0 ? currentWidth : 1;
        //     currentHeight = currentHeight > 0 ? currentHeight : 1;
        //     gl.viewport(0, 0, currentWidth, currentHeight);
        //     // bind next level for rendering but first restrict fetches only to previous level
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, i-1);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, i-1);
        //     gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, i);
        //     // draw full-screen quad
        // }

        // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthTexture, 0);


        // reset mipmap level range for the depth image
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, numLevels - 1);
        framebuffer.numLevels = numLevels

        // Create depth buffer
        var depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
        framebuffer.depthBuffer = depthBuffer;
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.screen.width, window.screen.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        return framebuffer;
    }
}