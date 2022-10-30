class CubeTexture {
    constructor(gl, urls) {
        this.urls = urls;
        this.gl = gl;
    }

    async init() {
        var img = new Array(6);
        const gl = this.gl;
        for (let i = 0; i < 6; i++) {
            img[i] = new Image();
            img[i].src = this.urls[i];
            var loadImage = async img => {
                return new Promise((resolve, reject) => {
                    img.onload = async () => {
                        console.log("Image Loaded");
                        resolve(true);
                    };
                });
            };
            await loadImage(img[i]);
        }

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

        var targets = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];

        for (var j = 0; j < 6; j++) {
            gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    }
}