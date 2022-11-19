class DirectionalLight {
    constructor(lightRadiance, lightPos, lightDir, lightUp, gl) {
        this.mesh = Mesh.cube(setTransform(0, 0, 0, 0.1, 0.1, 0.1));
        this.mat = new EmissiveMaterial(lightRadiance);
        this.lightPos = lightPos;
        this.lightDir = lightDir;
        this.lightUp = lightUp;

        this.fbo = new FBO(gl);
        if (!this.fbo) {
            console.log("无法设置帧缓冲区对象");
            return;
        }
    }

    CalcShadingDirection() {
        let lightDir = [-this.lightDir['x'], -this.lightDir['y'], -this.lightDir['z']];
        return lightDir;
    }

    CalcLightVP() {
        let lightVP = mat4.create();
        let viewMatrix = mat4.create();
        let projectionMatrix = mat4.create();

        // View transform
        let focalPoint = [this.lightDir['x'] + this.lightPos[0], this.lightDir['y'] + this.lightPos[1], this.lightDir['z'] + this.lightPos[2]];
        mat4.lookAt(viewMatrix, this.lightPos, focalPoint, this.lightUp);
        // Projection transform
        mat4.ortho(projectionMatrix, -10, 10, -10, 10, 1e-2, 1000);
        // VP transform
        mat4.multiply(lightVP, projectionMatrix, viewMatrix);

        return lightVP;
    }
}
