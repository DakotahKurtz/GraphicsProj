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

function DrawableObject(shape, programInfo, bufferAttributes, opt_shininess = 1) {

    const drawHelper = function () {
        shape.draw(programInfo, bufferAttributes);
    }

    return {
        drawable: shape,
        programInfo: programInfo,
        bufferAttributes: bufferAttributes,
        draw: drawHelper,
        shininess: opt_shininess,
    }
}

function calculateNormals(p1, p2, p3) {
    return [calculateNormal(p1, p2, p3), calculateNormal(p2, p3, p1), calculateNormal(p3, p1, p2)]
}

function crossProduct(p1, p2) {
    let arr = [p1.y * p2.z - p1.z * p2.y, p1.z * p2.x - p1.x * p2.z, p1.x * p2.y - p1.y * p2.x];
    return arr;
}

function calculateNormal(p1, p2, p3) {
    let v1 = subtractArr(p2, p1);
    let v2 = subtractArr(p3, p1);

    return crossProduct(v1, v2);
}
function subtractArr(p1, p2) {
    return point(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
}
function point(x, y, z) {
    return {
        x: x,
        y: y,
        z: z,
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}