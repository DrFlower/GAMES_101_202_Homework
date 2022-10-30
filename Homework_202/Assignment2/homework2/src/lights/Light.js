class EmissiveMaterial extends Material {

    constructor(lightRadiance) {
        super({
            'uLightRadiance': { type: '3fv', value: lightRadiance }
        }, [], LightCubeVertexShader, LightCubeFragmentShader);

        this.color = lightRadiance;
    }

    GetIntensity() {
        return this.color;
    }
}
