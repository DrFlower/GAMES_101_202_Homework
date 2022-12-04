class SkyBoxMaterial extends Material {

    constructor(vertexShader, fragmentShader) {
        super({
            'skybox': { type: 'CubeTexture', value: null }
        }, [], vertexShader, fragmentShader, null);
    }
}

async function buildSkyBoxMaterial(vertexPath, fragmentPath) {
    

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new SkyBoxMaterial(vertexShader, fragmentShader);

}