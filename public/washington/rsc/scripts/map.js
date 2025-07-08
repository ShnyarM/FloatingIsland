let groundHeight = 0;
let gravity = 50;

const backgroundSize = 20;

let xEnd = 0;
let structures = [];
let lastStructure = -1;
const STRUCURE_AMN = 12;

let RENDER_STRUCTURE_LINES = false;
let RENDER_GRID = false;

function mapSetup(){
  xEnd = 0;
  structures = [];
  // create starting structure
  createStructure(0)
}

function mapDraw(){
  drawBackground();

  if(camera.offsetX + uwidth + 1 >= xEnd){
    addRandomStructure();
  }

  //delete all structures no more on screen
  structures = structures.filter(s => s.xEnd > camera.offsetX);

  for(const s of structures){
    s.draw();
  }
}

function drawBackground(){
  const xCord = floor(camera.offsetX/backgroundSize)*backgroundSize;
  unitImage(backgroundImg, xCord, 12, backgroundSize, backgroundSize, false);
  unitImage(backgroundImg, xCord+backgroundSize, 12, backgroundSize, backgroundSize, false);
  unitImage(backgroundImg, xCord+2*backgroundSize, 12, backgroundSize, backgroundSize, false);
}

function addRandomStructure(){
  let id;
  while(true){
    id = floor(random(1, STRUCURE_AMN+1))
    if(id != lastStructure) break;
  }
  lastStructure = id;
  createStructure(id);
}

function createStructure(id){
  let newStructure = new Structure(id, xEnd);
  xEnd = newStructure.xEnd;
  structures.push(newStructure)
}

class Structure{
  constructor(id, xStart){
    this.blocks = [];
    this.xStart = xStart;
    this.length = 0;

    if(id == 0){ // starting structure
      this.addBlock(DIRT_GRASS, 0, 0, 10, 4);
      this.addBlock(PALM, 7, 3, 1, 3)
    }else if(id == 1){ // blocks in air
      this.addBlock(DIRT_GRASS, 0, 0, 3, 4);

      // stone and cakes
      this.addBlock(CAKE, 4, 6, 1, 1);
      this.addBlock(STONE, 4, 5, 1, 1);

      this.addBlock(CAKE, 9, 6, 1, 1);
      this.addBlock(STONE, 9, 5, 1, 1);

      this.addBlock(CAKE, 14, 6, 1, 1);
      this.addBlock(STONE, 14, 5, 1, 1);

      this.addBlock(CAKE, 19, 6, 1, 1);
      this.addBlock(STONE, 19, 5, 1, 1);

      // cakes on top
      this.addBlock(CAKE, 3, 11, 1, 1);
      this.addBlock(CAKE, 7, 11, 1, 1);
      this.addBlock(CAKE, 12, 11, 1, 1);
      this.addBlock(CAKE, 16, 11, 1, 1);
      this.addBlock(CAKE, 20, 11, 1, 1);

      //spike and stone
      this.addBlock(STONE, 3, 10, 18, 1);
      this.addBlock(SIMPLE_SPIKE_ROTATED, 3, 9, 18, 1);
      
      this.addBlock(DIRT_GRASS, 22, 0, 5, 4);

      this.addBlock(PUMPKIN, 10, 11, 1, 1);
      this.addBlock(FLOWER_BUSH, 24, 1, 1, 1);
    }else if(id == 2){ // multiple single spikes
      this.addBlock(DIRT_GRASS, 0, 0, 20, 4);
      
      this.addBlock(SPIKE, 3, 1, 1, 1);
      this.addBlock(SPIKE, 7, 1, 1, 1);
      this.addBlock(SPIKE, 11, 1, 1, 1);
      this.addBlock(SPIKE, 15, 1, 1, 1);

      this.addBlock(SPIKE_ROTATED, 3, 3, 1, 1);
      this.addBlock(SPIKE_ROTATED, 7, 3, 1, 1);
      this.addBlock(SPIKE_ROTATED, 11, 3, 1, 1);
      this.addBlock(SPIKE_ROTATED, 15, 3, 1, 1);

      this.addBlock(CAKE, 3, 2, 1, 1);
      this.addBlock(CAKE, 7, 2, 1, 1);
      this.addBlock(CAKE, 11, 2, 1, 1);
      this.addBlock(CAKE, 15, 2, 1, 1);

      this.addBlock(CAKE, 9, 5, 1, 1);
      this.addBlock(CAKE, 9, 7, 1, 1);

      this.addBlock(STONE, 3, 11, 1, 8);
      this.addBlock(STONE, 7, 11, 1, 8);
      this.addBlock(STONE, 11, 11, 1, 8);
      this.addBlock(STONE, 15, 11, 1, 8);
      
      this.addBlock(SHROOM, 2, 1, 1, 1);
      this.addBlock(TALL_TREE, 18, 3, 1, 3);
      this.addBlock(BOTTLE, 10, 1, 1, 1);
    }else if(id == 3){ // row of spikes
      this.addBlock(DIRT_GRASS, 0, 0, 21, 4);

      this.addBlock(STONE, 4, 4, 13, 1);
      this.addBlock(STONE, 4, 3, 1, 3);
      this.addBlock(STONE, 16, 3, 1, 3);

      this.addBlock(SPIKE, 8, 5, 1, 1);
      this.addBlock(SPIKE, 9, 5, 1, 1);
      this.addBlock(SPIKE, 10, 5, 1, 1);
      this.addBlock(SPIKE, 11, 5, 1, 1);
      this.addBlock(SPIKE, 12, 5, 1, 1);

      this.addBlock(CAKE, 8, 6, 1, 1);
      this.addBlock(CAKE, 10, 6, 1, 1);
      this.addBlock(CAKE, 12, 6, 1, 1);

      this.addBlock(SPIKE_ROTATED, 8, 7, 1, 1);
      this.addBlock(SPIKE_ROTATED, 9, 7, 1, 1);
      this.addBlock(SPIKE_ROTATED, 10, 7, 1, 1);
      this.addBlock(SPIKE_ROTATED, 11, 7, 1, 1);
      this.addBlock(SPIKE_ROTATED, 12, 7, 1, 1);

      this.addBlock(STONE, 8, 11, 5, 4);

      this.addBlock(BOTTLE, 15, 5, 1, 1);
      this.addBlock(PUMPKIN, 14, 1, 1, 1);
      this.addBlock(PUMPKIN, 6, 1, 1, 1);
    }else if(id == 4){ // jump up through hole
      this.addBlock(DIRT_GRASS, 0, 0, 21, 4);

      this.addBlock(STONE, 2, 5, 2, 1);
      this.addBlock(CAKE, 3, 8, 1, 1);
      this.addBlock(CAKE, 3, 9, 1, 1);

      this.addBlock(STONE, 4, 11, 1, 10);
      this.addBlock(STONE, 8, 4, 1, 4);

      this.addBlock(SPIKE_ROTATED, 5, 4, 1, 1);
      this.addBlock(SPIKE_ROTATED, 7, 4, 1, 1);
      this.addBlock(CAKE, 6, 5, 1, 1);

      this.addBlock(STONE, 9, 4, 6, 1);
      this.addBlock(SPIKE, 13, 5, 1, 1);
      this.addBlock(SPIKE, 14, 5, 1, 1);

      this.addBlock(STONE, 18, 11, 1, 10);
      this.addBlock(STONE, 12, 2, 6, 1);

      this.addBlock(CAKE, 17, 10, 1, 1);
      this.addBlock(CAKE, 12, 3, 1, 1);
      this.addBlock(CAKE, 15, 1, 1, 1);

      this.addBlock(SIGN, 3, 6, 1, 1);
      this.addBlock(BOTTLE, 17, 3, 1, 1);
      this.addBlock(SMALL_BUSH, 20, 1, 1, 1);
    }else if(id == 5){ // go back and forward, cake under stone
      this.addBlock(DIRT_GRASS, 0, 0, 21, 4);

      this.addBlock(STONE, 1, 11, 1, 7);
      this.addBlock(STONE, 2, 8, 1, 1);
      this.addBlock(STONE, 1, 4, 7, 1);
      this.addBlock(CAKE, 3, 5, 1, 1);
      this.addBlock(CAKE, 2, 9, 1, 1);

      this.addBlock(STONE, 11, 5, 1, 5);
      this.addBlock(STONE, 12, 4, 5, 1);
      this.addBlock(SPIKE, 11, 6, 1, 1);
      this.addBlock(SPIKE, 16, 5, 1, 1);
      this.addBlock(CAKE, 11, 9, 1, 1);

      this.addBlock(CAKE, 13, 1, 1, 1);
      this.addBlock(CAKE, 14, 1, 1, 1);

      this.addBlock(SIGN, 6, 5, 1, 1);
      this.addBlock(BIG_BUSH, 3, 1, 1, 1);
      this.addBlock(TALL_TREE, 19, 3, 1, 3);
      this.addBlock(SHROOM, 16, 1, 1, 1);
    }else if(id == 6){ //valley
      this.addBlock(DIRT_GRASS, 0, 0, 4, 4);

      this.addBlock(DIRT_GRASS, 4, 1, 1, 5);
      this.addBlock(DIRT_GRASS, 5, 2, 1, 6);
      this.addBlock(DIRT_GRASS, 6, 3, 1, 7);
      this.addBlock(DIRT_GRASS, 7, 4, 1, 8);
      this.addBlock(DIRT_GRASS, 8, 5, 1, 9);

      this.addBlock(DIRT_GRASS, 9, 0, 2, 4);


      this.addBlock(DIRT_GRASS, 11, 5, 1, 9);
      this.addBlock(DIRT_GRASS, 12, 4, 1, 8);
      this.addBlock(DIRT_GRASS, 13, 3, 1, 7);
      this.addBlock(DIRT_GRASS, 14, 2, 1, 6);
      this.addBlock(DIRT_GRASS, 15, 1, 1, 5);

      this.addBlock(DIRT_GRASS, 16, 0, 4, 4);

      this.addBlock(CAKE, 9, 1, 1, 1);
      this.addBlock(CAKE, 10, 1, 1, 1);

      this.addBlock(PALM, 2, 3, 1, 3);
      this.addBlock(PALM, 17, 3, 1, 3);
    }else if(id == 7){ //break
      this.addBlock(DIRT_GRASS, 0, 0, 9, 4);

      this.addBlock(CAKE, 4, 1, 1, 1);

      this.addBlock(PALM, 6, 3, 1, 3);
    }else if(id == 8){ // 2 stories
      this.addBlock(DIRT_GRASS, 0, 0, 21, 4);

      this.addBlock(BROWN_STONE, 6, 4, 6, 4);
      this.addBlock(BROWN_STONE, 11, 7, 1, 3);
      this.addBlock(BROWN_STONE, 6, 8, 6, 1);

      this.addBlock(SPIKE, 17, 8, 1, 1);
      this.addBlock(BROWN_STONE, 17, 7, 1, 1);

      this.addBlock(CAKE, 10, 5, 1, 1);
      this.addBlock(CAKE, 9, 9, 1, 1);
      this.addBlock(CAKE, 17, 10, 1, 1);
      this.addBlock(CAKE, 17, 9, 1, 1);

      this.addBlock(SIGN, 8, 5, 1, 1);
      this.addBlock(SMALL_BUSH, 2, 1, 1, 1);
      this.addBlock(TALL_TREE, 15, 3, 1, 3);
      this.addBlock(BOTTLE, 7, 9, 1, 1);
    }else if(id == 9){ // optional
      this.addBlock(DIRT_GRASS, 0, 0, 23, 4);

      this.addBlock(BROWN_STONE, 4, 4, 15, 1);
      this.addBlock(BROWN_STONE, 10, 7, 3, 3);
      this.addBlock(BROWN_STONE, 6, 11, 1, 5);
      this.addBlock(BROWN_STONE, 16, 11, 1, 5);

      this.addBlock(SPIKE_ROTATED, 7, 7, 1, 1);
      this.addBlock(SPIKE_ROTATED, 9, 7, 1, 1);
      this.addBlock(SPIKE_ROTATED, 13, 7, 1, 1);
      this.addBlock(SPIKE_ROTATED, 15, 7, 1, 1);

      this.addBlock(CAKE, 10, 8, 1, 1);
      this.addBlock(CAKE, 11, 8, 1, 1);
      this.addBlock(CAKE, 12, 8, 1, 1);

      this.addBlock(CAKE, 11, 1, 1, 1);

      this.addBlock(SPIKE, 5, 1, 1, 1);
      this.addBlock(SPIKE, 17, 1, 1, 1);

      this.addBlock(BOTTLE, 7, 5, 1, 1);
      this.addBlock(SIGN, 17, 5, 1, 1);
      this.addBlock(SMALL_BUSH, 8, 1, 1, 1);
      this.addBlock(SMALL_BUSH, 14, 1, 1, 1);
      this.addBlock(SHROOM, 21, 1, 1, 1);
    }else if(id == 10){ // side stepping
      this.addBlock(DIRT_GRASS, 0, 0, 19, 4);

      this.addBlock(BROWN_STONE, 14, 9, 1, 9);
      this.addBlock(BROWN_STONE, 10, 3, 4, 1);
      this.addBlock(BROWN_STONE, 10, 9, 4, 1);
      this.addBlock(BROWN_STONE, 2, 11, 1, 5);
      this.addBlock(BROWN_STONE, 2, 6, 5, 1);

      this.addBlock(SPIKE, 14, 10, 1, 1);

      this.addBlock(CAKE, 4, 7, 1, 1);
      this.addBlock(CAKE, 12, 4, 1, 1);
      this.addBlock(CAKE, 12, 1, 1, 1);
      this.addBlock(CAKE, 12, 10, 1, 1);

      this.addBlock(TALL_TREE, 3, 3, 1, 3);
      this.addBlock(BOTTLE, 13, 1, 1, 1);
      this.addBlock(SIGN, 11, 4, 1, 1);
      this.addBlock(SIGN, 5, 7, 1, 1);
      this.addBlock(SIGN, 11, 10, 1, 1);
      this.addBlock(FLOWER_BUSH, 17, 1, 1, 1);
    }else if(id == 11){ // stairway
      this.addBlock(DIRT_GRASS, 0, 0, 23, 4);

      this.addBlock(DIRT_GRASS, 3, 3, 5, 1);
      this.addBlock(DIRT_GRASS, 9, 5, 5, 1);
      this.addBlock(DIRT_GRASS, 15, 7, 5, 1);

      this.addBlock(CAKE, 5, 4, 1, 1);
      this.addBlock(CAKE, 11, 6, 1, 1);
      this.addBlock(CAKE, 17, 8, 1, 1);

      this.addBlock(PALM, 18, 3, 1, 3);
      this.addBlock(BIG_BUSH, 6, 4, 1, 1);
      this.addBlock(FLOWER_BUSH, 16, 8, 1, 1);
      this.addBlock(SHROOM, 9, 1, 1, 1);
    }else if(id == 12){ // inverse triangle
      this.addBlock(DIRT_GRASS, 0, 0, 22, 4);

      this.addBlock(DIRT_GRASS, 9, 4, 5, 1);
      this.addBlock(DIRT_GRASS, 3, 7, 5, 1);
      this.addBlock(DIRT_GRASS, 16, 7, 5, 1);
      this.addBlock(BROWN_STONE, 11, 11, 1, 4);

      this.addBlock(CAKE, 5, 8, 1, 1);
      this.addBlock(CAKE, 11, 5, 1, 1);
      this.addBlock(CAKE, 17, 8, 1, 1);

      this.addBlock(PALM, 2, 3, 1, 3);
      this.addBlock(TALL_TREE, 18, 3, 1, 3);
      this.addBlock(SMALL_BUSH, 10, 1, 1, 1);
      this.addBlock(BOTTLE, 3, 8, 1, 1);
      this.addBlock(PUMPKIN, 16, 8, 1, 1);
    }

    this.xEnd = this.xStart + this.length;
  }

  addBlock(id, x, y, width, height){
    if(id == PALM){
      x -= 0.5
      width += 1;
    }

    this.blocks.push(new Block(id, this.xStart+x, groundHeight+y, width, height));
    if(x+width > this.length) this.length = x+width;
  }

  draw(){
    for(const b of this.blocks){
      b.draw();
    }

    if(RENDER_STRUCTURE_LINES){
      fill("black")
      unitRect(this.xStart, groundHeight+11, 0.2, 11)
      unitRect(this.xEnd, groundHeight+11, 0.2, 11)
    }

    if(RENDER_GRID){
      stroke(100, 100, 100, 50)
      for(let i = 1; i < this.length; i++){
        unitRect(this.xStart+i, groundHeight+11, 0.05, 11)
      }

      for(let i = 0; i < 11; i++){
        unitRect(this.xStart, groundHeight+i, this.length, 0.05)
      }

      textAlign(LEFT)
      fill("white")
      for(let i = 0; i < this.length; i++){
        for(let j = 0; j < 12; j++){
          textSize(height/100)
          unitText(i + "/" + j, this.xStart+i, groundHeight+j-0.1)
        }
      }
    }
  }
}