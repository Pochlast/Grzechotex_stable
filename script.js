document.querySelector(".home-btn").addEventListener('click', goHome)
document.querySelector(".play-btn").addEventListener('click', startRattle)

function goHome() {
    document.querySelector(".home-view").style["display"] = "block";
    document.querySelector(".rattle-view").style["display"] = "none";

    BALLZ = []
    WALLZ = []
}

document.querySelector("#quantity").oninput = function () {
    document.querySelector(".quantity-range").innerHTML = this.value;
}

function startRattle() {
    let quantity = document.querySelector("#quantity").value;
    let size = document.querySelector("#one").checked;

    document.querySelector(".home-view").style["display"] = "none";
    document.querySelector(".rattle-view").style["display"] = "block";

    for (let i = 0; i < quantity; i++) {
        let newBall = new Ball(randInt(100, 500), randInt(50, 400), size ? 20 : randInt(20, 50), randInt(0, 10));
        newBall.elasticity = randInt(0, 10) / 10;
    }

    BALLZ[0].player = true;
}

document.querySelector(".rattle-btns").onclick = function(e){
    document.querySelectorAll(".rattle-btns img")[0].classList.remove("target")
    document.querySelectorAll(".rattle-btns img")[1].classList.remove("target")
    document.querySelectorAll(".rattle-btns img")[2].classList.remove("target")

    e.target.classList.add("target");
    if(e.target.classList.value.includes('1')) soundFile = './grzechotka_2.mp3'
    if(e.target.classList.value.includes('2')) soundFile = './grzechotka_3.wav'
    if(e.target.classList.value.includes('3')) soundFile = ''
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let BALLZ = [];
let WALLZ = [];

let LEFT, UP, RIGHT, DOWN;
let friction = 0.001;
let coef_restitution = 0.90;
let coef_ability = 3.5;
let soundFile = './grzechotka_2.mp3'


var devicePixelRatio = window.devicePixelRatio || 1;
dpi_x = document.getElementById('testdiv').offsetWidth * devicePixelRatio;
dpi_y = document.getElementById('testdiv').offsetHeight * devicePixelRatio;
console.log(dpi_x, dpi_y);

let wall_width = window.innerWidth-40;
let wall_height = window.innerHeight-140;

ctx.canvas.width = wall_width
ctx.canvas.height = wall_height

let vel_lim = 3;
const acl = new Accelerometer({ frequency: 600 });

acl.start();

let acc_x_test = 0;

const wersja = 35;

let acc_x = -acl.x;
let acc_y = acl.y;

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    subtr(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    mult(n) {
        return new Vector(this.x * n, this.y * n);
    }

    normal() {
        return new Vector(-this.y, this.x).unit();
    }

    unit() {
        if (this.mag() === 0) {
            return new Vector(0, 0);
        } else {
            return new Vector(this.x / this.mag(), this.y / this.mag());
        }
    }

    drawVec(start_x, start_y, n, color) {
        ctx.beginPath();
        ctx.moveTo(start_x, start_y);
        ctx.lineTo(start_x + this.x * n, start_y + this.y * n);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
}

class Ball {
    constructor(x, y, r, m) {
        this.pos = new Vector(x, y);
        this.r = r;
        this.m = m;
        if (this.m === 0) {
            this.inv_m = 0;
        } else {
            this.inv_m = 1 / this.m;
        }
        this.elasticity = 1;
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.acceleration = 2; //bylo 3
        this.player = true;
        this.soundAbilityHorizontal = true;
        this.soundAbilityVertical = true;
        BALLZ.push(this);
    }

    drawBall() {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = "#e98935";
        ctx.fill();
        ctx.closePath();   
    }

    reposition() {
        this.acc = this.acc.unit().mult(this.acceleration);
        this.vel = this.vel.add(this.acc);
        this.vel = this.vel.mult(1 - friction);
        this.pos = this.pos.add(this.vel);
    }
}

//Walls are line segments between two points
class Wall {
    constructor(x1, y1, x2, y2) {
        this.start = new Vector(x1, y1);
        this.end = new Vector(x2, y2);
        WALLZ.push(this);
    }

    drawWall() {
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.closePath();
    }

    wallUnit() {
        return this.end.subtr(this.start).unit();
    }
}

function acc_Control(b) {
    b.acc.x = -acl.x*dpi_x*2.54;
    b.acc.y = acl.y*dpi_x*2.54;
}

function round(number, precision) {
    let factor = 10 ** precision;
    return Math.round(number * factor) / factor;
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//returns with the closest point on a line segment to a given point
function closestPointBW(b1, w1) {
    let ballToWallStart = w1.start.subtr(b1.pos);
    if (Vector.dot(w1.wallUnit(), ballToWallStart) > 0) {
        return w1.start;
    }

    let wallEndToBall = b1.pos.subtr(w1.end);
    if (Vector.dot(w1.wallUnit(), wallEndToBall) > 0) {
        return w1.end;
    }

    let closestDist = Vector.dot(w1.wallUnit(), ballToWallStart);
    let closestVect = w1.wallUnit().mult(closestDist);
    return w1.start.subtr(closestVect);
}

function coll_det_bb(b1, b2) {
    if (b1.r + b2.r >= b2.pos.subtr(b1.pos).mag()) {
        return true;
    } else {
        return false;
    }
}

function Horizontal_coll(b) {
    if (b.soundAbilityHorizontal && Math.abs(b.vel.x) > vel_lim) {
        b.soundAbilityHorizontal = false;
        if (b.pos.x > 1 / 3 * wall_width && b.pos.x < 2 / 3 * wall_width) { new Audio(soundFile).play(); }
        new Audio(soundFile).play();
    }
}

function Vertical_coll(b) {
    if (b.soundAbilityHorizontal && Math.abs(b.vel.y) > vel_lim) {
        b.soundAbilityHorizontal = false;
        if (b.pos.y > 1 / 3 * wall_height && b.pos.y < 2 / 3 * wall_height) { new Audio(soundFile).play(); }
        new Audio(soundFile).play();
    }
}

function zderzenie(b) {

    acc_x_test = Math.round(b.vel.y * 100) / 100;

    if (b.pos.x < 0) {
        b.vel.x = -b.vel.x * coef_restitution;
        b.pos.x += -b.pos.x;
        Horizontal_coll(b)
    }

    if (b.pos.x > wall_width - 2*b.r) {
        b.vel.x = -b.vel.x * coef_restitution
        b.pos.x -= b.pos.x - (wall_width - b.r)
        Horizontal_coll(b)
    }

    if (b.pos.y < 0 + b.r) {
        b.vel.y = -b.vel.y * coef_restitution
        b.pos.y += b.r - b.pos.y
        Vertical_coll(b)

    }
    if (b.pos.y > wall_height - b.r) {
        b.vel.y = -b.vel.y * coef_restitution
        b.pos.y -= b.pos.y - (wall_height - b.r)
        Vertical_coll(b)
    }
}


function canPlaySound(b) {
    if (b.pos.x > 0 + coef_ability * b.r && b.pos.x < wall_width - coef_ability * b.r) {
        b.soundAbilityHorizontal = true;
    }

    if (b.pos.y > 0 + coef_ability * b.r && b.pos.y < wall_height - coef_ability * b.r) {
        b.soundAbilityHorizontal = true;
    }
}


//collision detection between ball and wall
function coll_det_bw(b1, w1) {
    let ballToClosest = closestPointBW(b1, w1).subtr(b1.pos);
    if (ballToClosest.mag() <= b1.r) {
        return true;
    }
}

function pen_res_bb(b1, b2) {
    let dist = b1.pos.subtr(b2.pos);
    let pen_depth = b1.r + b2.r - dist.mag();
    let pen_res = dist.unit().mult(pen_depth / (b1.inv_m + b2.inv_m));
    b1.pos = b1.pos.add(pen_res.mult(b1.inv_m));
    b2.pos = b2.pos.add(pen_res.mult(-b2.inv_m));
}

//penetration resolution between ball and wall
function pen_res_bw(b1, w1) {
    let penVect = b1.pos.subtr(closestPointBW(b1, w1));
    b1.pos = b1.pos.add(penVect.unit().mult(b1.r - penVect.mag()));
}

function coll_res_bb(b1, b2) {
    let normal = b1.pos.subtr(b2.pos).unit();
    let relVel = b1.vel.subtr(b2.vel);
    let sepVel = Vector.dot(relVel, normal);
    let new_sepVel = -sepVel * Math.min(b1.elasticity, b2.elasticity);

    let vsep_diff = new_sepVel - sepVel;
    let impulse = vsep_diff / (b1.inv_m + b2.inv_m);
    let impulseVec = normal.mult(impulse);

    b1.vel = b1.vel.add(impulseVec.mult(b1.inv_m));
    b2.vel = b2.vel.add(impulseVec.mult(-b2.inv_m));
}

//collision response between ball and wall
function coll_res_bw(b1, w1) {
    let normal = b1.pos.subtr(closestPointBW(b1, w1)).unit();
    let sepVel = Vector.dot(b1.vel, normal);
    let new_sepVel = -sepVel * b1.elasticity;
    let vsep_diff = sepVel - new_sepVel;
    b1.vel = b1.vel.add(normal.mult(-vsep_diff));
}

function mainLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    

    BALLZ.forEach((b, index) => {

        b.drawBall();
        if (b.player) {
            acc_Control(b);
        }
        //each ball object iterates through each wall object
        zderzenie(BALLZ[index]);

        canPlaySound(b);

        for (let i = index + 1; i < BALLZ.length; i++) {
            if (coll_det_bb(BALLZ[index], BALLZ[i])) {
                pen_res_bb(BALLZ[index], BALLZ[i]);
                coll_res_bb(BALLZ[index], BALLZ[i]);
            }
        }
        b.reposition();
    });

    acc_x = -acl.x;
    acc_y = acl.y;
    //drawing each wall on the canvas
    WALLZ.forEach((w) => {
        w.drawWall();
    })


 
    requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);