class PBRMaterial extends Material {

    constructor(albedo, metallic, roughness, BRDFLut, light, vertexShader, fragmentShader) {
        super({
            'uAlbedoMap': { type: 'texture', value: albedo },
            'uMetallic': { type: '1f', value: metallic },
            'uRoughness': { type: '1f', value: roughness },
            'uBRDFLut': { type: 'texture', value: BRDFLut },
            
            'uCubeTexture': { type: 'CubeTexture', value: null },
            'uLightRadiance': { type: '3fv', value: light.lightRadiance },
            'uLightDir': { type: '3fv', value: light.CalcShadingDirection() },
            'uLightPos': { type: '3fv', value: light.lightPos },
        }, [], vertexShader, fragmentShader);

    }
}

async function buildPBRMaterial(albedo, metallic, roughness, BRDFLut, light, vertexPath, fragmentPath) {

    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new PBRMaterial(albedo, metallic, roughness, BRDFLut, light, vertexShader, fragmentShader);
}