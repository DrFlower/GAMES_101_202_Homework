class SceneDepthDebugMaterial extends Material {
    constructor(vertexShader, fragmentShader) {
        let uniforms = {
            'uTime': { type: '1f', value: 0 },
        }

        for(let i = 0; i < mipMapLevel; i++){
            uniforms['uDepthTexture' + '[' + i + ']'] = { type: 'texture', value: null };
        }

        super(uniforms, [], vertexShader, fragmentShader);
    }
}

async function buildSceneDepthDebugMaterial(vertexPath, fragmentPath) {
    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SceneDepthDebugMaterial(vertexShader, fragmentShader);
}