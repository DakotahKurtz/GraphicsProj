class SkyBox {
    constructor(gl, size) {
        this.gl = gl;
        let vertices = this._getBoxPoints(size);
        let texCoords = this._setTexcoords();

        this.vertexBuffer = loadBuffer(gl, vertices, gl.STATIC_DRAW);
        this.texBuffer = loadBuffer(gl, texCoords, gl.STATIC_DRAW);
        this.numVertices = vertices.length / 3;

        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Fill the texture with a 1x1 blue pixel.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));
        // Asynchronously load an image
        var image = new Image();
        image.crossOrigin = "anonymous";
        image.src = "https://i.ibb.co/7xLCgSbY/sky-Box-Adjusted.png";
        image.addEventListener('load', function () {
            // Now that the image has loaded make copy it to the texture.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            // Check if the image is a power of 2 in both dimensions.
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                // Yes, it's a power of 2. Generate mips.
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        });
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

    draw() {
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }
}

