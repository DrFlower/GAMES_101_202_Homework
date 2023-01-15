class FBO{
    // Edit Start
    constructor(gl, GBufferNum, width, height){
    // Edit End
        //定义错误函数
        function error() {
            if(framebuffer) gl.deleteFramebuffer(framebuffer);
            if(texture) gl.deleteFramebuffer(texture);
            if(depthBuffer) gl.deleteFramebuffer(depthBuffer);
            return null;
        }

        function CreateAndBindColorTargetTexture(fbo, attachment, width, height) {
            //创建纹理对象并设置其尺寸和参数
            var texture = gl.createTexture();
            if(!texture){
                console.log("无法创建纹理对象");
                return error();
            }
            gl.bindTexture(gl.TEXTURE_2D, texture);
            // Edit Start
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.screen.width, window.screen.height, 0, gl.RGBA, gl.FLOAT, null);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
            // Edit End
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture, 0);

            return texture;
        };

        //创建帧缓冲区对象
        var framebuffer = gl.createFramebuffer();
        if(!framebuffer){
            console.log("无法创建帧缓冲区对象");
            return error();
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        
        // Edit Start
        // var GBufferNum = 5;
        // Edit End
        
	    framebuffer.attachments = [];
	    framebuffer.textures = []

        // Edit Start
        if(width == null){
            width = windowWidth;
        }
        if(height == null){
            height = windowHeight;
        }

        framebuffer.width = width;
        framebuffer.height = height;
        // Edit End

	    for (var i = 0; i < GBufferNum; i++) {
            // Edit Start
	    	// var attachment = gl_draw_buffers['COLOR_ATTACHMENT' + i + '_WEBGL'];
            var attachment = gl.COLOR_ATTACHMENT0 + i;
	    	// var texture = CreateAndBindColorTargetTexture(framebuffer, attachment);
            var texture = CreateAndBindColorTargetTexture(framebuffer, attachment, width, height, 0);
	    	framebuffer.attachments.push(attachment);
	    	framebuffer.textures.push(texture);

            if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
                console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));
            // Edit End
	    }
	    // * Tell the WEBGL_draw_buffers extension which FBO attachments are
	    //   being used. (This extension allows for multiple render targets.)
        // Edit Start
	    // gl_draw_buffers.drawBuffersWEBGL(framebuffer.attachments);
        gl.drawBuffers(framebuffer.attachments);
        // Edit End

        // Create depth buffer
        var depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
        // Edit Start
        // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.screen.width, window.screen.height);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        // Edit End
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        return framebuffer;
    }
}