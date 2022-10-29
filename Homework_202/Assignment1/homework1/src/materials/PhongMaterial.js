class PhongMaterial extends Material {
//Edit Start 添加rotate、lightIndex参数
    constructor(color, specular, light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, rotate, scale);
//Edit End
        let lightIntensity = light.mat.GetIntensity();

        super({
            // Phong
            'uSampler': { type: 'texture', value: color },
            'uKs': { type: '3fv', value: specular },
            'uLightIntensity': { type: '3fv', value: lightIntensity },
            // Shadow
            'uShadowMap': { type: 'texture', value: light.fbo },
            'uLightMVP': { type: 'matrix4fv', value: lightMVP },
        //Edit Start 添加lightIndex参数
        }, [], vertexShader, fragmentShader, null, lightIndex);
        //Edit End
    }
}

//Edit Start 添加rotate、lightIndex参数
async function buildPhongMaterial(color, specular, light, translate, rotate, scale, lightIndex, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate、lightIndex参数
    return new PhongMaterial(color, specular, light, translate, rotate, scale, lightIndex, vertexShader, fragmentShader);
//Edit End
}