class ShadowMaterial extends Material {
//Edit Start 添加rotate参数
    constructor(light, translate, rotate, scale, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, rotate, scale);
//Edit End
        super({
            'uLightMVP': { type: 'matrix4fv', value: lightMVP }
        }, [], vertexShader, fragmentShader, light.fbo);
    }
}

//Edit Start 添加rotate参数
async function buildShadowMaterial(light, translate, rotate, scale, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate参数
    return new ShadowMaterial(light, translate, rotate, scale, vertexShader, fragmentShader);
//Edit End
}