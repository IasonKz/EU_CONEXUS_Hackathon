
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const message = document.getElementById("message");

const backgroundImage = new Image();
backgroundImage.src = "background-level1.PNG";

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
// DIALOGUE SYSTEM
/////////////////////////////////////////////////////

let dialogueActive = false;
let currentDialogue = null;

const dialogueZones = [

    {
        x: 400,
        triggered: false,
        title: "Welcome!",
        text: "Guide FLora to the Apis Mellifera and bring her the healing cure!"
    },

    {
        x: 1800,
        triggered: false,
        title: "Machine Learning",
        text: "Machine Learning is a branch of AI where computers learn patterns from data instead of being explicitly programmed."
    },

    {
        x: 3300,
        triggered: false,
        title: "Neural Networks",
        text: "Neural Networks are inspired by the human brain and are used in many modern AI systems."
    }
];

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

    if (
        dialogueActive &&
        e.key === "Enter"
    ) {

        dialogueActive = false;
        currentDialogue = null;

        return;
    }

    keys[e.key] = true;

    if(
        (e.key === " " || e.key === "ArrowUp")
        && !player.jumping
        && !dialogueActive
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

    if(dialogueActive) return;

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
                "Game Over! Press R to restart!";
        }
    }

    /////////////////////////////////////////////////////
    // GOAL
    /////////////////////////////////////////////////////

    if(hit(player,goal)){

        gameWon = true;

        message.innerText =
            "You Win!";
    }

    /////////////////////////////////////////////////////
    // FALL
    /////////////////////////////////////////////////////

    if(player.y > canvas.height + 300){

        gameOver = true;

        message.innerText =
            "Game Over! Press R to restart!";
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
// DIALOGUE TRIGGERS
/////////////////////////////////////////////////////

for(const zone of dialogueZones){

    if(
        !zone.triggered &&
        player.x >= zone.x
    ){

        zone.triggered = true;

        dialogueActive = true;

        currentDialogue = zone;
    }
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

    if(!backgroundImage.complete)
        return;

    const parallax = cameraX * 0.2;

    const scale =
        canvas.height /
        backgroundImage.height;

    const drawWidth =
        backgroundImage.width *
        scale;

    for(let i = -1; i < 10; i++){

        ctx.drawImage(
            backgroundImage,
            i * drawWidth - parallax,
            0,
            drawWidth,
            canvas.height
        );
    }
}

function wrapText(
    text,
    x,
    y,
    maxWidth,
    lineHeight
){

    const words = text.split(" ");
    let line = "";

    for(let n = 0; n < words.length; n++){

        const testLine =
            line + words[n] + " ";

        const metrics =
            ctx.measureText(testLine);

        const testWidth =
            metrics.width;

        if(
            testWidth > maxWidth &&
            n > 0
        ){

            ctx.fillText(
                line,
                x,
                y
            );

            line =
                words[n] + " ";

            y += lineHeight;
        }

        else{

            line = testLine;
        }
    }

    ctx.fillText(
        line,
        x,
        y
    );
}

function roundRect(
    x,
    y,
    width,
    height,
    radius
){

    ctx.beginPath();

    ctx.moveTo(x + radius, y);

    ctx.lineTo(
        x + width - radius,
        y
    );

    ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    ctx.lineTo(
        x + width,
        y + height - radius
    );

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    ctx.lineTo(
        x + radius,
        y + height
    );

    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    ctx.lineTo(
        x,
        y + radius
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    ctx.closePath();
}

function drawDialogue(){

    if(!dialogueActive || !currentDialogue)
        return;

    const width = 900;
    const height = 240;

    const x =
        (canvas.width - width) / 2;

    const y =
        canvas.height - 600;

    /////////////////////////////////////////////////////
    // SHADOW
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#C59D79";

    ctx.fillRect(
        x + 8,
        y + 8,
        width,
        height
    );

    /////////////////////////////////////////////////////
    // MAIN PANEL
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#EFE7D8";

    roundRect(
        x,
        y,
        width,
        height,
        16
    );

    ctx.fill();

    /////////////////////////////////////////////////////
    // BORDER
    /////////////////////////////////////////////////////

    ctx.strokeStyle = "#F0B6B6";
    ctx.lineWidth = 6;

    roundRect(
        x,
        y,
        width,
        height,
        16
    );

    ctx.stroke();

    /////////////////////////////////////////////////////
    // HEADER BAR
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#DDB46B";

    ctx.fillRect(
        x,
        y,
        width,
        50
    );

    /////////////////////////////////////////////////////
    // TITLE
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#FFFFFF";

    ctx.font = "42px VT323";

    ctx.fillText(
        currentDialogue.title,
        x + 25,
        y + 35
    );

    /////////////////////////////////////////////////////
    // TEXT
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#3F512C";

    ctx.font =
        "32px VT323";

    wrapText(
        currentDialogue.text,
        x + 25,
        y + 95,
        width - 50,
        34
    );

    /////////////////////////////////////////////////////
    // FOOTER
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#6B7A3A";

    ctx.font = "28px VT323";

    ctx.fillText(
     "▶ press enter to continue",
     x + 25,
     y + height - 25
    );
}
/////////////////////////////////////////////////////
// DRAW
/////////////////////////////////////////////////////

function draw(){

    drawBackground();

    /////////////////////////////////////////////////////
    // PLATFORMS
    /////////////////////////////////////////////////////

    ctx.fillStyle = "#8FAF63";

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

drawDialogue();
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



loop();