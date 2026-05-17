
const canvas = document.querySelector('canvas');

const c = canvas.getContext('2d');

canvas.width=window.innerWidth
canvas.height=window.innerHeight

console.log(canvas);

const startY = canvas.height/2

class Player {
    constructor() {
        this.position ={
            x: 100,
            y: canvas.height/2 
        }
        this.velocity={
            x:0,
            y:0        }
        this.width = 30
        this.height = 30

        this.baseY= this.position.y;
        this.frame=0;
    }
    draw() {
        c.fillStyle= 'yellow'
        c.fillRect(this.position.x, this.position.y,this.width, this.height)
    }

    update() {
        this.frame++;
        this.baseY+= this.velocity.y;
        this.velocity.y *=0.9;
        this.position.y=this.baseY + Math.sin(this.frame * 0.05) * 10;
        this.position.x +=this.velocity.x
        this.draw()

        if (this.position.y<0) {
            this.position.y=0;
            this.baseY=0;
            this.velocity.y=0;
        }
        
        if(this.position.y + this.height > canvas.height) {
            this.position.y =canvas.height-this.height;
            this.baseY= canvas.height-this.height;
            this.velocity.y=0;
        }

        if (this.position.x<0){
            this.position.x=0;
        }

        if(this.position.x > canvas.width/2){
            this.position.x= canvas.width/2 -this.width
        }

        
    }
}

const player= new Player()
player.update()

function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0,0, canvas.width, canvas.height)
    player.update()
}

animate()

addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'ArrowDown': 
          console.log('down')
          player.velocity.y = 2
          break
    
        case 'ArrowUp': 
          console.log('up')
          player.velocity.y = -2
          break
        case 'ArrowLeft': 
          console.log('left')
          player.velocity.x = -2
          break
        case 'ArrowRight': 
         console.log('Right')
         player.velocity.x = 2
         break
    }

})

addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'ArrowDown': 
        case 'ArrowUp': 
          console.log('up')
          player.velocity.y = 0
          break
        case 'ArrowLeft': 
        case 'ArrowRight': 
         console.log('Right')
         player.velocity.x =0
         break
    }

})