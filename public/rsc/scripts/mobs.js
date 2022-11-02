mobs = {}

//Change to a mob from server
function mobChange(data){
  data.id = parseInt(data.id)
  switch(data.type){
    case "spawn":
      makeNewMonster(data.x, data.y, data.id)
      break;
    case "delete":
      if(!mobs[data.id])return
      deleteMonster(data.id)
      break;
    case "varChange":
      //second key is id, rest is data with keyname being changed var
      const mob = mobs[data.id]
      if(!mob) return
      for(let i = 2; i < Object.keys(data).length; i ++){
        //Get name of changed key and put in value
        mob[Object.keys(data)[i]] = Object.values(data)[i]
      }
      break;
  }
}

function mobDraw(){
  for(const m in mobs){
    mobs[m].draw()
  }
}

function makeNewMonster(x, y, id){
  mobs[parseInt(id)] = new Monster(x, y, id)
}

function deleteMonster(id){
  delete mobs[id]
}

//gets called when player leaves game
function deleteMobs(){
  mobs = {}
}

class Monster{
  constructor(x, y, id){
    this.x = x
    this.y = y
    this.width = 0.9
    this.height = 0.9
    this.xChunk = floor(x/10)
    this.yChunk = floor(y/10)
    this.id = id
    this.direction = 1
  }

  draw(){
    if(collision(camera.offsetX, camera.offsetY, uwidth, uheight, this.x, this.y, this.width, this.height)){
      imageMode(CENTER)
      unitImage(monsterImg, this.x+0.5*this.width, this.y+0.5*this.height, this.width, this.height, !this.direction)
      imageMode(CORNER)
    }
  }
}