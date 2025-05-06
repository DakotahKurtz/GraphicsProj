function bufferAttributes(size, type, opt_normalize = false, opt_stride = 0, opt_offset = 0) {
    return {
        size: size,
        type: type,
        normalize: opt_normalize,
        stride: opt_stride,
        offset: opt_offset
    }
}

function setBufferAttributes(gl, shapeData) {
    let attributes = shapeData.bufferAttributes;
    console.log(attributes.length);
    console.log(attributes);
    let buffers = shapeData.drawable.getBuffers();
    for (let i = 0; i < attributes.length; i++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[i]);
        gl.vertexAttribPointer(shapeData.programInfo.getBufferLocations()[i], attributes[i].size, attributes[i].type, attributes[i].normalize, attributes[i].stride, attributes[i].offset);
    }
}



function createProgramInfo(gl, vertexShaderText, fragmentShaderText, attributeNames,) {



    var program = initShaders(gl, vertexShaderText, fragmentShaderText);
    let bufferLocations = [];
    console.log(attributeNames)

    for (let i = 0; i < attributeNames.length; i++) {
        let loc = gl.getAttribLocation(program, attributeNames[i]);
        gl.enableVertexAttribArray(loc);
        bufferLocations.push(loc);
    }





    return {
        program: program,
        bufferLocations: bufferLocations,
    }
}

function loadBuffer(gl, values, type) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, type);

    return buffer;
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}



function loadImage(url, callback) {
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    image.onload = callback;
    return image;
}

function loadImages(urls, callback) {
    var images = [];
    var imagesToLoad = urls.length;

    // Called each time an image finished loading.
    var onImageLoad = function () {
        --imagesToLoad;
        // If all the images are loaded call the callback.
        if (imagesToLoad == 0) {
            callback(images);
        }
    };

    for (var ii = 0; ii < imagesToLoad; ++ii) {
        var image = loadImage(urls[ii], onImageLoad);
        images.push(image);
    }
}

