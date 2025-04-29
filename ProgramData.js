class ProgramData {
    constructor(gl, vertexShaderSource, fragmentShaderSource, attributeNames) {
        this.gl = gl;
        this.program = this.createProgram(gl, vertexShaderSource, fragmentShaderSource);

        this.uniformLocations = new Map();
        this.scanUniforms();

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

    getUniformInfo(name) {
        return this.uniformLocations.get(name);
    }

    setUniform(name, value) {
        const info = this.getUniformInfo(name);
        if (!info) {
            console.warn(`Uniform '${name}' not found`);
            return;
        }
        const { location, type } = info;
        const gl = this.gl;

        switch (type) {
            case gl.FLOAT:
                gl.uniform1f(location, value);
                break;
            case gl.FLOAT_VEC2:
                gl.uniform2fv(location, value);
                break;
            case gl.FLOAT_VEC3:
                gl.uniform3fv(location, value);
                break;
            case gl.FLOAT_VEC4:
                gl.uniform4fv(location, value);
                break;
            case gl.INT:
            case gl.BOOL:
                gl.uniform1i(location, value);
                break;
            case gl.INT_VEC2:
            case gl.BOOL_VEC2:
                gl.uniform2iv(location, value);
                break;
            case gl.INT_VEC3:
            case gl.BOOL_VEC3:
                gl.uniform3iv(location, value);
                break;
            case gl.INT_VEC4:
            case gl.BOOL_VEC4:
                gl.uniform4iv(location, value);
                break;
            case gl.FLOAT_MAT3:
                gl.uniformMatrix3fv(location, false, value);
                break;
            case gl.FLOAT_MAT4:
                gl.uniformMatrix4fv(location, false, value);
                break;
            case gl.SAMPLER_2D:
            case gl.SAMPLER_CUBE:
                gl.uniform1i(location, value); // Texture unit index
                break;
            default:
                console.warn(`Unknown uniform type for '${name}'`);
        }
    }

    scanUniforms() {
        const gl = this.gl;
        const program = this.program;
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (let i = 0; i < numUniforms; ++i) {
            const info = gl.getActiveUniform(program, i);
            if (!info) break;

            const name = info.name.replace(/\[.*\]$/, ""); // Handle arrays
            const location = gl.getUniformLocation(program, name);

            this.uniformLocations.set(name, { location, type: info.type });
        }
    }
}