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
    return Math.random() * (max - min) + min;
}

function getAutomataArray(startArray, numIterations, applyRules) {
    let currentState = [];

    for (let i = 0; i < startArray.length; i++) {
        let r = [];
        for (let j = 0; j < startArray[0].length; j++) {
            r.push(-2);
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
            if (startArray[i][j] == 1) {
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





    var iteration = function (previousState) {
        let next = [];
        for (let i = 0; i < previousState.length; i++) {
            let r = [];
            for (let j = 0; j < previousState[0].length; j++) {
                let n = applyRules(previousState, i, j);
                if (n == 3) {

                }
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


    return {
        state: currentState,
        print: function () {
            printArr(currentState);
        },
    }
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
                return previousState[i][j] == 1 ? 1 : previousState[i][j] - 1;
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
    if (c >= 8) {
        return 3;
    }
    else if (c == 7) {
        return 2;
    }
    else if (c >= 5 || (c >= 4 && previousState[i][j] >= 1)) {
        return 1;
    } else {
        return 0;
    }
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



function terrainNoiseAlgorithm(wArray, iterations) {
    console.log("Generating terrain noise");
    var inBounds = (i, j) => {
        return i >= 0 && i < wArray.length && j >= 0 && j < wArray[0].length;
    }

    let r = getAutomataArray(wArray, iterations, caveGenRule);
    let treeOdds = .01;

    for (let i = 0; i < r.state.length; i++) {
        for (let j = 0; j < r.state[0].length; j++) {
            if (r.state[i][j] == 3) {
                if (Math.random() <= treeOdds) {
                    r.state[i][j] = 4;
                }
            }
        }
    }
    // r.print();
    // console.log("-----------------------------------");
    // console.log("r.stateL: " + r.state.length);
    // console.log("r.state[0].length: " + r.state[0].length);
    // let treeSpacing = 10;

    // let checked = [];
    // for (let i = 0; i < r.state.length; i++) {
    //     let row = [];
    //     for (let j = 0; j < r.state[i].length; j++) {
    //         row.push(0);
    //     }
    //     checked.push(row);
    // }

    // // console.log("Checked: " + checked.length);
    // // console.log("Checked[0]: " + checked[0].length);

    // for (let i = 0; i < r.state.length; i++) {
    //     for (let j = 0; j < r.state[0].length; j++) {
    //         // console.log("checked: " + checked[i][j]);
    //         if (checked[i][j] == 1) {
    //             // console.log("Already checked: " + i + ", " + j);
    //             continue;
    //         }
    //         checked[i][j] = 1;
    //         if (r.state[i][j] == 3) {
    //             // console.log("Found a tree at: " + i + ", " + j);
    //             for (let k = i - treeSpacing; k <= i + treeSpacing; k++) {
    //                 for (let l = j - treeSpacing; l <= j + treeSpacing; l++) {
    //                     if (inBounds(k, l)) {
    //                         r.state[k][l] = 2;
    //                         // console.log("Replacing tree at: " + k + ", " + l);
    //                         checked[k][l] = 1;
    //                     }
    //                 }
    //             }
    //             r.state[i][j] = 3;

    //         }
    //     }
    // }
    return r;
}