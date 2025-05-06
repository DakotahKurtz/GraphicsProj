class CameraPath {
    constructor(keyframes) {
        this.keyframes = keyframes;
        this.currentIndex = 0;
        this.time = 0;
    }

    update(dt, camera) {
        if (this.currentIndex >= this.keyframes.length - 1) return;

        const curr = this.keyframes[this.currentIndex];
        const next = this.keyframes[this.currentIndex + 1];

        this.time += dt;
        const t = Math.min(this.time / curr.duration, 1);

        camera.position = lerpVec(curr.position, next.position, t);
        camera.lookingAt = lerpVec(curr.lookAt, next.lookAt, t);

        if (t >= 1) {
            this.time = 0;
            this.currentIndex++;
        }
    }
}
