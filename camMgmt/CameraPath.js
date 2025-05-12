class CameraPath {
    constructor(keyframes, startingIndex = 0) {
        this.keyframes = keyframes;
        this.currentIndex = startingIndex;
        this.setStoredPosition(this.keyframes[this.currentIndex].position, this.keyframes[this.currentIndex].lookAt);
        this.time = 0;


    }

    setStoredPosition(p, l) {
        this.cameraPosition = p;
        this.cameraLookAt = l;
    }

    update(dt, camera) {
        if (this.currentIndex >= this.keyframes.length - 1) {
            this.currentIndex = 0;
        }
        const curr = this.keyframes[this.currentIndex];
        const next = this.keyframes[this.currentIndex + 1];

        this.time += dt;
        const t = Math.min(this.time / curr.duration, 1);

        camera.position = lerpVec(curr.position, next.position, t);
        camera.lookingAt = lerpVec(curr.lookAt, next.lookAt, t);

        this.setStoredPosition(camera.position, camera.lookingAt);

        if (t >= 1) {
            this.time = 0;
            this.currentIndex++;
            console.log(this.currentIndex);

        }
    }
}
