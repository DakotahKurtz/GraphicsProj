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

        var c0 = [114 / 255, 143 / 255, 113 / 255, 1];
        var c1 = [150 / 255, 99 / 255, 99 / 255, 1];
        var c2 = [150 / 255, 130 / 255, 99 / 255, 1];
        var c3 = [150 / 255, 166 / 255, 128 / 255, 1]



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
                

                this.normalsArray.push(
                    n1, n2, n3
                )


            }
        }

        // console.log("Print Noise")
        // printArr(noise);
        // console.log("Printed noise")




        for (let i = 0; i < gridPoints.length - 1; i++) {
            for (let j = 0; j < gridPoints[i].length - 1; j++) {
                this.colorsArray.push(
                    colorFromNoise(noise[i][j]), colorFromNoise(noise[i + 1][j]), colorFromNoise(noise[i + 1][j + 1]),
                    colorFromNoise(noise[i][j]), colorFromNoise(noise[i + 1][j + 1]), colorFromNoise(noise[i][j + 1])
                );
            }
        }

        let up = [0, 1, 0];
        let thresh = 0;



        // for (let i = 0; i < this.pointsArray.length; i += 3) {




        //     // let iPrime = Math.floor(i / this.nRows);
        //     // let j = i % this.nColumns;
        //     if (dot(n1, up) < thresh) {
        //         console.log(dot(n1, up))
        //         this.colorsArray.push(c3);
        //     } else {
        //         this.colorsArray.push(colorFromNoise(noise[Math.floor(i / this.nRows)][i % this.nColumns]))
        //     }
        //     if (dot(n2, up) < thresh) {
        //         this.colorsArray.push(c3);
        //     }
        //     else {
        //         this.colorsArray.push(colorFromNoise(noise[Math.floor((i + 1) / this.nRows)][(i + 1) % this.nColumns]))
        //     }
        //     if (dot(n3, up) < thresh) {
        //         this.colorsArray.push(c3);
        //     } else {
        //         this.colorsArray.push(colorFromNoise(noise[Math.floor((i + 2) / this.nRows)][(i + 2) % this.nColumns]))
        //     }

        // }



        this.vectorBuffer = loadBuffer(this.gl, flatten(this.pointsArray), gl.STATIC_DRAW);
        this.numVertices = this.pointsArray.length;
        this.texBuffer = loadBuffer(this.gl, flatten(this.texCoords), gl.STATIC_DRAW);
        // this.colorBuffer = loadBuffer(this.gl, flatten(this.colorsArray), gl.STATIC_DRAW);
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
