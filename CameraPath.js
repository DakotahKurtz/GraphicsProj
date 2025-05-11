class CameraPath {
    constructor(keyframes, startingIndex = 0) {
        this.keyframes = keyframes;
        this.currentIndex = startingIndex;
        this.time = 0;
    }

    update(dt, camera) {
        // console.log("try update")
        if (this.currentIndex >= this.keyframes.length - 1) return;
        const curr = this.keyframes[this.currentIndex];
        const next = this.keyframes[this.currentIndex + 1];
        // console.log("Time: " + this.time)
        // console.log("current: " + curr.position + ", " + curr.lookAt)
        // console.log("next: " + next.position + ", " + next.lookAt);

        this.time += dt;
        const t = Math.min(this.time / curr.duration, 1);

        camera.position = lerpVec(curr.position, next.position, t);
        camera.lookingAt = lerpVec(curr.lookAt, next.lookAt, t);

        if (t >= 1) {
            console.log("finished w/ index: " + this.currentIndex + " | dur: " + curr.duration + " | " + curr.position);

            this.time = 0;
            this.currentIndex++;
            console.log("to index: " + this.currentIndex + " | " + next.duration + " | " + next.position);

        }
    }
}
