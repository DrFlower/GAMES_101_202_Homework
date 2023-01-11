class SceneDepthMaterial extends Material {

    constructor(depthTexture, vertexShader, fragmentShader) {    
        super({
            'uSampler': { type: 'texture', value: depthTexture },
            'uDepthMipMap': { type: 'texture', value: null },
            'uLastMipLevel': { type: '1i', value: -1 },
            'uLastMipSize': { type: '3fv', value: null },
            'uCurLevel': { type: '1i', value: 0 },
        }, [], vertexShader, fragmentShader);
        this.notShadow = true;
    }
}

async function buildSceneDepthMaterial(depthTexture, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SceneDepthMaterial(depthTexture, vertexShader, fragmentShader);

}