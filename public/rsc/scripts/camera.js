let camera; //Camera Object

function cameraSetup(){
  camera = new Camera()
}

function cameraDraw(){
  camera.updateOffset()
  //camera.debug()
}

//Delete data that isnt neccesary anymore when leaving Game
function deleteCamera(){
  camera = {}
}

class Camera{
  constructor(){
    this.offsetX = 0; //Offset from 0 point in x direction in units
    this.offsetY = 0; //Offset from 0 point in y direction in units
    this.rdcConst = 30 //Used to easily change size of all Borders
    this.xoBorder = 20*zoom/this.rdcConst //Outer Border of the x Axis
    this.yoBorder = 8*zoom/this.rdcConst //Outer Border of the y Axis
    this.xiBorder = 25*zoom/this.rdcConst //Inner Border of the x Axis
    this.yiBorder = 13*zoom/this.rdcConst //Inner Border of the y Axis
    this.slowSpeed = 0.72
    this.fastSpeed = 7.2
  }

  updateOffset(){
    //If player is inside of Inner Border, move Player with speed matching to distance from Outer Border
    if(self.x - this.offsetX < this.xiBorder){
      const toMove = map(self.x, this.xiBorder + this.offsetX, this.xoBorder + this.offsetX, this.slowSpeed*sdeltaTime, this.fastSpeed*sdeltaTime);
      this.offsetX -= toMove
      self.checkBreaking() //check if player is still breaking same block
    }else if (self.x + self.width - this.offsetX > uwidth - this.xiBorder){
      const toMove = map(self.x + self.width, uwidth - this.xiBorder + this.offsetX, uwidth - this.xoBorder + this.offsetX, this.slowSpeed*sdeltaTime, this.fastSpeed*sdeltaTime);
      this.offsetX += toMove
      self.checkBreaking() //check if player is still breaking same block
    }

    if(self.y - this.offsetY < this.yiBorder){
      const toMove = map(self.y, this.yiBorder + this.offsetY, this.yoBorder + this.offsetY, this.slowSpeed*sdeltaTime, this.fastSpeed*sdeltaTime);
      this.offsetY -= toMove
      self.checkBreaking() //check if player is still breaking same block
    }else if (self.y + self.width - this.offsetY > uheight - this.yiBorder){
      const toMove = map(self.y + self.width, uheight - this.yiBorder + this.offsetY, uheight - this.yoBorder + this.offsetY, this.slowSpeed*sdeltaTime, this.fastSpeed*sdeltaTime);
      this.offsetY += toMove
      self.checkBreaking() //check if player is still breaking same block
    }
  }

  debug(){
    //show Borders, for debugging purposes
    fill(0, 255, 0, 120)
    rect(0, 0, this.xiBorder * u, height)
    rect(width - this.xiBorder * u, 0, this.xiBorder * u, height)

    rect(0, 0, width, this.yiBorder * u)
    rect(0, height - this.yiBorder * u, width, this.yiBorder * u)

    fill(255, 0, 0, 120)
    rect(0, 0, this.xoBorder * u, height)
    rect(width - this.xoBorder * u, 0, this.xoBorder * u, height)

    rect(0, 0, width, this.yoBorder * u)
    rect(0, height - this.yoBorder * u, width, this.yoBorder * u)
  }
}
