class DirectLightMaterial extends Material {

    constructor(color, specular, light, translate, scale, vertexShader, fragmentShader) {
        let lightMVP = light.CalcLightMVP(translate, scale);
        let lightIntensity = light.mat.GetIntensity();

        super({
            // Phong
            'uSampler': { type: 'texture', value: color },
            'uKs': { type: '3fv', value: specular },
            'uLightRadiance': { type: '3fv', value: lightIntensity },
            // Shadow
            'uShadowMap': { type: 'texture', value: light.fbo },
            'uLightMVP': { type: 'matrix4fv', value: lightMVP },

        }, [], vertexShader, fragmentShader);
    }
}

async function buildDirectLightMaterial(color, specular, light, translate, scale, vertexPath, fragmentPath) {
    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new DirectLightMaterial(color, specular, light, translate, scale, vertexShader, fragmentShader);
}