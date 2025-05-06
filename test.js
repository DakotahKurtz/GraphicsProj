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


let gol = new GoL(20);
console.log(gol.toString())
gol.setLWSS(3, 3);
console.log(gol.toString())

let iterations = 45;

for (let i = 0; i < iterations; i++) {
    console.log(gol.toString())

    console.log(gol.count);
    gol.next();
}

