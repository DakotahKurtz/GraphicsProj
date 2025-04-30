"use strict";

var DrawableObjectArray = [];
const imageURLS = [
    "https://i.ibb.co/7xLCgSbY/sky-Box-Adjusted.png",
    "https://i.ibb.co/tPBYz9fz/flat-Rock-Reduced.png",
]
function main() {

    loadImages(imageURLS, init);
}

main();

function init(images) {
    var canvas = document.getElementById("gl-canvas");

    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    var programDataPhongTexture = new ProgramData(gl, "vertex-shader-phong-texture", "fragment-shader-phong-texture",
        ["a_position", "a_texcoord", "a_normal"],);
    var programDataTexture = new ProgramData(gl, "vertex-shader-texture", "fragment-shader-texture",
        ["a_position", "a_texcoord"],);
    var programDataPhong = new ProgramData(gl, "vertex-shader-phong", "fragment-shader-phong",
        ["a_position", "a_color", "a_normal"],);

    var phongTextureUniforms = {
        "modelView": 0,
        "projection": 0,
        "ambientProduct": 0,
        "diffuseProduct": 0,
        "specularProduct": 0,
        "lightPosition": 0,
        "shininess": 0,
        "eyePosition": 0,
        "u_texture": 0,
    };

    var textureUniforms = {
        "modelView": 0,
        "projection": 0,
        "u_texture": 0,
    }

    var phongUniforms = {
        "modelView": 0,
        "projection": 0,
        "ambientProduct": 0,
        "diffuseProduct": 0,
        "specularProduct": 0,
        "lightPosition": 0,
        "shininess": 0,
        "eyePosition": 0,
    }

    for (const [name] of Object.entries(phongTextureUniforms)) {
        programDataPhongTexture.getUniformInfo(name);
    }

    for (const [name] of Object.entries(textureUniforms)) {
        programDataTexture.getUniformInfo(name);
    }

    for (const [name] of Object.entries(textureUniforms)) {
        programDataPhong.getUniformInfo(name);
    }

    var textures = [];
    for (var i = 0; i < images.length; ++i) {
        var texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + i);

        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);

        // add the texture to the array of textures.
        textures.push(texture);
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var aspect = canvas.width / canvas.height;
    var lookInc = .1;
    var cameraAtInc = .1;
    var boundingInc = .1;
    var angleInc = 10;
    var lightInc = .1;

    var cameraLocation = [0, 4.5, 7];
    var lookingAt = [0, 6, -3];
    var boundingNear = .3;
    var boundingFar = 100;
    var viewAngle = 30;

    var lightPosition = vec4(0, 6, -3, 1);
    var lightAmbient = vec4(.6, .6, .6, 1.0);
    var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
    var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

    var materialAmbient = vec4(1.0, 0.8, 0.0, 1.0);
    var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
    var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
    var materialShininess = 20.0;
    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    phongTextureUniforms["ambientProduct"] = flatten(ambientProduct);
    phongTextureUniforms["diffuseProduct"] = flatten(diffuseProduct);
    phongTextureUniforms["specularProduct"] = flatten(specularProduct);
    phongTextureUniforms["shininess"] = materialShininess;

    phongUniforms["ambientProduct"] = flatten(ambientProduct);
    phongUniforms["diffuseProduct"] = flatten(diffuseProduct);
    phongUniforms["specularProduct"] = flatten(specularProduct);
    phongUniforms["shininess"] = materialShininess;

    DrawableObjectArray.push(
        DrawableObject(new Terrain(gl, 512, 512, 20, 1), programDataPhongTexture,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT), bufferAttributes(3, gl.FLOAT),]
        ),
    );


    var skyBoxObject = DrawableObject(new SkyBox(gl, 20, 0), programDataTexture,
        [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT)]
    );

    var lightFrameObject = DrawableObject(new LightFrame(gl, .5, lightPosition), programDataPhong,
        [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
    );

    manageControls();



    render();

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let eye = vec3(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
        let at = calculateTarget(lookingAt);
        let up = vec3(0, 1, 0);

        let mvMatrix = lookAt(eye, at, up);
        let pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);
        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);
        programDataPhongTexture.use();

        phongTextureUniforms["eyePosition"] = flatten(eye);
        phongTextureUniforms["lightPosition"] = flatten(lightPosition);
        phongTextureUniforms["ambientProduct"] = flatten(ambientProduct);
        phongTextureUniforms["diffuseProduct"] = flatten(diffuseProduct);
        phongTextureUniforms["specularProduct"] = flatten(specularProduct);
        phongTextureUniforms["shininess"] = materialShininess;
        phongTextureUniforms["modelView"] = flatten(mvMatrix);
        phongTextureUniforms["projection"] = flatten(pMatrix);
        phongTextureUniforms["u_texture"] = DrawableObjectArray[0].drawable.getTextureID();

        setUniforms(phongTextureUniforms, programDataPhongTexture);

        DrawableObjectArray.forEach((drawableObject) => {

            drawableObject.draw()
        })

        // gl.useProgram(programDataTexture.program);
        programDataTexture.use();
        textureUniforms["modelView"] = flatten(mvMatrix);
        textureUniforms["projection"] = flatten(pMatrix);
        textureUniforms["u_texture"] = skyBoxObject.drawable.getTextureID();
        setUniforms(textureUniforms, programDataTexture);

        skyBoxObject.draw();

        programDataPhong.use();
        phongUniforms["eyePosition"] = flatten(eye);
        phongUniforms["lightPosition"] = flatten(lightPosition);
        phongUniforms["ambientProduct"] = flatten(ambientProduct);
        phongUniforms["diffuseProduct"] = flatten(diffuseProduct);
        phongUniforms["specularProduct"] = flatten(specularProduct);
        phongUniforms["shininess"] = materialShininess;
        phongUniforms["modelView"] = flatten(mvMatrix);
        phongUniforms["projection"] = flatten(pMatrix);        // gl.drawArrays(skyBoxObject.drawable.getType(), 0, skyBoxObject.drawable.getNumVertices());
        setUniforms(phongUniforms, programDataPhong);

        lightFrameObject.draw();
    }

    function manageControls() {
        const pressedKeys = {};

        document.addEventListener('keydown', (event) => {
            pressedKeys[event.key] = true;
        });

        document.addEventListener('keyup', (event) => {
            delete pressedKeys[event.key];
        });

        document.addEventListener('keydown', function (event) {
            if (pressedKeys["Shift"]) {
                adjustControlArray(event, lookingAt, lookInc);

                switch (event.key) {
                    case ("n"):
                        boundingNear = Math.max(0, boundingNear - boundingInc);
                        break;
                    case ("e"):
                        boundingFar = Math.max(boundingNear, boundingFar + boundingInc);
                        break;
                    case ("a"):
                        viewAngle = Math.max(10, viewAngle - angleInc);
                        break;

                }
            } else if (pressedKeys["l"]) {
                adjustControlArray(event, lightPosition, lightInc);
            }
            else {
                adjustControlArray(event, cameraLocation, cameraAtInc);
                switch (event.key) {
                    case ("n"):
                        boundingNear = Math.min(boundingFar, boundingNear + boundingInc);
                        break;
                    case ("e"):
                        boundingFar += boundingInc;
                        break;
                    case ("a"):
                        viewAngle = Math.min(355, viewAngle + angleInc);
                        break;
                }
            }


            // console.log("CameraLocation: " + cameraLocation);
            console.log("Light: " + lightPosition)
            console.log("LookingAt: " + lookingAt);
            console.log("Near: " + boundingNear + ", Far: " + boundingFar + ", angle: " + viewAngle);
            console.log("Position: " + cameraLocation)
            render();

        });
    }
}

function setupTerrainProgram() {

}

function adjustControlArray(event, array, inc) {
    switch (event.key) {
        case ("ArrowLeft"):
            array[0] -= inc;
            break;
        case ("ArrowRight"):
            array[0] += inc;
            break;
        case ("ArrowDown"):
            array[1] -= inc;
            break;
        case ("ArrowUp"):
            array[1] += inc;
            break;
        case ("f"):
        case ("F"):
            array[2] -= inc;
            break;
        case ("b"):
        case ("B"):
            array[2] += inc;
            break;
    }


}

function setUniforms(map, programData) {
    for (const [name, value] of Object.entries(map)) {
        programData.setUniform(name, value);
    }
}

function calculateTarget(look) {
    return look;
    // return [
    //     look[2] * Math.sin(look[0]),
    //     look[2] * Math.cos(look[1]),
    //     look[2] * Math.cos(look[0]),
    // ]
}