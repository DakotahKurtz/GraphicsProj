class Grass {
    constructor(gl, terrainDim, size, density, worldArray) {
        this.gl = gl;
        this.terrainDim = terrainDim;
        this.size = size;
        this.noiseArray = worldArray.worldNoise;
        this.terrainMesh = worldArray.terrainMesh;
        this.density = density;

        this.points = [];
        this.colors = [];
        this.normals = [];

        this.color = [1, 0, 0, 1]
        this.height = .13;
        this.bladeWidth = .01;

        this.threshold = .1;

        this.filterSize = 3;

        this.plantingRange = size / terrainDim;

        for (let i = 0; i < this.noiseArray.length; i++) {
            for (let j = 0; j < this.noiseArray[i].length; j++) {
                if (this.noiseArray[i][j] == 1 && getRandomFloat(0, 1) < this.threshold) {
                    this.plantPatch(i, j);
                }
            }
        }


        this.pBuff = loadBuffer(this.gl, flatten(this.points), this.gl.STATIC_DRAW);
        this.nBuff = loadBuffer(this.gl, flatten(this.normals), this.gl.STATIC_DRAW);
        this.cBuff = loadBuffer(this.gl, flatten(this.colors), this.gl.STATIC_DRAW);

        this.numVertices = this.points.length;
    }

    plantPatch(i, j) {
        var validGrassTile = (x, y) => {
            return x >= 0 && y >= 0 && x < this.noiseArray.length && y < this.noiseArray.length && this.noiseArray[x][y] == 0;
        }

        for (let k = Math.floor(i - this.filterSize / 2); k < Math.floor(i + this.filterSize / 2); k++) {
            for (let l = Math.floor(j - this.filterSize / 2); l < Math.floor(j + this.filterSize / 2); l++) {
                if (validGrassTile(k, l)) {
                    for (let m = 0; m < this.density; m++) {
                        this.plantGrass(getRandomFloat(0, this.plantingRange) + this.terrainMesh[k][l][0], this.terrainMesh[k][l][1] - .03, getRandomFloat(0, this.plantingRange) + this.terrainMesh[k][l][2]);
                    }
                }
            }
        }
    }

    update() {
        return;
    }

    getObjectMatrix() {
        return flatten(identity());
    }

    plantGrass(x, y, z) {
        let p1 = [x, y, z];
        let p2 = [x, y, z + this.bladeWidth];
        let p3 = [x, y + this.height, z];
        let p4 = [x + this.bladeWidth, y, z];

        this.points.push(
            p1, p2, p3,
            p1, p4, p3,
        )

        let n = calculateNormals(p1, p2, p3);
        this.normals.push(
            normalize(n[0]),
            normalize(n[1]),
            normalize(n[2])
        )

        n = calculateNormals(p1, p4, p3);
        this.normals.push(
            normalize(n[0]),
            normalize(n[1]),
            normalize(n[2])
        )

        this.colors.push(
            this.color,
            this.color,
            this.color,
            this.color,
            this.color,
            this.color,
        )

    }

    getType() {
        return this.gl.TRIANGLES;
    }

    getNumVertices() {
        return this.numVertices;
    }

    getBuffers() {
        return [this.pBuff, this.nBuff, this.cBuff]
    }

    draw(programInfo, bufferAttributes) {

        let buffers = this.getBuffers();
        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }
}