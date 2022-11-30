class SceneDepthMaterial extends Material {

    constructor(depthTexture, depthMiMap, maxLevel, maxSize, vertexShader, fragmentShader) {    
        super({
            'uSampler': { type: 'texture', value: depthTexture },
            'uDepthMipMap': { type: 'texture', value: depthMiMap },
            'uLastMipLevel': { type: '1i', value: -1 },
            'uLastMipSize': { type: '3fv', value: null },
            'uMaxLevel': { type: '1i', value: maxLevel },
            'uCurLevel': { type: '1i', value: 0 },
            'uMaxSize': { type: '3fv', value: maxSize },
        }, [], vertexShader, fragmentShader);
        this.notShadow = true;
    }
}

async function buildSceneDepthMaterial(depthTexture, depthMiMap, maxLevel, maxSize, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SceneDepthMaterial(depthTexture, depthMiMap, maxLevel, maxSize, vertexShader, fragmentShader);

}