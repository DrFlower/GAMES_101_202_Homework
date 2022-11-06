class PRTMaterial extends Material {

    constructor(vertexShader, fragmentShader) {

        super({
            'uPrecomputeL[0]': { type: 'precomputeL', value: 0 },
            'uPrecomputeL[1]': { type: 'precomputeL', value: 1 },
            'uPrecomputeL[2]': { type: 'precomputeL', value: 2 },
        }, 
        ['aPrecomputeLT'], 
        vertexShader, fragmentShader, null);
    }
}

async function buildPRTMaterial(vertexPath, fragmentPath) {


    let vertexShader = await getShaderString(vertexPath);
    let fragmentShader = await getShaderString(fragmentPath);

    return new PRTMaterial(vertexShader, fragmentShader);

}