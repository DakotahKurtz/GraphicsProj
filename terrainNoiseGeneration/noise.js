"use strict";




var canvas;
var gl;

var numVertices = 36;

var pointsArray = [];
var colorsArray = [];
var aspect;

// save terrian data points

var index = 0;

// save into 1D Array

var mvMatrix, pMatrix;
var modelMatrixLocation, projMatrixLoc;

var cameraLocation = [0, 0, .5];
var lookingAt = [0, 0, 0];
var boundingNear = .3;
var boundingFar = 15;
var viewAngle = 90;

var vPosition;
var vColor;

var noiseDisplay;

function makeNoiseDisplay(gl, noise) {
    let numVertices = 0;
    let points = [];
    let colors = [];



    var pbuff = gl.createBuffer();
    var cBuff = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, pbuff);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        pointBuffer: pbuff,
        colorBuffer: cBuff,
        numVertices: ((points.length) / 3),
    }
}

function getAutomataArray(width, height, numIterations, applyRules) {
    let currentState = [];

    for (let i = 0; i < width; i++) {
        let r = [];
        for (let j = 0; j < height; j++) {
            r.push(getRandomInt(0, 1));
        }
        currentState.push(r);
    }


    function iteration(previousState) {
        let next = [];
        for (let i = 0; i < previousState.length; i++) {
            let r = [];
            for (let j = 0; j < previousState[0].length; j++) {
                r.push(applyRules(previousState, i, j));
            }
            next.push(r);
        }
        return next;
    }

    for (let i = 0; i < numIterations; i++) {
        currentState = iteration(currentState);
    }

    return currentState;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function caveGenRule(array, i, j) {

    let previousState = array;

    var inBounds = (i, j) => {
        return i >= 0 && i < previousState.length && j >= 0 && j < previousState[0].length;
    }

    var isNeighborWall = (i, j) => {
        return inBounds(i, j) && previousState[i][j] == 1;
    }

    var count = (i, j) => {
        let c = 0;
        if (isNeighborWall(i + 1, j)) {
            c++;
        }
        if (isNeighborWall(i + 1, j + 1)) {
            c++;
        }
        if (isNeighborWall(i + 1, j - 1)) {
            c++;
        }
        if (isNeighborWall(i, j + 1)) {
            c++;
        }
        if (isNeighborWall(i, j - 1)) {
            c++;
        }
        if (isNeighborWall(i - 1, j + 1)) {
            c++;
        }
        if (isNeighborWall(i - 1, j)) {
            c++;
        }
        if (isNeighborWall(i - 1, j - 1)) {
            c++;
        }
        return c;
    }

    let c = count(i, j);
    if (c >= 7) {
        return 2;
    }
    else if (c >= 5 || (c >= 4 && previousState[i][j] >= 1)) {
        return 1;
    } else {
        return 0;
    }
}

function printNoise(arr) {
    let s = "";
    for (let i = 0; i < arr.length; i++) {

        for (let j = 0; j < arr[0].length; j++) {
            s += arr[i][j] + " ";
        }
        s += "\n";
    }
    console.log(s);
}


window.onload = function init() {

    let noise = getAutomataArray(30, 30, 3, caveGenRule);
    printNoise(noise);

    canvas = document.getElementById("gl-canvas");
    aspect = canvas.width / canvas.height;

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);



    //console.log(flatten(colorsArray));

    // var cBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    vColor = gl.getAttribLocation(program, "vColor");


    // var vBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");


    // noiseDisplay = makeNoiseDisplay(gl, noise);

    modelMatrixLocation = gl.getUniformLocation(program, "modelView");
    projMatrixLoc = gl.getUniformLocation(program, "projection");

    var lookInc = .5;
    var cameraAtInc = .1;
    var boundingInc = .1;
    var angleInc = 10;
    document.addEventListener('keydown', function (event) {
        if (event.shiftKey) {
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
        } else {
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


        console.log("CameraLocation: " + cameraLocation);
        console.log("LookingAt: " + lookingAt);
        console.log("Near: " + boundingNear + ", Far: " + boundingFar + ", angle: " + viewAngle);
        render();

    });

    // render();
}


var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // change the camera location or position


    // x= -2 
    // each render call x += -2+dr

    let eye = vec3(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
    let at = vec3(lookingAt[0], lookingAt[1], lookingAt[2]);
    let up = vec3(0, 1, 0);

    mvMatrix = lookAt(eye, at, up);/*depricated function in MV.js*/
    // pMatrix = ortho(left, right, bottom, ytop, near, far);/*return 4x4  matrix 
    // 	for orthographic projection*/
    pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);
    /*recall P' = P*MV*p*/

    // pass info to the shader
    gl.uniformMatrix4fv(modelMatrixLocation, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(projMatrixLoc, false, flatten(pMatrix));

    gl.bindBuffer(gl.ARRAY_BUFFER, noiseDisplay.pointBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, noiseDisplay.colorBuffer);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(gl.LINES, 0, noiseDisplay.numVertices);


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