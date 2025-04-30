class Terrain {
    constructor(gl, nRows, nColumns, size) {
        this.gl = gl;
        this.nRows = nRows;
        this.nColumns = nColumns;
        this.size = size;

        this.terrainData = this.genTerrainData(this.nRows, this.nColumns);
        this.pointsArray = [];
        this.colorsArray = [];
        this.normalsArray = [];

        let gridValues = this.prepMesh(this.nRows, this.nColumns);

        let gridColors = gridValues.gridColors;
        let gridPoints = gridValues.gridPoints;

        for (let i = 0; i < gridPoints.length - 1; i++) {
            for (let j = 0; j < gridPoints[i].length - 1; j++) {
                this.pointsArray.push(
                    gridPoints[i][j], gridPoints[i + 1][j], gridPoints[i + 1][j + 1],
                    gridPoints[i][j], gridPoints[i + 1][j + 1], gridPoints[i][j + 1],
                )
                // this.colorsArray.push(
                //     gridColors[i][j], gridColors[i + 1][j], gridColors[i + 1][j + 1],
                //     gridColors[i][j], gridColors[i + 1][j + 1], gridColors[i][j + 1],
                // )
                this.colorsArray.push(
                    .69, .68, .45, 1,
                    .8, .68, .45, 1,
                    .69, .68, .45, 1,
                    .69, .68, .1, 1,
                    .4, .68, .45, 1,
                    .69, .68, .45, 1,

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
        this.colorBuffer = loadBuffer(this.gl, flatten(this.colorsArray), gl.STATIC_DRAW);
        this.normalBuffer = loadBuffer(this.gl, flatten(this.normalsArray), gl.STATIC_DRAW);

        this.numVertices = this.pointsArray.length;
    }

    draw(programInfo, bufferAttributes) {

        let buffers = this.getBuffers();
        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }

    prepMesh(nRows, nColumns) {
        let gridPoints = [];
        let gridColors = [];

        for (var i = 0; i < nRows; ++i) {
            let rowP = [];
            let rowC = [];
            for (var j = 0; j < nColumns; ++j) {
                rowP.push([
                    this.scalingFactor * this.terrainData[i][j][0],
                    this.scalingFactor * this.terrainData[i][j][1],
                    this.scalingFactor * this.terrainData[i][j][2]
                ]);
                rowC.push([i / nRows, j / nColumns, 0.0, 1.0]);
            }
            gridPoints.push(rowP);
            gridColors.push(rowC);
        }

        console.log("GridPoints: " + gridPoints.length + ", " + gridPoints[0].length);


        return {
            gridPoints: gridPoints,
            gridColors: gridColors,
        }
    }

    genTerrainData(rows, cols) {
        let data = [];

        let terrainDataWidth = terrainDataRaw.length;
        let terrainDataHeight = terrainDataRaw[0].length;
        let min = Number.MAX_VALUE;
        let max = Number.MIN_VALUE;

        for (let i = 0; i < rows; i++) {
            let r = [];
            for (let j = 0; j < cols; j++) {
                let actual = terrainDataRaw[Math.floor(i * terrainDataWidth / cols)][Math.floor(j * terrainDataHeight / rows)];
                min = Math.min(min, Math.min(actual[0], actual[2]));
                max = Math.max(max, Math.max(actual[0], actual[2]));
                r.push(actual);
            }
            data.push(r);
        }
        this.scalingFactor = this.size / (max - min);
        return data;
    }

    getVertexBuffer() {
        return this.vectorBuffer;
    }

    getColorBuffer() {
        return this.colorBuffer;
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
        return [this.getVertexBuffer(), this.getColorBuffer(), this.getNormalBuffer()];
    }


}




function printarr(arr) {
    return "" + (arr[0] + ", " + arr[1] + ", " + arr[2])
}