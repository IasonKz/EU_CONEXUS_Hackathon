const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");

ctx.imageSmoothingEnabled = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

/////////////////////////////////////////////////////
// GAME STATE
/////////////////////////////////////////////////////

let gameOver = false;
let gameWon = false;

const gravity = 0.7;
const levelWidth = 5000;

let cameraX = 0;

/////////////////////////////////////////////////////
// SPRITES
/////////////////////////////////////////////////////

const idleSheet = new Image();
idleSheet.src = "idle.png";

const runLeftSheet = new Image();
runLeftSheet.src = "run-left.png";

const runRightSheet = new Image();
runRightSheet.src = "run-right.png";

const animations = {

    idle: {
        image: idleSheet,
        frameWidth: 550,
        frameHeight: 880,
        frames: 8,
        drawWidth: 120,
        drawHeight: 192
    },

    runLeft: {
        image: runLeftSheet,
        frameWidth: 800,
        frameHeight: 920,
        frames: 4,
        drawWidth: 145,
        drawHeight: 192
    },

    runRight: {
        image: runRightSheet,
        frameWidth: 800,
        frameHeight: 910,
        frames: 4,
        drawWidth: 145,
        drawHeight: 192
    }
};

let currentAnimation = animations.idle;

/////////////////////////////////////////////////////
// PLAYER
/////////////////////////////////////////////////////

const player = {

    x: 100,
    y: 200,

    width: 120,
    height: 192,

    speed: 5,
    velY: 0,

    jumping: true
};

/////////////////////////////////////////////////////
// ANIMATION
/////////////////////////////////////////////////////

let frameIndex = 0;
let frameTimer = 0;
const frameSpeed = 8;

function setAnimation(animation){

    if(currentAnimation !== animation){

        currentAnimation = animation;
        frameIndex = 0;
        frameTimer = 0;
    }
}

function updateAnimation(){

    frameTimer++;

    if(frameTimer >= frameSpeed){

        frameTimer = 0;

        frameIndex++;

        if(frameIndex >= currentAnimation.frames){

            frameIndex = 0;
        }
    }
}

/////////////////////////////////////////////////////
// INPUT
/////////////////////////////////////////////////////

const keys = {};

document.addEventListener("keydown", e => {

    keys[e.key] = true;

    if(
        (e.key === " " || e.key === "ArrowUp")
        && !player.jumping
    ){

        player.velY = -15;
        player.jumping = true;
    }

    if(
        (gameWon || gameOver)
        && e.key.toLowerCase() === "r"
    ){

        location.reload();
    }
});

document.addEventListener("keyup", e => {

    keys[e.key] = false;
});

/////////////////////////////////////////////////////
// LEVEL
/////////////////////////////////////////////////////

const platforms = [

    {
        x:0,
        y:canvas.height-60,
        width:levelWidth,
        height:60
    },

    {x:400,y:canvas.height-160,width:200,height:20},
    {x:900,y:canvas.height-240,width:200,height:20},
    {x:1400,y:canvas.height-180,width:200,height:20},
    {x:1900,y:canvas.height-260,width:200,height:20},
    {x:2400,y:canvas.height-200,width:200,height:20},
    {x:3000,y:canvas.height-260,width:200,height:20},
    {x:3600,y:canvas.height-180,width:200,height:20},
    {x:4200,y:canvas.height-240,width:200,height:20}
];

const enemies = [

    {
        x:900,
        y:canvas.height-110,
        width:50,
        height:50,
        min:800,
        max:1100,
        speed:2
    },

    {
        x:2600,
        y:canvas.height-110,
        width:50,
        height:50,
        min:2400,
        max:2900,
        speed:2.5
    },

    {
        x:3800,
        y:canvas.height-110,
        width:50,
        height:50,
        min:3600,
        max:4100,
        speed:2
    }
];

const goal = {

    x:4800,
    y:canvas.height-200,
    width:80,
    height:140
};

/////////////////////////////////////////////////////
// COLLISION
/////////////////////////////////////////////////////

function hit(a,b){

    return (

        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/////////////////////////////////////////////////////
// UPDATE
/////////////////////////////////////////////////////

function update(){

    if(gameOver || gameWon) return;

    /////////////////////////////////////////////////////
    // MOVEMENT
    /////////////////////////////////////////////////////

    if(keys["ArrowRight"]){

        player.x += player.speed;

        setAnimation(
            animations.runRight
        );
    }

    else if(keys["ArrowLeft"]){

        player.x -= player.speed;

        setAnimation(
            animations.runLeft
        );
    }

    else{

        setAnimation(
            animations.idle
        );
    }

    /////////////////////////////////////////////////////
    // GRAVITY
    /////////////////////////////////////////////////////

    player.velY += gravity;
    player.y += player.velY;

    player.jumping = true;

    /////////////////////////////////////////////////////
    // PLATFORM COLLISION
    /////////////////////////////////////////////////////

    for(let p of platforms){

        if(

            player.x < p.x + p.width &&
            player.x + player.width > p.x &&

            player.y + player.height > p.y &&
            player.y + player.height < p.y + 25 &&

            player.velY >= 0
        ){

            player.y =
                p.y - player.height;

            player.velY = 0;

            player.jumping = false;
        }
    }

    /////////////////////////////////////////////////////
    // ENEMIES
    /////////////////////////////////////////////////////

    for(let e of enemies){

        e.x += e.speed;

        if(
            e.x < e.min ||
            e.x > e.max
        ){

            e.speed *= -1;
        }

        if(hit(player,e)){

            gameOver = true;

            message.innerText =
                "💀 Game Over - Press R";
        }
    }

    /////////////////////////////////////////////////////
    // GOAL
    /////////////////////////////////////////////////////

    if(hit(player,goal)){

        gameWon = true;

        message.innerText =
            "🎉 You Win! Press R";
    }

    /////////////////////////////////////////////////////
    // FALL
    /////////////////////////////////////////////////////

    if(player.y > canvas.height + 300){

        gameOver = true;

        message.innerText =
            "💀 Game Over - Press R";
    }

    /////////////////////////////////////////////////////
    // BOUNDS
    /////////////////////////////////////////////////////

    if(player.x < 0){

        player.x = 0;
    }

    if(
        player.x >
        levelWidth - player.width
    ){

        player.x =
            levelWidth - player.width;
    }

    /////////////////////////////////////////////////////
    // CAMERA
    /////////////////////////////////////////////////////

    cameraX =
        player.x - canvas.width/3;

    if(cameraX < 0){

        cameraX = 0;
    }

    if(
        cameraX >
        levelWidth - canvas.width
    ){

        cameraX =
            levelWidth - canvas.width;
    }
}

/////////////////////////////////////////////////////
// PARALLAX BACKGROUND
/////////////////////////////////////////////////////

function drawBackground(){

    ctx.fillStyle = "#87CEEB";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#7BBF6A";

    for(let i=0;i<20;i++){

        const x =
            i * 350 -
            cameraX * 0.25;

        ctx.beginPath();

        ctx.arc(
            x,
            canvas.height,
            220,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

/////////////////////////////////////////////////////
// DRAW
/////////////////////////////////////////////////////

function draw(){

    drawBackground();

    /////////////////////////////////////////////////////
    // PLATFORMS
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#4CAF50";

    for(let p of platforms){

        ctx.fillRect(
            p.x-cameraX,
            p.y,
            p.width,
            p.height
        );
    }

    /////////////////////////////////////////////////////
    // ENEMIES
    /////////////////////////////////////////////////////

    ctx.fillStyle = "purple";

    for(let e of enemies){

        ctx.fillRect(
            e.x-cameraX,
            e.y,
            e.width,
            e.height
        );
    }

    /////////////////////////////////////////////////////
    // GOAL
    /////////////////////////////////////////////////////

    ctx.fillStyle = "gold";

    ctx.fillRect(
        goal.x-cameraX,
        goal.y,
        goal.width,
        goal.height
    );

    /////////////////////////////////////////////////////
    // PLAYER
    /////////////////////////////////////////////////////

    ctx.drawImage(

    currentAnimation.image,

    frameIndex *
    currentAnimation.frameWidth,

    0,

    currentAnimation.frameWidth,
    currentAnimation.frameHeight,

    player.x - cameraX,
    player.y,

    currentAnimation.drawWidth,
    currentAnimation.drawHeight
);
}

/////////////////////////////////////////////////////
// LOOP
/////////////////////////////////////////////////////

function loop(){

    update();
    updateAnimation();
    draw();

    requestAnimationFrame(loop);
}

message.innerText =
"← → Move | SPACE Jump | R Restart";

loop();