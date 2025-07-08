const DIRT_GRASS = 0;
const DIRT = 1;
const GRASS = 2;
const SPIKE = 3;
const CAKE = 4;
const STONE = 5;
const SIMPLE_SPIKE = 6;
const SPIKE_ROTATED = 7;
const SIMPLE_SPIKE_ROTATED = 8;
const BROWN_STONE = 9;
const PALM = 10;
const TALL_TREE = 11;
const BIG_BUSH = 12;
const SMALL_BUSH = 13;
const SIGN = 14;
const BOTTLE = 15;
const PUMPKIN = 16;
const SHROOM = 17;
const FLOWER_BUSH = 18;

class Block{
  constructor(id, x, y, width, height){
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.id = id;
    this.active = true;
  }

  draw(){
    if(!this.active) return;

    if(this.id == 0){ // general ground
      for(let i = 0; i < this.width; i++){
        unitImage(blockSprites[1], this.x+i, this.y, 1, 1);
      }

      for(let i = 0; i < this.width; i++){
        for(let j = 1; j < this.height; j++){
          unitImage(blockSprites[2], this.x+i, this.y-j, 1, 1);
        }
      }
    }else{
      if(blockInfo[this.id]["individualBlocks"]){
        for(let i = 0; i < this.width; i++){
          for(let j = 0; j < this.height; j++){
            unitImage(blockSprites[this.id], this.x+i, this.y-j, 1, 1);
          }
        }
      }else{
        if(this.id != CAKE) unitImage(blockSprites[this.id], this.x, this.y, this.width, this.height);
        else unitImage(blockSprites[this.id], this.x, this.y+sin(timer*100)*0.1, this.width, this.height);
      }
    }
  }

  hasCollision(){
    return blockInfo[this.id]["collision"];
  }

  isLethal(){
    return blockInfo[this.id]["lethal"];
  }

  isGround(){
    return this.hasCollision() && !this.isLethal()
  }

  collide(x, y, width, height){
    if(!this.active) return false;

    if(!blockInfo[this.id]["customHitbox"]) return collision(x, -y, width, height, this.x, -this.y, this.width, this.height) // minus to change coordinate system
    else {
      const xB = this.x + blockInfo[this.id]["xHitbox"];
      const yB = this.y - blockInfo[this.id]["yHitbox"];
      const widthB = blockInfo[this.id]["widthHitbox"];
      const heightB = blockInfo[this.id]["heightHitbox"];
      return collision(x, -y, width, height, xB, -yB, widthB, heightB) // minus to change coordinate system
    }
  }
}