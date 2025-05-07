class Terrain {
    constructor(gl, terrainMesh, textureID) {
        this.gl = gl;
        this.nRows = terrainMesh.length;
        this.nColumns = terrainMesh[0].length;
        this.textureID = textureID;

        this.pointsArray = [];
        this.texCoords = [];
        this.normalsArray = [];




        this.terrainArray = terrainMesh;
        console.log("Terrain Array: " + this.terrainArray.length);

        let gridPoints = terrainMesh;

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
            }
        }

        for (let i = 0; i < this.pointsArray.length; i += 3) {

            let normals = calculateNormals(this.pointsArray[i], this.pointsArray[i + 1], this.pointsArray[i + 2]);
            let n1 = normalize(normals[0]);
            let n2 = normalize(normals[1]);
            let n3 = normalize(normals[2]);

            this.normalsArray.push(
                n1, n2, n3
            )

        }

        this.vectorBuffer = loadBuffer(this.gl, flatten(this.pointsArray), gl.STATIC_DRAW);
        this.numVertices = this.pointsArray.length;
        this.texBuffer = loadBuffer(this.gl, flatten(this.texCoords), gl.STATIC_DRAW);
        // this.colorBuffer = loadBuffer(this.gl, flatten(this.colorsArray), gl.STATIC_DRAW);
        this.normalBuffer = loadBuffer(this.gl, flatten(this.normalsArray), gl.STATIC_DRAW);
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



    getTerrainData() {
        return this.terrainData;
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
        return [this.getVertexBuffer(), this.getTexBuffer(), this.getNormalBuffer()];
    }


}




function printarr(arr) {
    return "" + (arr[0] + ", " + arr[1] + ", " + arr[2])
}