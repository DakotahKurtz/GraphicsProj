"use strict";




// save into 1D Array








var DrawableObjectArray = [];

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    var programInfo = createProgramInfo(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(programInfo.program);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var aspect = canvas.width / canvas.height;
    var lookInc = .5;
    var cameraAtInc = .1;
    var boundingInc = .1;
    var angleInc = 10;
    var lightInc = .1;

    var cameraLocation = [0, 3, -3];
    var lookingAt = [0, 0, 1];
    var boundingNear = .3;
    var boundingFar = 15;
    var viewAngle = 90;

    var lightDirection = [.2, -.9, -.3];

    var modelMatrixLocation, projMatrixLoc, reverseLightDirLocation;

    // set uniforms
    modelMatrixLocation = gl.getUniformLocation(programInfo.program, "modelView");
    projMatrixLoc = gl.getUniformLocation(programInfo.program, "projection");
    reverseLightDirLocation = gl.getUniformLocation(programInfo.program, "uReverseLightDirection");



    DrawableObjectArray.push(
        DrawableObject(new Terrain(gl, 512, 512), programInfo,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT),]
        ),
    );

    const pressedKeys = {};

    document.addEventListener('keydown', (event) => {
        pressedKeys[event.key] = true;
    });

    document.addEventListener('keyup', (event) => {
        delete pressedKeys[event.key];
    });

    document.addEventListener('keydown', function (event) {
        if (pressedKeys["Shift"]) {
            handleControls(event, lookingAt, lookInc);

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
            handleControls(event, lightDirection, lightInc);
        }
        else {
            handleControls(event, cameraLocation, cameraAtInc);
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
        render();

    });

    render();

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let eye = vec3(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
        let at = vec3(lookingAt[0], lookingAt[1], lookingAt[2]);
        let up = vec3(0, 1, 0);

        let mvMatrix = lookAt(eye, at, up);/*depricated function in MV.js*/
        let pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);

        // pass info to the shader
        gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(mvMatrix));
        gl.uniformMatrix4fv(projMatrixLoc, false, flatten(pMatrix));
        let lightPositionNorm = normalize(lightDirection)

        gl.uniform3fv(reverseLightDirLocation, lightPositionNorm);

        DrawableObjectArray.forEach((drawableObject) => {

            setBufferAttributes(gl, drawableObject);
            gl.drawArrays(drawableObject.drawable.getType(), 0, drawableObject.drawable.getNumVertices());

        })
    }
}

function handleControls(event, array, inc) {
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