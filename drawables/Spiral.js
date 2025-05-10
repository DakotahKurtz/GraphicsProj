class Spiral {
    constructor(gl, posXYZ, height, size, sizeDecrement, theta, stepSize) {
        this.gl = gl;
        this.posXYZ = posXYZ;

        this.height = height;
        this.size = size;
        this.sizeDecrement = sizeDecrement;
        this.theta = theta;
        this.pointsArray = [];
        this.numStepsY = stepSize;

        let sizeT = this.size;
        let layersArray = this.generateSpiral(sizeT);

        for (let i = 0; i < layersArray.length; i++) {
            for (let j = 0; j < layersArray[i].length; j++) {
                this.pointsArray.push(layersArray[i][j]);
            }
        }

        var colorSchemes = [
            [
                [0.451, 0.063, 0.114, 1],
                [0.671, 0.231, 0.286, 1],
                [0.922, 0.549, 0.596, 1],
            ],
            [
                [.663, 0.549, 0.922, 1],
                [0.914, 0.886, 0.98, 1],
                [0.247, 0.251, 0.929, 1],
            ],
            [
                [0.482, 0.678, 0.525, 1],
                [0.482, 0.678, 0.525, 1],
                [0.482, 0.678, 0.525, 1],
            ],
            [
                [0.482, 0.678, 0.525, 1],
                [0.275, 0.761, 0.376, 1],
                [0.969, 0.804, 0.447, 1],
            ]
        ]

        let choice = getRandomInt(0, colorSchemes.length - 1)
        let colorChoice = colorSchemes[choice];



        this.normalsArray = [];
        for (let i = 0; i < this.pointsArray.length; i += 3) {
            let n = calculateNormals(this.pointsArray[i], this.pointsArray[i + 1], this.pointsArray[i + 2]);
            this.normalsArray.push(normalize(n[0]), normalize(n[1]), normalize(n[2]));
        }

        this.numVertices = this.pointsArray.length;
        // var color = [0, 0, 1, 1];
        this.colorsArray = [];
        for (let i = 0; i < this.numVertices / 3; i++) {
            this.colorsArray.push(colorChoice[0], colorChoice[1], colorChoice[2]);
        }

        let adjustPoints = [];
        for (let i = 0; i < this.pointsArray.length; i++) {
            adjustPoints.push(this.pointsArray[i][0] + this.posXYZ[0], this.pointsArray[i][1] + this.posXYZ[1], this.pointsArray[i][2] + this.posXYZ[2]);
        }



        this.vertexBuffer = loadBuffer(this.gl, new Float32Array(adjustPoints), this.gl.STATIC_DRAW);
        this.normalBuffer = loadBuffer(this.gl, new Float32Array(flatten(this.normalsArray)), this.gl.STATIC_DRAW);
        this.colorBuffer = loadBuffer(this.gl, new Float32Array(flatten(this.colorsArray)), this.gl.STATIC_DRAW);
    }

    update() {
        return;
    }

    getObjectMatrix() {
        return flatten(identity())
    }

    scale(v, s) {
        return [v[0] * s, v[1] * s, v[2] * s];
    };

    generateSpiral(size) {
        const v0 = [-size, 0, -size];
        const v1 = [size, 0, -size];
        const v2 = [size, 0, size];
        const v3 = [-size, 0, size];

        let heightIncrement = this.height / this.numStepsY;
        let layers = [];
        let previous = [v0, v1, v2, v3];
        let currTheta = this.theta;
        let currLayerSize = size;
        let currentHeight = 0;
        for (let i = 0; i < this.numStepsY; i++) {
            currLayerSize *= this.sizeDecrement;
            currentHeight += heightIncrement;
            currTheta += this.theta;

            let layer = this.generateNextLayer(currTheta, currLayerSize, currentHeight, previous);
            layers.push(layer[0]);
            previous = [layer[1][0], layer[1][1], layer[1][2], layer[1][3]];

        }



        return layers;
    }

    generateNextLayer(theta, size, nextHeight, previous) {

        const rotateY = ([x, y, z]) => {
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);
            const xR = x * cosT + z * sinT;
            const zR = -x * sinT + z * cosT;
            return [xR, y, zR];
        };



        // Top face (rotated)
        const v4 = rotateY([-size, nextHeight, -size]);
        const v5 = rotateY([size, nextHeight, -size]);
        const v6 = rotateY([size, nextHeight, size]);
        const v7 = rotateY([-size, nextHeight, size]);

        // Build faces (two triangles each, CCW)

        const faces = [
            // Bottom face
            previous[0], previous[1], previous[2],
            previous[0], previous[2], previous[3],


            // Top face (rotated)
            v4, v6, v5,
            v4, v7, v6,

            // Front face (+Z)
            previous[3], previous[2], v6,
            previous[3], v6, v7,

            // Back face (-Z)
            previous[1], previous[0], v4,
            previous[1], v4, v5,

            // Left face (-X)
            previous[0], previous[3], v7,
            previous[0], v7, v4,

            // Right face (+X)
            previous[2], previous[1], v5,
            previous[2], v5, v6,
        ];

        return [faces, [v4, v5, v6, v7]];
    }

    getPosition() {
        return this.posXYZ;
    }

    getNumVertices() {
        return this.numVertices;
    }
    getVertexBuffer() {
        return this.vertexBuffer;
    }
    getNormalBuffer() {
        return this.normalBuffer;
    }
    getColorBuffer() {
        return this.colorBuffer;
    }
    getBuffers() {
        return [this.vertexBuffer, this.normalBuffer, this.colorBuffer,];
    }
    getType() {
        return this.gl.TRIANGLES;
    }
    draw(programInfo, bufferAttributes) {

        let buffers = this.getBuffers();
        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            this.gl.vertexAttribPointer(programInfo.getBufferLocations()[i], bufferAttributes[i].size, bufferAttributes[i].type, bufferAttributes[i].normalize, bufferAttributes[i].stride, bufferAttributes[i].offset);
        }
        this.gl.drawArrays(this.getType(), 0, this.getNumVertices());

    }

    _makeCube(s1tl, s1tr, s1bl, s1br, s2tl, s2tr, s2bl, s2br) {


        //left face
        let vertices = [s1bl, s2bl, s2tl,
            s1bl, s2tl, s1tl,

            //right face
            s1tr, s2tr, s2br,
            s1tr, s2br, s1br,

            //back face
            s1tl, s2tl, s2tr,
            s1tl, s2tr, s1tr,
            //front face
            s1bl, s2br, s2bl,
            s1bl, s1br, s2bl,]

        let normals = [];
        for (let i = 0; i < vertices.length; i += 3) {
            let n = calculateNormals(vertices[i], vertices[i + 1], vertices[i + 2]);
            normals.push(normalize(n[0]), normalize(n[1]), normalize(n[2]));
        }

        return {
            vertices: vertices,
            normals: normals
        }


    }



}