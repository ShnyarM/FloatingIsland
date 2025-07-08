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

    this.moveSpeedLower = 4;
    this.moveSpeedUpper = 6;
    this.moveSpeedChange = 0.03;
    this.moveSpeed = this.moveSpeedLower;
  }

  updateOffset(){
    if(playerHurt) return;
    this.moveSpeed = min(this.moveSpeedLower + this.moveSpeedChange*timer, this.moveSpeedUpper)
    if(moveCamera) this.offsetX += this.moveSpeed*sdeltaTime
  }
}
