class SkyBox {
    constructor(gl, size, textureID) {
        this.gl = gl;
        this.textureID = textureID;
        let vertices = this._getBoxPoints(size);
        let texCoords = this._setTexcoords();

        this.vertexBuffer = loadBuffer(gl, vertices, gl.STATIC_DRAW);
        this.texBuffer = loadBuffer(gl, texCoords, gl.STATIC_DRAW);
        this.numVertices = vertices.length / 3;
    }

    getTextureID() {
        return this.textureID;
    }

    getTextureBuffer() {
        return this.texBuffer;
    }

    getVertexBuffer() {
        return this.vertexBuffer;
    }

    getBuffers() {
        return [this.getVertexBuffer(), this.getTextureBuffer()];
    }

    getType() {
        return this.gl.TRIANGLES;
    }

    getNumVertices() {
        return this.numVertices;
    }

    _setTexcoords() {
        let coords =
            new Float32Array(
                [
                    //left
                    .25, 1,
                    .25, .5,
                    0.0, 1,
                    0, 1,
                    .25, .5,
                    0, .5,

                    // back
                    .5, 1,
                    .5, .5,
                    .25, 1,
                    .25, 1,
                    .5, .5,
                    .25, .5,

                    // right
                    .75, 1,
                    .75, .5,
                    .5, 1,
                    .5, 1,
                    .75, .5,
                    .5, .5,

                    // front
                    1, 1,
                    1, .5,
                    .75, 1,
                    .75, 1,
                    1, .5,
                    .75, .5,

                    //up
                    .75, 0,
                    .5, 0,
                    .75, .5,
                    .75, .5,
                    .5, 0,
                    .5, .5,

                    // down
                    .75, 0,
                    .75, .5,
                    1, 0,
                    1, 0,
                    .75, .5,
                    1, .5,



                ]);
        return coords;
    }

    _getBoxPoints(size) {
        let positions = new Float32Array([


            //left face
            -size, -size, -size,
            -size, size, -size,
            -size, -size, size,
            -size, -size, size,
            -size, size, -size,
            -size, size, size,

            // back face
            size, -size, -size,
            size, size, -size,
            -size, -size, -size,
            -size, -size, -size,
            size, size, -size,
            -size, size, -size,

            // right face
            size, -size, size,
            size, size, size,
            size, -size, -size,
            size, -size, -size,
            size, size, size,
            size, size, -size,

            // front face
            //
            -size, -size, size,
            -size, size, size,
            size, -size, size,
            size, -size, size,
            -size, size, size,
            size, size, size,

            // up
            -size, size, size,
            -size, size, -size,
            size, size, size,
            size, size, size,
            -size, size, -size,
            size, size, -size,

            // down
            -size, -size, -size,
            -size, -size, size,
            size, -size, -size,
            size, -size, -size,
            -size, -size, size,
            size, -size, size,
        ]);

        return positions;
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

