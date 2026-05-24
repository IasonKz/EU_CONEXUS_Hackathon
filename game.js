
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const backgroundImage = new Image();
backgroundImage.src = 'background .png';

let backgroundX = 0;
const backgroundSpeed = 1;

function drawBackground() {
  
  if (keys.ArrowRight) {
    backgroundX -= backgroundSpeed;
  }

  if (keys.ArrowLeft) {
    backgroundX += backgroundSpeed;
  }

  c.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
  c.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);

}



const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

class Player {
  constructor() {
    this.width = 90;
    this.height = 110;

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

function animate() {
  requestAnimationFrame(animate);

  c.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  player.update();
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