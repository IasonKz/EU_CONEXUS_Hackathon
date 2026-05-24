const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameState = 'start';

const backgroundImage = new Image();
backgroundImage.src = 'background .png';

const startBackgroundImage = new Image();
startBackgroundImage.src = 'starting_bg.JPG';

const logoImage = new Image();
logoImage.src = 'logo.PNG';

let backgroundX = 0;
const backgroundSpeed = 1;

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

function drawCoverImage(image, x, y, width, height) {
  if (!image.complete || image.naturalWidth === 0) return;

  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;

  let drawWidth;
  let drawHeight;
  let drawX;
  let drawY;

  if (imageRatio > canvasRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
    drawX = x - (drawWidth - width) / 2;
    drawY = y;
  } else {
    drawWidth = width;
    drawHeight = width / imageRatio;
    drawX = x;
    drawY = y - (drawHeight - height) / 2;
  }

  c.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawBackground() {
  if (keys.ArrowRight) {
    backgroundX -= backgroundSpeed;
  }

  if (keys.ArrowLeft) {
    backgroundX += backgroundSpeed;
  }

  if (backgroundX <= -canvas.width) {
    backgroundX = 0;
  }

  if (backgroundX > 0) {
    backgroundX = -canvas.width;
  }

  c.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
  c.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);
}

class Player {
  constructor() {
    this.width = 110;
    this.height = 150;

    this.position = {
      x: 100,
      y: canvas.height / 2 - this.height / 2
    };

    this.velocity = {
      x: 0,
      y: 0
    };

    this.baseY = this.position.y;
    this.frame = 0;

    this.images = [];

    const bee1 = new Image();
    bee1.src = 'bee_1.PNG';

    const bee2 = new Image();
    bee2.src = 'bee_2.PNG';

    const bee3 = new Image();
    bee3.src = 'bee_3.PNG';

    const bee4 = new Image();
    bee4.src = 'bee_4.PNG';

    this.images.push(bee1, bee2, bee3, bee4);

    this.currentImage = 0;
  }

  draw() {
    const currentBeeImage = this.images[this.currentImage];

    c.drawImage(
      currentBeeImage,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update() {
    this.frame++;

    const speedX = 2;
    const speedY = 4;

    this.velocity.x = 0;
    this.velocity.y = 0;

    if (keys.ArrowLeft) {
      this.velocity.x = -speedX;
    }

    if (keys.ArrowRight) {
      this.velocity.x = speedX;
    }

    if (keys.ArrowUp) {
      this.velocity.y = -speedY;
    }

    if (keys.ArrowDown) {
      this.velocity.y = speedY;
    }

    this.position.x += this.velocity.x;
    this.baseY += this.velocity.y;

    this.position.y = this.baseY + Math.sin(this.frame * 0.05) * 10;

    if (this.frame % 8 === 0) {
      this.currentImage++;

      if (this.currentImage >= this.images.length) {
        this.currentImage = 0;
      }
    }

    if (this.position.y < 0) {
      this.position.y = 0;
      this.baseY = 0;
    }

    if (this.position.y + this.height > canvas.height) {
      this.position.y = canvas.height - this.height;
      this.baseY = canvas.height - this.height;
    }

    if (this.position.x < 0) {
      this.position.x = 0;
    }

    if (this.position.x + this.width > canvas.width / 2) {
      this.position.x = canvas.width / 2 - this.width;
    }

    this.draw();
  }
}

const player = new Player();

function drawStartScreen() {
  drawCoverImage(startBackgroundImage, 0, 0, canvas.width, canvas.height);

  c.textAlign = 'center';

  const logoWidth = 500;
  const logoHeight = 500 * (1600 / 1277);

  const logoX = canvas.width / 2 - logoWidth / 2;
  const logoY = canvas.height / 2 - logoHeight / 2 - 180;

  c.drawImage(
    logoImage,
    logoX,
    logoY,
    logoWidth,
    logoHeight
  );

  c.fillStyle = '#06124a';
  c.font = '22px "Courier New", monospace';
  c.fillText(
    '> USE ARROW KEYS TO MOVE',
    canvas.width / 2,
    canvas.height / 2 + 130
  );

  const buttonX = canvas.width / 2 - 100;
  const buttonY = canvas.height / 2 + 170;
  const buttonWidth = 200;
  const buttonHeight = 60;

  c.fillStyle = '#2f4f4f';
  c.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

  c.strokeStyle = '#06124a';
  c.lineWidth = 3;
  c.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

  c.fillStyle = '#ffffff';
  c.font = '28px "Courier New", monospace';
  c.fillText('> START_', canvas.width / 2, buttonY + 40);
}

function animate() {
  requestAnimationFrame(animate);

  c.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'start') {
    drawStartScreen();
  }

  if (gameState === 'playing') {
    drawBackground();
    player.update();
  }
}

animate();

addEventListener('keydown', (event) => {
  if (event.code in keys) {
    event.preventDefault();
    keys[event.code] = true;
  }
});

addEventListener('keyup', (event) => {
  if (event.code in keys) {
    event.preventDefault();
    keys[event.code] = false;
  }
});

canvas.addEventListener('click', (event) => {
  if (gameState !== 'start') return;

  const rect = canvas.getBoundingClientRect();

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const buttonX = canvas.width / 2 - 100;
  const buttonY = canvas.height / 2 + 170;
  const buttonWidth = 200;
  const buttonHeight = 60;

  const clickedStartButton =
    mouseX >= buttonX &&
    mouseX <= buttonX + buttonWidth &&
    mouseY >= buttonY &&
    mouseY <= buttonY + buttonHeight;

  if (clickedStartButton) {
    gameState = 'playing';
  }
});