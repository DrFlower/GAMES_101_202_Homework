async function loadShaderFile(filename) {

    return new Promise((resolve, reject) => {
        const loader = new THREE.FileLoader();

        loader.load(filename, (data) => {
            resolve(data);
        });
    });
}

async function getShaderString(filename) {

    let val = ''
    await this.loadShaderFile(filename).then(result => {
        val = result;
    });
    return val;
}
