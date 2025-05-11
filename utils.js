// var seed = Math.floor(Math.random() * (50000 - 1 + 1)) + 1;
// console.log("Seed: " + seed);
var seed = 12360;
const SeededRandom = mulberry32(seed);

function DrawableObject(shape, programInfo, bufferAttributes, materials) {

    const drawHelper = function () {
        shape.draw(programInfo, bufferAttributes);
    }

    return {
        drawable: shape,
        programInfo: programInfo,
        bufferAttributes: bufferAttributes,
        draw: drawHelper,
        hasMaterials: materials != null,
        materials: materials,
    }
}

function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function midpoint(a, b) {
    let n = [];
    for (let i = 0; i < a.length; i++) {
        n.push((a[i] + b[i]) / 2);
    }
    return n;
    // return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
}

const printArr = function (arr) {
    let s = "";
    for (let i = 0; i < arr.length; i++) {

        for (let j = 0; j < arr[0].length; j++) {
            s += arr[i][j];
        }
        s += "\n";
    }
    console.log(s);
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

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpVec(a, b, t) {
    return [
        lerp(a[0], b[0], t),
        lerp(a[1], b[1], t),
        lerp(a[2], b[2], t)
    ];
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

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}
function getRandomFloat(min, max) {
    return SeededRandom() * (max - min) + min;
}

function getAutomataArray(startArray, numIterations, applyRules) {
    let currentState = [];

    for (let i = 0; i < startArray.length; i++) {
        let r = [];
        for (let j = 0; j < startArray[i].length; j++) {
            if (startArray[i][j] == -1) {
                r.push(-1);
            } else {
                r.push(startArray[i][j])

            }
        }
        currentState.push(r);
    }



    for (let i = 0; i < startArray.length; i++) {
        for (let j = 0; j < startArray[0].length; j++) {
            if (currentState[i][j] == -1) {
                continue
            }
            var inBounds = (i, j) => {
                return i >= 0 && i < startArray.length && j >= 0 && j < startArray[0].length;
            }
            if (startArray[i][j] == -2) {
                currentState[i][j] = -1;
                if (inBounds(i + 1, j)) {
                    currentState[i + 1][j] = -1;
                }
                if (inBounds(i - 1, j)) {
                    currentState[i - 1][j] = -1;
                }
                if (inBounds(i, j + 1)) {
                    currentState[i][j + 1] = -1;
                }
                if (inBounds(i, j - 1)) {
                    currentState[i][j - 1] = -1;
                }
                if (inBounds(i + 1, j + 1)) {
                    currentState[i + 1][j + 1] = -1;
                }
                if (inBounds(i - 1, j - 1)) {
                    currentState[i - 1][j - 1] = -1;
                }
                if (inBounds(i + 1, j - 1)) {
                    currentState[i + 1][j - 1] = -1;
                }
                if (inBounds(i - 1, j + 1)) {
                    currentState[i - 1][j + 1] = -1;
                }


            }

            else {
                currentState[i][j] = getRandomInt(0, 1);
            }

        }
    }

    console.log("Added random values")
    // printArr(currentState);






    var iteration = function (previousState) {
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

    let result = [];
    for (let i = 0; i < currentState.length; i++) {
        let r = [];
        for (let j = 0; j < currentState[0].length; j++) {
            if (currentState[i][j] == -1) {
                r.push(1);
            } else {
                r.push(currentState[i][j]);
            }
        }
        result.push(r);
    }


    return currentState;
}



var caveGenRule = (array, i, j) => {

    if (array[i][j] == -1) {
        return -1;
    }

    let previousState = array;

    var inBounds = (i, j) => {
        return i >= 0 && i < previousState.length && j >= 0 && j < previousState[0].length;
    }

    var isNeighborWall = (i, j) => {
        if (inBounds(i, j)) {
            if (previousState[i][j] == -1) {
                return -1;
            } else if (previousState[i][j] == 0 || previousState[i][j] == 3) {
                return 0;
            } else {
                return previousState[i][j] == 1// ? 1 : previousState[i][j] - 1;
            }
        }
        // return inBounds(i, j) && previousState[i][j] == 1;
    }

    var count = (i, j) => {
        let c = 0;
        c += isNeighborWall(i + 1, j);
        c += isNeighborWall(i - 1, j);
        c += isNeighborWall(i, j + 1);
        c += isNeighborWall(i, j - 1);
        c += isNeighborWall(i + 1, j + 1);
        c += isNeighborWall(i - 1, j - 1);
        c += isNeighborWall(i + 1, j - 1);
        c += isNeighborWall(i - 1, j + 1);
        return c;
    }




    let c = count(i, j);
    // if (c >= 8) {
    //     return 3;
    // }
    // else if (c == 7) {
    //     return 2;
    // }
    // else 
    if (c >= 5 || (c >= 4 && previousState[i][j] >= 1)) {
        return 1;
    } else {
        return 0;
    }
}


function getRandomInt(min, max) {
    return Math.floor(SeededRandom() * (max - min + 1)) + min;
}



function terrainNoiseAlgorithm(wArray, iterations) {

    let r = getAutomataArray(wArray, iterations, caveGenRule);

    return r;
}

function generateWorldArray(terrainGridDim, MAP_SIZE, waterLevel, noiseIterations) {

    var genTerrainData = (rows, cols) => {
        let data = [];
        let desiredHeight = 3;

        let terrainDataWidth = terrainDataRaw.length;
        let terrainDataHeight = terrainDataRaw[0].length;
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;
        let minY = Number.MAX_VALUE;
        let maxY = Number.MIN_VALUE;

        for (let i = 0; i < rows; i++) {
            let r = [];
            for (let j = 0; j < cols; j++) {
                let actual = terrainDataRaw[Math.floor(i * terrainDataWidth / cols)][Math.floor(j * terrainDataHeight / rows)];
                min = Math.min(min, Math.min(actual[0], actual[2]));
                max = Math.max(max, Math.max(actual[0], actual[2]));
                minY = Math.min(minY, actual[1]);
                maxY = Math.max(maxY, actual[1]);
                r.push(actual);
            }
            data.push(r);
        }

        var scaleY = (v) => {
            let range = maxY - minY;
            let scalingFactor = desiredHeight / range;
            return (v - minY) * scalingFactor;
        }

        let scalingFactor = 1 * MAP_SIZE / (max - min);

        return {
            data: data,
            scalingFactor: scalingFactor,
            scaleY: scaleY,
        }
    }

    var terrainData = genTerrainData(terrainGridDim, terrainGridDim);

    var prepTerrainMesh = (nRows, nColumns) => {
        let gridPoints = [];
        let gridColors = [];

        for (var i = 0; i < nRows; ++i) {
            let rowP = [];
            let rowC = [];
            for (var j = 0; j < nColumns; ++j) {
                rowP.push([
                    terrainData.scalingFactor * terrainData.data[i][j][0],
                    terrainData.scaleY(terrainData.data[i][j][1]),
                    terrainData.scalingFactor * terrainData.data[i][j][2]
                ]);
                rowC.push([i / nRows, j / nColumns, 0.0, 1.0]);
            }
            gridPoints.push(rowP);
        }



        return gridPoints;
    }

    var terrainMesh = prepTerrainMesh(terrainGridDim, terrainGridDim);

    var fillBelow = (rows, cols, ceilingY) => {
        let wArray = [];
        for (let i = 0; i < rows; i++) {
            let r = [];
            for (let j = 0; j < cols; j++) {
                r.push(0);
            }
            wArray.push(r);
        }

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (terrainMesh[i][j][1] <= ceilingY) {
                    wArray[i][j] = -1;
                }
            }

        }
        return wArray;

    }

    var waterArray = fillBelow(terrainMesh.length, terrainMesh[0].length, waterLevel);
    //printArr(waterArray);

    var terrainNoise = terrainNoiseAlgorithm(waterArray, noiseIterations);
    //printArr(terrainNoise);
    return {
        terrainMesh: terrainMesh,
        waterArray: waterArray,
        worldNoise: terrainNoise,
    }
}




