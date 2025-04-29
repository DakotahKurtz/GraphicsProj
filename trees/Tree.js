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


var tree;

function generateTree(gl, lSystem) {
    let systemData = lSystem.render();
    let numVertices = 0;
    let points = [];
    let colors = [];

    for (let i = 0; i < systemData.length; i++) {
        // console.log(systemData[i][0] + ", " + systemData[i][1], ", 0");
        points.push(systemData[i][0], systemData[i][1], 0)
    }

    for (let i = 0; i < (points.length / 3); i++) {
        colors.push(0, .4, .9, 1);
    }

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

var vPosition;
var vColor;

window.onload = function init() {
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

    var lSystem = new LSystem(0, 2, 20, .1);

    tree = generateTree(gl, lSystem);

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

    render();
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

    gl.bindBuffer(gl.ARRAY_BUFFER, tree.pointBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, tree.colorBuffer);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    gl.drawArrays(gl.LINES, 0, tree.numVertices);


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