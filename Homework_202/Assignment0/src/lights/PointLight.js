
class PointLight {
    /**
     * Creates an instance of PointLight.
     * @param {float} lightIntensity  The intensity of the PointLight.
     * @param {vec3f} lightColor The color of the PointLight.
     * @memberof PointLight
     */
    constructor(lightIntensity, lightColor) {
        this.mesh = Mesh.cube();
        this.mat = new EmissiveMaterial(lightIntensity, lightColor);
    }
}