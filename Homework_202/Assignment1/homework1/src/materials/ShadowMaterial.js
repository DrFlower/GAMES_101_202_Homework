class ShadowMaterial extends Material {
//Edit Start 添加rotate、lightIndex参数
    constructor(light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, rotate, scale);
//Edit End
        super({
            'uLightMVP': { type: 'matrix4fv', value: lightMVP }
        //Edit Start lightIndex参数
        }, [], vertexShader, fragmentShader, light.fbo, lightIndex);
        //Edit End
    }
}

//Edit Start 添加rotate、lightIndex参数
async function buildShadowMaterial(light, translate, rotate, scale, lightIndex, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate、lightIndex参数
    return new ShadowMaterial(light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader);
//Edit End
}