class GoL {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.grid = this._initGrid(gridSize);
        this.count = 0;

    }

    _setValues(arr) {

        for (let i = 0; i < arr.length; i++) {
            this.grid[arr[i][0]][arr[i][1]] = 1;
        }
    }

    setLWSS(i, j) {
        let arr = [
            [i, j],
            [i + 2, j],
            [i - 1, j + 1],
            [i - 1, j + 2],
            [i - 1, j + 3],
            [i - 1, j + 4],
            [i, j + 4],
            [i + 1, j + 4],
            [i + 2, j + 3]
        ]
        this._setValues(arr);
    }

    setPulsar(i, j) {
        this.setBlinkerV(i, j);
        this.setBlinkerV(i, j + 5);
        this.setBlinkerV(i, j + 7);
        this.setBlinkerV(i, j + 12);
        this.setBlinkerV(i + 6, j);
        this.setBlinkerV(i + 6, j + 5);
        this.setBlinkerV(i + 6, j + 7);
        this.setBlinkerV(i + 6, j + 12);

        this.setBlinkerH(i - 2, j + 2);
        this.setBlinkerH(i + 3, j + 2);
        this.setBlinkerH(i + 5, j + 2);
        this.setBlinkerH(i + 10, j + 2);
        this.setBlinkerH(i - 2, j + 8);
        this.setBlinkerH(i + 3, j + 8);
        this.setBlinkerH(i + 5, j + 8);
        this.setBlinkerH(i + 10, j + 8);

    }

    setGlider(i, j) {
        let glider = [
            [i, j],
            [i + 1, j + 1],
            [i + 1, j + 2],
            [i, j + 2],
            [i - 1, j + 2],
        ]
        this._setValues(glider);
    }

    setBlinkerH(i, j) {
        this._setValues([
            [i, j],
            [i, j + 1],
            [i, j + 2]
        ])
    }

    setBlinkerV(i, j) {
        this.grid[i][j] = 1;
        this.grid[i + 1][j] = 1;
        this.grid[i + 2][j] = 1;
    }

    next() {
        let next = this._initGrid(this.gridSize);
        let count = 0;
        for (let i = 0; i < next.length; i++) {
            for (let j = 0; j < next[i].length; j++) {
                let v = this._applyRules(i, j);
                next[i][j] = v;
                count += v;
            }
        }
        this.count = count;
        this.grid = next;
    }

    _checkIndex(i, j) {
        while (i < 0) {
            i += this.gridSize;
        }
        while (j < 0) {
            j += this.gridSize;
        }
        return this.grid[i % this.gridSize][j % this.gridSize];
    }

    _setValue(i, j, v) {
        this.grid[i % this.gridSize][j % this.gridSize] = v;
    }

    _applyRules(i, j) {
        var inBounds = (i, j) => {
            return i >= 0 && j >= 0 && i < this.gridSize && j < this.gridSize;
        }
        var isNeighbor = (i, j) => {
            return inBounds(i, j) && this.grid[i][j] == 1;
        }
        var count = (i, j) => {
            let count = 0;
            count += this._checkIndex(i, j - 1);
            count += this._checkIndex(i, j + 1);
            count += this._checkIndex(i - 1, j - 1);
            count += this._checkIndex(i - 1, j + 1);
            count += this._checkIndex(i - 1, j);
            count += this._checkIndex(i + 1, j - 1);
            count += this._checkIndex(i + 1, j + 1);
            count += this._checkIndex(i + 1, j);

            // if (isNeighbor(i, j - 1))
            //     count++;
            // if (isNeighbor(i, j + 1))
            //     count++;
            // if (isNeighbor(i - 1, j - 1))
            //     count++;
            // if (isNeighbor(i - 1, j)) {
            //     count++;
            // }
            // if (isNeighbor(i - 1, j + 1)) {
            //     count++;
            // }
            // if (isNeighbor(i + 1, j - 1))
            //     count++;
            // if (isNeighbor(i + 1, j))
            //     count++;
            // if (isNeighbor(i + 1, j + 1))
            //     count++;

            return count;
        }

        let currCount = count(i, j);

        // if (currCount == 3 || currCount == 2) {
        //     return 1;
        // } else {
        //     return 0;
        // }


        if (this.grid[i][j] == 1) {
            if (currCount == 3 || currCount == 2) {
                return 1;
            } else {
                return 0;
            }
        } else {
            if (currCount == 3) {
                return 1;
            } else {
                return 0;
            }
        }
    }


    _initGrid(gridSize) {
        let grid = [];
        for (let i = 0; i < gridSize; i++) {
            let row = [];
            for (let j = 0; j < gridSize; j++) {
                row.push(0);
            }
            grid.push(row);
        }
        return grid;
    }

    toString() {
        let arr = this.grid;
        let s = "";
        for (let i = 0; i < arr.length; i++) {
            let r = "";
            for (let j = 0; j < arr[0].length; j++) {
                r += arr[i][j];
            }
            s += r + "\n";
        }
        return s;
    }
}


// let gol = new GoL(20);
// console.log(gol.toString())
// gol.setLWSS(3, 3);
// console.log(gol.toString())

// let iterations = 45;

// for (let i = 0; i < iterations; i++) {
//     console.log(gol.toString())

//     console.log(gol.count);
//     gol.next();
// }

function getAutomataArray(size, numIterations, applyRules) {
    let currentState = [];

    for (let i = 0; i < size; i++) {
        let r = [];
        for (let j = 0; j < size; j++) {
            r.push(getRandomInt(0, 1));
        }
        currentState.push(r);
    }

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

    return currentState;
}

var caveGenRule = (array, i, j) => {



    let previousState = array;

    var inBounds = (i, j) => {
        return i >= 0 && i < previousState.length && j >= 0 && j < previousState[0].length;
    }

    var isNeighborWall = (i, j) => {
        if (inBounds(i, j)) {
            if (previousState[i][j] == 0) {
                return 0;
            } else {
                return 1;
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

    if (c >= 5 || (c >= 4 && previousState[i][j] >= 1)) {
        return 1;
    } else {
        return 0;
    }
}

function addArr(a, b) {
    let o = [];

    for (let i = 0; i < a.length; i++) {
        let r = [];
        for (let j = 0; j < a[0].length; j++) {

            let v = Math.floor(a[i][j] + b[i][j]) % 4;
            r.push(v)
        }
        o.push(r);
    }
    return o
}

let size = 100;
let o = [];
for (let i = 0; i < size; i++) {
    let r = [];
    for (let j = 0; j < size; j++) {
        r.push()
    }
}

let f = getAutomataArray(size, 5, caveGenRule);
printArr(f);

for (let i = 6; i < 9; i++) {
    let r = getAutomataArray(size, i, caveGenRule);
    f = addArr(f, r);
    printArr(f);
}

