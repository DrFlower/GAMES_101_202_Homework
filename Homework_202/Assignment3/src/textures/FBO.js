class FBO{
    constructor(gl, GBufferNum, width, height, mipMapLevel){
        //定义错误函数
        function error() {
            if(framebuffer) gl.deleteFramebuffer(framebuffer);
            if(texture) gl.deleteFramebuffer(texture);
            if(depthBuffer) gl.deleteFramebuffer(depthBuffer);
            return null;
        }

        function isPowerOf2(value) {
            return (value & (value - 1)) == 0;
          }

        function CreateAndBindColorTargetTexture(fbo, attachment, width, height, mipMapLevel) {
            //创建纹理对象并设置其尺寸和参数
            var texture = gl.createTexture();
            if(!texture){
                console.log("无法创建纹理对象");
                return error();
            }

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            // if(genMipMap){
            //     // if (!(isPowerOf2(width) && isPowerOf2(height))){
            //     //     console.log("!isPowerOf2");
            //     //     return error();
            //     // }
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            //     gl.generateMipmap(gl.TEXTURE_2D);
            // }
            // gl.generateMipmap(gl.TEXTURE_2D);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture, mipMapLevel);
            // if(genMipMap){
            //     var _texture = gl.createTexture();
            //     gl.bindTexture(gl.TEXTURE_2D, _texture);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 5 - 1);
            //     gl.texImage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            //     gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, _texture, 1);
            //     // gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture, 2);
            //     // gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture, 3);
            //     // gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture, 4);
            // }

            return texture;
        };

        function CreateAndBindDepthTargetTexture() {
            //创建纹理对象并设置其尺寸和参数
            var texture = gl.createTexture();
            if(!texture){
                console.log("无法创建纹理对象");
                return error();
            }
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, windowWidth, windowHeight, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 1);
            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 2);
            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 3);
            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 4);
            return texture;
        };

        //创建帧缓冲区对象
        var framebuffer = gl.createFramebuffer();
        if(!framebuffer){
            console.log("无法创建帧缓冲区对象");
            return error();
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

	    framebuffer.attachments = [];
	    framebuffer.textures = []


        if(width == null){
            width = windowWidth;
        }
        if(height == null){
            height = windowHeight;
        }
        if(mipMapLevel == null){
            mipMapLevel = 0;
        }

        framebuffer.width = width;
        framebuffer.height = height;

	    // for (var i = 0; i < GBufferNum; i++) {
	    // 	var attachment = gl_draw_buffers['COLOR_ATTACHMENT' + i + '_WEBGL'];
	    // 	var texture = CreateAndBindColorTargetTexture(framebuffer, attachment);
	    // 	framebuffer.attachments.push(attachment);
	    // 	framebuffer.textures.push(texture);
	    // }
        for (var i = 0; i < GBufferNum; i++) {
	    	var attachment = gl.COLOR_ATTACHMENT0 + i;
            var texture;
            if( i != 6){
                texture = CreateAndBindColorTargetTexture(framebuffer, attachment, width, height, mipMapLevel);
                framebuffer.attachments.push(attachment);
            }else{
                // texture = CreateAndBindColorTargetTexture(framebuffer, attachment, width, height, true);
                // framebuffer.attachments.push(attachment);

                // texture = CreateAndBindDepthTargetTexture();
            }
            // texture = CreateAndBindColorTargetTexture(framebuffer, attachment, width, height, mipMapLevel);
            // framebuffer.attachments.push(attachment);
	    	framebuffer.textures.push(texture);
            if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
                console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));
	    }

        // let depthTexture = framebuffer.textures[1];
        // gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32, window.screen.width, window.screen.height, 0,
        //     gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        // // depth texture is gonna be a mipmap so we have to establish the mipmap chain
        // gl.generateMipmap(gl.TEXTURE_2D);
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

	    // * Tell the WEBGL_draw_buffers extension which FBO attachments are
	    //   being used. (This extension allows for multiple render targets.)
	    gl.drawBuffers(framebuffer.attachments);

        // Create depth buffer
        var depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
        framebuffer.depthBuffer = depthBuffer;
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer); // Bind the object to target
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        return framebuffer;
    }
}