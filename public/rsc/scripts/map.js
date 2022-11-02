const chunkSize = 10, chunkBlocks = chunkSize*chunkSize
let chunks = {}
//Chunk size in Pixel
let cPSize
//Amount of chunks to load
let chunkWidth, chunkHeight
let spawnChunksLoaded = false; //is true when chunks in which player spawns are loaded, only false when player is host
let spawnChunksAmn = 0; //Says amount of spawnchunks that need to be loaded
let worldTime = 0; //Daytime of world

const renderWorker = new Worker("rsc/scripts/worker/render.js")
const generateWorker = new Worker("rsc/scripts/worker/generation.js")

function mapSetup(){
  cPSize = chunkSize*u

  //chunkWidth = ceil(26/chunkSize) + 1
  chunkWidth = ceil(uwidth/chunkSize) + 1
  if(chunkWidth % 2 == 0) chunkWidth++;
  //chunkHeight = ceil(15/chunkSize) + 2
  chunkHeight = ceil(uheight/chunkSize) + 2
  if(chunkHeight % 2 == 0) chunkHeight++;

  renderWorker.postMessage({type:"vars", blockRes: blockRes, chunkSize: chunkSize})
  renderWorker.postMessage({type:"blockInfo", ids: blockInfo})
  generateWorker.postMessage({type:"vars", chunkSize: chunkSize})
}

function mapDraw(){
  drawWorld()
}

//Draw all chunks
function drawWorld(){
   //Draw background images, each is 50 units big and moves at a slower speed (cameraoffset/20)
  const startX = floor((camera.offsetX/20)/50) //Get index of first image (0,0) is image in center
  const startY = floor((camera.offsetY/20)/50)

  for(let i = startX; collision(0, 0, width, height, (i*50-camera.offsetX/20)*u, (startY*50-camera.offsetY/20)*u, 50.1 * u, 50.1 * u); i++){ //Check if x coordinate is visible
    for(let j = startY; collision(0, 0, width, height, (startX*50-camera.offsetX/20)*u, (j*50-camera.offsetY/20)*u, 50.1 * u, 50.1 * u); j++){ //Check if y coordinate is visible
      image(sky, (50*i-camera.offsetX / 20) * u, (50*j-camera.offsetY / 20) * u, 50.1 * u, 50.1 * u) //Image is visible, draw it
    }
  }

  for(const chunk in chunks){ //Draw blocks
    const c = chunks[chunk]
    if(collision(camera.offsetX, camera.offsetY, uwidth, uheight, c.x*chunkSize, c.y*chunkSize, chunkSize, chunkSize)){
      c.draw()
    }
  }
  for(const chunk in chunks){ //Draw items, has do be done seperately so items are always on top
    const c = chunks[chunk]
    if(Object.keys(c.items).length != 0 && collision(camera.offsetX, camera.offsetY, uwidth, uheight, c.x*chunkSize, c.y*chunkSize, chunkSize, chunkSize)){
      c.drawItems()
    }
  }
}

//Draw a colored translucent rect to mimic daytime
function drawDayTime(){
  //0: bright, 600: starts getting dark, 700: dark, 1100: starts getting bright, 1200=0
  if(worldTime > 600){ //not bright
    let alphaValue = 0
    if(worldTime >= 700 && worldTime < 1100) alphaValue = 200 //Darkness is at max at this time
    else alphaValue = worldTime >= 1100 ? map(worldTime, 1200, 1100, 0, 200) : map(worldTime, 600, 700, 0, 200)
    fill(color(0, 0, 30, alphaValue))
    strokeWeight(0)
    rect(0, 0, width, height)
  }
}

//Create new Chunk
async function newChunk(x, y, indexPos){
  chunks[x + "/" + y] = await new Chunk(x, y, indexPos) //Create Chunk object
}

//Load new Chunks and delete old ones when entering new Chunk
function updateChunks(){
  //chunk coordinates of first chunk to be rendered
  const xStart = self.xChunk - (chunkWidth-1)/2
  const yStart = self.yChunk - (chunkHeight-1)/2

  //Create Array with chunks that need to be shown
  let neededChunks = []
  for(let i = 0; i < chunkWidth; i++){
    for(let j = 0; j < chunkHeight; j++){
      if(!spawnChunksLoaded) spawnChunksAmn++ //Add to spawnChunksAmn if spawnchunks not yet generated
      neededChunks.push([xStart+i, yStart+j])
    }
  }

  //Delete not needed Chunks
  for(let c in chunks){
    const chunk = chunks[c]
    //Check if coordinates of chunk is in needed chunks
    if(!neededChunks.containsArray([chunk.x, chunk.y])){
      socket.emit("worldData", {type: "leaveChunk", x:chunk.x, y:chunk.y}) //Tell server that player is leaving chunk
      delete chunks[c];
    }
  }

  //Delete existing Chunks from neededChunks
  for(let i = neededChunks.length - 1; i >= 0; i--)
    if(chunks[neededChunks[i][0] + "/" + neededChunks[i][1]]) neededChunks.splice(i, 1)

  //Create chunk objects
  for(let i = 0; i < neededChunks.length; i++)
    newChunk(neededChunks[i][0], neededChunks[i][1])
}

//Process message from render Worker
renderWorker.onmessage = function(e){
  if(e.data == "loaded"){updateChunks(); return;} //Start generating chunks when images are loaded by renderer
  let chunk; //Image has been made, save in chunk object
  if(chunk = getChunk(e.data.x, e.data.y)){ //Check if Chunk hasnt already been deleted
    createImageFromBitmap(e.data["image"]).then(img => {
      chunk.img = img
    })
  }
}

//Process message from generate worker
generateWorker.onmessage = function(e){
  //Blocks have been calculated, set them on object
  let chunk
  if(chunk = getChunk(e.data.x, e.data.y)){ //Check if Chunk hasnt already been deleted
    if(!spawnChunksLoaded){ //host hasnt loaded spawnchunks yet
      spawnChunksAmn--;
      if(spawnChunksAmn == 0) {
        socket.emit("worldData", {type: "spawnChunks"}) //if all spawnchunks are generated tell server
        spawnChunksLoaded = true
      }
    }
    chunk.setBlocks(e.data.blocks1, e.data.blocks2) //Set blocks in chunk to newly generated blocks
    chunk.sendData() //Send generated data to server
  }
}

async function createImageFromBitmap(bitmap) {
  const pImg = new p5.Image(0, 0);

  pImg.width = pImg.canvas.width = bitmap.width;
  pImg.height = pImg.canvas.height = bitmap.height;

  // Draw the image into the backing canvas of the p5.Image
  pImg.drawingContext.drawImage(bitmap, 0, 0);
  pImg.modified = true;

  bitmap.close()
  return pImg;
}

//Get Index of block in blocks array with the coordinates
function getIndexFromBlock(x, y){
  x = x >= 0 ? x%chunkSize : (chunkSize+(x%chunkSize))%chunkSize
  y = y >= 0 ? y%chunkSize : (chunkSize+(y%chunkSize))%chunkSize
  return y*chunkSize+x
}

//Try to interact with a block, returns if was succesful
function interactBlock(x, y){
  const chunk = getChunkCords(x, y) //Get Chunk of Block
  const index = getIndexFromBlock(x, y)
  const blockId = chunk.blocks2[index] != 0 ? chunk.blocks2[index] : chunk.blocks1[index]
  const level = chunk.blocks2[index] != 0 ? 2 : 1
  if(blockId != 0 && blockInfo[blockId].interactable) {interaction(blockInfo[blockId].interactable, x, y, level); return true} //interact with block if possible
  else return false
}

//Place a block in the world
function placeBlock(x, y){
  if(self.itemSelected == 0 || !itemInfo[self.itemSelected].placeable) return
  const chunkX = floor(x/chunkSize)
  const chunkY = floor(y/chunkSize)
  const chunk = getChunk(chunkX, chunkY) //Get Chunk of Block
  const index = getIndexFromBlock(x, y)
  if(chunk.blocks1[index] == 0) {// Check if theres block next to it
    const right = index % 10 != 9 ? chunk.blocks1[index+1] : chunks[(chunkX+1) + "/" + chunkY].blocks1[floor(index/chunkSize)*10] //Get block on the right, check first if in another chunk
    const left = index % 10 != 0 ? chunk.blocks1[index-1] : chunks[(chunkX-1) + "/" + chunkY].blocks1[floor(index/chunkSize)*10+9] //Left block
    const top = floor(index/chunkSize) != 0 ? chunk.blocks1[index-chunkSize] : chunks[chunkX + "/" + (chunkY-1)].blocks1[chunkSize*(chunkSize-1)+(index%chunkSize)] //top block
    const down = floor(index/chunkSize) != 9 ? chunk.blocks1[index+chunkSize] : chunks[chunkX + "/" + (chunkY+1)].blocks1[index%chunkSize] //down block
    if((right || left || top || down) != 0) {
      chunk.changeBlock(index, 1, itemInfo[self.itemSelected].placeable, false);
      self.useItem()
    }
    return; //if this condition gets called block cant be placed on level 2, so it can be skipped
  }
  if(chunk.blocks2[index] == 0 && !playerOnBlock(x, y)) {//place on level 2 if possible
    chunk.changeBlock(index, 2, itemInfo[self.itemSelected].placeable, false);
    self.useItem()
  }
}

//Destroy a block in the world
function destroyBlock(x, y, correctTool=false){
  const chunk = getChunkCords(x, y) //Get Chunk of Block
  const index = getIndexFromBlock(x, y)

  if(chunk.blocks2[index] != 0) {
    const id = chunk.blocks2[index]
    if(!blockInfo[id].needsTool||correctTool) createItem(x+random(0.5), y+random(0.5), blockInfo[chunk.blocks2[index]].drop, false, false) //Create drop if possible
    chunk.changeBlock(index, 2, 0, false);
    self.useDurability()
    self.checkItemCollision() //Check if player can pick it up
    return
  }
  if(chunk.blocks1[index] != 0) {
    const id = chunk.blocks1[index]
    if(!blockInfo[id].needsTool||correctTool) createItem(x+random(0.5), y+random(0.5), blockInfo[chunk.blocks1[index]].drop, false, false) //Create drop if possible
    chunk.changeBlock(index, 1, 0, false); //Create drop
    self.useDurability()
    self.checkItemCollision() //Check if player can pick it up
    return
  }
  //if here, block cant be destroyed
}
 
//Returns true if a player is standing on said block
function playerOnBlock(x, y){
  if(collision(x, y, 1, 1, self.x, self.y, self.width, self.height) && self.alive) return true //Check if self is standing on block
  for(const p in players){
    const player = players[p]
    if(collision(x, y, 1, 1, player.x, player.y, player.width, player.height) && player.alive) return true //Check if other player is standing on block
  }
  return false //player not standing on it
}

//Every interactable block has an interactindex which says what should happen, some need coordinates thus x,y vars
function interaction(index, x=0, y=0, level=0){
  switch(index){
    case 1: //Open craftingtable screen
      toggleCraftingScreen(false)
      break;
    case 2: //Unlock door
      getChunkCords(x, y).changeBlock(getIndexFromBlock(x, y), level, 10, false)
      break;
    case 3: //Lock door
      if(playerOnBlock(x, y)) return //Check if player is on door
      getChunkCords(x, y).changeBlock(getIndexFromBlock(x, y), level, 9, false)
      break;
  }
}

//Delete all items in loaded Chunks
function clearItems(){
  if(!host) return //check if player is host of world
  for(const c in chunks){
    const chunk = chunks[c]
    for(const i in chunk.items){
      const item = chunk.items[i]
      deleteItem(item.x, item.y, item.id, false)
    }
  }
}

//Get a chunk by its chunkcoordinates
function getChunk(x, y){
  return chunks[x + "/" + y]
}

//Get a chunk by its coordinatesMath.floor(data.x/10), Math.floor(data.y/10)
function getChunkCords(x, y){
  return chunks[floor(x/chunkSize) + "/" + floor(y/chunkSize)]
}

//Delete data that isnt neccesary anymore when leaving Game
function deleteMap(){
  chunks = {}
  spawnChunksLoaded = false;
  spawnChunksAmn = 0;
}

class Chunk{
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.size = chunkSize
    this.blocks1 = []
    this.blocks2 = []
    this.img = new p5.Image(1, 1)
    this.items = {}
    this.requestData()
  }

  requestData(){ //Request Data about Chunk from Server
    socket.emit("worldData", {type: "enterChunk", x:this.x, y:this.y})
  }

  setBlocks(blocks1, blocks2){ //Set the blocks when blocks are received (either self generated or server)
    this.blocks1 = blocks1
    this.blocks2 = blocks2
    this.render()
  }

  sendData(){ //Send data about Chunk to server
    socket.emit("worldData", {type: "generatedChunk", x:this.x, y:this.y, blocks1: this.blocks1, blocks2: this.blocks2, index: this.index})
  }

  generate(seed, index){ //Generate Chunk if it never has been generated
    generateWorker.postMessage({type: "chunk", x:this.x, y:this.y, seed:seed})
    this.index = index
  }

  render(){ //Create image of chunk
    renderWorker.postMessage({type:"chunk", x:this.x, y:this.y, blocks1: this.blocks1, blocks2: this.blocks2})
  }

  draw(){ //Draw the chunk on screen
    image(this.img, (this.x*chunkSize-camera.offsetX)*u, (this.y*chunkSize-camera.offsetY)*u, cPSize, cPSize)
    if(debug) this.debug()
  }

  drawItems(){ //Draw items on screen
    for(let item in this.items) this.items[item].draw()
  }

  //Change a block in the chunk
  changeBlock(index, level, block, server){ //server var says if its from server or self induced
    const chunk = this //this["..."] isnt possible, workaround
    chunk["blocks" + level][index] = block
    chunk.render()
    if(!server) socket.emit("worldData", {type:"blockChange", x: this.x, y: this.y, index: index, level: level, block: block})
    if(collision(this.x*chunkSize, this.y*chunkSize, chunkSize, chunkSize, self.x, self.y, self.width, self.height)) self.checkFall() //Check if block under player was destroyed when in chunk
  }

  //For debugging
  debug(){
    stroke("#414149")
    strokeWeight(height/180)
    line((this.x*this.size-camera.offsetX)*u, (this.y*this.size-camera.offsetY)*u, (this.x*this.size-camera.offsetX)*u, (this.y*this.size+this.size-camera.offsetY)*u)
    line((this.x*this.size+this.size-camera.offsetX)*u, (this.y*this.size-camera.offsetY)*u, (this.x*this.size+this.size-camera.offsetX)*u, (this.y*this.size+this.size-camera.offsetY)*u)
    line((this.x*this.size-camera.offsetX)*u, (this.y*this.size-camera.offsetY)*u, (this.x*this.size+this.size-camera.offsetX)*u, (this.y*this.size-camera.offsetY)*u)
    line((this.x*this.size-camera.offsetX)*u, (this.y*this.size+this.size-camera.offsetY)*u, (this.x*this.size+this.size-camera.offsetX)*u, (this.y*this.size+this.size-camera.offsetY)*u)
    textSize(height/40)
    fill("white")
    textAlign(LEFT)
    text(this.x + "/" + this.y, ((this.x*this.size-camera.offsetX)+0.5)*u, ((this.y*this.size-camera.offsetY)+1)*u)
  }
}
