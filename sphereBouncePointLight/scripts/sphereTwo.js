"use strict";

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



function positioningInfo(location, opt_rotation = vec3(0, 0, 0)) {
  return {
    location: location,
    rotation: opt_rotation,
  }
}



function getSphere(gl, radius, hDensity, wDensity, color, opt_positionData = positioningInfo(vec3(0, 0, 0), vec3(0, 0, 0))) {
  let quadCols = hDensity;
  let quadRows = wDensity;

  let phiInc = 160 / quadRows;
  let thetaInc = 360 / quadCols;
  let r = radius;

  let spherePtStorage = [];
  let sphereNormals = [];

  for (let phi = -80; phi < 80; phi += phiInc) {
    let phiRads = degToRad(phi);
    let phiRadsNext = degToRad(phi + phiInc);

    for (let theta = 0; theta <= 360; theta += thetaInc) {
      let thetaRads = degToRad(theta);
      let thetaRadsNext = degToRad(theta + thetaInc);
      let p1 = toCartesian(thetaRads, phiRads, r);
      let p2 = toCartesian(thetaRads, phiRadsNext, r);
      let p3 = toCartesian(thetaRadsNext, phiRads, r);
      let p4 = toCartesian(thetaRadsNext, phiRadsNext, r);



      spherePtStorage.push(
        p1[0], p1[1], p1[2],
        p3[0], p3[1], p3[2],
        p2[0], p2[1], p2[2],
        p2[0], p2[1], p2[2],
        p3[0], p3[1], p3[2],
        p4[0], p4[1], p4[2],
      );

      p1 = normalize(p1);
      p2 = normalize(p2);
      p3 = normalize(p3);
      p4 = normalize(p4);

      sphereNormals.push(
        p1[0], p1[1], p1[2],
        p3[0], p3[1], p3[2],
        p2[0], p2[1], p2[2],
        p2[0], p2[1], p2[2],
        p3[0], p3[1], p3[2],
        p4[0], p4[1], p4[2],
      )
    }
  }

  // cover both naked poles
  let northPole = [0, 0, r];
  let phi = degToRad(80);
  let p = r * Math.cos(phi);
  for (let theta = 0; theta <= 360; theta += thetaInc) {
    let thetaRads = degToRad(theta);
    let thetaRadsNext = degToRad(theta + thetaInc);
    let p1 = [p * Math.cos(thetaRads), p * Math.sin(thetaRads), r * Math.sin(phi)];
    let p2 = [p * Math.cos(thetaRadsNext), p * Math.sin(thetaRadsNext), r * Math.sin(phi)];
    spherePtStorage.push(
      northPole[0], northPole[1], northPole[2],
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
    );
    p1 = normalize(p1);
    p2 = normalize(p2);
    sphereNormals.push(
      0, 0, 1,
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
    )
  }

  phi = degToRad(-80);
  p = r * Math.cos(phi);
  for (let theta = 0; theta <= 360; theta += thetaInc) {
    let thetaRads = degToRad(theta);
    let thetaRadsNext = degToRad(theta + thetaInc);
    let p1 = [p * Math.cos(thetaRadsNext), p * Math.sin(thetaRadsNext), r * Math.sin(phi)];
    let p2 = [p * Math.cos(thetaRads), p * Math.sin(thetaRads), r * Math.sin(phi)];
    spherePtStorage.push(
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
    );
    p1 = normalize(p1);
    p2 = normalize(p2);
    sphereNormals.push(
      0, 0, -1,
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
    )
  }

  let tColor = [];
  let solid = (color.length == 4);
  for (let i = 0; i < spherePtStorage.length; i += 9) {
    if (solid) {
      tColor.push(
        color[0], color[1], color[2], color[3],
        color[0], color[1], color[2], color[3],
        color[0], color[1], color[2], color[3],

      )
    } else {
      tColor.push(
        color[0], color[1], color[2], color[3],
        color[4], color[5], color[6], color[7],
        color[8], color[9], color[10], color[11],
      );
    }
  }

  var positionBuffer = loadBuffer(gl, new Float32Array(spherePtStorage), gl.STATIC_DRAW);
  var colorBuffer = loadBuffer(gl, new Float32Array(tColor), gl.STATIC_DRAW);
  var normalBuffer = loadBuffer(gl, new Float32Array(sphereNormals), gl.STATIC_DRAW);

  var numPoints = spherePtStorage.length / 3;

  return {
    points: positionBuffer,
    colors: colorBuffer,
    normals: normalBuffer,
    vertexCount: numPoints,
    positioningInfo: opt_positionData,
    radius: radius,
    type: gl.TRIANGLES
  }
}

function loadBuffer(gl, values, type) {
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, values, type);

  return buffer;
}

function glassWall(gl, upperLeft, bottomRight, color, opacity, opt_positionData = positioningInfo(vec3(0, 0, 0), vec3(0, 0, 0))) {
  let points = [];
  let normals = [];

  normals.push(
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  )
  points.push(
    upperLeft.x, upperLeft.y, upperLeft.z,
    upperLeft.x, bottomRight.y, upperLeft.z,
    bottomRight.x, bottomRight.y, upperLeft.z,
    bottomRight.x, bottomRight.y, bottomRight.z,
    bottomRight.x, upperLeft.y, upperLeft.z,
    upperLeft.x, upperLeft.y, upperLeft.z,
  )

  let colors = [];
  for (let i = 0; i < points.length; i++) {
    colors.push(color[0], color[1], color[2], opacity);
  }

  let positionBuffer = loadBuffer(gl, new Float32Array(points), gl.STATIC_DRAW);
  let colorBuffer = loadBuffer(gl, new Float32Array(colors), gl.STATIC_DRAW);
  let normalBuffer = loadBuffer(gl, new Float32Array(normals), gl.STATIC_DRAW);

  let numPoints = points.length / 3;

  return {
    points: positionBuffer,
    colors: colorBuffer,
    normals: normalBuffer,
    vertexCount: numPoints,
    positioningInfo: opt_positionData,
    type: gl.TRIANGLES,
  }

}

function openFacedBox(gl, upperLeftFront, bottomRightRear, color, opt_positionData = positioningInfo(vec3(0, 0, 0), vec3(0, 0, 0))) {
  let faces = [];
  let counterWise = [];
  let normals = [];

  normals.push(
    // inside walls
    // left
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    // up
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    // right wall
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    // bottom wall
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    // back wall
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,

    // exterior facing walls
    -1, 0, 0, // left
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,

    0, 1, 0, // up
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,

    1, 0, 0, // right
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    0, -1, 0, // down
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,

    0, 0, -1, // rear
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
  )

  counterWise.push( // inside facing walls
    [ // left
      upperLeftFront,
      vec3(upperLeftFront.x, bottomRightRear.y, upperLeftFront.z),
      vec3(upperLeftFront.x, bottomRightRear.y, bottomRightRear.z),
      vec3(upperLeftFront.x, upperLeftFront.y, bottomRightRear.z)
    ],
    [ // top
      upperLeftFront,
      vec3(upperLeftFront.x, upperLeftFront.y, bottomRightRear.z),
      vec3(bottomRightRear.x, upperLeftFront.y, bottomRightRear.z),
      vec3(bottomRightRear.x, upperLeftFront.y, upperLeftFront.z)
    ],
    [ // right
      bottomRightRear,
      vec3(bottomRightRear.x, bottomRightRear.y, upperLeftFront.z),
      vec3(bottomRightRear.x, upperLeftFront.y, upperLeftFront.z),
      vec3(bottomRightRear.x, upperLeftFront.y, bottomRightRear.z)
    ],
    [ // bottom
      bottomRightRear,
      vec3(upperLeftFront.x, bottomRightRear.y, bottomRightRear.z),
      vec3(upperLeftFront.x, bottomRightRear.y, upperLeftFront.z),
      vec3(bottomRightRear.x, bottomRightRear.y, upperLeftFront.z)

    ],
    [ // rear
      bottomRightRear,
      vec3(bottomRightRear.x, upperLeftFront.y, bottomRightRear.z),
      vec3(upperLeftFront.x, upperLeftFront.y, bottomRightRear.z),
      vec3(upperLeftFront.x, bottomRightRear.y, bottomRightRear.z)
    ]
  );

  let clockWise = []; // outside facing walls

  for (let i = 0; i < counterWise.length; i++) {
    let clockwiseFace = [];
    for (let j = counterWise[i].length - 1; j >= 0; j--) {
      clockwiseFace.push(counterWise[i][j]);
    }
    clockWise.push(clockwiseFace);
  }

  let rectangles = counterWise;
  for (let i = 0; i < clockWise.length; i++) {
    rectangles.push(clockWise[i]);
  }

  for (let i = 0; i < rectangles.length; i++) {
    faces.push(rectanglePoints(
      rectangles[i][0],
      rectangles[i][1],
      rectangles[i][2],
      rectangles[i][3]
    ))
  }




  let points = [];
  for (let i = 0; i < faces.length; i++) {
    for (let j = 0; j < faces[i].length; j++) {
      points.push(faces[i][j]);
    }
  }


  let tColor = [];
  for (let i = 0; i < points.length; i++) {
    tColor.push(color[0], color[1], color[2], color[3],
      color[0], color[1], color[2], color[3],
      color[0], color[1], color[2], color[3],)
  }

  var positionBuffer = loadBuffer(gl, new Float32Array(points), gl.STATIC_DRAW);
  var colorBuffer = loadBuffer(gl, new Float32Array(tColor), gl.STATIC_DRAW);
  var normalBuffer = loadBuffer(gl, new Float32Array(normals), gl.STATIC_DRAW);
  let numPoints = points.length / 3;

  return {
    points: positionBuffer,
    colors: colorBuffer,
    normals: normalBuffer,
    vertexCount: numPoints,
    positioningInfo: opt_positionData,
    type: gl.TRIANGLES,
  }

}

function rectanglePoints(p1, p2, p3, p4) {
  return [
    p1.x, p1.y, p1.z,
    p2.x, p2.y, p2.z,
    p3.x, p3.y, p3.z,

    p1.x, p1.y, p1.z,
    p3.x, p3.y, p3.z,
    p4.x, p4.y, p4.z,
  ]
}

function getBox(gl, upperLeftFront, bottomRightRear, color, opt_positionData = positioningInfo(vec3(0, 0, 0), vec3(0, 0, 0))) {
  let boxPoints = [
    upperLeftFront.x, upperLeftFront.y, upperLeftFront.z,
    bottomRightRear.x, upperLeftFront.y, upperLeftFront.z,

    upperLeftFront.x, upperLeftFront.y, upperLeftFront.z,
    upperLeftFront.x, bottomRightRear.y, upperLeftFront.z,

    upperLeftFront.x, upperLeftFront.y, upperLeftFront.z,
    upperLeftFront.x, upperLeftFront.y, bottomRightRear.z,

    bottomRightRear.x, bottomRightRear.y, upperLeftFront.z,
    upperLeftFront.x, bottomRightRear.y, upperLeftFront.z,

    bottomRightRear.x, bottomRightRear.y, upperLeftFront.z,
    bottomRightRear.x, upperLeftFront.y, upperLeftFront.z,

    bottomRightRear.x, bottomRightRear.y, upperLeftFront.z,
    bottomRightRear.x, bottomRightRear.y, bottomRightRear.z,

    bottomRightRear.x, upperLeftFront.y, bottomRightRear.z,
    upperLeftFront.x, upperLeftFront.y, bottomRightRear.z,

    bottomRightRear.x, upperLeftFront.y, bottomRightRear.z,
    bottomRightRear.x, bottomRightRear.y, bottomRightRear.z,

    bottomRightRear.x, upperLeftFront.y, bottomRightRear.z,
    bottomRightRear.x, upperLeftFront.y, upperLeftFront.z,

    upperLeftFront.x, bottomRightRear.y, bottomRightRear.z,
    bottomRightRear.x, bottomRightRear.y, bottomRightRear.z,

    upperLeftFront.x, bottomRightRear.y, bottomRightRear.z,
    upperLeftFront.x, upperLeftFront.y, bottomRightRear.z,

    upperLeftFront.x, bottomRightRear.y, bottomRightRear.z,
    upperLeftFront.x, bottomRightRear.y, upperLeftFront.z,
  ];

  let tColor = [];
  for (let i = 0; i < boxPoints.length; i++) {
    tColor.push(
      color[0], color[1], color[2], color[3],
      color[0], color[1], color[2], color[3],
      color[0], color[1], color[2], color[3],
    );
  }

  let positionBuffer = loadBuffer(gl, new Float32Array(boxPoints), gl.STATIC_DRAW);
  let colorBuffer = loadBuffer(gl, new Float32Array(tColor), gl.STATIC_DRAW);

  let numPoints = boxPoints.length / 3;

  return {
    points: positionBuffer,
    colors: colorBuffer,
    vertexCount: numPoints,
    positioningInfo: opt_positionData,
    type: gl.LINES,
  }
}

function createProgramInfo(gl, vertexShaderText, fragmentShaderText) {
  var vertexShaderSource = document.querySelector(vertexShaderText).text;
  var fragmentShaderSource = document.querySelector(fragmentShaderText).text;

  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  //link shaders
  var program = createProgram(gl, vertexShader, fragmentShader);
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");
  var normalLocation = gl.getAttribLocation(program, "a_normal");

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);
  // // Turn on the color attribute
  gl.enableVertexAttribArray(colorLocation);
  gl.enableVertexAttribArray(normalLocation);
  return {
    program: program,
    positionLocation: positionLocation,
    colorLocation: colorLocation,
    normalLocation: normalLocation,
  }
}


function prepareShape(shape, programInfo, bufferAttributes, opt_shininess = 1) {
  return {
    shape: shape,
    programInfo: programInfo,
    bufferAttributes: bufferAttributes,
    shininess: opt_shininess,
  }
}

function bouncingBall(shapeInfo, locationInfoDelta) {
  // assuming density of 1
  let volume = (4 / 3) * Math.PI * Math.pow(shapeInfo.shape.radius, 3);

  return {
    shapeInfo: shapeInfo,
    mass: volume,
    locationInfoDelta: locationInfoDelta,
  }
}

function checkOutOfBounds(bouncingBall, delta, bounds) {
  let deltaPos = delta;
  let currPos = bouncingBall.shapeInfo.shape.positioningInfo.location;
  let radius = bouncingBall.shapeInfo.shape.radius;

  if (currPos.x - radius <= bounds.left) {
    bouncingBall.shapeInfo.shape.positioningInfo.location.x = bounds.left + radius;
    bouncingBall.locationInfoDelta.location.x *= -1;
  }
  if (currPos.x + radius >= bounds.right) {
    bouncingBall.shapeInfo.shape.positioningInfo.location.x = bounds.right - radius;
    bouncingBall.locationInfoDelta.location.x *= -1;
  }
  if (currPos.y + radius >= bounds.top) {
    bouncingBall.shapeInfo.shape.positioningInfo.location.y = bounds.top - radius;
    bouncingBall.locationInfoDelta.location.y *= -1;
  }
  if (currPos.y - radius <= bounds.bottom) {
    bouncingBall.shapeInfo.shape.positioningInfo.location.y = bounds.bottom + radius;
    bouncingBall.locationInfoDelta.location.y *= -1;
  }
  if (currPos.z - radius <= bounds.back) {
    bouncingBall.shapeInfo.shape.positioningInfo.location.z = bounds.back + radius;
    bouncingBall.locationInfoDelta.location.z *= -1;
  }
  if (currPos.z + radius >= bounds.front) {
    bouncingBall.shapeInfo.shape.positioningInfo.location.z = bounds.front - radius;
    bouncingBall.locationInfoDelta.location.z *= -1;
  }
}

var fixedShapes = [];
var bouncingBalls = [];
var then;
let dist = 260;
let rot = 1.5;
let cx = -30;
let focus = 0;
let lightX = -105;
let lightY = 130;
let lightZ = -360;
let lightInc = 5;
const g = -500;
var ticks = 0;
let numBalls = 3;
var shininess = 150;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl");



  if (!gl) {
    return;
  }

  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var programInfo = createProgramInfo(gl, "#vertex-shader-3d", "#fragment-shader-3d");

  // lookup uniforms
  var worldViewProjectionLocation = gl.getUniformLocation(programInfo.program, "u_worldViewProjection");
  var worldInverseTransposeLocation = gl.getUniformLocation(programInfo.program, "u_worldInverseTranspose");
  var lightWorldPositionLocation =
    gl.getUniformLocation(programInfo.program, "u_lightWorldPosition");
  var worldLocation =
    gl.getUniformLocation(programInfo.program, "u_world");
  var viewWorldPositionLocation = gl.getUniformLocation(programInfo.program, "u_viewWorldPosition");
  var shininessLocation = gl.getUniformLocation(programInfo.program, "u_shininess");

  gl.useProgram(programInfo.program);

  gl.uniform1f(shininessLocation, shininess);


  var fieldOfViewRadians = degToRad(60);
  var zClipFront = 400;
  let cubeSize = zClipFront * Math.tan(fieldOfViewRadians / 2);
  var bounds = {
    left: -cubeSize,
    right: cubeSize,
    top: cubeSize,
    bottom: -cubeSize,
    front: -zClipFront,
    back: -zClipFront - 2 * cubeSize,
  };



  var colors = [];
  for (let i = 0; i < numBalls; i++) {
    let c2 = Math.random() * Math.PI;
    let color = [];
    color.push(Math.sin(c2) * Math.sin(c2), Math.sin(c2 + .5) * Math.sin(c2 * .5), Math.sin(c2 + 1) * Math.sin(c2 + 1), 1);
    colors.push(color);
  }

  let vRange = 5;
  var deltas = [];
  for (let i = 0; i < numBalls; i++) {
    deltas.push(vec3(randNum(-vRange, vRange), 0, randNum(-vRange, vRange)));
  }

  var sizes = [];
  for (let i = 0; i < numBalls; i++) {
    sizes.push(randNum(10, 40));
  }

  let position = [];
  for (let i = 0; i < numBalls; i++) {
    let intersection = true;
    while (intersection) {
      let possiblePos = vec3(randNum(bounds.left + sizes[i], bounds.right - sizes[i]), randNum(bounds.bottom + sizes[i], bounds.top - sizes[i]), randNum(bounds.back + sizes[i], bounds.front - sizes[i]));
      let foundCollision = false;

      for (let j = i - 1; j >= 0 && !foundCollision; j--) {
        if (distance(possiblePos, position[j]) <= (sizes[i] + sizes[j] - 1)) {
          foundCollision = true;
        }
      }
      if (!foundCollision) {
        position[i] = vec3(possiblePos.x, possiblePos.y, possiblePos.z);
        intersection = false;
      }
    }
  }



  for (let i = 0; i < numBalls; i++) {
    bouncingBalls.push(
      bouncingBall(
        prepareShape(
          getSphere(gl, sizes[i], 40, 20,
            [
              colors[i][0], colors[i][1], colors[i][2], colors[i][3],
              colors[i][0], colors[i][1], colors[i][2], colors[i][3],
              colors[i][0], colors[i][1], colors[i][2], colors[i][3],
            ],
            positioningInfo(vec3(-50 + 100 * i, -100 + 100 * i, -zClipFront - 100), vec3(0, 0, 0))),
          programInfo,
          [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT)]
        ),
        positioningInfo(deltas[i]),
      ))
  }

  fixedShapes.push(
    prepareShape(
      openFacedBox(gl, vec3(-cubeSize, cubeSize, 0), vec3(cubeSize, -cubeSize, -2 * cubeSize)
        , [
          1, .8, .75, 1,
        ]
        , positioningInfo(vec3(0, 0, -zClipFront))),
      programInfo,
      [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT)],
    )
  )

  fixedShapes.push(
    prepareShape(
      glassWall(gl, vec3(-cubeSize, cubeSize, 0), vec3(cubeSize, -cubeSize, 0), [1, .8, .75], .5,
        positioningInfo(vec3(0, 0, -zClipFront))),
      programInfo,
      [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT)],
    )
  );

  var shininessInc = 10;

  var testCube = prepareShape(new LightFrame(gl, 200, [0, 0, -zClipFront]), programInfo, [bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT)])


  document.addEventListener("keydown", function (event) {
    switch (event.key) {
      case "ArrowDown":
        {
          lightY -= lightInc;
          break;
        }
      case "ArrowUp":
        {
          lightY += lightInc;
          break;
        }
      case "ArrowRight":
        {
          lightZ += lightInc;
          break;
        }
      case "ArrowLeft":
        {
          lightZ -= lightInc;
          break;
        }
      case "a": {
        lightX += lightInc;
        break;
      }
      case 's': {
        lightX -= lightInc;
        break;
      }
      case " ": {
        dist += 10;
        break;
      }
      case "1": {
        shininess += shininessInc;
        console.log("shininess: " + shininess);
        gl.uniform1f(shininessLocation, shininess);
        break;
      }
      case "2": {
        shininess -= shininessInc;
        console.log("shininess: " + shininess);
        gl.uniform1f(shininessLocation, shininess);
      }


    }
    let light = [lightX, lightY, lightZ];
    console.log("x, y, z: " + light[0] + ", " + light[1] + ", " + light[2])
    console.log("dist: " + dist);

  })



  var animID;
  var running = false;

  then = 0;

  window.addEventListener("focus", function () {
    console.log("focus")
    if (!running) {
      then = 0;
      animID = requestAnimationFrame(drawScene);
      running = true;
    }



  })
  window.addEventListener("blur", function () {
    console.log("blur")
    if (running) {
      window.clearInterval(animID);
      running = false;
    }
  })

  running = true;
  animID = requestAnimationFrame(drawScene);


  // Draw the scene.
  function drawScene(now) {
    ticks++;

    now *= .001;
    var deltaTime = now - then;
    then = now;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    let lightPos = vec3(lightX, lightY, lightZ);
    gl.uniform3fv(lightWorldPositionLocation, [lightPos.x, lightPos.y, lightPos.z]);
    // gl.uniform3fv(lightWorldPositionLocation, [lightX, lightY, lightZ]);


    var cameraFocus = [-50, 0, -zClipFront - cubeSize];

    var cameraMatrix = m4.yRotation(rot);
    cameraMatrix = m4.multiply(cameraMatrix, m4.translation(-30, 0, dist));


    var cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ];

    var up = [0, 1, 0];

    cameraMatrix = m4.lookAt(cameraPosition, cameraFocus, up);

    gl.uniform3fv(viewWorldPositionLocation, cameraFocus);

    var viewMatrix = m4.inverse(cameraMatrix);

    // Compute the matrices
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var energyOfSystem = 0;

    // for (let i = 0; i < bouncingBalls.length; i++) {
    //   let vi = bouncingBalls[i].locationInfoDelta.location.y;
    //   bouncingBalls[i].locationInfoDelta.location.y += g * deltaTime;
    //   let velocity = bouncingBalls[i].locationInfoDelta;



    //   let scaledDeltaPos = positioningInfo(scaleVector(velocity.location, deltaTime), scaleVector(velocity.rotation, deltaTime));
    //   updatePosition(scaledDeltaPos, bouncingBalls[i].shapeInfo.shape.positioningInfo);

    //   for (let j = i + 1; j < bouncingBalls.length; j++) {
    //     checkCollision(bouncingBalls[i], bouncingBalls[j]);


    //   }

    //   checkOutOfBounds(bouncingBalls[i], scaledDeltaPos.location, bounds);

    //   energyOfSystem += getEnergy(bouncingBalls[i]);

    //   var objMatrix = computeMatrix(bouncingBalls[i].shapeInfo.shape.positioningInfo);
    //   var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, objMatrix);
    //   var worldInverseMatrix = m4.inverse(objMatrix);
    //   var worldInverseMatrixTranspose = m4.transpose(worldInverseMatrix);


    //   gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);

    //   gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseMatrixTranspose);
    //   gl.uniformMatrix4fv(worldLocation, false, objMatrix);
    //   setBufferAttributes(gl, bouncingBalls[i].shapeInfo);

    //   gl.drawArrays(bouncingBalls[i].shapeInfo.shape.type, 0, bouncingBalls[i].shapeInfo.shape.vertexCount);
    // }

    // console.log("energy: " + (energyOfSystem * .001));

    let objMatrix = m4.identity();

    var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, objMatrix);
    var worldInverseMatrix = m4.inverse(objMatrix);
    var worldInverseMatrixTranspose = m4.transpose(worldInverseMatrix);

    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);

    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseMatrixTranspose);
    gl.uniformMatrix4fv(worldLocation, false, objMatrix);

    setBufferAttributes(gl, testCube);

    gl.drawArrays(testCube.shape.getType(), 0, testCube.shape.getNumVertices());




    requestAnimationFrame(drawScene);

  }

  function distance(c1, c2) {
    return Math.sqrt((c1.x - c2.x) * (c1.x - c2.x) + (c1.y - c2.y) * (c1.y - c2.y) + (c1.z - c2.z) * (c1.z - c2.z));
  }

  function getEnergy(shapeStructure) {
    let shape = shapeStructure.shapeInfo.shape;
    let velocities = shapeStructure.locationInfoDelta.location;

    let potential = shapeStructure.mass * -g * (shape.positioningInfo.location.y - bounds.bottom);
    let velocity = Math.sqrt(velocities.x * velocities.x + velocities.y * velocities.y + velocities.z * velocities.z);

    return potential + .5 * shapeStructure.mass * velocity * velocity;
  }

  function checkCollision(ball1, ball2) {

    let s1 = ball1.shapeInfo.shape;
    let s2 = ball2.shapeInfo.shape;
    let r1 = s1.radius;
    let r2 = s2.radius;
    let c1 = s1.positioningInfo.location;
    let c2 = s2.positioningInfo.location;
    let dist = distance(c1, c2);


    if (dist <= (r1 + r2)) {

      let scale = (r1 + r2 - dist) / 2;

      let centerDist = subtractVectors([c1.x, c1.y, c1.z], [c2.x, c2.y, c2.z]);
      centerDist = normalize(centerDist);

      let toMove = scaleVector(vec3(centerDist[0], centerDist[1], centerDist[2]), scale);
      ball1.shapeInfo.shape.positioningInfo.location = addVectors(c1, toMove);

      centerDist = subtractVectors([c2.x, c2.y, c2.z], [c1.x, c1.y, c1.z]);
      centerDist = normalize(centerDist);

      toMove = scaleVector(vec3(centerDist[0], centerDist[1], centerDist[2]), scale);

      ball2.shapeInfo.shape.positioningInfo.location = addVectors(c2, toMove);

      let v1 = ball1.locationInfoDelta.location;
      let v2 = ball2.locationInfoDelta.location;


      // calculate v' for ball1
      let newV1 = computeNewVelocity(ball1, ball2);
      let newV2 = computeNewVelocity(ball2, ball1);

      // console.log("newV1: ", newV1.x, newV1.y, newV1.z);
      ball1.locationInfoDelta.location = newV1;
      ball2.locationInfoDelta.location = newV2;

      v1 = ball1.locationInfoDelta.location;
      v2 = ball2.locationInfoDelta.location;
      // console.log("final v1: ", v1.x, v1.y, v1.z);
      // console.log("final v2: " + v2.x, v2.y, v2.z);
      // the balls are overlapping - fix that


      return true;
    }

    return false;
  }

  function computeNewVelocity(ball1, ball2) {
    let s1 = ball1.shapeInfo.shape;
    let s2 = ball2.shapeInfo.shape;
    let c1 = s1.positioningInfo.location;
    let c2 = s2.positioningInfo.location;

    let diffCenters = subtractVectors([c1.x, c1.y, c1.z], [c2.x, c2.y, c2.z]);


    let normalized = normalize([diffCenters[0], diffCenters[1], diffCenters[2]]);

    normalized = vec3(normalized[0], normalized[1], normalized[2]);

    let v1 = ball1.locationInfoDelta.location;

    let v2 = ball2.locationInfoDelta.location;

    let diffV = subtractVectors([v1.x, v1.y, v1.z], [v2.x, v2.y, v2.z]);


    let dot = dotProduct(vec3(diffV[0], diffV[1], diffV[2]), normalized);




    let scalar = dot * (2 * ball2.mass) / (ball1.mass + ball2.mass);
    let scaled = scaleVector(normalized, scalar);

    let subtracted = subtractVectors([v1.x, v1.y, v1.z], [scaled.x, scaled.y, scaled.z]);
    return vec3(subtracted[0], subtracted[1], subtracted[2]);
  }


}

main();


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
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeData.shape.getVertexBuffer());
  gl.vertexAttribPointer(shapeData.programInfo.positionLocation, attributes[0].size, attributes[0].type, attributes[0].normalize, attributes[0].stride, attributes[0].offset);
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeData.shape.getColorBuffer());
  gl.vertexAttribPointer(shapeData.programInfo.colorLocation, attributes[1].size, attributes[1].type, attributes[1].normalize, attributes[1].stride, attributes[1].offset);
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeData.shape.getNormalBuffer());
  gl.vertexAttribPointer(shapeData.programInfo.normalLocation, attributes[2].size, attributes[2].type, attributes[2].normalize, attributes[2].stride, attributes[2].offset);
}

function toCartesian(theta, phi, r) {
  return [
    r * Math.cos(phi) * Math.cos(theta),
    r * Math.cos(phi) * Math.sin(theta),
    r * Math.sin(phi),
  ];
}

function updatePosition(deltaLoc, currLoc) {

  currLoc.location = addVectors(currLoc.location, deltaLoc.location);
}







function computeMatrix(positioningInfo) {

  var matrix = m4.yRotation(positioningInfo.rotation.y);
  matrix = m4.multiply(m4.xRotation(positioningInfo.rotation.x), matrix);
  matrix = m4.multiply(m4.translation(positioningInfo.location.x, positioningInfo.location.y, positioningInfo.location.z), matrix);
  return matrix;

}



function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}



function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]];
}

function randNum(lower, upper) {

  return (Math.random() * (upper - lower + 1) + lower);

}