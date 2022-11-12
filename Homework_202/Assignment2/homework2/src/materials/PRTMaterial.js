class PRTMaterial extends Material {

    constructor(vertexShader, fragmentShader) {

        super({
            'uPrecomputeL[0]': { type: 'precomputeL', value: null},
            'uPrecomputeL[1]': { type: 'precomputeL', value: null},
            'uPrecomputeL[2]': { type: 'precomputeL', value: null},
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