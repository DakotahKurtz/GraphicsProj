"use strict";

const imageURLS = [
    "https://i.ibb.co/7xLCgSbY/sky-Box-Adjusted.png",
    "https://i.ibb.co/tPBYz9fz/flat-Rock-Reduced.png",
]



function main() {

    loadImages(imageURLS, init);
}

var materials = (lighting, shininess) => {
    return {
        ambient: lighting.ambient,
        diffuse: lighting.diffuse,
        specular: lighting.specular,
        shininess: shininess,
    }
}

var lighting = (ambient, diffuse, specular) => {
    return {
        ambient: ambient,
        diffuse: diffuse,
        specular: specular,
    }
}

var worldLight = lighting(
    [.25, .2, .2, 1],
    [.6, .6, .6, 1],
    [.9, .9, .9, 1],
)

var geometricMaterials = materials(
    lighting(
        [.1, .1, .1, 1],
        [.6, .6, .6, 1],
        [.9, .9, .9, 1]),
    15);

var spiralMaterials = materials(
    lighting(
        [0, 0, .1, 1],
        [.2, .2, .3, 1],
        [.8, .8, .9, 1]),
    1
);

var rockMaterials = materials(
    lighting(
        [.2, .2, .2, 1],
        [.6, .6, .6, 1],
        [.2, .2, .2, 1],
    ), 20);

var waterMaterials = materials(
    lighting(
        [1.0, 1.0, 1.0, 1],
        [0, 0, 0, 1],
        [1.0, 1.0, 1.0, 1],
    ), 20);


var terrainMaterials = materials(
    lighting(
        [1.0, 1.0, 1.0, 1],
        [.6, .6, .6, 1],
        [0.0, 0.0, 0.0, 1],
    ), 20);

var grassMaterials = materials(
    lighting(
        [.2, .2, .2, 1],
        [.8, .8, .8, 1],
        [.8, .8, .8, 1],),
    15);


var then = 0;
var animID;
var isPlaying = false;
var terrainGridDim = 512;
const pressedKeys = {};

main();

function init(images) {
    var canvas = document.getElementById("gl-canvas");

    var gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    var programDataPhongTexture = new ProgramData(gl, "vertex-shader-phong-texture", "fragment-shader-phong-texture",
        ["a_position", "a_texcoord", "a_normal", "a_color"],);
    var programDataTexture = new ProgramData(gl, "vertex-shader-texture", "fragment-shader-texture",
        ["a_position", "a_texcoord"],);
    var programDataPhong = new ProgramData(gl, "vertex-shader-phong", "fragment-shader-phong",
        ["vPosition", "vNormal", "a_color"],);
    var programDataSparse = new ProgramData(gl, "vertex-shader-sparse", "fragment-shader-sparse",
        ["vPosition", "a_color"],);

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
        "u_mixValue": .01,
    };

    var textureUniforms = {
        "modelView": 0,
        "projection": 0,
        "u_texture": 0,
    }

    var phongUniforms = {
        "modelView": 0,
        "projection": 0,
        "objectMatrix": flatten(identity()),
        "ambientProduct": 0,
        "diffuseProduct": 0,
        "specularProduct": 0,
        "lightPosition": 0,
        "shininess": 0,
        "eyePosition": 0,
    }

    var sparseUniforms = {
        "modelView": 0,
        "projection": 0,
        "objectMatrix": flatten(identity()),
    }

    var programUniformCorrespondence = (program, uniforms) => {
        for (const [name] of Object.entries(uniforms)) {
            program.getUniformInfo(name);
        }

        return {
            program: program,
            uniforms: uniforms,
            drawableObjects: []
        }
    }

    var DrawableTypes = {
        "PhongTexture": programUniformCorrespondence(programDataPhongTexture, phongTextureUniforms),
        "Phong": programUniformCorrespondence(programDataPhong, phongUniforms),
        "Texture": programUniformCorrespondence(programDataTexture, textureUniforms),
        "Sparse": programUniformCorrespondence(programDataSparse, sparseUniforms),
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
    var cameraAtInc = .1;
    var boundingInc = 1;
    var angleInc = .03;
    var lightInc = .1;
    var depthChangeInc = .1;
    var waterLevel = 1.19;
    var cameraLocation = [9.006, 2.989, 8.743];
    var lookingAt = [-2.776, 17.579, 7.887];
    var camera = new Camera(cameraLocation, lookingAt, [0, 1, 0]);
    var boundingNear = .3;
    var boundingFar = 100;
    var viewAngle = 30;
    var lightPosition = vec4(0, 15, 0, 1);

    const MAP_SIZE = 20;
    var worldArray = generateWorldArray(terrainGridDim, MAP_SIZE, waterLevel, 15);

    DrawableTypes["PhongTexture"].drawableObjects.push(
        DrawableObject(new Terrain(gl, worldArray.terrainMesh, worldArray.worldNoise, 1), programDataPhongTexture,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)]
            , terrainMaterials),

        DrawableObject(new River(gl, worldArray.terrainMesh, worldArray.waterArray, waterLevel, 0), programDataPhongTexture,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            waterMaterials),
    )

    DrawableTypes["Phong"].drawableObjects.push(

        DrawableObject(new Sierpinski(gl, 3, 5, [0, 5, -6]), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            geometricMaterials),
        DrawableObject(new GoLDisplay(gl, 80, 2 * MAP_SIZE, [-MAP_SIZE, 15, -MAP_SIZE], .5), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            geometricMaterials,),
        DrawableObject(new Grass(gl, terrainGridDim, MAP_SIZE * 2, 5, worldArray), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            grassMaterials,),
    );

    let objectPlacement = worldArray.worldNoise;
    let randomIncHeight = .3;
    let randomIncBase = .05;
    let randomIncSteps = 5;
    var spiralThresh = .002;

    for (let i = 0; i < objectPlacement.length; i++) {
        for (let j = 0; j < objectPlacement[i].length; j++) {
            if (objectPlacement[i][j] == 1 && getRandomFloat(0, 1) < spiralThresh) {
                let x = worldArray.terrainMesh[i][j][0];
                let z = worldArray.terrainMesh[i][j][2]
                let y = worldArray.terrainMesh[i][j][1];
                objectPlacement[i][j] = "t";
                let rand = getRandomInt(0, 1) == 1 ? 1 : -1;
                DrawableTypes["Phong"].drawableObjects.push(
                    DrawableObject(
                        new Spiral(
                            gl,
                            [x, y, z],
                            1 + getRandomFloat(-randomIncHeight, randomIncHeight),
                            .1 + getRandomFloat(-randomIncBase, randomIncBase),
                            .8,
                            toRadians(rand * getRandomFloat(30, 40)),
                            15 + getRandomInt(0, randomIncSteps)
                        ),
                        programDataPhong,
                        [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
                        spiralMaterials,)
                )

            }
        }
    }

    let rockThresh = .01;
    for (let i = 0; i < objectPlacement.length; i++) {
        for (let j = 0; j < objectPlacement[i].length; j++) {
            if (objectPlacement[i][j] == 1 && getRandomFloat(0, 1) < rockThresh) {
                let x = worldArray.terrainMesh[i][j][0];
                let z = worldArray.terrainMesh[i][j][2]
                let y = worldArray.terrainMesh[i][j][1] - .02;
                objectPlacement[i][j] = "r";

                DrawableTypes["Phong"].drawableObjects.push(
                    DrawableObject(
                        new Rock(
                            gl,
                            getRandomFloat(.05, .15),
                            [x, y, z],
                            2,
                        ), programDataPhong,
                        [bufferAttributes(4, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
                        rockMaterials,
                    )
                )

            }
        }
    }

    DrawableTypes["Texture"].drawableObjects.push(
        DrawableObject(new SkyBox(gl, 20, 0), programDataTexture,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT)], null
        )
    )

    var lookAtCheckBox = document.getElementById("lookAt");
    lookAtCheckBox.value = false;

    var startCameraPathButton = document.getElementById("animation");
    var controlCameraManuallyButton = document.getElementById("control");
    var isShowLookAt = false;
    lookAtCheckBox.disabled = true;
    var cameraPath = new CameraPath(frameIncrement, 0);
    camera.setFixedPath(true);

    startCameraPathButton.addEventListener("click", () => {
        cameraPath = new CameraPath(frameIncrement, 0);
        camera.setLocked(false);
        camera.setFixedPath(true);
        lookAtCheckBox.value = false;
        lookAtCheckBox.disabled = true;
    })

    controlCameraManuallyButton.addEventListener("click", () => {
        camera.setFixedPath(false);
        lookAtCheckBox.disabled = false;
        camera = new Camera(cameraPath.cameraPosition, cameraPath.cameraLookAt, [0, 1, 0])


    })

    lookAtCheckBox.addEventListener("click", () => {
        isShowLookAt = lookAtCheckBox.checked;
    })

    manageControls();
    startAnimation();

    function startAnimation() {
        if (isPlaying) {
            cancelAnimationFrame(animID);
        }
        isPlaying = true;
        animID = requestAnimationFrame(render);
    }

    var lastSnapshot = 0;

    function render(now) {

        now *= 0.001;
        let deltaTime = now - then;
        then = now;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (camera.isFixedPath()) {
            cameraPath.update(deltaTime, camera);
        }



        let mvMatrix = camera.getViewMatrix();
        let eye = camera.getPosition();

        let pMatrix = perspective(viewAngle, aspect, boundingNear, boundingFar);


        programDataPhongTexture.use();

        phongTextureUniforms["eyePosition"] = flatten(eye);
        phongTextureUniforms["lightPosition"] = flatten(lightPosition);
        phongTextureUniforms["modelView"] = flatten(mvMatrix);
        phongTextureUniforms["projection"] = flatten(pMatrix);

        DrawableTypes["PhongTexture"].drawableObjects.forEach((drawableObject) => {
            phongTextureUniforms["u_texture"] = drawableObject.drawable.getTextureID();
            phongTextureUniforms["u_mixValue"] = drawableObject.drawable.getTextureMix();
            setMaterials(phongTextureUniforms, drawableObject.materials, worldLight);
            drawableObject.drawable.update(now);

            setUniforms(phongTextureUniforms, programDataPhongTexture);

            drawableObject.draw();
        })



        programDataTexture.use();
        textureUniforms["modelView"] = flatten(mvMatrix);
        textureUniforms["projection"] = flatten(pMatrix);
        DrawableTypes["Texture"].drawableObjects.forEach((drawableObject) => {
            textureUniforms["u_texture"] = drawableObject.drawable.getTextureID();
            setUniforms(textureUniforms, programDataTexture);

            drawableObject.draw();
        })
        // // textureUniforms["u_texture"] = skyBoxObject.drawable.getTextureID();
        // // setUniforms(textureUniforms, programDataTexture);

        // // skyBoxObject.draw();

        // DrawableTypes["Phong"].drawableObjects.push(
        //     DrawableObject(new TransparentBox(gl, .5, lightPosition), programDataPhong,
        //         [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
        //         materials(lighting(vec4(.2, .2, .2, 1), vec4(.9, .9, .9, 1), vec4(.9, .9, .9, 1)), 100),),
        // );

        if (isShowLookAt) {
            DrawableTypes["Phong"].drawableObjects.push(
                LookAtBox(camera),
            );
        }

        programDataPhong.use();
        phongUniforms["eyePosition"] = flatten(eye);
        phongUniforms["lightPosition"] = flatten(lightPosition);
        // phongUniforms["objectMatrix"] = flatten(identity());
        phongUniforms["modelView"] = flatten(mvMatrix);
        phongUniforms["projection"] = flatten(pMatrix);

        DrawableTypes["Phong"].drawableObjects.forEach((drawableObject) => {
            drawableObject.drawable.update(now);

            setMaterials(phongUniforms, drawableObject.materials, worldLight);
            phongUniforms["objectMatrix"] = drawableObject.drawable.getObjectMatrix();
            setUniforms(phongUniforms, programDataPhong);
            drawableObject.draw();

        })
        if (isShowLookAt) {
            DrawableTypes["Phong"].drawableObjects.pop();

        }




        animID = requestAnimationFrame(render);
    }

    function setMaterials(uniformData, materials, worldLight) {
        let ambientProduct = mult(materials.ambient, worldLight.ambient);
        let diffuseProduct = mult(materials.diffuse, worldLight.diffuse);
        let specularProduct = mult(materials.specular, worldLight.specular);
        uniformData["ambientProduct"] = flatten(ambientProduct);
        uniformData["diffuseProduct"] = flatten(diffuseProduct);
        uniformData["specularProduct"] = flatten(specularProduct);
        uniformData["shininess"] = materials.shininess;
    }

    function LookAtBox(camera) {
        let size = .2;
        let position = camera.lookingAt;
        return DrawableObject(new TransparentBox(gl, size, position), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            materials(lighting(vec4(.2, .2, .2, 1), vec4(.9, .9, .9, 1), vec4(.9, .9, .9, 1)), 100),);
    }

    function manageControls() {


        document.addEventListener('keydown', (event) => {
            pressedKeys[event.key] = true;
        });

        document.addEventListener('keyup', (event) => {
            delete pressedKeys[event.key];
        });

        var incrementArray = (array, inc) => {
            for (let i = 0; i < 3; i++) {
                array[i] += inc;
            }
        }
        var lightIncrement = .1;

        document.addEventListener('keydown', function (event) {

            if (event.key == "^") {
                let output = "#states: " + cameraSavedStates[0].length

                var printVFormatted = (s) => {
                    return "[" + s[0].toFixed(3) + ", " + s[1].toFixed(3) + "," + s[2].toFixed(3) + "],"
                }

                for (let i = 0; i < cameraSavedStates.length; i++) {
                    let state = cameraSavedStates[i];
                    output += ("{position: " + printVFormatted(state[0]) + " lookAt: " + printVFormatted(state[1]) + " up: " + printVFormatted(state[2]) + " duration: 1},\n");
                    if (i % 10 == 0) {
                        output += ("\n")
                    }
                }
                console.log(output);
            }

            if (pressedKeys["p"]) { // water materials
                // console.log("Water Material: " + waterMaterials.ambient + ", " + waterMaterials.diffuse + ", " + waterMaterials.specular);
                adjustLighting(geometricMaterials, lightIncrement, event.key);

                return;

            }
            else if (pressedKeys["r"]) {
                adjustLighting(rockMaterials, lightInc, event.key);
                return;
            }
            else if (pressedKeys["g"]) {
                adjustLighting(grassMaterials, lightInc, event.key);
            }
            else if (pressedKeys["w"]) {
                switch (event.key) {
                    case ("1"):
                        incrementArray(worldLight.ambient, lightIncrement);
                        break;
                    case ("2"):
                        incrementArray(worldLight.diffuse, lightIncrement);
                        break;
                    case ("3"):
                        incrementArray(worldLight.specular, lightIncrement);
                        break;
                    case ("4"):
                        worldLight.shininess += 5;
                        break;
                    case ("5"):
                        worldLight.shininess -= 5;
                        break;
                    case ("6"):
                        incrementArray(worldLight.ambient, -lightIncrement);
                        break;
                    case ("7"):
                        incrementArray(worldLight.diffuse, -lightIncrement);
                        break;
                    case ("8"):
                        incrementArray(worldLight.specular, -lightIncrement);
                        break;

                }
                console.log("WorldLight: ", " ambien: " + worldLight.ambient, " diffuse: ", worldLight.diffuse, " specular: ", worldLight.specular)
                return;
            }


            if (event.key == '0') {
                camera.setLocked(!camera.isLocked());
            }

            if (pressedKeys["Shift"]) {
                //adjustControlArray(event, lookingAt, lookInc);

                switch (event.key) {
                    case ("ArrowLeft"):
                        camera.rotateTheta(angleInc);
                        break;
                    case ("ArrowRight"):
                        camera.rotateTheta(-angleInc);
                        break;
                    case ("ArrowDown"):

                        camera.rotatePhi(-angleInc);
                        break;
                    case ("ArrowUp"):
                        camera.rotatePhi(angleInc);
                        break;
                    case ("f"):
                    case ("F"):
                        camera.forward(cameraAtInc)
                        break;
                    case ("b"):
                    case ("B"):
                        camera.backward(cameraAtInc)
                        break;
                    case ("r"):
                    case ("R"):
                        camera.right(cameraAtInc)
                        break;
                    case ("l"):
                    case ("L"):
                        camera.left(cameraAtInc)
                        break;
                    case ("i"):
                    case ("I"):
                        camera.updateFocusDepth(1 - depthChangeInc);
                        break;
                    case ("o"):
                    case ("O"):
                        camera.updateFocusDepth(1 + depthChangeInc);
                        break;
                    case ("n"):
                    case ("N"):
                        boundingNear += boundingInc;
                        break;
                    case ("e"):
                    case ("E"):
                        boundingFar += boundingInc;
                        break;
                    case ("a"):
                    case ("A"):

                        viewAngle -= angleInc;
                        break;

                }
            } else if (pressedKeys["l"]) {
                adjustControlArray(event, lightPosition, lightInc);
            }
            else {
                //adjustControlArray(event, cameraLocation, cameraAtInc);

                switch (event.key) {
                    case ("ArrowLeft"):
                        camera.updatePosition([-cameraAtInc, 0, 0]);
                        break;
                    case ("ArrowRight"):
                        camera.updatePosition([cameraAtInc, 0, 0]);
                        break;
                    case ("ArrowDown"):
                        camera.updatePosition([0, -cameraAtInc, 0]);
                        break;
                    case ("ArrowUp"):
                        camera.updatePosition([0, cameraAtInc, 0]);
                        break;
                    case ("f"):
                    case ("F"):
                        camera.updatePosition([0, 0, -cameraAtInc]);
                        break;
                    case ("b"):
                    case ("B"):
                        camera.updatePosition([0, 0, cameraAtInc]);
                        break;
                    case ("n"):
                    case ("N"):
                        boundingNear -= boundingInc;
                        break;
                    case ("e"):
                    case ("E"):
                        boundingFar -= boundingInc;
                        break;
                    case ("a"):
                    case ("A"):
                        viewAngle = Math.min(355, viewAngle + angleInc);
                        break;
                }

            }


            startAnimation();

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
    // return look;
    return [
        look[2] * Math.sin(look[0]),
        look[2] * Math.cos(look[1]),
        look[2] * Math.cos(look[0]),
    ]
}

function adjustLighting(material, lightIncrement, input) {

    var incrementArray = (array, inc) => {
        for (let i = 0; i < 3; i++) {
            array[i] += inc;
        }
    }
    switch (input) {
        case ("1"):
            incrementArray(material.ambient, lightIncrement);
            break;
        case ("2"):
            incrementArray(material.diffuse, lightIncrement);
            break;
        case ("3"):
            incrementArray(material.specular, lightIncrement);
            break;
        case ("4"):
            material.shininess += 5;
            break;
        case ("5"):
            material.shininess -= 5;
            break;
        case ("6"):
            incrementArray(material.ambient, -lightIncrement);
            break;
        case ("7"):
            incrementArray(material.diffuse, -lightIncrement);
            break;
        case ("8"):
            incrementArray(material.specular, -lightIncrement);
            break;
    }


    console.log("material: " + material.ambient + ", " + material.diffuse + ", " + material.specular);
    console.log("shininess: " + material.shininess);
}
