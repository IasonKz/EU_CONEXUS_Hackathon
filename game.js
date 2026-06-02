const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* =======================
   GAME STATE
======================= */
let gameWon = false;
let score = 0;
let currentLevel = 0;

/* =======================
   CAMERA
======================= */
const camera = { x: 0 };

/* =======================
   PLAYER
======================= */
const player = {
  x: 100,
  y: 300,
  width: 40,
  height: 40,
  dx: 0,
  dy: 0,
  speed: 5,
  jumpPower: -12,
  grounded: false
};

const gravity = 0.6;

/* =======================
   CLOUDS
======================= */
const clouds = [
  { x: 200, y: 90, speed: 0.15 },
  { x: 700, y: 130, speed: 0.2 },
  { x: 1200, y: 80, speed: 0.1 },
  { x: 1600, y: 110, speed: 0.18 }
];

/* =======================
   LEVELS
======================= */
const levels = [
  {
    groundY: 550,

    platforms: [
      { x: 300, y: 470, width: 160, height: 20 },
      { x: 600, y: 430, width: 160, height: 20 },
      { x: 900, y: 390, width: 160, height: 20 }
    ],

    coins: [
      { x: 330, y: 440, size: 12, collected: false },
      { x: 630, y: 400, size: 12, collected: false },
      { x: 930, y: 360, size: 12, collected: false }
    ],

    enemies: [
      { x: 500, y: 520, width: 30, height: 30, dir: 1 }
    ],

    flag: { x: 1200, y: 480, width: 20, height: 70 }
  },

  {
    groundY: 550,

    platforms: [
      { x: 250, y: 470, width: 140, height: 20 },
      { x: 500, y: 430, width: 140, height: 20 },
      { x: 750, y: 390, width: 140, height: 20 },
      { x: 1000, y: 350, width: 140, height: 20 },
      { x: 1250, y: 310, width: 140, height: 20 }
    ],

    coins: [
      { x: 280, y: 440, size: 12, collected: false },
      { x: 530, y: 400, size: 12, collected: false },
      { x: 780, y: 360, size: 12, collected: false },
      { x: 1030, y: 320, size: 12, collected: false }
    ],

    enemies: [
      { x: 600, y: 520, width: 30, height: 30, dir: 1 },
      { x: 1100, y: 520, width: 30, height: 30, dir: -1 }
    ],

    flag: { x: 1400, y: 480, width: 20, height: 70 }
  }
];

/* =======================
   WORLD
======================= */
let platforms = [];
let coins = [];
let enemies = [];
let flag = {};
let groundY = 550;

/* full ground rectangle (IMPORTANT FIX) */
const ground = {
  x: -1000,
  y: 550,
  width: 6000,
  height: 200
};

/* =======================
   LOAD LEVEL (SAFE RESET)
======================= */
function loadLevel(index) {
  const level = levels[index];

  platforms = level.platforms.map(p => ({ ...p }));
  coins = level.coins.map(c => ({ ...c, collected: false }));
  enemies = level.enemies.map(e => ({ ...e }));
  flag = { ...level.flag };

  ground.y = level.groundY;
  groundY = level.groundY;

  player.x = 100;
  player.y = 300;
  player.dx = 0;
  player.dy = 0;

  camera.x = 0;
  gameWon = false;

  document.getElementById("level").innerText = "Level: " + (index + 1);
  document.getElementById("score").innerText = "Coins: " + score;
  document.getElementById("winScreen").style.display = "none";
}

loadLevel(currentLevel);

/* =======================
   INPUT
======================= */
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

/* =======================
   UPDATE
======================= */
function update() {
  if (gameWon) return;

  // movement
  if (keys["ArrowRight"]) player.dx = player.speed;
  else if (keys["ArrowLeft"]) player.dx = -player.speed;
  else player.dx = 0;

  if (keys[" "] && player.grounded) {
    player.dy = player.jumpPower;
    player.grounded = false;
  }

  player.dy += gravity;

  player.x += player.dx;
  player.y += player.dy;

  camera.x = player.x - 200;

  player.grounded = false;

  /* =======================
     🔥 STRONG GROUND COLLISION (FIX)
  ======================= */
  const playerBottom = player.y + player.height;

  if (
    player.x < ground.x + ground.width &&
    player.x + player.width > ground.x &&
    playerBottom >= ground.y &&
    playerBottom - player.dy <= ground.y
  ) {
    player.y = ground.y - player.height;
    player.dy = 0;
    player.grounded = true;
  }

  /* =======================
     PLATFORM COLLISION (FIXED)
  ======================= */
  for (let p of platforms) {

    const playerBottom = player.y + player.height;
    const playerTop = player.y;

    const isOverlapping =
      player.x + player.width > p.x &&
      player.x < p.x + p.width &&
      playerBottom >= p.y &&
      playerTop < p.y + p.height;

    const wasAbove = playerBottom - player.dy <= p.y;

    if (isOverlapping && player.dy >= 0 && wasAbove) {
      player.y = p.y - player.height;
      player.dy = 0;
      player.grounded = true;
    }
  }

  /* =======================
     COINS
  ======================= */
  for (let c of coins) {
    if (!c.collected &&
      player.x < c.x + c.size &&
      player.x + player.width > c.x &&
      player.y < c.y + c.size &&
      player.y + player.height > c.y
    ) {
      c.collected = true;
      score++;
      document.getElementById("score").innerText = "Coins: " + score;
    }
  }

  /* =======================
     ENEMIES
  ======================= */
  for (let e of enemies) {
    e.x += e.dir * 2;

    if (e.x < 400 || e.x > 1600) e.dir *= -1;

    if (
      player.x < e.x + e.width &&
      player.x + player.width > e.x &&
      player.y < e.y + e.height &&
      player.y + player.height > e.y
    ) {
      player.x = 100;
      player.y = 300;
    }
  }

  /* =======================
     WIN CONDITION
  ======================= */
  if (
    player.x < flag.x + flag.width &&
    player.x + player.width > flag.x &&
    player.y < flag.y + flag.height &&
    player.y + player.height > flag.y
  ) {
    gameWon = true;
    document.getElementById("winScreen").style.display = "flex";
  }
}

/* =======================
   DRAW
======================= */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, 0);

  /* SKY */
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(camera.x, 0, canvas.width * 5, canvas.height);

  /* CLOUDS */
  ctx.fillStyle = "white";
  for (let c of clouds) {
    c.x -= c.speed;

    ctx.beginPath();
    ctx.arc(c.x - camera.x * 0.3, c.y, 25, 0, Math.PI * 2);
    ctx.arc(c.x + 25 - camera.x * 0.3, c.y + 10, 25, 0, Math.PI * 2);
    ctx.arc(c.x + 50 - camera.x * 0.3, c.y, 25, 0, Math.PI * 2);
    ctx.fill();

    if (c.x < -200) c.x = 2000;
  }

  /* GROUND (VISIBLE + COLLISION SAME LINE) */
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(ground.x, ground.y, ground.width, ground.height);

  /* PLATFORMS */
  ctx.fillStyle = "#654321";
  for (let p of platforms) {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }

  /* COINS */
  ctx.fillStyle = "gold";
  for (let c of coins) {
    if (!c.collected) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ENEMIES */
  ctx.fillStyle = "black";
  for (let e of enemies) {
    ctx.fillRect(e.x, e.y, e.width, e.height);
  }

  /* FLAG */
  ctx.fillStyle = "red";
  ctx.fillRect(flag.x, flag.y, flag.width, flag.height);

  ctx.fillStyle = "white";
  ctx.fillRect(flag.x + 5, flag.y, 10, 20);

  /* PLAYER */
  ctx.fillStyle = "red";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.restore();
}

/* =======================
   LOOP
======================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

/* =======================
   UI
======================= */
function nextLevel() {
  currentLevel++;

  if (currentLevel >= levels.length) {
    currentLevel = 0;
    score = 0;
  }

  loadLevel(currentLevel);
}

function restartLevel() {
  loadLevel(currentLevel);
}