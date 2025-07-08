let camera; //Camera Object
let moveCamera = true;

function cameraSetup(){
  camera = new Camera()
}

function cameraDraw(){
  camera.updateOffset()
}

//Delete data that isnt neccesary anymore when leaving Game
function deleteCamera(){
  camera = {}
}

class Camera{
  constructor(){
    this.offsetX = 0; //Offset from 0 point in x direction in units
    this.offsetY = 11; //Offset from 0 point in y direction in units

    if(!easyMode){
      this.moveSpeedLower = 4;
      this.moveSpeedUpper = 6;
    }else{
      this.moveSpeedLower = 1;
      this.moveSpeedUpper = 2;
    }
    this.moveSpeedChange = 0.03;
    this.moveSpeed = this.moveSpeedLower;

    this.rightBoundaryOuter = 8
    this.rightBoundaryInner = 10
  }

  updateOffset(){
    if(playerHurt) return;
    this.moveSpeed = min(this.moveSpeedLower + this.moveSpeedChange*timer, this.moveSpeedUpper)
    if(moveCamera) this.offsetX += this.moveSpeed*sdeltaTime

    if(easyMode){
      if(player.x > this.offsetX + uwidth - this.rightBoundaryInner){
        const playerPos = player.x-this.offsetX;
        const boundaryPos = uwidth-this.rightBoundaryInner
        const diff = playerPos-boundaryPos
        const toAdd = map(diff, 0, this.rightBoundaryInner-this.rightBoundaryOuter, 0, player.moveSpeed)
        this.offsetX += toAdd*sdeltaTime
      }
      // if right from outer boundary, snap to player position
      if(player.x > this.offsetX + uwidth - this.rightBoundaryOuter){
        this.offsetX = player.x - uwidth + this.rightBoundaryOuter
      }
    }
  }
}
