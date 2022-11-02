let self; //Own Player
let players = {}; //Other Multiplayer players

function playerSetup(){
  self = new Self()
}

function playerDraw(){
  if(self.alive){
    self.draw()
    if(!gamePaused){
      if(!self.falling && !self.inventoryOpen && !craftingScreen){
        self.move(); 
        if(self.break.breaking) self.breakBlock()
      }
      if(!self.inventoryOpen && !craftingScreen)self.armLocation()
    }
    if(self.falling) self.fall()
  }
  for(const id in players){
    players[id].draw()
  }
  if(self.alive) {self.recover(); self.drawHitIndicator()}
}

function playerMouseClicked(){
  if(self.falling || !self.alive || self.inventoryOpen || gamePaused || craftingScreen) return
  const x = floor(self.mouseX)
  const y = floor(self.mouseY)
  if (mouseButton === RIGHT){
    const x = floor(self.mouseX)
    const y = floor(self.mouseY)
    if(!interactBlock(x, y))placeBlock(x, y) //try to place block if interacting didnt work
  }
  else if (mouseButton === LEFT){
    if(!self.hit()) self.breakNewBlock() //break block if nothing was hit
  }
}

function playerMouseReleased(){
  //Stop breaking process if left mouse Button is released
  if(self.break.breaking) self.break = {breaking: false, x:0, y:0, blockId:0, progress:0}
}

function playerMouseDragged(){
  if(self.break.breaking) self.checkBreaking() //check if player is still breaking same block
  else if(mouseIsPressed && mouseButton === LEFT) self.breakNewBlock()
}

function playerKeyPressed(){
  switch(true){ //keycode, use true so a range can be used
    case keyCode == 69: //E
      if(self.alive && !gamePaused && !craftingScreen){//Open inventory screen
        self.inventoryOpen = !self.inventoryOpen //Open inventory screen

        if(!self.inventoryOpen && self.selected.holding) self.pickUpItemSelected() //inventory closed and Item was still on mouse
      }else if(craftingScreen){
        toggleCraftingScreen()
      }
      break
    case keyCode == 81: //Q 
      if(self.itemSelected != 0){ //Drop item, item in hand
        const item = self.toolBar[self.toolBarSelected]
        item.durability ? self.dropItem(item.id, 1, false, item.durability) : self.dropItem(item.id, 1)

        self.addToAmnInventorySlot("toolBar", self.toolBarSelected, -1) //Remove 1 from inventory
      }
      break
    case (keyCode >= 48 && keyCode <= 57): //0-9, select toolBar
      const newIndex = keyCode == 48 ? 9 : keyCode - 49
      self.toolBarSelected = newIndex
      self.itemSelected = self.toolBar[newIndex] == 0 ? 0 : self.toolBar[newIndex].id
      self.updateServer(["itemSelected"])
      break
  }
}

function playerMouseWheel(event){
  if(self.inventoryOpen) return //Cant scroll if inventory is open

  self.toolBarSelected = (self.toolBarSelected + Math.sign(-event.delta)) % 10
  if(self.toolBarSelected == -1) self.toolBarSelected = 9
  self.itemSelected = self.toolBar[self.toolBarSelected] != 0 ? self.toolBar[self.toolBarSelected].id : 0
  self.updateServer(["itemSelected"])
  self.updateServer(["toolBarSelected"], true)
}

//Delete data that isnt neccesary anymore when leaving Game
function deletePlayer(){
  self = {}
  players = {}
}

//Own Player
class Self{
  //playerData = variables
  constructor(playerData = playerLayout){
    Object.assign(this, playerData)
    this.moveSpeed = 7.2*4
    //this.moveSpeed = 15*4
    this.xChunk = 0;
    this.yChunk = 0;
    this.collCorrection = 0.00001 //Add when colliding to prevent bugs where game thinks its inside block
    this.canMove = false //Says if player can move, is set to false till map fully loads

    this.armLength = 3
    this.direction = true //Which direction player is looking, true is right, false is left
    this.armX = this.direction ? 0.9 : 0.1 //Location of playerArm, percentage of width/height
    this.armY = 0.6
    this.mouseX = this.x
    this.mouseY = this.y

    this.break = {breaking:false, x:0, y:0, level:0, blockId:0, progress:0} //infos about block that is being broken

    this.inventoryOpen = false
    this.selected = {holding: false, item: {}} //used to move things in inventory, has data about item being held (origin says if from toolbar or inventory)

    this.redScreen = 0 //Fading redscreen after getting hit
    this.redScreenMax = 2
    this.recovery = 0 //Says how much time is left before recovering healt
    this.recoveryMax = 5
    this.recoverySpeed = 2 //How fast health will be regenerated

    this.hitIndicator = 0 //Timer for hit indicator
    this.hitIndicatorMax = 1

    this.img = playerImg //Which image to draw, used for walking animation
  }

  //Draw the player on canvas
  draw(){
    imageMode(CENTER)
    unitImage(this.img, this.x+0.5*this.width, this.y+0.5*this.height, this.width, this.height, !this.direction)
    if(this.itemSelected != 0){//Draw item in hand if item in hand
      imageMode(CENTER)
      unitImage(itemInfo[this.itemSelected].image, (this.x+this.width*this.armX), this.y+this.height*this.armY, this.width*0.5, this.height*0.5, !this.direction)
    }
    imageMode(CORNER)
  }

  //Move the Player
  move(){
    if(!getChunk(this.xChunk, this.yChunk) || !this.canMove) return //Check if current Chunk has been loaded and if player can move

    //Move the player with WASD
    let xSpeed = 0; //Amount moved
    let ySpeed = 0;
    var changed = false; //Did player move?
    if(keyIsDown(87)) ySpeed -= this.moveSpeed/4;
    if(keyIsDown(83)) ySpeed += this.moveSpeed/4;
    if(keyIsDown(68)) xSpeed += this.moveSpeed/4;
    if(keyIsDown(65)) xSpeed -= this.moveSpeed/4;
    //prevent player from being faster when going diagonally
    if(Math.abs(xSpeed) == Math.abs(ySpeed) && xSpeed != 0){
      xSpeed *= 0.707
      ySpeed *= 0.707
    }
    //Multiplicate with deltatime for same speed on different frameRates
    xSpeed *= sdeltaTime
    ySpeed *= sdeltaTime
    if(xSpeed != 0){
      changed = true
      this.x = this.collisionX(xSpeed)
      if((Math.sign(xSpeed)==1) != this.direction){//Update way player is facing
        this.direction = !this.direction
        this.armX = this.direction ? 0.9 : 0.1
        this.updateServer(["direction"])
      }
    }
    if(ySpeed != 0){
      changed = true
      this.y = this.collisionY(ySpeed)
    }

    if(changed){
      //Emit new Position to server
      this.updateServer(["x", "y"])
      //Check if in new Chunk
      const newXChunk = floor(this.x / chunkSize)
      const newYChunk = floor(this.y / chunkSize)
      if(this.xChunk != newXChunk || this.yChunk != newYChunk){ //Update chunks
        this.xChunk = newXChunk
        this.yChunk = newYChunk
        updateChunks()
      }
      this.checkBreaking() //check if player is still breaking same block
      this.checkItemCollision() //Check if item can be picked up
      this.checkFall()
      this.img = frameCount%30 > 14 ? (frameCount%15 > 8 ? playerMove1Img : playerImg) : (frameCount%15 > 8 ? playerMove2Img : playerImg) //Walking animation
    }else this.img = playerImg
  }

  armLocation(){
    const playerX = (this.x+this.width*this.armX) //Location of arms
    const playerY = (this.y+this.height*this.armY)
    const diffX = (mouseX/u+camera.offsetX) - playerX //x and y differences of arm and mouse
    const diffY = (mouseY/u+camera.offsetY) - playerY
    const hypothenuse = diffX**2+diffY**2 //Hypothenuse^2 of right triangle with diffX/Y as catheters
    const reductionFactor = hypothenuse > this.armLength**2 ? this.armLength*Q_rsqrt(hypothenuse) : 1 //if length smaller than 2 then no reduction
    this.mouseX = playerX + diffX*reductionFactor 
    this.mouseY = playerY + diffY*reductionFactor
    stroke("#414149")
    strokeWeight(height/180)
    line((playerX-camera.offsetX)*u, (playerY-camera.offsetY)*u, (this.mouseX-camera.offsetX)*u, (this.mouseY-camera.offsetY)*u)
    stroke("white")
    fill(255, 255, 255, 50)
    unitRect(floor(this.mouseX), floor(this.mouseY), 1, 1)
  }

  //Change block which is being
  breakNewBlock(){
    const x = floor(this.mouseX)
    const y = floor(this.mouseY)
    const chunk = getChunkCords(x, y)
    if(!chunk || chunk.blocks2.length == 0) return //chunk isnt loaded, stop process
    const index = getIndexFromBlock(x, y)
    const level = chunk.blocks2[index] != 0 ? "blocks2" : (chunk.blocks1[index] != 0 ? "blocks1" : 0) //Check if block is there and get level if true
    if(level == 0) return //Stop if no block is there, continue if there is

    const blockId = chunk[level][index]
    this.break = {breaking: true, x:x, y:y, blockId:blockId, progress:0}
  }

  breakBlock(){
    let correctTool = false //Check if is being broken by correct tool, needed for destroyblock()

    let toAdd = (blockInfo[this.break.blockId].breakSpeed/20) //base breakingspeed
    if(this.itemSelected != 0){ //Multiply toAdd if correct tool is being used
      const itemToolType = itemInfo[this.itemSelected].toolType
      if(itemToolType && itemToolType == blockInfo[this.break.blockId].toolType){//Check if correct Tool
        toAdd *= itemInfo[this.itemSelected].multiplier
        correctTool = true
      } 
    }

    toAdd = toAdd*sdeltaTime //Multiply by deltatime so it is same speed with different fps
    this.break.progress += toAdd //add to breaking speed

    rectMode(CORNER) //Draw progress bar
    fill("white") //White bar as nackground
    stroke("#414149")
    strokeWeight(height/300)
    unitRect(this.mouseX-0.75, this.mouseY-1.1, 1.5, 0.2)

    fill(color((1-self.break.progress)*255, self.break.progress*255, 0)) //change color based on progress (red => green)
    strokeWeight(0)
    unitRect(this.mouseX-0.75, this.mouseY-1.1, self.break.progress*1.5, 0.2) //actual progress bar

    if(this.break.progress >= 1){ //Destroy block if breaking progress is over
      destroyBlock(this.break.x, this.break.y, correctTool)
      this.break = {breaking:false, x:0, y:0, level:0, blockId:0, progress:0}
    }
  }

  //Check if player is still breaking same block, used when player moves and mouse changes
  checkBreaking(){
    if(this.break.breaking){ //Stop breaking process if on different block
      const x = floor(this.mouseX)
      const y = floor(this.mouseY)
      if(x != this.break.x || y != this.break.y){ //Not on same, stop or go to different block
        this.break = {breaking:false, x:0, y:0, level:0, blockId:0, progress:0}
        this.breakNewBlock()
      }
    }
  }

  //Draw toolbar on bottom of screen, inventory says if its being drawn for inventory screen
  drawToolBar(inventory = false){
    image(toolBarImg, width*0.25, height*0.9, width*0.5, width*0.05)

    textSize(height/80)
    textAlign(CENTER)
    strokeWeight(height/180)
    stroke("#414149")
    fill("white")

    imageMode(CENTER) //Draw Item
    for(let i = 0; i < 10; i++){
      if(this.toolBar[i] != 0){
        image(itemInfo[this.toolBar[i].id].image, width*0.25 + i*width*0.05 + width*0.025, height*0.9 + width*0.025, width*0.035, width*0.035)
        if(itemInfo[this.toolBar[i].id].stackable) text(this.toolBar[i].amn, width*0.25 + i*width*0.05 + width*0.035, height*0.9 + width*0.035)
        if(this.toolBar[i].durability){
          strokeWeight(height/400)
          rect(width*0.258 + i*width*0.05, height*0.97, width*0.034, width*0.004)
          const durabilityLeft = this.toolBar[i].durability/itemInfo[this.toolBar[i].id].durability
          fill(color((1-durabilityLeft)*255, durabilityLeft*255, 0)) //change color based on left durability (red => green)
          rect(width*0.258 + i*width*0.05, height*0.97, (width*0.034)*durabilityLeft, width*0.004)

          fill("white")
          strokeWeight(height/180)
        } 
      }
    }
    imageMode(CORNER)

    textSize(height/70)
    for(let i = 0; i < 10; i++){//Draw number
      const numb = i == 9 ? 0 : i+1 //Slot 0 is to the right instead of left
      text(numb, width*0.25 + i*width*0.05 + width/110, height*0.9 + width/110)
    }

    if(!inventory){
      borderRect(width*0.25+this.toolBarSelected*width*0.05, height*0.9, width*0.05, width*0.05) //Draw border around selected
      if(this.itemSelected != 0){
        stroke("#414149")
        fill("white")
        text(itemInfo[this.itemSelected].name, width*0.5, height*0.82)
      }

      for(let i = 0; i < floor(this.health / 2); i++){ //Draw health hearts
        image(fullHeartImg, width*0.25+width*0.025*i, height*0.855, width*0.02, width*0.02)
      }
      if(this.health%2 >= 1){ //Draw half heart
        image(halfHeartImg, width*0.25+width*0.025*floor(this.health / 2), height*0.855, width*0.02, width*0.02)
      }
    }
  }

  //Draw inventory Screen, darkscreen says if background should be darkened
  drawInventory(darkScreen=true){
    if(darkScreen){
      fill(color(0, 0, 0, 180)) //Black background
      strokeWeight(0)
      rect(0, 0, width, height)
    }
    this.drawToolBar(true)

    for(let i = 0; i < 3; i++){ //Draw three rows
      image(toolBarImg, width*0.25, height*0.5+width*0.05*i, width*0.5, width*0.05)
    }
    
    imageMode(CENTER)
    for(let i = 0; i < 3; i++){ //Draw items in inventory
      for(let j = 0; j < 10; j++){
        if(this.inventory[i*10+j] != 0){
          image(itemInfo[this.inventory[i*10+j].id].image, width*0.25 + j*width*0.05 + width*0.025, height*0.5+width*0.05*i + width*0.025, width*0.035, width*0.035)
          if(itemInfo[this.inventory[i*10+j].id].stackable) text(this.inventory[i*10+j].amn, width*0.25 + j*width*0.05 + width*0.035, height*0.5+width*0.05*i + width*0.035)
          if(this.inventory[i*10+j].durability){ //Draw durability
            strokeWeight(height/400)
            rect(width*0.258 + j*width*0.05, height*0.57+width*0.05*i, width*0.034, width*0.004)

            const durabilityLeft = this.inventory[i*10+j].durability/itemInfo[this.inventory[i*10+j].id].durability
            fill(color((1-durabilityLeft)*255, durabilityLeft*255, 0)) //change color based on left durability (red => green)
            rect(width*0.258 + j*width*0.05, height*0.57+width*0.05*i, (width*0.034)*durabilityLeft, width*0.004)
  
            fill("white")
            strokeWeight(height/180)
          } 
        }
      }
    }
    imageMode(CORNER)

    let pickUpItem = false; //Used after this block of code, says if mouse has to pick item up
    let placeItem = false; //Used after this block of code, says if mouse has item selected and it has to be placed in inventory
    let place = ""; //Says if item has to be placed in toolbar or inventory
    let index = 0; //index of array in which it has to be placed

    //Mark Item over which mouse is and make moving of items possible
    if(button(width*0.25, height*0.5, width*0.5, width*0.05*3)){ //Mouse is over inventory
      const indexX = floor((mouseX-width*0.25)/(width*0.05)) //get position of slot which mouse is over
      const indexY = floor((mouseY-height*0.5)/(width*0.05))
      index = indexY*10+indexX
      borderRect(width*0.25+indexX*width*0.05, height*0.5+indexY*width*0.05, width*0.05, width*0.05)
      if(mouseClick){ //Mouse has been clicked
        if(!this.selected.holding){ //Pick item up
          pickUpItem = true //Tell code that later it has to get item
          place = "inventory"
        }else{ //Place item
          placeItem = true //Tell code that later it has to place item
          place = "inventory"
        }
      }
    }else if(button(width*0.25, height*0.9, width*0.5, width*0.05)){ //Mouse is over toolBar
      index = floor((mouseX-width*0.25)/(width*0.05)) //get index of slot which mouse is over
      borderRect(width*0.25+index*width*0.05, height*0.9, width*0.05, width*0.05)
      if(mouseClick){ //Mouse has been clicked
        if(!this.selected.holding){ //Pick item up
          pickUpItem = true //Tell code that later it has to get item
          place = "toolBar"
        }else{ //Place item
          placeItem = true //Tell code that later it has to place item
          place = "toolBar"
        }
      }
    }

    if(pickUpItem){ //Item has to be picked up by mouse
      if(this[place][index] != 0){ //item can be picked up there
        if(mouseButton == LEFT || this[place][index].amn == 1){ //Pick up entire stack
          this.selected.holding = true
          this.selected.item = this[place][index]
          if(this[place][index].durability) this.selected.item.durability = this[place][index].durability
          this.changeInventorySlot(place, index, 0) //empty slot from which was taken
        }else if (mouseButton == RIGHT) { //Only take half from stack
          this.selected.holding = true
          this.selected.item = {id: this[place][index].id, amn:this[place][index].amn}
          this.selected.item.amn = ceil(this.selected.item.amn/2)
          if(this[place][index].durability) this.selected.item.durability = this[place][index].durability
          this.changeAmnInventorySlot(place, index, floor(this[place][index].amn/2)) //update amn of stack taken from
        }
      }
    }
    else if(placeItem){ //Mouse selected item has to be placed in inventory
      const selectItem = this.selected.item; //Vars to make next block of code easier
      const newSlotItem = this[place][index];
      const itemId = selectItem.id
      if(newSlotItem == 0){ //Slot is empty
        this.changeInventorySlot(place, index, selectItem.id, selectItem.amn, selectItem.durability)
        this.selected = {holding:false, item:{}}
      }else{ //Slot is not empty
        if(newSlotItem.id == itemId && newSlotItem.amn < itemInfo[itemId].stackable){ //new slot has same item and stack is available
          if(itemInfo[itemId].stackable >= newSlotItem.amn+selectItem.amn) {//Add amn to itemslot if enough space
            newSlotItem.amn += selectItem.amn
            if(craftingScreen) getAvailableRecipes(false) //Update recipes when in craftingscreen
            this.selected = {holding:false, item:{}}
          }else{ //Wont fit into stack
            selectItem.amn -= (itemInfo[itemId].stackable - newSlotItem.amn) //Subtract from amn
            newSlotItem.amn = itemInfo[itemId].stackable //Fill out stack
          } 
        }else{ //newSlot is used but not the same item
          this.changeInventorySlot(place, index, selectItem.id, selectItem.amn, selectItem.durability) //Swap slots
          this.selected.item = newSlotItem
        }
      }
    }else if(mouseClick && this.selected.holding && !(craftingScreen && button(width*0.25, height*0.02, width*0.5, height*0.4))){ //mouse has been clicked but not in inventory => drop item if in hand
      this.selected.item.durability ? this.dropItem(this.selected.item.id, this.selected.item.amn, false, this.selected.item.durability) : this.dropItem(this.selected.item.id, this.selected.item.amn)
      this.selected = {holding:false, item:{}}
    }

    if(this.selected.holding){ //Draw item that is being held by mouse
      strokeWeight(height/180)
      stroke("#414149")
      fill("white")
      image(itemInfo[this.selected.item.id].image, mouseX, mouseY, width*0.035, width*0.035)
      if(itemInfo[this.selected.item.id].stackable) text(this.selected.item.amn, mouseX + width*0.035, mouseY + width*0.035)
    }
  }

  //Check if player has specific amount of an item, return index if true [place, index]
  getItemFromInventory(itemId, amn){
    for(let i = 0; i < this.inventory.length; i++){ //Check inventory for item
      const item = this.inventory[i]
      if(item.id == itemId && item.amn >= amn) return ["inventory", i]
    }

    for(let i = 0; i < this.toolBar.length; i++){ //Check toolbar for item
      const item = this.toolBar[i]
      if(item.id == itemId && item.amn >= amn) return ["toolBar", i]
    }
  }

  //pick up or drop item which is selected when leaving inventory
  pickUpItemSelected(){
    if(!this.selected.holding) return

    self.getItem(this.selected.item.id, this.selected.item.amn, data => { //Try to make player pick it up, loop to make sure everything is being picked up
      if(Number.isInteger(data)){ //Item was picked up
        if(data != 0){//still remaining
          this.selected.item.amn = data
          this.pickUpItemSelected() //Call function again
        }else{
          this.selected = {holding: false, item: {}}
        }
      }else{ //item couldnt be picked up, stop loop and drop item to ground  
        this.selected.item.durability ? this.dropItem(this.selected.item.id, this.selected.item.amn, false, this.selected.item.durability) : this.dropItem(this.selected.item.id, this.selected.item.amn)
        this.selected = {holding: false, item: {}}
      }
    }, this.selected.item.durability) 
  }

  //Change a slot in inventory
  changeInventorySlot(place, index, itemId, amn=1, durability=0){
    if(place != "toolBar" && place != "inventory") return //Check if place is valid
    if((place == "toolBar" && index > 9) || index > 29) return //Check if index are valid
    if (!itemInfo[itemId] && itemId != 0 && amn != 0) return //check if itemID and amn is valid 

    if(itemId == 0) this[place][index] = 0 //Empty slot
    else {
      this[place][index] = {id: itemId, amn: amn}
      if(durability != 0) this[place][index].durability = durability
    }

    if(place == "toolBar" && index == this.toolBarSelected){ //update itemselected if item in hand was changed
      this.itemSelected = itemId == 0 ? 0 : itemId;
      this.updateServer(["itemSelected"])
    }

    socket.emit("inventoryChange", {type: place, index:index, item:this[place][index]}) //tell server
    if(craftingScreen) getAvailableRecipes(false) //Update crafting recipes if craftscreen open
  }

  //Change amn of item in inventory
  changeAmnInventorySlot(place, index, amn){
    if(place != "toolBar" && place != "inventory") return //Check if place is valid
    if((place == "toolBar" && index > 9) || index > 29) return //Check if index are valid
    const item = this[place][index]
    if(item == 0) return //Check if index is not empty
    if(!itemInfo[item.id].stackable) return //Check if item can have multiple

    item.amn = amn // change amn
    if(itemInfo[item.id].stackable < item.amn) item.amn = itemInfo[item.id].stackable //Check if it went over stack
    else if(item.amn <= 0){ //delete item if none remaining
      this[place][index] = 0
      if(place == "toolBar" && index == this.toolBarSelected){ //update itemSelected if item was in hand
        this.itemSelected = 0
        self.updateServer(["itemSelected"])
      }
    }

    socket.emit("inventoryChange", {type: place, index:index, item:this[place][index]}) //tell server
    if(craftingScreen) getAvailableRecipes(false) //Update crafting recipes if craftscreen open
  }

  //Add or subtract to inventoryslot amn
  addToAmnInventorySlot(place, index, amn){
    if(place != "toolBar" && place != "inventory") return //Check if place is valid
    if((place == "toolBar" && index > 9) || index > 29) return //Check if index are valid
    const item = this[place][index]
    if(item == 0) return //Check if index is not empty

    item.amn += amn // Add/subtract
    if(itemInfo[item.id].stackable < item.amn) item.amn = itemInfo[item.id].stackable //Check if it went over stack
    else if(item.amn <= 0){ //delete item if none remaining
      this[place][index] = 0
      if(place == "toolBar" && index == this.toolBarSelected){ //update itemSelected if item was in hand
        this.itemSelected = 0
        self.updateServer(["itemSelected"])
      }
    }

    socket.emit("inventoryChange", {type: place, index:index, item:this[place][index]}) //tell server
    if(craftingScreen) getAvailableRecipes(false) //Update crafting recipes if craftscreen open
  }

  //Use a piece from block which is currently held
  useItem(){
    this.addToAmnInventorySlot("toolBar", this.toolBarSelected, -1)
  }

  //Use durability from item which is currently held
  useDurability(){
    if(this.itemSelected == 0 || !itemInfo[this.itemSelected].durability) return //Item doesnt have durability attribute

    const item = this.toolBar[this.toolBarSelected]
    if(item.durability == null) item.durability = itemInfo[this.itemSelected].durability //Add durability attribute if not used till now
    item.durability--
    socket.emit("inventoryChange", {type: "toolBar", index:this.toolBarSelected, item:item}) //tell server

    if(item.durability <= 0) this.changeInventorySlot("toolBar", this.toolBarSelected, 0) //Destroy item if no durability left
  }

  //Get Item added to inventory
  getItem(itemId, amn=1, callback = function(){}, durability=0){
    //First it tries to find a fitting slot in inventory, if found it will be added
    if(!itemInfo[itemId]) return //check if itemId exists
    let found = false; //has slot been found?
    let emptySlotFound = false; //possible free slot has been found, but better could be available
    let place = ""; //Slot is in toolbar or inventory
    let index = 0; //index of found slot

    for(let i = 0; i < this.toolBar.length; i++){ //Go through toolbar and see if item has available stack
      const toolBarItem = this.toolBar[i]
      if(toolBarItem.id == itemId && toolBarItem.amn < itemInfo[itemId].stackable){ //If item already in toolbar and stackable save that slot
        found = true;
        place = "toolBar"
        index = i
        break //Stop loop
      }
      if(toolBarItem == 0 && !emptySlotFound){//Save emptyslot in toolbar to know where to add item if theres no stack to add to
        emptySlotFound = true;
        place = "toolBar"
        index = i
      }
    }
    if(!found){ //go through inventory if suitable stack hasnt been found
      for(let i = 0; i < this.inventory.length; i++){ //Go through toolbar and see if item has available stack
        const inventoryItem = this.inventory[i]
        if(inventoryItem.id == itemId && inventoryItem.amn < itemInfo[itemId].stackable){ //If item already in inventory and stackable save that slot
          found = true;
          place = "inventory"
          index = i
          break //Stop loop
        }
        if(inventoryItem == 0 && !emptySlotFound){//Save emptyslot in inventory to know where to add item if theres no stack to add to
          emptySlotFound = true;
          place = "inventory"
          index = i
        }
      }
    }

    if(found){ //Stack of item already exists
      const item = this[place][index]

      if(itemInfo[itemId].stackable >= item.amn+amn) {this.addToAmnInventorySlot(place, index, amn); amn = 0} //Add amn to itemslot if enough space
      else{ //Wont fit into stack
        amn -= (itemInfo[itemId].stackable - item.amn) //Subtract from amn
        this.changeAmnInventorySlot(place, index, itemInfo[itemId].stackable) //Fill out stack
      } 

      callback(amn) //Tell item object that it has been picked up
      return
    }else if(emptySlotFound){ //Emptyslot exists
      this.changeInventorySlot(place, index, itemId, amn, durability) //Add item to empty slot

      callback(0) //Tell item object that it has been picked up, 0 because amn == 0
      return
    }
    callback(false) //Tell item object that it hasnt been picked up since theres no suitable slot
  }

  //Drop item around player, if random is true it will be thrown in random direction
  dropItem(id, amn, randomDir = false, durability=0){
    const throwDirection = randomDir ? [1, -1][round(random(1))] : (this.direction ? 1 : -1) //Get direction in which is thrown
    const itemX = this.x + (throwDirection ? 0 : this.width) + (round(random(0.8, 1.2), 2)*throwDirection) //random x value to be added playerX, if random direction is random, else in direction where player is looking 
    const itemY = this.y + round(random(-1, 1), 2)
    createItem(itemX, itemY, id, false, false, amn, durability)
  }

  //Delete all items in toolBar and Inventory
  clearInventory(){
    for(let i = 0; i < this.toolBar.length; i++){ //Clear toolbar
      this.changeInventorySlot("toolBar", i, 0)
    }
    for(let i = 0; i < this.inventory.length; i++){
      this.changeInventorySlot("inventory", i, 0)
    }
  }

  //Drop every item in inventory
  dropInventory(){
    for(let i = 0; i < this.toolBar.length; i++){ //Clear toolbar
      const item = this.toolBar[i]
      if(item) item.durability ? this.dropItem(item.id, item.amn, true, item.durability) : this.dropItem(item.id, item.amn, true)
      this.changeInventorySlot("toolBar", i, 0)
    }
    for(let i = 0; i < this.inventory.length; i++){
      const item = this.inventory[i]
      if(item) item.durability ? this.dropItem(item.id, item.amn, true, item.durability) : this.dropItem(item.id, item.amn, true)
      this.changeInventorySlot("inventory", i, 0)
    }
  }

  //Check if item can be picked up
  checkItemCollision(){
    //for(let item of chunks[this.xChunk + "/" + this.yChunk].items) item.collision()//Check items in current chunk
    for(let i = -1; i < 2; i++) //Check in current and neighboring chunks if player is inside them
      for(let j = -1; j < 2; j++)
        if(collision(this.x, this.y, this.width, this.height, (this.xChunk+i)*chunkSize, (this.yChunk+j)*chunkSize, chunkSize, chunkSize)){
          const chunk = getChunk(this.xChunk+i, this.yChunk+j)
          for(let item in chunk.items) chunk.items[item].collision() //Check for items if in chunk
        }
  }

  //Check if will be colliding with block in x direction, addToX is movement
  collisionX(addToX){
    const direction =  Math.sign(addToX) //Moving in negative or positive, -1 = negative
    const blocksToCheckX = (1 + ceil(Math.abs(addToX)))*direction //amount of blocks to check based on moveDistance
    const blocksToCheckY = floor(this.y) == floor(this.y+this.height) ? 1 : 2; //Check if player is on 2 blocks on y Direction
    for(let i = 0; i < blocksToCheckY; i++){ //Go through all possible Blocks
      for(let j = 0; j != blocksToCheckX; j+=(1*direction)){
        //Get position of block in world
        const blockX = floor(this.x)+j
        const blockY = floor(this.y)+i
        //get Chunk of Block
        const yChunk = floor(blockY/chunkSize)
        const xChunk = floor(blockX/chunkSize)
        //get index of block in array
        const index = getIndexFromBlock(blockX, blockY)
        //Get blocks array of that chunk
        const blocks2 = getChunk(xChunk, yChunk).blocks2;
        if(blocks2[index] == null) return direction == 1 ? blockX - this.width - this.collCorrection : blockX + 1 + this.collCorrection //Chunk hasnt been loaded, collide

        if(blocks2[index] != 0 && !blockInfo[blocks2[index]].noHitbox) //Block is there
          if(collision(this.x+addToX, this.y, this.width, this.height, blockX, blockY, 1, 1))
            return direction == 1 ? blockX - this.width - this.collCorrection : blockX + 1 + this.collCorrection
      }
    }
    return this.x + addToX //Nothing was hit
  }

  //Check if will be colliding with block in y direction, addToY is movement
  collisionY(addToY){
    const direction = Math.sign(addToY) //Moving in negative or positive, -1 = negative
    const blocksToCheckY = (1 + ceil(Math.abs(addToY)))*direction //amount of blocks to check based on moveDistance
    const blocksToCheckX = floor(this.x) == floor(this.x+this.width) ? 1 : 2; //Check if player is on 2 blocks on x Direction
    for(let i = 0; i < blocksToCheckX; i++){ //Go through all possible Blocks
      for(let j = 0; j != blocksToCheckY; j+=(1*direction)){
        //Get position of block in world
        const blockY = floor(this.y)+j
        const blockX = floor(this.x)+i
        //get Chunk of Block
        const yChunk = floor(blockY/chunkSize)
        const xChunk = floor(blockX/chunkSize)
        //get index of block in array
        const index = getIndexFromBlock(blockX, blockY)
        //Get blocks array of that chunk
        const blocks2 = getChunk(xChunk, yChunk).blocks2;
        if(blocks2[index] == null) return direction == 1 ? blockY - this.width - this.collCorrection : blockY + 1 + this.collCorrection //Chunk hasnt been loaded, collide

        if(blocks2[index] != 0 && !blockInfo[blocks2[index]].noHitbox) //Block is there
          if(collision(this.x, this.y+addToY, this.width, this.height, blockX, blockY, 1, 1))
            return direction == 1 ? blockY - this.width - this.collCorrection : blockY + 1 + this.collCorrection
      }
    }
    return this.y + addToY //Nothing was hit
  }

  //Teleport player to a specific location
  teleport(x, y){
    this.x = x //Move player
    this.y = y
    this.xChunk = floor(this.x / chunkSize) //Update chunk data about player
    this.yChunk = floor(this.y / chunkSize)
    camera.offsetX = self.x - 0.5*uwidth //Update camera position
    camera.offsetY = self.y - 0.5*uheight
    updateChunks() //Update chunks
    this.updateServer(["x", "y"])
  }

  //Try to hit player or mob
  hit(){
    let hit = false, hitType = "", hitId = "" //vars to store if something was hit and what was hit
    for(const id in players){ //See if player was hit
      const player = players[id]
      if(collision(player.x, player.y, player.width, player.height, this.mouseX, this.mouseY, 0.01, 0.01)){
        hit = true
        hitType = "player"
        hitId = id 
      }
    }

    if(!hit){
      for(const id in mobs){ //See if player was hit
        const mob = mobs[id]
        if(collision(mob.x, mob.y, mob.width, mob.height, this.mouseX, this.mouseY, 0.01, 0.01)){
          hit = true
          hitType = "mob"
          hitId = id 
        }
      }
    }

    if(hit){ //Something was hit
      let damage = 1
      if(this.itemSelected != 0 && itemInfo[this.itemSelected].toolType == 1){ //increase damage if player is holding a sword
        damage = itemInfo[this.itemSelected].damage
        this.useDurability()
      }

      socket.emit("damage", {type:hitType, id:hitId, damage:damage})
      this.hitIndicator = this.hitIndicatorMax
      return true
    }

    return false //if still here nothing was hit
  }

  //draw Indicator to show that something was hit
  drawHitIndicator(){
    if(this.hitIndicator > 0){ //draw hit indicator and reuce timer
      unitImage(itemInfo[20].image, this.mouseX+0.25, this.mouseY+0.25, 0.5, 0.5) //Draw image of iron sword
      
      this.hitIndicator -= sdeltaTime
    }
  }

  takeDamage(damage){
    if(!this.alive || this.falling || godmode) return
    this.health -= damage
    this.redScreen = this.redScreenMax
    this.recovery = this.recoveryMax
    this.updateServer(["health"], true)
    if(this.health <= 0) this.die()
  }

  //Recover health and draw redscreen when hit
  recover(){
    if(this.redScreen > 0){ //Redscreen
      fill(color(96, 0, 0, (this.redScreen/this.redScreenMax)*200))
      strokeWeight(0)
      rect(0, 0, width, height)
      this.redScreen -= sdeltaTime
    }

    if(this.health < 20){ //Regenerate health
      if(this.recovery <= 0){//can regenerate health
        this.health += this.recoverySpeed*sdeltaTime
        if(this.health > 20) this.health = 20
      }else{ //recovery timer has to go down first
        this.recovery -= sdeltaTime
      }
    }
  }

  //Check if player is standing on ground or in the void, true if void
  checkFall(){
    if(godmode) return

    const blocksToCheckY = floor(this.y) == floor(this.y+this.height) ? 1 : 2; //Check if player is on 2 blocks on y Direction
    const blocksToCheckX = floor(this.x) == floor(this.x+this.width) ? 1 : 2; //Check if player is on 2 blocks on x Direction
    for(let i = 0; i < blocksToCheckX; i++){ //Go through all blocks player is standing on
      for(let j = 0; j != blocksToCheckY; j++){
        //Get position of block in world
        const blockY = floor(this.y)+j
        const blockX = floor(this.x)+i
        //get Chunk of Block
        const yChunk = floor(blockY/chunkSize)
        const xChunk = floor(blockX/chunkSize)
        //get index of block in array
        const index = getIndexFromBlock(blockX, blockY)
        //Get blocks1 array of that chunk
        const blocks1 = chunks[xChunk + "/" + yChunk].blocks1;
        if(blocks1[index] != 0) //Block is there
          return //Player is standing on a block
      }
    }
    this.falling = true //Player is not standing on a block
    this.updateServer(["falling"], true)
  }

  //Make the fallanimation by making player smaller
  fall(){
    const fallRate = 0.6 / frameRate() //Divide by framerate so it takes the same time on different framerates
    this.x += fallRate*0.5 //Change pos so it looks like player is falling down
    this.y += fallRate*0.5
    this.width -= fallRate //Make player smaller
    this.height -= fallRate
    this.updateServer(["x", "y", "width", "height"])
    if(this.width <= 0){ //Kill player when animation is done
      this.falling = false
      this.updateServer(["falling"], true)
      this.die(true)
    }
  }

  //Kill player, deleteitems says if items should be dropped or deleted
  die(deleteItems = false){
    this.alive = false
    this.redScreen = 0
    deleteItems ? this.clearInventory() : this.dropInventory()
    this.updateServer(["alive"])
  }

  respawn(){
    if(this.alive) return

    this.teleport(this.spawnX, this.spawnY)
    this.width = 0.9
    this.height = 0.9
    this.alive = true
    this.health = 20
    this.updateServer(["width", "height", "alive"])
    this.updateServer(["health"], true)
  }

  //Send specific variables to server to be updated
  updateServer(data, serverOnly = false){
    let dataObject = {}
    for(let i = 0; i < data.length; i++){
      dataObject[data[i]] = self[data[i]]
    }
    if(serverOnly) dataObject.serverOnly = true
    socket.emit("playerDataChange", dataObject)
  }

  debug(){
    fill("white")
    textSize(height/50)
    strokeWeight(height/180)
    stroke("#414149")
    textAlign(LEFT)
    text("Pos: " + round(this.x, 1) + "/" + round(this.y, 1), width/50, height/15)
    text("Chunk: " + this.xChunk + "/" + this.yChunk, width/50, height/9)
  }
}

class OnlinePlayer{
  //playerData = variables
  constructor(playerData = playerLayout){
    Object.assign(this, playerData)
    this.arrow = false
    this.img = playerImg
    this.movedThisFrame = false //Keeps track of if players has moved in this frame for walking animation
  }

  //Draw the player on canvas
  draw(){
    if(!this.alive) return //Dont draw if not alive

    if(this.movedThisFrame){
      this.img = frameCount%30 > 14 ? (frameCount%15 > 8 ? playerMove1Img : playerImg) : (frameCount%15 > 8 ? playerMove2Img : playerImg) //walking animation
      this.movedThisFrame = false
    }else this.img = playerImg

    if(collision(camera.offsetX, camera.offsetY, uwidth, uheight, this.x, this.y, this.width, this.height)){ //Check if player is alive
      imageMode(CENTER)
      textAlign(CENTER)
      unitImage(this.img, this.x+0.5*this.width, this.y+0.5*this.height, this.width, this.height, !this.direction)

      stroke("#414149")
      fill("white")
      textSize(height/70)
      text(this.name, (this.x+this.width*0.5-camera.offsetX)*u, (this.y-0.5-camera.offsetY)*u)

      if(this.itemSelected != 0){//Draw item in hand if item in hand
        unitImage(itemInfo[this.itemSelected].image, (this.x+this.width*(this.direction ? 0.9 : 0.1)), this.y+this.height*0.6, this.width*0.5, this.height*0.5, !this.direction )
      }
      imageMode(CORNER)
    }else this.arrow = true //Tell code to draw arrow this frame
  }

  //Draw arrow pointing to player if not alive
  drawArrow(){
    if(!this.arrow) return //dont draw arrow if not needed
    //Idk how i got this piece of code to work, but it works
    const widthMiddleU = width/2/u+camera.offsetX //Middle of screen as world coordinates
    const heightMiddleU = height/2/u+camera.offsetY

    const deltaX = this.x - widthMiddleU //Get angle at which to rotate arrow
    const deltaY = this.y - heightMiddleU
    const tanAlpha = deltaX/deltaY //Get tan of angle
    let alpha = -Math.atan(tanAlpha)*180/Math.PI - (deltaY > 0 ? 180 : 0) //<= dont know why this last part works but it does
    if(alpha < 0) alpha = 360+alpha //Convert angle alpha to positive angle
    
    //Calculate at which x y position of canvas to draw arrow
    //First it is being checked if pos is at one of the sides, if true it is being checked on which side it is
    //If not static pos set to 0 and calculate later
    let x = ((alpha > 60.6 && alpha < 119.4) || (alpha > 240.6 && alpha < 299.4)) ? (alpha > 119.4 ? height/20 : width-(height/20)) : 0
    let y = (((alpha > 299.4) || (alpha < 60.6)) || (alpha > 119.4 && alpha < 240.6)) ? ((alpha > 60.6 && alpha < 240.6) ? height-(height/20) : height/20) : 0
    
    //Calculate side length of smaller similar triangle (  smallY/Y=smallX/X => (smallY*X)/Y = smallX  and other way around)
    //bigger triangles 2 points are this players position and middle of screen, has right angle
    if(x==0) x = ( (widthMiddleU+( (deltaX*( (camera.offsetY+y/u)-heightMiddleU ) )/deltaY) ) -camera.offsetX)*u 
    if(y==0) y = ( (heightMiddleU+( (deltaY*( (camera.offsetX+x/u)-widthMiddleU ) )/deltaX) ) -camera.offsetY)*u

    rotateImage(arrowImg, x, y, height/20, height/20, alpha)
    this.arrow = false //arrow has been drawn, dont draw next frame
  }
}
