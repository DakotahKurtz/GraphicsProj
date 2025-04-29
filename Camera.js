class Camera {
    constructor(position, up, lookingAt) {
        this.position = position;
        this.up = up;
        this.r = lookingAt[0]
        this.theta = lookingAt[1]
        this.phi = lookingAt[2]
    }

    panXZ(deltaTheta) {
        this.theta += deltaTheta;
    }

    panY(deltaPhi) {
        this.phi += deltaPhi;
    }

    slideX(delta) {
        this.position[0] += delta;
    }
    slideY(delta) {
        this.position[1] += delta;
    }
    slideZ(delta) {
        this.position[2] += delta;
    }
    adjustR(delta) {
        this.r += delta;
    }
    /**
     * 
     * @returns         let eye = vec3(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
            let at = vec3(lookingAt[0], lookingAt[1], lookingAt[2]);
            let up = vec3(0, 1, 0);
    
            let mvMatrix = lookAt(eye, at, up);
     */
    getMatrix() {
        return lookAt(this.position, [this.r * Math.cos(this.theta), this.r * Math.sin(this.phi), this.r * Math.sin(this.theta), this.up
        ]);
    }

    _distance(arr) {
        return Math.sqrt((arr[0] * arr[0]) + (arr[1] * arr[1]) + (arr[2] * arr[2]));
    }
}