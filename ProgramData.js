class ProgramData {
    constructor(gl, vertexShaderSource, fragmentShaderSource, attributeNames) {
        this.gl = gl;
        this.program = this.createProgram(gl, vertexShaderSource, fragmentShaderSource);
        this.uniformLocations = new Map();
        this.bufferLocations = [];

        for (let i = 0; i < attributeNames.length; i++) {
            let loc = this.gl.getAttribLocation(this.program, attributeNames[i]);
            this.gl.enableVertexAttribArray(loc);
            this.bufferLocations.push(loc);
        }
    }

    getBufferLocations() {
        return this.bufferLocations;
    }

    //
    //  initShaders.js
    //

    createProgram(gl, vertexShaderId, fragmentShaderId) {
        var vertShdr;
        var fragShdr;

        var vertElem = document.getElementById(vertexShaderId);
        if (!vertElem) {
            alert("Unable to load vertex shader " + vertexShaderId);
            return -1;
        }
        else {
            vertShdr = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertShdr, vertElem.text);
            gl.compileShader(vertShdr);
            if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS)) {
                var msg = "Vertex shader failed to compile.  The error log is:"
                    + "<pre>" + gl.getShaderInfoLog(vertShdr) + "</pre>";
                alert(msg);
                return -1;
            }
        }

        var fragElem = document.getElementById(fragmentShaderId);
        if (!fragElem) {
            alert("Unable to load vertex shader " + fragmentShaderId);
            return -1;
        }
        else {
            fragShdr = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragShdr, fragElem.text);
            gl.compileShader(fragShdr);
            if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS)) {
                var msg = "Fragment shader failed to compile.  The error log is:"
                    + "<pre>" + gl.getShaderInfoLog(fragShdr) + "</pre>";
                alert(msg);
                return -1;
            }
        }

        var program = gl.createProgram();
        gl.attachShader(program, vertShdr);
        gl.attachShader(program, fragShdr);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            var msg = "Shader program failed to link.  The error log is:"
                + "<pre>" + gl.getProgramInfoLog(program) + "</pre>";
            alert(msg);
            return -1;
        }

        return program;
    }

    use() {
        this.gl.useProgram(this.program);
    }

    getUniformLocation(name) {
        if (!this.uniformLocations.has(name)) {
            const location = this.gl.getUniformLocation(this.program, name);
            if (location === null) {
                console.warn(`Uniform '${name}' not found in shader`);
            }
            this.uniformLocations.set(name, location);
        }
        return this.uniformLocations.get(name);
    }

    setUniform(name, value) {
        const location = this.getUniformLocation(name);
        if (location == null) return;

        if (typeof value === 'number') {
            this.gl.uniform1f(location, value);
        } else if (value.length) {
            switch (value.length) {
                case 2:
                    this.gl.uniform2fv(location, value);
                    break;
                case 3:
                    this.gl.uniform3fv(location, value);
                    break;
                case 4:
                    this.gl.uniform4fv(location, value);
                    break;
                case 9:
                    this.gl.uniformMatrix3fv(location, false, value);
                    break;
                case 16:
                    this.gl.uniformMatrix4fv(location, false, value);
                    break;
                default:
                    console.warn(`Unhandled uniform array length for '${name}': ${value.length}`);
            }
        } else if (typeof value === 'boolean') {
            this.gl.uniform1i(location, value ? 1 : 0);
        } else {
            console.warn(`Unhandled uniform type for '${name}'`);
        }
    }
}