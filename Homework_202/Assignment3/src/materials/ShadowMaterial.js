class ShadowMaterial extends Material {
    constructor(light, vertexShader, fragmentShader) {
        let lightVP = light.CalcLightVP();

        super({
            'uLightVP': { type: 'matrix4fv', value: lightVP }
        }, [], vertexShader, fragmentShader, light.fbo);
    }
}

async function buildShadowMaterial(light, vertexPath, fragmentPath) {
    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new ShadowMaterial(light, vertexShader, fragmentShader);
}