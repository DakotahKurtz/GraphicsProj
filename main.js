"use strict";

const imageURLS = [
    "https://i.ibb.co/7xLCgSbY/sky-Box-Adjusted.png",
    "https://i.ibb.co/tPBYz9fz/flat-Rock-Reduced.png",
    "https://i.ibb.co/6M9cBc6/rock-Reduced.png",
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

var waterMaterials = materials(
    lighting(
        [1.0, 1.0, 1.0, 1.0],
        [0, 0, 0, 1],
        [1.0, 1.0, 1.0, 1],
    ), 20);


var terrainMaterials = materials(
    lighting(
        [1.0, 1.0, 1.0, 1.0],
        [.6, .6, .6, 1],
        [0.0, 0.0, 0.0, 1],
    ), 20);


var then = 0;
var animID;
var isPlaying = false;
var terrainGridDim = 512;

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
        "objectMatrix": flatten(identity()),
        "ambientProduct": 0,
        "diffuseProduct": 0,
        "specularProduct": 0,
        "lightPosition": 0,
        "shininess": 0,
        "eyePosition": 0,
    }

    var programUniformCorrespondence = (program, uniforms) => {
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
    }

    for (const [name] of Object.entries(phongTextureUniforms)) {
        programDataPhongTexture.getUniformInfo(name);
    }

    for (const [name] of Object.entries(textureUniforms)) {
        programDataTexture.getUniformInfo(name);
    }

    for (const [name] of Object.entries(phongUniforms)) {
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
    var cameraAtInc = 1;
    var boundingInc = 1;
    var angleInc = .1;
    var lightInc = .1;
    var depthChangeInc = .1;
    var waterLevel = 1.19;
    var waterInc = .1;

    var cameraLocation = [11, 6, 0];
    var lookingAt = [-6.156638770579235, 7.098167583115111, 11.970355998951227];

    var camera = new Camera(cameraLocation, lookingAt, [0, 1, 0]);

    var boundingNear = .3;
    var boundingFar = 100;
    var viewAngle = 30;

    var lightPosition = vec4(0, 9, 0, 1);
    var lightAmbient = vec4(.3, .3, .3, 1.0);
    var lightDiffuse = vec4(.6, .6, .6, 1.0);
    var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

    var worldLight = lighting(lightAmbient, lightDiffuse, lightSpecular);

    // initialize objects to draw
    const MAP_SIZE = 20;

    var worldArray = generateWorldArray(terrainGridDim, MAP_SIZE, waterLevel, 8);

    DrawableTypes["PhongTexture"].drawableObjects.push(
        DrawableObject(new Terrain(gl, worldArray.terrainMesh, worldArray.worldNoise, 1), programDataPhongTexture,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)]
            , terrainMaterials),

        DrawableObject(new River(gl, worldArray.terrainMesh, worldArray.waterArray, waterLevel, 0), programDataPhongTexture,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(2, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            waterMaterials),
    )

    DrawableTypes["Phong"].drawableObjects.push(

        DrawableObject(new TransparentBox(gl, .5, lightPosition), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            geometricMaterials,),

        DrawableObject(new Sierpinski(gl, 3, 5, [0, 5, -6]), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            geometricMaterials),
        DrawableObject(new GoLDisplay(gl, 20, 20, [-5, 17, -5], 1), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            geometricMaterials,),
        DrawableObject(new Grass(gl, terrainGridDim, MAP_SIZE * 2, 5, worldArray), programDataPhong,
            [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
            geometricMaterials,),
    );

    var trees = [];
    let objectPlacement = worldArray.worldNoise;
    let randomIncHeight = .3;
    let randomIncBase = .05;
    let randomIncSteps = 5;
    var thresh = .002;

    for (let i = 0; i < objectPlacement.length; i++) {
        for (let j = 0; j < objectPlacement[i].length; j++) {
            if (objectPlacement[i][j] == 1 && getRandomFloat(0, 1) < thresh) {
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

    var rocks = [];
    for (let i = 0; i < objectPlacement.length; i++) {
        for (let j = 0; j < objectPlacement[i].length; j++) {
            if (objectPlacement[i][j] == 1 && getRandomFloat(0, 1) < .01) {
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
                        terrainMaterials,
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


    const keyframes = [
        { position: [0, 6, 5], lookAt: [0, 0, 0], duration: 6 },
        { position: [5, 6, 5], lookAt: [0, 0, 0], duration: 2 },
        // { position: [5, 6, 0], lookAt: [0, 0, 0], duration: 2 }
    ];

    const cameraPath = new CameraPath(keyframes);

    manageControls();

    startAnimation();

    function startAnimation() {
        if (isPlaying) {
            cancelAnimationFrame(animID);
        }
        isPlaying = true;
        animID = requestAnimationFrame(render);
    }

    function render(now) {
        now *= 0.001;
        let deltaTime = now - then;
        then = now;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // cameraPath.update(deltaTime, camera);

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
        // textureUniforms["u_texture"] = skyBoxObject.drawable.getTextureID();
        // setUniforms(textureUniforms, programDataTexture);

        // skyBoxObject.draw();

        DrawableTypes["Phong"].drawableObjects.push(
            DrawableObject(new TransparentBox(gl, .5, lightPosition), programDataPhong,
                [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
                materials(lighting(vec4(.2, .2, .2, 1), vec4(.9, .9, .9, 1), vec4(.9, .9, .9, 1)), 100),),
            LookAtBox(camera),
        );
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
        DrawableTypes["Phong"].drawableObjects.pop();
        DrawableTypes["Phong"].drawableObjects.pop();

        // setMaterials(phongUniforms, waterMaterials, worldLight);
        // setUniforms(phongUniforms, programDataPhong);

        // lightFrameObject = DrawableObject(new TransparentBox(gl, .5, lightPosition), programDataPhong,
        //     [bufferAttributes(3, gl.FLOAT), bufferAttributes(3, gl.FLOAT), bufferAttributes(4, gl.FLOAT)],
        //     materials(lighting(vec4(.2, .2, .2, 1), vec4(.9, .9, .9, 1), vec4(.9, .9, .9, 1)), 100),); lightFrameObject.draw();

        // let box = LookAtBox(camera);
        // box.draw();

        // riverObject.drawable.update(now);
        // lightFrameObject.draw();
        // riverObject.draw();
        // setMaterials(phongUniforms, terrainMaterials, worldLight);
        // setUniforms(phongUniforms, programDataPhong);

        // for (let i = 0; i < rocks.length; i++) {
        //     rocks[i].draw();
        // }

        // setMaterials(phongUniforms, spiralMaterials, worldLight);
        // setUniforms(phongUniforms, programDataPhong);
        // spiralObject.draw();
        // for (let i = 0; i < trees.length; i++) {
        //     trees[i].draw();
        // }

        // GoLObject.drawable.update(now);
        // GoLObject.draw();

        // let sierpinskiMatrix = sierpinskiObject.drawable.update(now);
        // phongUniforms["objectMatrix"] = flatten(sierpinskiMatrix);
        // setUniforms(phongUniforms, programDataPhong);
        // sierpinskiObject.draw();


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
        const pressedKeys = {};

        document.addEventListener('keydown', (event) => {
            pressedKeys[event.key] = true;
        });

        document.addEventListener('keyup', (event) => {
            delete pressedKeys[event.key];
        });

        var incrementArray = (array, inc) => {
            for (let i = 0; i < array.length; i++) {
                array[i] += inc;
            }
        }
        var lightIncrement = .1;

        document.addEventListener('keydown', function (event) {
            if (pressedKeys["p"]) { // water materials
                // console.log("Water Material: " + waterMaterials.ambient + ", " + waterMaterials.diffuse + ", " + waterMaterials.specular);
                switch (event.key) {
                    case ("1"):
                        incrementArray(geometricMaterials.ambient, lightIncrement);
                        break;
                    case ("2"):
                        incrementArray(geometricMaterials.diffuse, lightIncrement);
                        break;
                    case ("3"):
                        incrementArray(geometricMaterials.specular, lightIncrement);
                        break;
                    case ("4"):
                        geometricMaterials.shininess += 5;
                        break;
                    case ("5"):
                        geometricMaterials.shininess -= 5;
                        break;
                    case ("6"):
                        incrementArray(geometricMaterials.ambient, -lightIncrement);
                        break;
                    case ("7"):
                        incrementArray(geometricMaterials.diffuse, -lightIncrement);
                        break;
                    case ("8"):
                        incrementArray(geometricMaterials.specular, -lightIncrement);
                        break;
                }

                console.log("Water Material: " + geometricMaterials.ambient + ", " + geometricMaterials.diffuse + ", " + geometricMaterials.specular);
                console.log("Water Shininess: " + geometricMaterials.shininess);
                return;

            }
            if (pressedKeys["w"]) {
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

            // console.log("near: " + boundingNear);
            // console.log("far: " + boundingFar);
            // console.log("angle: " + viewAngle);
            // // console.log("CameraLocation: " + cameraLocation);
            // console.log("Light: " + lightPosition)
            console.log("LookingAt: " + camera.lookingAt);
            // console.log("Near: " + boundingNear + ", Far: " + boundingFar + ", angle: " + viewAngle);
            // console.log("Position: " + cameraLocation)
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

