class SceneDepthMaterial extends Material {

    constructor(depthTexture, depthMiMap, vertexShader, fragmentShader) {    
        super({
            'uSampler': { type: 'texture', value: depthTexture },
            'uDepthMiMap': { type: 'texture', value: depthMiMap },
            'uLastMipLevel': { type: '1i', value: -1 },
            'uLastMipSize': { type: '3fv', value: null },
        }, [], vertexShader, fragmentShader);
        this.notShadow = true;
    }
}

async function buildSceneDepthMaterial(depthTexture, depthMiMap, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SceneDepthMaterial(depthTexture, depthMiMap, vertexShader, fragmentShader);

}