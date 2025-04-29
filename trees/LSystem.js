const _PRESETS = [
    {
        axiom: 'X',
        rules: [
            ['F', 'FF'],
            ['X', 'F+[-F-XF-X][+FF][--XF[+X]][++F-X]'],
        ]
    },
    {
        axiom: 'FX',
        rules: [
            ['F', 'FF+[+F-F-F]-[-F+F+F]'], // 
        ]
    },
    {
        axiom: 'X',
        rules: [
            ['F', 'FX[FX[+XF]]'],
            ['X', 'FF[+XZ++X-F[+ZX]][-X++F-X]'],
            ['Z', '[+F-X-F][++ZX]'],
        ]
    },
    {
        axiom: 'F',
        rules: [
            ['F', 'F > F[+F]F[-F]F'],
        ]
    },
];

class TurtleStates {
    constructor(startX, startY, startAngle, branchAngle) {
        this.stack = [];
        this.currX = startX;
        this.currY = startY;
        this.points = [];
        this.currAngle = startAngle;
        this.branchAngle = branchAngle;
    }

    forward(l) {
        console.log("Forward")
        let nextX = this.currX + l * Math.cos(this.toRads(this.currAngle));
        let nextY = this.currY + l * Math.sin(this.toRads(this.currAngle));

        this.pushPrint([this.currX, this.currY]);
        this.currX = nextX;
        this.currY = nextY;
        this.pushPrint([this.currX, this.currY]);

        // this.pushPrint([this.currX, this.currY]);

    }

    pushPrint(arr) {
        console.log("Pushing " + arr[0] + ", " + arr[1]);
        this.points.push(arr);
    }

    rotateL() {
        console.log("RotateL")
        console.log("Curr: " + this.currAngle);
        this.currAngle += this.branchAngle;
        console.log("becomes: " + this.currAngle);

    }

    rotateR() {
        console.log("RotateR")
        console.log("Curr: " + this.currAngle);

        this.currAngle -= this.branchAngle;
        console.log("becomes: " + this.currAngle);

    }

    toRads(degrees) {
        return degrees * Math.PI / 180;
    }

    pop() {
        console.log("POP")
        let t = this.stack.pop();
        this.printTurtle(t);
        this.update(t);

        // this.pushPrint([this.currX, this.currY]);

    }

    printTurtle(t) {
        console.log("Turtle: " + t.x + ", " + t.y + " | " + t.angle);
    }

    save() {
        console.log("Save")
        let t = Turtle(this.currX, this.currY, this.currAngle);
        this.printTurtle(t);
        this.stack.push(t);
    }

    update(turtle) {
        this.currX = turtle.x;
        this.currY = turtle.y;
        this.currAngle = turtle.angle;
    }
}

function Turtle(x, y, angle) {
    return {
        x: x,
        y: y,
        angle: angle,
    }
}

class LSystem {
    constructor(preset, iterations, branchAngle, branchLength) {
        this._axiom = _PRESETS[preset].axiom;
        this._rules = _PRESETS[preset].rules;

        this._sentence = this._axiom;
        this._id = 0;
        this._iterations = iterations;
        this._branchAngle = branchAngle;
        this._branchLength = branchLength;
        this._branchLengthFalloff = .7;
        this._ApplyRules();
    }

    render() {
        console.log(this._sentence);

        let states = new TurtleStates(0, 0, 90, this._branchAngle);
        let len = this._branchLength;

        for (let i = 0; i < this._sentence.length; i++) {
            let c = this._sentence[i];
            if (c == 'F') {
                states.forward(len);
            } else if (c == '+') {
                states.rotateL();
            } else if (c == '-') {
                states.rotateR();
            } else if (c == ']') {
                states.pop();
            }
            else if (c == '[') {
                states.save();
            }
        }

        for (let i = 0; i < states.points.length; i++) {
            let p = states.points[i];
            console.log(i + " | " + p[0] + ", " + p[1]);
        }
        return states.points

    }

    _FindMatchingRule(c) {
        for (let rule of this._rules) {
            if (c == rule[0]) {
                return rule;
            }
        }
        return null;
    }

    _ApplyRulesToSentence(sentence) {
        let newSentence = '';
        for (let i = 0; i < sentence.length; i++) {
            const c = sentence[i];

            const rule = this._FindMatchingRule(c);
            if (rule) {
                newSentence += rule[1];
            } else {
                newSentence += c;
            }
        }
        return newSentence;
    }

    _ApplyRules() {
        let cur = this._axiom;
        for (let i = 0; i < this._iterations; i++) {
            cur = this._ApplyRulesToSentence(cur);

            this._branchLength *= this._branchLengthFalloff;
        }
        this._sentence = cur;
    }


};