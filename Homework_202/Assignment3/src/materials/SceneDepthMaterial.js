class SceneDepthMaterial extends Material {

    constructor(color, vertexShader, fragmentShader) {    
        super({
            'uSampler': { type: 'texture', value: color },
        }, [], vertexShader, fragmentShader, bufferFBO);
        this.notShadow = true;
    }
}

async function buildSceneDepthMaterial(color, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SceneDepthMaterial(color, vertexShader, fragmentShader);

}