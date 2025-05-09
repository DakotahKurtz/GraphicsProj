class Rock {
    constructor(gl, size, posXYZ, textureID) {

        this.gl = gl;
        this.size = size;
        this.posXYZ = posXYZ;
        this.textureID = textureID;
        this.numVertices = 0;
        this.pointsArray = [];
        this.normalsArray = [];
        this.colorArray = [];
        this.color = [0, 0, 1, 1];
        this.c1 = [(115 + getRandomInt(-10, 10)) / 255, 111 / 255, (101 + getRandomInt(-10, 10)) / 255, 1]
        this.c2 = [66 / 255, (57 + getRandomInt(-10, 10)) / 255, 54 / 255, 1]
        this.c3 = [8 / 255, 10 / 255, (3 + getRandomInt(-10, 10)) / 255, 1];

        let theta = 2 * Math.PI / 3;
        let va = [0, 1, 0, 1];
        var vb = vec4(Math.cos(theta), 0, -Math.sin(theta), 1);
        var vc = vec4(Math.cos(2 * theta), -getRandomFloat(0, .7), -Math.sin(2 * theta) + getRandomFloat(-.2, .2), 1);
        var vd = vec4(Math.cos(0), -getRandomFloat(0, .7), getRandomFloat(-.2, .2), 1);


        var numTimesToSubdivide = 1;
        this.tetrahedron(va, vb, vc, vd, numTimesToSubdivide);



        this.pointBuffer = loadBuffer(this.gl, flatten(this.pointsArray), this.gl.STATIC_DRAW);
        this.normalBuffer = loadBuffer(this.gl, flatten(this.normalsArray), this.gl.STATIC_DRAW);
        this.colorBuffer = loadBuffer(this.gl, flatten(this.colorArray), this.gl.STATIC_DRAW);

    }

    getTextureID() {
        return this.textureID;
    }

    draw(programInfo, bufferAttributes) {

        let buffers = this.getBuffers();
        for (let i = 0; i < bufferAttributes.length; i++) {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers[i]);
            // console.log(i + ", " + buffers[i]);
            // console.log(bufferAttributes[i].size);
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

    getBuffers() {
        return [this.pointBuffer, this.normalBuffer, this.colorBuffer];
    }

    scaleAndShift(v) {
        return [this.posXYZ[0] + v[0] * this.size, this.posXYZ[1] + v[1] * this.size, this.posXYZ[2] + v[2] * this.size, 1];
    }

    triangle(a, b, c) {

        // normals are vectors

        // normalsArray.push(a[0], a[1], a[2], 0.0);
        // normalsArray.push(b[0], b[1], b[2], 0.0);
        // normalsArray.push(c[0], c[1], c[2], 0.0);

        let n = calculateNormals(a, b, c);
        this.normalsArray.push(normalize(n[0]), normalize(n[1]), normalize(n[2]))



        this.pointsArray.push(this.scaleAndShift(a));
        this.pointsArray.push(this.scaleAndShift(b));
        this.pointsArray.push(this.scaleAndShift(c));

        this.colorArray.push(this.c1, this.c2, this.c3);

        this.numVertices += 3;
    }

    randomize(v) {
        let ceiling = 0;
        //return [v[0] + getRandomFloat(0, ceiling), v[1] + getRandomFloat(0, ceiling), v[2] + getRandomFloat(0, ceiling), 1]
        return v;
    }

    scale(v, s) {
        return [v[0] * s, v[1] * s, v[2] * s, 1];
    }
    divideTriangle(a, b, c, count) {
        if (count > 0) {

            var ab = this.randomize(mix(a, b, 0.5));
            var ac = this.randomize(mix(a, c, 0.5));
            var bc = this.randomize(mix(b, c, 0.5));

            ab = normalize(ab, true);
            ac = normalize(ac, true);
            bc = normalize(bc, true);

            this.divideTriangle(a, ab, ac, count - 1);
            this.divideTriangle(ab, b, bc, count - 1);
            this.divideTriangle(bc, c, ac, count - 1);
            this.divideTriangle(ab, bc, ac, count - 1);
        }
        else {
            this.triangle(a, b, c);
        }
    }


    tetrahedron(a, b, c, d, n) {
        this.divideTriangle(a, b, c, n);
        this.divideTriangle(d, c, b, n);
        this.divideTriangle(a, d, b, n);
        this.divideTriangle(a, c, d, n);
    }
}