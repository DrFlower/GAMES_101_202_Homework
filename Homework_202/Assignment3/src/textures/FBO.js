class FBO{
    constructor(gl){
        //定义错误函数
        function error() {
            if(framebuffer) gl.deleteFramebuffer(framebuffer);
            if(texture) gl.deleteFramebuffer(texture);
            if(depthBuffer) gl.deleteFramebuffer(depthBuffer);
            return null;
        }

        function CreateAndBindColorTargetTexture(fbo, attachment) {
            //创建纹理对象并设置其尺寸和参数
            var texture = gl.createTexture();
            if(!texture){
                console.log("无法创建纹理对象");
                return error();
            }
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.screen.width, window.screen.height, 0, gl.RGBA, gl.FLOAT, null);
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

        var GBufferNum = 5;
	    framebuffer.attachments = [];
	    framebuffer.textures = []

	    for (var i = 0; i < GBufferNum; i++) {
	    	var attachment = gl_draw_buffers['COLOR_ATTACHMENT' + i + '_WEBGL'];
	    	var texture = CreateAndBindColorTargetTexture(framebuffer, attachment);
	    	framebuffer.attachments.push(attachment);
	    	framebuffer.textures.push(texture);
	    }
	    // * Tell the WEBGL_draw_buffers extension which FBO attachments are
	    //   being used. (This extension allows for multiple render targets.)
	    gl_draw_buffers.drawBuffersWEBGL(framebuffer.attachments);

        // Create depth buffer
        var depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, window.screen.width, window.screen.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        return framebuffer;
    }
}