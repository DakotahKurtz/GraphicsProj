class Terrain {
    constructor(gl, terrainMesh, noise, textureID) {
        this.gl = gl;
        this.nRows = terrainMesh.length;
        this.nColumns = terrainMesh[0].length;
        this.textureID = textureID;

        this.pointsArray = [];
        this.texCoords = [];
        this.normalsArray = [];
        this.colorsArray = [];
        this.noise = noise;

        // var c0 = [114 / 255, 143 / 255, 113 / 255, 1];
        var c0 = [77 / 255, 122 / 255, 96 / 255, 1]
        //var c1 = [150 / 255, 99 / 255, 99 / 255, 1];
        var c1 = [85 / 255, 122 / 255, 77 / 255, 1]

        //var c2 = [150 / 255, 130 / 255, 99 / 255, 1];
        var c2 = [115 / 255, 114 / 255, 114 / 255, 1]
        var c3 = [150 / 255, 166 / 255, 128 / 255, 1]

        var slopeColor = c2;

        this.terrainArray = terrainMesh;
        console.log("Terrain Array: " + this.terrainArray.length);

        let gridPoints = terrainMesh;

        var colorFromNoise = (v) => {
            switch (v) {
                case 1:
                    return c1;
                    break;
                case 2:
                    return c2;
                    break;
                case 3:
                    return c3;
                    break;
                default:
                    return c0;
            }
        }
        let up = [0, 1, 0];
        var thresh = .7;

        let p1 = [0, 1, 0];
        let p2 = [0, 0, 1];
        let p3 = [1, 0, 0];

        let n = calculateNormals(p2, p1, p3);
        n[0] = normalize(n[0])
        console.log("Test normals: " + n[0]);
        console.log("Test dot: " + dot(n[0], [0, 1, 0]))

        var checkSlope = (n, i, j) => {
            if (Math.abs(dot(n, [0, 1, 0])) < thresh) {
                this.noise[i][j] = "s";
                return slopeColor
            } else {
                return colorFromNoise(this.noise[i][j]);
            }
        }

        let rowScale = gridPoints.length - 1;
        let colScale = gridPoints[0].length - 1;
        for (let i = 0; i < gridPoints.length - 1; i++) {
            for (let j = 0; j < gridPoints[i].length - 1; j++) {
                this.pointsArray.push(
                    gridPoints[i][j], gridPoints[i + 1][j], gridPoints[i + 1][j + 1],
                    gridPoints[i][j], gridPoints[i + 1][j + 1], gridPoints[i][j + 1],
                )
                this.texCoords.push(
                    j / colScale, i / rowScale,
                    j / colScale, (i + 1) / rowScale,
                    (j + 1) / colScale, (i + 1) / rowScale,
                    j / colScale, i / rowScale,
                    j / colScale, (i + 1) / rowScale,
                    (j + 1) / colScale, (i + 1) / rowScale,
                )

                let normals1 = calculateNormals(gridPoints[i][j], gridPoints[i + 1][j], gridPoints[i + 1][j + 1]);
                let normals2 = calculateNormals(gridPoints[i][j], gridPoints[i + 1][j + 1], gridPoints[i][j + 1]);
                let n1 = normalize(normals1[0]);
                let n2 = normalize(normals1[1]);
                let n3 = normalize(normals1[2]);
                let n4 = normalize(normals2[0]);
                let n5 = normalize(normals2[1]);
                let n6 = normalize(normals2[2]);


                this.normalsArray.push(
                    n1, n2, n3, n4, n5, n6
                )

                this.colorsArray.push(
                    checkSlope(n1, i, j),
                    checkSlope(n2, i + 1, j),
                    checkSlope(n3, i + 1, j + 1),
                    checkSlope(n4, i, j),
                    checkSlope(n5, i + 1, j + 1),
                    checkSlope(n6, i, j + 1)
                )


            }
        }


        this.vectorBuffer = loadBuffer(this.gl, flatten(this.pointsArray), gl.STATIC_DRAW);
        this.numVertices = this.pointsArray.length;
        this.texBuffer = loadBuffer(this.gl, flatten(this.texCoords), gl.STATIC_DRAW);
        this.normalBuffer = loadBuffer(this.gl, flatten(this.normalsArray), gl.STATIC_DRAW);
        this.colorsBuffer = loadBuffer(this.gl, flatten(this.colorsArray), gl.STATIC_DRAW);
    }

    draw(programInfo, bufferAttributes) {

        let buffers = this.getBuffers();
        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }

    getTerrainArray() {
        return this.terrainArray;
    }

    getTextureID() {
        return this.textureID;
    }

    getColorBuffer() {
        return this.colorsBuffer;
    }

    update() {
        return;
    }


    getVertexBuffer() {
        return this.vectorBuffer;
    }

    getTexBuffer() {
        return this.texBuffer;
    }

    getNormalBuffer() {
        return this.normalBuffer;
    }

    getNumRows() {
        return this.nRows;
    }

    getNumColumns() {
        return this.nColumns;
    }

    getNumVertices() {
        return this.numVertices;
    }

    getType() {
        return this.gl.TRIANGLES;
    }

    getBuffers() {
        return [this.getVertexBuffer(), this.getTexBuffer(), this.getNormalBuffer(), this.getColorBuffer()];
    }


}
