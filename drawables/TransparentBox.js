class TransparentBox {
    constructor(gl, frameDimension, lightPosition) {
        this.gl = gl;
        this.frameDimension = frameDimension;
        this.lightPosition = lightPosition;
        var vect = (x, y, z) => {
            return {
                x: x,
                y: y,
                z: z,
            }
        };

        // let points = []

        let color = [0, 0, 1, .5];
        let opacity = 1;
        let offset = this.frameDimension / 2;

        let upperLeftFront = vect(lightPosition[0] - offset, lightPosition[1] + offset, lightPosition[2] + offset);
        let bottomRightRear = vect(lightPosition[0] + offset, lightPosition[1] - offset, lightPosition[2] - offset);

        var rectanglePoints = (p1, p2, p3, p4) => {
            return [
                p1.x, p1.y, p1.z,
                p2.x, p2.y, p2.z,
                p3.x, p3.y, p3.z,

                p1.x, p1.y, p1.z,
                p3.x, p3.y, p3.z,
                p4.x, p4.y, p4.z,
            ]
        }

        var counterWise = [// inside facing walls
            [ // left
                upperLeftFront,
                vect(upperLeftFront.x, bottomRightRear.y, upperLeftFront.z),
                vect(upperLeftFront.x, bottomRightRear.y, bottomRightRear.z),
                vect(upperLeftFront.x, upperLeftFront.y, bottomRightRear.z)
            ],
            [ // top
                upperLeftFront,
                vect(upperLeftFront.x, upperLeftFront.y, bottomRightRear.z),
                vect(bottomRightRear.x, upperLeftFront.y, bottomRightRear.z),
                vect(bottomRightRear.x, upperLeftFront.y, upperLeftFront.z)
            ],
            [ // right
                bottomRightRear,
                vect(bottomRightRear.x, bottomRightRear.y, upperLeftFront.z),
                vect(bottomRightRear.x, upperLeftFront.y, upperLeftFront.z),
                vect(bottomRightRear.x, upperLeftFront.y, bottomRightRear.z)
            ],
            [ // bottom
                bottomRightRear,
                vect(upperLeftFront.x, bottomRightRear.y, bottomRightRear.z),
                vect(upperLeftFront.x, bottomRightRear.y, upperLeftFront.z),
                vect(bottomRightRear.x, bottomRightRear.y, upperLeftFront.z)

            ],
            [ // rear
                bottomRightRear,
                vect(bottomRightRear.x, upperLeftFront.y, bottomRightRear.z),
                vect(upperLeftFront.x, upperLeftFront.y, bottomRightRear.z),
                vect(upperLeftFront.x, bottomRightRear.y, bottomRightRear.z)
            ],
            [   // front
                upperLeftFront,
                vect(bottomRightRear.x, upperLeftFront.y, upperLeftFront.z),
                vect(bottomRightRear.x, bottomRightRear.y, upperLeftFront.z),
                vect(upperLeftFront.x, bottomRightRear.y, upperLeftFront.z),
            ]
        ];

        let rectangles = counterWise;
        let faces = [];
        for (let i = 0; i < rectangles.length; i++) {
            faces.push(rectanglePoints(
                rectangles[i][3],
                rectangles[i][2],
                rectangles[i][1],
                rectangles[i][0]
            ))
        }

        let points = [];
        for (let i = 0; i < faces.length; i++) {
            for (let j = 0; j < faces[i].length; j++) {
                points.push(faces[i][j]);
            }
        }


        let tColor = [];
        for (let i = 0; i < points.length; i++) {
            tColor.push(//color[0], color[1], color[2], color[3],
                // color[0], color[1], color[2], color[3],
                color[0], color[1], color[2], color[3],)
        }


        let normals = [
            1, 0, 0, // right
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            0, -1, 0, // down
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            -1, 0, 0, // left
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,


            0, 1, 0, // up
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            0, 0, 1, // front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, -1, // rear
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,





        ];



        this.vBuff = loadBuffer(this.gl, new Float32Array(points), this.gl.STATIC_DRAW);
        this.nBuff = loadBuffer(this.gl, new Float32Array(normals), gl.STATIC_DRAW);
        this.cBuff = loadBuffer(this.gl, new Float32Array(tColor), gl.STATIC_DRAW);

        this.numVertices = (points.length) / 3;
    }

    draw(programInfo, bufferAttributes) {
        let buffers = this.getBuffers();

        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }

    getNumVertices() {
        return this.numVertices;
    }

    getType() {
        return this.gl.TRIANGLES;
    }

    getVertexBuffer() {
        return this.vBuff;
    }

    getNormalBuffer() {
        return this.nBuff;
    }

    getColorBuffer() {
        return this.cBuff;
    }

    getBuffers() {
        return [this.getVertexBuffer(), this.getNormalBuffer(), this.getColorBuffer()];
    }
}