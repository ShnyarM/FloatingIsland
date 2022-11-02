//Spawn an item, server var says if function was called because of server, if id is false give new id
function createItem(x, y, itemId, id, server, amn=1, durability = 0){
  const chunk = getChunkCords(x, y)
  const rand = id ? id : int(random(1000000)) //If id is true, item already has id, else create new
  chunk.items[rand] = new Item(x, y, itemId, rand, server, amn, durability)
}

//Delete existing item, x y needed to figure out chunk, id is special id of item, server says if function was called by server
function deleteItem(x, y, id, server=false){
  const chunk = getChunkCords(x, y)
  if(!server) socket.emit("worldData", {type:"itemChange", toDo:"delete", x:x, y:y, id: id})
  delete chunk.items[id]
}

class Item{
  constructor(x, y, itemId, id, server, amn, durability){
    this.x = x
    this.y = y
    this.xChunk = floor(x/chunkSize)
    this.yChunk = floor(y/chunkSize)
    this.width = 0.5
    this.height = 0.5
    this.id = id //random number to identify item
    this.itemId = itemId
    this.amn = amn
    this.durability = durability
    if(!server) socket.emit("worldData", {type:"itemChange", toDo:"create", x:this.x, y:this.y, itemId: this.itemId, id: this.id, amn:this.amn, durability:this.durability})
  }

  draw(){
    if(collision(camera.offsetX, camera.offsetY, uwidth, uheight, this.x, this.y, this.width, this.height)){ //Check if its visible on screen
      unitImage(itemInfo[this.itemId].image, this.x, this.y, this.width, this.height)
      if(itemInfo[this.itemId].stackable){ //Draw amn number if it is stackable
        textAlign(LEFT)
        strokeWeight(height/180)
        stroke("#414149")
        fill("white")
        textSize(height/100)
        unitText(this.amn,  this.x+0.25, this.y+0.4)
      }
    }
  }

  collision(){ //Check if player can pick it up
    if(collision(self.x, self.y, self.width, self.height, this.x, this.y, this.width, this.height)){
      self.getItem(this.itemId, this.amn, data => { //if data true, item was successfully picked up, data is amn that is remaining
        if(Number.isInteger(data)){ //Item was picked up
          if(data == 0){ //none remaining
            deleteItem(this.x, this.y, this.id, false)
          }else{ //Run again to see if rest can be picked up
            this.amn = data
            socket.emit("worldData", {type:"itemChange", toDo:"modifyAmn", x:this.x, y:this.y, id: this.id, amn:this.amn})
            this.collision()
          }  
        }
      }, this.durability)
    }
  }
}
