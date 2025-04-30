"use strict";

var DrawableObjectArray = [];

function main() {
    var imageURLS = [
        "https://i.ibb.co/7xLCgSbY/sky-Box-Adjusted.png"
    ]
    loadImages(imageURLS, init);
}

main();

function init(images) {
    var canvas = document.getElementById("gl-canvas");

    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    var programDataTerrain = new ProgramData(gl, "vertex-shader-terrain", "fragment-shader-terrain",
        ["a_position", "a_color", "a_normal"],);
    var programDataSkyBox = new ProgramData(gl, "vertex-shader-skybox", "fragment-shader-skybox",
        ["a_position", "a_texcoord"],);


    var terrainUniforms = {
        "modelView": 0,
        "projection": 0,
        "ambientProduct": 0,
        "diffuseProduct": 0,
        "specularProduct": 0,
        "lightPosition": 0,
        "shininess": 0,
        "eyePosition": 0,
    };

    var skyboxUniforms = {
        "modelView": 0,
        "projection": 0,
        "u_texture": 0,
    }

    for (const [name] of Object.entries(terrainUniforms)) {
        programDataTerrain.getUniformInfo(name);
    }

    for (const [name] of Object.entries(skyboxUniforms)) {
        programDataSkyBox.getUniformInfo(name);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var aspect = canvas.width / canvas.height;
    var lookInc = .5;
    var cameraAtInc = .1;
    var boundingInc = .1;
    var angleInc = 10;
    var lightInc = .1;

    var cameraLocation = [0, 4.9, 1.6];
    var lookingAt = [-2, -1.5, 20];
    var boundingNear = .3;
    var boundingFar = 50;
    var viewAngle = 30;

    var lightPosition = vec4(0, .5, 0, 1);
    var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
    var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
    var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

    var materialAmbient = vec4(1.0, 0.8, 0.0, 1.0);
    var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
    var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
    var materialShininess = 20.0;
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    terrainUniforms["ambientProduct"] = flatten(ambientProduct);
    terrainUniforms["diffuseProduct"] = flatten(diffuseProduct);
    terrainUniforms["specularProduct"] = flatten(specularProduct);
    terrainUniforms["shininess"] = materialShininess;


    DrawableObjectArray.push(
        DrawableObject(new Terrain(gl, 512, 512, 20), programDataTerrain,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT),]
        ),
    );


    var skyBoxObject = DrawableObject(new SkyBox(gl, 20, images[0]), programDataSkyBox,
        [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT)]
    );

    manageControls();



    render();

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let eye = vec3(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
        let at = calculateTarget(lookingAt);
        let up = vec3(0, 1, 0);

        let mvMatrix = lookAt(eye, at, up);
        let pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);

        programDataTerrain.use();

        terrainUniforms["eyePosition"] = flatten(eye);
        terrainUniforms["lightPosition"] = flatten(lightPosition);
        terrainUniforms["ambientProduct"] = flatten(ambientProduct);
        terrainUniforms["diffuseProduct"] = flatten(diffuseProduct);
        terrainUniforms["specularProduct"] = flatten(specularProduct);
        terrainUniforms["shininess"] = materialShininess;

        terrainUniforms["modelView"] = flatten(mvMatrix);
        terrainUniforms["projection"] = flatten(pMatrix);
        setUniforms(terrainUniforms, programDataTerrain);

        DrawableObjectArray.forEach((drawableObject) => {

            drawableObject.draw()
        })

        gl.useProgram(programDataSkyBox.program);
        programDataSkyBox.use();
        skyboxUniforms["modelView"] = flatten(mvMatrix);
        skyboxUniforms["projection"] = flatten(pMatrix);
        skyboxUniforms["u_texture"] = 0;
        setUniforms(skyboxUniforms, programDataSkyBox);

        skyBoxObject.draw();
        // gl.drawArrays(skyBoxObject.drawable.getType(), 0, skyBoxObject.drawable.getNumVertices());

    }

    function manageControls() {
        const pressedKeys = {};

        document.addEventListener('keydown', (event) => {
            pressedKeys[event.key] = true;
        });

        document.addEventListener('keyup', (event) => {
            delete pressedKeys[event.key];
        });

        document.addEventListener('keydown', function (event) {
            if (pressedKeys["Shift"]) {
                adjustControlArray(event, lookingAt, lookInc);

                switch (event.key) {
                    case ("n"):
                        boundingNear = Math.max(0, boundingNear - boundingInc);
                        break;
                    case ("e"):
                        boundingFar = Math.max(boundingNear, boundingFar + boundingInc);
                        break;
                    case ("a"):
                        viewAngle = Math.max(10, viewAngle - angleInc);
                        break;

                }
            } else if (pressedKeys["l"]) {
                adjustControlArray(event, lightPosition, lightInc);
            }
            else {
                adjustControlArray(event, cameraLocation, cameraAtInc);
                switch (event.key) {
                    case ("n"):
                        boundingNear = Math.min(boundingFar, boundingNear + boundingInc);
                        break;
                    case ("e"):
                        boundingFar += boundingInc;
                        break;
                    case ("a"):
                        viewAngle = Math.min(355, viewAngle + angleInc);
                        break;
                }
            }


            // console.log("CameraLocation: " + cameraLocation);
            console.log("Light: " + lightPosition)
            console.log("LookingAt: " + lookingAt);
            console.log("Near: " + boundingNear + ", Far: " + boundingFar + ", angle: " + viewAngle);
            console.log("Position: " + cameraLocation)
            render();

        });
    }
}

function setupTerrainProgram() {

}

function adjustControlArray(event, array, inc) {
    switch (event.key) {
        case ("ArrowLeft"):
            array[0] -= inc;
            break;
        case ("ArrowRight"):
            array[0] += inc;
            break;
        case ("ArrowDown"):
            array[1] -= inc;
            break;
        case ("ArrowUp"):
            array[1] += inc;
            break;
        case ("f"):
        case ("F"):
            array[2] -= inc;
            break;
        case ("b"):
        case ("B"):
            array[2] += inc;
            break;
    }


}

function setUniforms(map, programData) {
    for (const [name, value] of Object.entries(map)) {
        programData.setUniform(name, value);
    }
}

function calculateTarget(look) {
    return [
        look[2] * Math.sin(look[0]),
        look[2] * Math.cos(look[1]),
        look[2] * Math.cos(look[0]),
    ]
}