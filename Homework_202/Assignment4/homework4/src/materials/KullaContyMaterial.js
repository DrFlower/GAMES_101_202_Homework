class KullaContyMaterial extends Material {

    constructor(albedo, metallic, roughness, BRDFLut, EavgLut, light, vertexShader, fragmentShader) {
        super({
            'uAlbedoMap': { type: 'texture', value: albedo },
            'uMetallic': { type: '1f', value: metallic },
            'uRoughness': { type: '1f', value: roughness },
            'uBRDFLut': { type: 'texture', value: BRDFLut },
            'uEavgFLut': { type: 'texture', value: EavgLut },
            
            'uCubeTexture': { type: 'CubeTexture', value: null },
            'uLightRadiance': { type: '3fv', value: light.lightRadiance },
            'uLightDir': { type: '3fv', value: light.CalcShadingDirection() },
            'uLightPos': { type: '3fv', value: light.lightPos },
        }, [], vertexShader, fragmentShader);

    }
}

async function buildKullaContyMaterial(albedo, metallic, roughness, BRDFLut, EavgLut, light, vertexPath, fragmentPath) {

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new KullaContyMaterial(albedo, metallic, roughness, BRDFLut, EavgLut, light, vertexShader, fragmentShader);
}