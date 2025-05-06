class GoLDisplay {
    constructor(gl, gridSize, displayDim, posXYZ, updateSpeed) {
        this.gl = gl;
        this.gridSize = gridSize;
        this.displayDim = displayDim;
        this.posXYZ = posXYZ;
        this.updateSpeed = updateSpeed;

        this.padding = this.displayDim * .01;
        this.displayDimSize = this.displayDim / this.gridSize;
        this.sideLength = (this.displayDim - 2 * this.padding * this.gridSize) / this.gridSize;


        this.gol = new GoL(this.gridSize);
        this.gol.setBlinkerH(4, 4);
        this.gol.setGlider(8, 8);

        this.color = [0, 0, 1, 1];

        this.lastUpdate = 0;

        this.updateDisplayBuffers();
    }

    update(t) {
        if ((t - this.lastUpdate) < this.updateSpeed) {
            return;
        }
        this.lastUpdate = t;
        this.gol.next();
        this.updateDisplayBuffers();
    }

    draw(programInfo, bufferAttributes) {


        let buffers = this.getBuffers();
        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            // console.log(i + ", " + buffers[i]);
            // console.log(bufferAttributes[i].size);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }

    getNumVertices() {
        return this.numVertices;
    }

    getBuffers() {
        return [this.vertexBuffer, this.normalBuffer, this.colorBuffer];
    }

    getType() {
        return this.gl.TRIANGLES;
    }


    updateDisplayBuffers() {
        let grid = this.gol.grid;
        let cubes = [];

        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {

                if (grid[i][j] == 1) {
                    let tl = [
                        this.posXYZ[0] + j * this.displayDimSize + this.padding,
                        this.posXYZ[1],
                        this.posXYZ[2] + i * this.displayDimSize + this.padding
                    ];


                    cubes.push(this.addFaces(tl, this.sideLength));
                }
            }
        }

        var colors = [];
        var points = [];
        var normals = [];

        for (let i = 0; i < cubes.length; i++) {
            let cubeFaces = cubes[i];
            for (let j = 0; j < cubeFaces.length; j++) {
                let t1 = cubeFaces[j][0];
                let t2 = cubeFaces[j][1];

                points.push(t1[0], t1[1], t1[2], t2[0], t2[1], t2[2]);
                let n1 = calculateNormals(t1[0], t1[1], t1[2]);
                let n2 = calculateNormals(t2[0], t2[1], t2[2]);

                normals.push(n1[0], n1[1], n1[2], n2[0], n2[1], n2[2]);

                colors.push(this.color, this.color, this.color, this.color, this.color, this.color,)
            }
        }

        this.vertexBuffer = loadBuffer(this.gl, flatten(points), this.gl.STATIC_DRAW);
        this.normalBuffer = loadBuffer(this.gl, flatten(normals), this.gl.STATIC_DRAW);
        this.colorBuffer = loadBuffer(this.gl, flatten(colors), this.gl.STATIC_DRAW);
        this.numVertices = points.length;
    }

    addFaces(pos, l) {
        let a = pos;
        let b = [pos[0], pos[1], pos[2] + l];
        let c = [pos[0] + l, pos[1], pos[2] + l];
        let d = [pos[0] + l, pos[1], pos[2]];

        let e = [pos[0], pos[1] - l, pos[2]];
        let f = [pos[0], pos[1] - l, pos[2] + l];
        let g = [pos[0] + l, pos[1] - l, pos[2] + l];
        let h = [pos[0] + l, pos[1] - l, pos[2]];

        return [
            this.triangles(a, b, c, d),
            this.triangles(d, c, g, h),
            this.triangles(h, g, f, e),
            this.triangles(e, f, b, a),
            this.triangles(e, a, d, h),
            this.triangles(b, f, g, c)
        ]
    }

    triangles(a, b, c, d) {
        return [[a, b, c], [a, c, d]];
    }
}

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

    setTestSquare(i, j) {
        this._setValues([[i, j]]);
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