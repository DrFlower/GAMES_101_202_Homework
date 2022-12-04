class EnvMapMaterial extends Material {
    
    constructor(cubeMap, vertexShader, fragmentShader) {
        super({
            'uCubeTexture': { type: 'CubeTexture', value: cubeMap }
        }, [], vertexShader, fragmentShader, null);
    }
}

async function buildEnvMapMaterial(cubeMap, vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new EnvMapMaterial(cubeMap, vertexShader, fragmentShader);

}