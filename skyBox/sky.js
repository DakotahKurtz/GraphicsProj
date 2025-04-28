"use strict";
var cameraLoc = [0, 0, 0];
var lookAt = [0, 1, 1];
var positions;
var target;

function calculateTarget(look) {
    console.log("Look: " + look);
    return [
        look[2] * Math.sin(look[0]),
        look[2] * Math.cos(look[1]),
        look[2] * Math.cos(look[0]),
    ]
}

function main() {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
    var canvas = document.querySelector("#canvas");
    var gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }
    target = calculateTarget(lookAt);

    // setup GLSL program
    var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-3d", "fragment-shader-3d"]);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");

    // lookup uniforms
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    var textureLocation = gl.getUniformLocation(program, "u_texture");

    // Create a buffer for positions
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put the positions in the buffer
    // setGeometry(gl);
    setBoxGeo(gl, 40);

    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    // Set Texcoords.
    setTexcoords2(gl);

    // Create a texture.
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 255, 255]));
    // Asynchronously load an image
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = "https://i.ibb.co/7xLCgSbY/sky-Box-Adjusted.png";
    image.addEventListener('load', function () {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Check if the image is a power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    });

    function isPowerOf2(value) {
        return (value & (value - 1)) === 0;
    }

    function radToDeg(r) {
        return r * 180 / Math.PI;
    }

    function degToRad(d) {
        return d * Math.PI / 180;
    }

    var fieldOfViewRadians = degToRad(60);
    var modelXRotationRadians = degToRad(0);
    var modelYRotationRadians = degToRad(0);

    // Get the starting time.
    var then = 0;
    const pressedKeys = {};

    document.addEventListener('keydown', (event) => {
        pressedKeys[event.key] = true;
    });

    document.addEventListener('keyup', (event) => {
        delete pressedKeys[event.key];
    });


    requestAnimationFrame(drawScene);
    var cameraAtInc = .1;
    var lookInc = .2;
    document.addEventListener('keydown', function (event) {
        if (pressedKeys["Shift"]) {
            handleControls(event, lookAt, lookInc);


        }
        else {
            handleControls(event, cameraLoc, cameraAtInc);

        }
        console.log("Lookat: " + lookAt)
        target = calculateTarget(lookAt);
        console.log("LOC  " + cameraLoc);
        console.log("LOOKAT cartesian: " + target);


    });



    // Draw the scene.
    function drawScene(time) {
        // convert to seconds
        time *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = time - then;
        // Remember the current time for the next frame.
        then = time;

        webglUtils.resizeCanvasToDisplaySize(gl.canvas);

        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Animate the rotation
        modelYRotationRadians += -0.7 * deltaTime;
        modelXRotationRadians += -0.4 * deltaTime;

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 3;          // 3 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset);

        // Turn on the texcoord attribute
        gl.enableVertexAttribArray(texcoordLocation);

        // bind the texcoord buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

        // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            texcoordLocation, size, type, normalize, stride, offset);

        // Compute the projection matrix
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, .3, 80);

        var cameraPosition = cameraLoc;
        var up = [0, 1, 0];
        // target = [Math.cos(lookAt[0]), lookAt[1], Math.sin(lookAt[0])];

        // Compute the camera's matrix using look at.
        var cameraMatrix = m4.lookAt(cameraPosition, target, up);

        // Make a view matrix from the camera matrix.
        var viewMatrix = m4.inverse(cameraMatrix);

        var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

        // var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
        // matrix = m4.yRotate(matrix, modelYRotationRadians);
        var matrix = viewProjectionMatrix;
        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Tell the shader to use texture unit 0 for u_texture
        gl.uniform1i(textureLocation, 0);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

        requestAnimationFrame(drawScene);
    }
}

// Fill the buffer with texture coordinates the cube.
function setTexcoords2(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(
            [
                //left
                .25, 1,
                .25, .5,
                0.0, 1,
                0, 1,
                .25, .5,
                0, .5,

                // back
                .5, 1,
                .5, .5,
                .25, 1,
                .25, 1,
                .5, .5,
                .25, .5,

                // right
                .75, 1,
                .75, .5,
                .5, 1,
                .5, 1,
                .75, .5,
                .5, .5,

                // front
                1, 1,
                1, .5,
                .75, 1,
                .75, 1,
                1, .5,
                .75, .5,

                //up
                .75, 0,
                .5, 0,
                .75, .5,
                .75, .5,
                .5, 0,
                .5, .5,

                // down
                .75, 0,
                .75, .5,
                1, 0,
                1, 0,
                .75, .5,
                1, .5,



            ]),
        gl.STATIC_DRAW);
}

function setBoxGeo(gl, size) {
    positions = new Float32Array([


        //left face
        -size, -size, -size,
        -size, size, -size,
        -size, -size, size,
        -size, -size, size,
        -size, size, -size,
        -size, size, size,

        // back face
        size, -size, -size,
        size, size, -size,
        -size, -size, -size,
        -size, -size, -size,
        size, size, -size,
        -size, size, -size,

        // right face
        size, -size, size,
        size, size, size,
        size, -size, -size,
        size, -size, -size,
        size, size, size,
        size, size, -size,

        // front face
        //
        -size, -size, size,
        -size, size, size,
        size, -size, size,
        size, -size, size,
        -size, size, size,
        size, size, size,

        // up
        -size, size, size,
        -size, size, -size,
        size, size, size,
        size, size, size,
        -size, size, -size,
        size, size, -size,

        // down
        -size, -size, -size,
        -size, -size, size,
        size, -size, -size,
        size, -size, -size,
        -size, -size, size,
        size, -size, size,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

}

// Fill the buffer with the values that define a cube.
function setGeometry(gl) {
    var positions = new Float32Array(
        [
            -0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, -0.5, -0.5,

            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,

            -0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,

            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,

            -0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, -0.5,

            0.5, -0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, -0.5,
            0.5, 0.5, 0.5,

        ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with texture coordinates the cube.
function setTexcoords(gl) {
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(
            [
                // select the top left image
                0, 0,
                0, 0.5,
                0.25, 0,
                0, 0.5,
                0.25, 0.5,
                0.25, 0,
                // select the top middle image
                0.25, 0,
                0.5, 0,
                0.25, 0.5,
                0.25, 0.5,
                0.5, 0,
                0.5, 0.5,
                // select to top right image
                0.5, 0,
                0.5, 0.5,
                0.75, 0,
                0.5, 0.5,
                0.75, 0.5,
                0.75, 0,
                // select the bottom left image
                0, 0.5,
                0.25, 0.5,
                0, 1,
                0, 1,
                0.25, 0.5,
                0.25, 1,
                // select the bottom middle image
                0.25, 0.5,
                0.25, 1,
                0.5, 0.5,
                0.25, 1,
                0.5, 1,
                0.5, 0.5,
                // select the bottom right image
                0.5, 0.5,
                0.75, 0.5,
                0.5, 1,
                0.5, 1,
                0.75, 0.5,
                0.75, 1,

            ]),
        gl.STATIC_DRAW);
}

main();

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