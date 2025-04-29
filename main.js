"use strict";

var DrawableObjectArray = [];



window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    var programInfoTerrain = createProgramInfo(gl, "vertex-shader-terrain", "fragment-shader-terrain",
        ["a_position", "a_color", "a_normal"],
    );
    var programInfoSkyBox = createProgramInfo(gl, "vertex-shader-skybox", "fragment-shader-skybox",
        ["a_position", "a_texcoord"],
    )

    var modelMatrixLocationTerrain, projMatrixLocTerrain, reverseLightDirLocationTerrain;

    // get uniform locations
    gl.useProgram(programInfoTerrain.program);
    modelMatrixLocationTerrain = gl.getUniformLocation(programInfoTerrain.program, "modelView");
    projMatrixLocTerrain = gl.getUniformLocation(programInfoTerrain.program, "projection");
    reverseLightDirLocationTerrain = gl.getUniformLocation(programInfoTerrain.program, "uReverseLightDirection");

    gl.useProgram(programInfoSkyBox.program);
    var modelMatrixLocationSkyBox = gl.getUniformLocation(programInfoSkyBox.program, "modelView");
    var projMatrixLocSkyBox = gl.getUniformLocation(programInfoSkyBox.program, "projection");
    var textureLocation = gl.getUniformLocation(programInfoSkyBox.program, "u_texture")

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var aspect = canvas.width / canvas.height;
    var lookInc = .5;
    var cameraAtInc = .1;
    var boundingInc = .1;
    var angleInc = 10;
    var lightInc = .1;

    var cameraLocation = [0, 3, 3];
    var lookingAt = [0, 0, 1];
    var boundingNear = .3;
    var boundingFar = 50;
    var viewAngle = 30;

    var lightDirection = [.2, -.9, -.3];





    DrawableObjectArray.push(
        DrawableObject(new Terrain(gl, 512, 512), programInfoTerrain,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT),]
        ),
    );


    var skyBoxObject = DrawableObject(new SkyBox(gl, 20), programInfoSkyBox,
        [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT)]
    );

    manageControls();



    render();

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let lightPositionNorm = normalize(lightDirection)
        let eye = vec3(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
        let at = calculateTarget(lookingAt);
        let up = vec3(0, 1, 0);

        let mvMatrix = lookAt(eye, at, up);
        let pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);

        gl.useProgram(programInfoTerrain.program);
        // pass info to the shader
        gl.uniformMatrix4fv(modelMatrixLocationTerrain, false, flatten(mvMatrix));
        gl.uniformMatrix4fv(projMatrixLocTerrain, false, flatten(pMatrix));

        gl.uniform3fv(reverseLightDirLocationTerrain, lightPositionNorm);


        DrawableObjectArray.forEach((drawableObject) => {

            setBufferAttributes(gl, drawableObject);
            gl.drawArrays(drawableObject.drawable.getType(), 0, drawableObject.drawable.getNumVertices());

        })

        gl.useProgram(programInfoSkyBox.program);
        gl.uniformMatrix4fv(modelMatrixLocationSkyBox, false, flatten((mvMatrix)));
        gl.uniformMatrix4fv(projMatrixLocSkyBox, false, flatten(pMatrix));
        gl.uniform1i(textureLocation, 0);
        setBufferAttributes(gl, skyBoxObject);
        gl.drawArrays(skyBoxObject.drawable.getType(), 0, skyBoxObject.drawable.getNumVertices());

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
                adjustControlArray(event, lightDirection, lightInc);
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
            console.log("Light: " + normalize(lightDirection))
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

function calculateTarget(look) {
    return [
        look[2] * Math.sin(look[0]),
        look[2] * Math.cos(look[1]),
        look[2] * Math.cos(look[0]),
    ]
}