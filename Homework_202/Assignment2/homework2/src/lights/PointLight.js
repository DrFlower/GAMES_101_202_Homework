class PointLight {
    /**
     * Creates an instance of PointLight.
     * @param {float} lightIntensity  The intensity of the PointLight.
     * @param {vec3f} lightColor The color of the PointLight.
     * @memberof PointLight
     */
    constructor(lightIntensity, lightPos, hasShadowMap, gl) {
        this.mesh = Mesh.cube(setTransform(0, 0, 0, 0.2, 0.2, 0.2, 0));
        this.mat = new EmissiveMaterial(lightIntensity);
        this.lightPos = lightPos;

        this.hasShadowMap = hasShadowMap;
        this.fbo = new FBO(gl);
        if (!this.fbo) {
            console.log("无法设置帧缓冲区对象");
            return;
        }
    }
}