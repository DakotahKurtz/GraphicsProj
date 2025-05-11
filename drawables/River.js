class River {
    constructor(gl, terrainMesh, waterArray, waterLevel, time) {
        this.gl = gl;
        this.terrainArray = terrainMesh;
        this.waterArray = waterArray;
        this.waterLevel = waterLevel;
        this.updateFrequency = .1;

        this.points = this._initRiver(this.waterLevel);

        let waterColor = [138 / 255, 202 / 255, 237 / 255, .9];
        this.rippleColor = [0.576, 0.808, 0.859, 1];
        this.rippleColor = [0.808, 0.922, 0.949]


        this.colors = [];
        this.normals = [];
        this.lastUpdate = time;

        for (let i = 0; i < this.points.length; i++) {
            this.colors.push(
                waterColor[0], waterColor[1], waterColor[2], waterColor[3],

            )
            // this.normals.push(
            //     0, 1, 0,

            // )
        }

        let texCoords = [];

        for (let i = 0; i < this.points.length; i += 3) {

            let normals = calculateNormals(this.points[i + 1], this.points[i], this.points[i + 2]);
            let n1 = normalize(normals[0]);
            let n2 = normalize(normals[1]);
            let n3 = normalize(normals[2]);

            this.normals.push(
                n1, n2, n3
                // [0, 1, 0],
                // [0, 1, 0],
                // [0, 1, 0],
            )

            let i1 = this.intersection(this.points[i + 1], n1, 20);
            let i2 = this.intersection(this.points[i], n2, 20);
            let i3 = this.intersection(this.points[i + 2], n3, 20);

            let t = this.getTex(i1);
            texCoords.push(this.getTex(i1), this.getTex(i2), this.getTex(i3))

        }


        this.numVertices = this.points.length;

        this.pBuff = loadBuffer(this.gl, flatten(this.points), gl.STATIC_DRAW);
        this.tBuff = loadBuffer(this.gl, flatten(texCoords), this.gl.STATIC_DRAW);
        this.cBuff = loadBuffer(this.gl, flatten(this.colors), gl.STATIC_DRAW);
        this.nBuff = loadBuffer(this.gl, new Float32Array(flatten(this.normals)), gl.STATIC_DRAW);

        this.updateFunction = (point, t) => {
            let scale = .03;
            let frequency = 6;
            let moveSpeed = 6;
            let stretch = 6;
            return [point[0], point[1] + scale * Math.abs(Math.sin(stretch * point[2] * Math.sin(.2 * t)) + (Math.sin(moveSpeed * t + frequency * point[0]))), point[2]]
        }

        this.ripplePoints = this._initRipples(time);

        this.createRippleBuffers();

    }

    getTex(inters) {
        let xProp = (inters[0] + 20) / (2 * 20);
        let zProp = (inters[2] + 20) / (2 * 20);

        let tW = .25;
        let tH = .5;

        return [.75 - xProp * tW, zProp * tH]
    }

    intersection(p, n, y) {
        let alpha = (y - p[1]) / n[1];

        return [p[0] + alpha * n[0], p[1] + alpha * n[1], p[2] + alpha * n[2]];
    }

    getWaterArray() {
        return this.waterArray;
    }

    getTextureMix() {
        return .01;
    }

    createRippleBuffers() {
        let rippleNormals = [];
        let rippleColors = [];
        let texCoords = [];

        for (let i = 0; i < this.ripplePoints.length; i++) {
            rippleColors.push(
                this.rippleColor[0], this.rippleColor[1], this.rippleColor[2], this.rippleColor[3],
            )
        }
        for (let i = 0; i < this.ripplePoints.length; i += 3) {

            let normals = calculateNormals(this.ripplePoints[i + 1], this.ripplePoints[i], this.ripplePoints[i + 2]);
            let n1 = normalize(normals[0]);
            let n2 = normalize(normals[1]);
            let n3 = normalize(normals[2]);

            rippleNormals.push(
                n1, n2, n3
                // [0, 1, 0],
                // [0, 1, 0],
                // [0, 1, 0],
            )
            let i1 = this.intersection(this.points[i + 1], n1, 20);
            let i2 = this.intersection(this.points[i], n2, 20);
            let i3 = this.intersection(this.points[i + 2], n3, 20);

            let t = this.getTex(i1);
            texCoords.push(this.getTex(i1), this.getTex(i2), this.getTex(i3))

        }


        this.rippleNumVertices = this.ripplePoints.length;

        this.ripplePBuff = loadBuffer(this.gl, flatten(this.ripplePoints), this.gl.DYNAMIC_DRAW);
        this.rippleTBuff = loadBuffer(this.gl, flatten(texCoords), this.gl.DYNAMIC_DRAW);
        this.rippleCBuff = loadBuffer(this.gl, flatten(rippleColors), this.gl.DYNAMIC_DRAW);
        this.rippleNBuff = loadBuffer(this.gl, new Float32Array(flatten(rippleNormals)), this.gl.DYNAMIC_DRAW);
    }

    update(time) {

        if (time - this.lastUpdate < this.updateFrequency) { return; }
        this.lastUpdate = time;
        this.ripplePoints = this._initRipples(time);
        this.createRippleBuffers();


    }



    _initRipples(t) {
        let points = [];
        for (let i = 0; i < this.points.length; i++) {
            let point = this.points[i];
            let newPoint = this.updateFunction(point, t);
            points.push(newPoint);
        }
        return points;
    }

    _initRiver(waterLevel) {
        var points = [];
        var addWaterGrid = (i, j) => {

            let gridPointsToAdd = [];
            let up = false, left = false, down = false, right = false; // illegal?

            var directions = {
                "up": 0,
                "left": 0,
                "down": 0,
                "right": 0,
            }

            var waterLocFromIndex = (i, j) => {
                return [this.terrainArray[i][j][0], waterLevel, this.terrainArray[i][j][2]];
            }

            if (i > 0) { // safe to add upward
                // gridPointsToAdd.push([i - 1, j]);
                up = true;
                directions["up"] = waterLocFromIndex(i - 1, j);
            }
            if (j > 0) { // left
                // gridPointsToAdd.push([i, j - 1]);
                left = true;
                directions["left"] = waterLocFromIndex(i, j - 1);
            }
            if (i < this.waterArray.length - 1) { // down
                // gridPointsToAdd.push([i + 1, j]);
                down = true;
                directions["down"] = waterLocFromIndex(i + 1, j);
            }
            if (j < this.waterArray[0].length - 1) { // right
                // gridPointsToAdd.push([i, j + 1]);
                right = true;
                directions["right"] = waterLocFromIndex(i, j + 1);
            }

            var centerPoint = waterLocFromIndex(i, j);

            if (up && left) {
                points.push(centerPoint, directions["up"], directions["left"],)
            }
            if (left && down) {
                points.push(centerPoint, directions["left"], directions["down"]);
            }
            if (down && right) {
                points.push(centerPoint, directions["down"], directions["right"])
            }
            if (right && up) {
                points.push(centerPoint, directions["right"], directions["up"]);
            }

        }

        for (let i = 0; i < this.waterArray.length; i++) {
            for (let j = 0; j < this.waterArray[0].length; j++) {
                if (this._isWater(i, j)) {
                    addWaterGrid(i, j);
                }
            }
        }

        return points;
    }



    getObjectMatrix() {
        return flatten(identity())
    }

    _isWater = (i, j) => {
        return this.waterArray[i][j] == -1;
    }

    getNumVertices() {
        return this.numVertices;
    }


    draw(programInfo, bufferAttributes) {
        let buffers = this.getBuffers();

        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

        let rippleBuffers = this._getRippleBuffers();

        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, rippleBuffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.rippleNumVertices);

    }

    getType() {
        return this.gl.TRIANGLES;
    }

    getTextureID() {
        return 0;
    }

    getVertexBuffer() {
        return this.pBuff;
    }
    getColorBuffer() {
        return this.cBuff;
    }
    getNormalBuffer() {
        return this.nBuff;
    }

    getBuffers() {
        return [this.getVertexBuffer(), this.tBuff, this.getNormalBuffer(), this.getColorBuffer()];
    }

    _getRippleBuffers() {
        return [this.ripplePBuff, this.rippleTBuff, this.rippleNBuff, this.rippleCBuff,];
    }

    _fillBelow(rows, cols, ceilingY) {
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
                if (this.terrainArray[i][j][1] <= ceilingY) {
                    wArray[i][j] = 1;
                }
            }

        }
        return wArray;

    }


    _floodfill(rows, cols, startXZ, floorY, ceilingY) {

        let wArray = [];
        for (let i = 0; i < rows; i++) {
            let r = [];
            for (let j = 0; j < cols; j++) {
                r.push(-1);
            }
            wArray.push(r);
        }

        var inBounds = (pos) => {
            return (pos[0] >= 0 && pos[0] < rows && pos[1] >= 0 && pos[1] < cols);
        }

        var validWater = (pos) => {
            return inBounds(pos) && this.terrainArray[pos[0]][pos[1]][1] <= ceilingY;
        }

        var notChecked = (pos) => {
            return inBounds(pos) && wArray[pos[0]][pos[1]] == -1;
        }



        let queue = [startXZ];

        var checkNeighbor = (pos) => {
            if (notChecked(pos)) {
                queue.push(pos)
            }
        }

        while (queue.length != 0) {
            let current = queue[0];
            let i = current[0];
            let j = current[1];
            if (validWater(current)) {
                wArray[i][j] = 1;
                checkNeighbor([i + 1, j]);
                checkNeighbor([i + 1, j + 1]);
                checkNeighbor([i + 1, j - 1]);
                checkNeighbor([i, j + 1]);
                checkNeighbor([i, j - 1]);
                checkNeighbor([i - 1, j]);
                checkNeighbor([i - 1, j + 1]);
                checkNeighbor([i - 1, j - 1]);
            } else {
                wArray[i][j] = 0;
            }



            queue.shift();

        }

        return wArray;
    }
}