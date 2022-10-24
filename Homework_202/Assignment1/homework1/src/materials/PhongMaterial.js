class PhongMaterial extends Material {
//Edit Start 添加rotate参数
    constructor(color, specular, light, translate, rotate, scale, vertexShader, fragmentShader) {
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

        }, [], vertexShader, fragmentShader);
    }
}

//Edit Start 添加rotate参数
async function buildPhongMaterial(color, specular, light, translate, rotate, scale, vertexPath, fragmentPath) {
//Edit End

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);
//Edit Start 添加rotate参数
    return new PhongMaterial(color, specular, light, translate, rotate, scale, vertexShader, fragmentShader);
//Edit End
}