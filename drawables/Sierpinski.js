/**
 * https://lettier.github.io/posts/2016-02-29-triforce-overload-sierpinski-pyramids.html
 */

class Sierpinski {
    constructor(gl, size, depth, posXYZ) {
        this.gl = gl;
        this.posXYZ = posXYZ;

        this.vertices = [];
        this.normals = [];
        this.colors = [];
        this.rotationRate = 1; // 3 seconds / revolution
        this.rotation = (t) => {
            return 2 * Math.PI * t / this.rotationRate;
        }
        let c1 = [0, 1, 0, .9];
        let c2 = [1, 0, 0, 1];
        let c3 = [0, 0, 1, .5];
        let c4 = [1, 1, 1, .1];

        this.m = translate(posXYZ[0], posXYZ[1], posXYZ[2]);


        // The main points of the Sierpinski tetrahedron.

        var a = 0;
        var b = size;
        var c = b * Math.sqrt(2) * 2.0 / 3.0;
        var d = -1 * b / 3.0;
        var e = -1 * b * Math.sqrt(2) / 3.0;
        var f = b * Math.sqrt(2) / Math.sqrt(3);
        var g = -1 * f;


        var point_one = [a, b, a];
        var point_two = [c, d, a];
        var point_three = [e, d, f];
        var point_four = [e, d, g];
        this._divide_tetra(point_one, point_two, point_three, point_four, c1, c2, c3, c4, depth);

        for (let i = 0; i < this.vertices.length; i++) {
            this.vertices[i][1] = (2 / 3) * size - this.vertices[i][1]
        }
        this.numVertices = this.vertices.length;

        this.vertexBuffer = loadBuffer(this.gl, new Float32Array(flatten(this.vertices)), this.gl.STATIC_DRAW);
        this.normalBuffer = loadBuffer(this.gl, new Float32Array(flatten(this.normals)), this.gl.STATIC_DRAW);
        this.colorBuffer = loadBuffer(this.gl, new Float32Array(flatten(this.colors)), this.gl.STATIC_DRAW);



    }

    update(t) {
        let r = this.rotation(t)
        this.objectMatrix = mult(this.m, rotateY(r));

    }


    getObjectMatrix() {
        return flatten(this.objectMatrix)
    }

    _divide_tetra(p1, p2, p3, p4, c1, c2, c3, c4, count) {
        var p1_p2 = midpoint(p1, p2);
        var p1_p3 = midpoint(p1, p3);
        var p1_p4 = midpoint(p1, p4);
        var p2_p3 = midpoint(p2, p3);
        var p2_p4 = midpoint(p2, p4);
        var p3_p4 = midpoint(p3, p4);

        let c1_c2 = midpoint(c1, c2);
        let c1_c3 = midpoint(c1, c3);
        let c1_c4 = midpoint(c1, c4);
        let c2_c3 = midpoint(c2, c3);
        let c2_c4 = midpoint(c2, c4);
        let c3_c4 = midpoint(c3, c4);

        if (count > 0) {
            this._divide_tetra(p1, p1_p2, p1_p3, p1_p4, c1, c1_c2, c1_c3, c1_c4, count - 1)
            this._divide_tetra(p1_p2, p2, p2_p3, p2_p4, c1_c2, c2, c2_c3, c2_c4, count - 1);
            this._divide_tetra(p1_p3, p2_p3, p3, p3_p4, c1_c3, c2_c3, c3, c3_c4, count - 1);
            this._divide_tetra(p1_p4, p2_p4, p3_p4, p4, c1_c4, c2_c4, c3_c4, c4, count - 1)
        } else {
            this._tetra(p1, p2, p3, p4, c1, c2, c3, c4);
        }
    }

    _tetra(p1, p2, p3, p4, c1, c2, c3, c4) {
        this.triangle(p1, p2, p3, c1, c2, c3);
        this.triangle(p1, p4, p2, c1, c4, c2);
        this.triangle(p1, p3, p4, c1, c3, c4);
        this.triangle(p2, p4, p3, c2, c4, c3);
    }

    triangle(p1, p2, p3, c1, c2, c3) {
        this.vertices.push(
            [p3[0], p3[1], p3[2],],
            [p2[0], p2[1], p2[2],],
            [p1[0], p1[1], p1[2]],
        );
        let norms = calculateNormals(p1, p3, p2);
        this.normals.push(normalize(norms[0]), normalize(norms[1]), normalize(norms[2]));
        this.colors.push(c1, c2, c3);
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

    getBuffers() {
        return [this.vertexBuffer, this.normalBuffer, this.colorBuffer]
    }






}