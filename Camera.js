class Camera {
    constructor(position, lookingAt, up) {
        this.position = position;
        this.up = up;
        this.lookingAt = lookingAt;
        this.direction = this._subtract(this.lookingAt, this.position);
        this.lockedOn = false;
        console.log("Camera initialized");
        this.isOnRails = false;
        this.printState();
    }

    setFixedPath(b) {
        this.isOnRails = b;
    }

    isFixedPath() {
        return this.isOnRails;
    }



    _recoverLookingAt() {
        return this._add(this.position, this.direction);
    }

    setState(state) {
        this.lockedOn = state["lockedOn"];
        this.position = state["position"];
        this.lookingAt = state["lookAt"];
        this.direction = this._subtract(this.lookingAt, this.position);
    }

    getLookingAt() {
        return this.lookingAt;
    }



    getViewMatrix() {
        if (!this.isOnRails) {
            this.lookingAt = this._recoverLookingAt();

        }
        //console.log("Camera: " + this.position + ", " + this.lookingAt)

        return lookAt(this.position, this.lookingAt, this.up);
    }

    updatePosition(delta) {
        // console.log("Update Position | Delta: ", delta);
        this.position = (this._add(this.position, delta));
        if (this.lockedOn) {
            this.direction = this._subtract(this.lookingAt, this.position);
        }
        this.printState();

    }

    forward(delta) {
        // console.log("Forward | Delta: ", delta);
        this.printState();
        let forward = this._normalize(this.direction);
        let change = this._scale(forward, delta);
        this.updatePosition(change);
        // this._checkFixed(change);
        // this.position = this._add(this.position, change);
    }

    backward(delta) {
        // console.log("Backward | Delta: ", delta);
        this.printState();
        let backward = this._normalize(this.direction);
        let change = this._scale(backward, -delta);
        this.updatePosition(change);
    }

    right(delta) {
        // console.log("Right | Delta: ", delta);
        this.printState();
        let right = this._normalize(this._cross(this.up, this.direction));
        let change = this._scale(right, delta);
        this.updatePosition(change);
    }
    left(delta) {
        this.right(-delta);
        // console.log("Left | Delta: ", delta);
        // this.printState();
        // let left = this._normalize(this._cross(this.direction, this.up));
        // let change = this._scale(left, delta);
        // this.updatePosition(change);
    }

    _scale(v, s) {
        return [v[0] * s, v[1] * s, v[2] * s];
    }

    _cross(v1, v2) {
        return [v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]];
    }

    getPosition() {
        return this.position;
    }

    _checkFixed(delta) {
        if (!this.lockedOn) {
            console.log("Camera not locked on");
            this.lookingAt = this._add(this.position, delta);
        }
        return delta;
    }

    rY(v, theta) {
        let cT = Math.cos(theta);
        let sT = Math.sin(theta);
        let x = v[0] * cT + v[2] * sT;
        let y = v[1];
        let z = -v[0] * sT + v[2] * cT;
        return [x, y, z];
    }

    rotatePhi(delta) {
        // console.log("Rotate Phi | Delta: ", delta);
        if (!this.lockedOn) {
            let translateToOrigin = this._subtract(this.lookingAt, this.position);
            let forward = translateToOrigin;
            let right = this._normalize(this._cross(forward, this.up));



            let rotated = this._rotateAroundAxis(forward, right, delta);
            this.lookingAt = this._add(this.position, [rotated[0], rotated[1], rotated[2]]);
            this.direction = this._subtract(this.lookingAt, this.position);
        } else { // rotate camera location around the lockedOn point
            console.log("Camera locked on");
            // let translateToOrigin = this._subtract(this.position, this.lookingAt);
            // let forward = this._normalize(translateToOrigin);
            // let right = this._normalize(this._cross(forward, this.up));
            // let rotated = this._rotateAroundAxis(forward, right, delta);
            // this.position = this._add(this.lookingAt, [rotated[0], rotated[1], rotated[2]]);
            // this.direction = this._subtract(this.lookingAt, this.position);
            let forward = this._normalize(this.direction);
            let right = this._normalize(this._cross(forward, this.up));
            let offset = this._subtract(this.position, this.lookingAt);
            let rotated = this._rotateAroundAxis(offset, right, delta);

            this.position = this._add(this.lookingAt, [rotated[0], rotated[1], rotated[2]]);
            this.direction = this._subtract(this.lookingAt, this.position);
        }

        this.printState();

    }

    updateFocusDepth(delta) {
        this.direction = this._scale(this.direction, delta);
        this.printState();
    }

    rotateTheta(delta) {
        // console.log("Rotate Theta | Delta: ", delta);
        this.printState();
        if (!this.lockedOn) {
            let translateToOrigin = this._subtract(this.lookingAt, this.position);
            let rotated = this.rY(translateToOrigin, delta);

            this.lookingAt = this._add(this.position, [rotated[0], rotated[1], rotated[2]]);
            this.direction = this._subtract(this.lookingAt, this.position);
        } else { // rotate camera location around the lockedOn point
            let translateToOrigin = this._subtract(this.position, this.lookingAt);
            let rotated = this.rY(translateToOrigin, delta);
            this.position = this._add(this.lookingAt, rotated);
            this.direction = this._subtract(this.lookingAt, this.position);
        }
    }

    _rotateAroundAxis(v, k, theta) {
        let cT = Math.cos(theta);
        let sT = Math.sin(theta);
        let dot = this._dot(k, v);
        let cross = this._cross(k, v);
        let x = v[0] * cT + cross[0] * sT + k[0] * dot * (1 - cT);
        let y = v[1] * cT + cross[1] * sT + k[1] * dot * (1 - cT);
        let z = v[2] * cT + cross[2] * sT + k[2] * dot * (1 - cT);

        return [x, y, z];
    }

    _dot(v1, v2) {
        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    }





    isLocked() {
        return this.lockedOn;
    }

    setLocked(isLocked) {
        if (!this.lockedOn && isLocked) {
            this.direction = this._subtract(this.lookingAt, this.position);
            // this.spherical = this._getSpherical(this.direction);
        }
        this.lockedOn = isLocked;
        console.log("Camera locked: ", this.lockedOn);
    }



    _magnitude(v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    _add(v1, v2) {
        return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
    }

    _subtract(v1, v2) {
        return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
    }
    _normalize(v) {
        let length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / length, v[1] / length, v[2] / length];
    }

    _getSpherical(direction) {
        let r = this._magnitude(direction);
        let theta, phi;
        let x = direction[0];
        let y = direction[2];
        let z = direction[1];


        if (z > 0) {
            theta = Math.atan((Math.sqrt(x * x + y * y)) / z);
        } else if (z < 0) {
            theta = Math.PI + Math.atan((Math.sqrt(x * x + y * y)) / z);
        } else if (z == 0 && (Math.sqrt(x * x + y * y) != 0)) {
            theta = Math.PI / 2;
        } else {
            theta = 0;
        }

        if (x > 0) {
            phi = Math.atan(y / x);
        }
        else if (x < 0 && y >= 0) {
            phi = Math.PI + Math.atan(y / x);
        } else if (x < 0 && y < 0) {
            phi = Math.atan(y / x) - Math.PI;
        } else if (x == 0 && y > 0) {
            phi = Math.PI / 2;
        }
        else if (x == 0 && y < 0) {
            phi = -Math.PI / 2;
        }
        else {
            phi = 0;
        }
        return [r, theta, phi];
    }

    _cartesian(spherical) {
        let r = spherical[0];
        let theta = spherical[1];
        let phi = spherical[2];

        let x = r * Math.sin(phi) * Math.sin(theta);
        let y = r * Math.cos(theta);
        let z = r * Math.sin(phi) * Math.cos(theta);

        return [z, y, x];
    }

    printState() {
        // console.log("Camera State: ");
        // console.log("Position: ", this.position);
        // console.log("Looking At: ", this.lookingAt);
        // console.log("Direction: ", this.direction);
        // // console.log("Spherical: r, theta, phi", this.spherical[0], this.spherical[1], this.spherical[2]);
        // console.log("Up: ", this.up);
        // console.log("Locked On: ", this.lockedOn);
    }

    getUp() {
        return this.up;
    }

}