
function loadShaderFile(filename) {

    return new Promise((resolve, reject) => {
        const loader = new THREE.FileLoader();
        loader.load(filename, (data) => {
            resolve(data);
            //console.log(data);
        });
    });
}
