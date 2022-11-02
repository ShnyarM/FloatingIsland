//fileread
var fs = require("fs")
// include fs-extra package
var fs = require("fs-extra");
var playerLayout;
const sOVars = ["spawnX", "spawnY", "falling", "loggedIn", "toolBarSelected", "toolBar", "inventory", "health"] //server only player variables, other players wont get these
const mapSaveVars = ["seed", "existingPlayers", "name", "spawnX", "spawnY", "time"] //Vars from world object that will be saved in json file
const noSave = ["loggedIn"] //Player variables that wont be saved

//Get JSON layout of a player
fs.readFile("public/rsc/json/playerLayout.json", "utf8", (err, data) => {
  if(err){console.log("error trying to read Playerlayout File"); return;}
  playerLayout = JSON.parse(data)
})

class World{
  constructor(socket, id, host, io, createNew=false, seed=0, name="", save=true){
    this.path = save ? "worlds/" + host + "/" + id + "/" : "worlds/§noUser/" + id + "/"
    this.save = save
    this.room = parseInt(id)
    this.host = host
    this.hostId = socket.id
    this.chunks = {}
    this.regions = [{}, {}, {}, {}] //Array of 4 objects, index corresponds to largeRegion
    this.players = {}
    this.mobs = {}
    this.mobCount = 0
    this.spawnPointCreated = false
    this.spawnX = 0
    this.spawnY = 0
    this.time = 0
    this.io = io

    if(createNew){ //World has to be created first
      fs.copy('worldTemplate', this.path).then(() => {
        this.seed = seed //Apply variables
        this.existingPlayers = []
        this.name = name
        fs.writeFile(this.path+"name", this.name) //Save name of world in file
        console.log('New World created: ' + this.room)
        socket.emit("worldCreated", id)
      })
      .catch(err => console.error(err));

    }else{ //World already created, only load it
      fs.readFile(this.path + "mapData.json", "utf8", (err, data) => { //Get saved worldData from file
        if(err){console.log("error trying to read mapData File"); return;}
        const worldJson = JSON.parse(data)
        this.seed = worldJson.seed //Apply variables
        this.existingPlayers = worldJson.existingPlayers
        this.name = worldJson.name
        this.spawnX = worldJson.spawnX
        this.spawnY = worldJson.spawnY
        this.time = worldJson.time
        this.spawnPointCreated = true //world has been saved, so this must be true
        socket.emit("worldCreated", id)
      })
    }
  }

  //gets called every 1000ms in script.js with setinterval() to update world data which is connected to time
  update1000(){
    //remove lifetime from items
    for(const c in this.chunks){ //Go through every loaded chunk and item and subtract from lifetime
      const chunk = this.chunks[c]
      for(const i in chunk.items){
        const item = chunk.items[i]
        item.timeLeft--
        if(item.timeLeft <= 0){ //Delete item if lifetime is over
          //Tell players that have chunk loaded that item is gone
          for(let i = 0; i < chunk.players.length; i++) this.io.to(chunk.players[i]).emit("worldData", {type:"itemChange", toDo:"delete", x:item.x, y:item.y, id: item.id})
          delete chunk.items[i]
        }
      }
    }

    //Increase daytime
    this.time++
    if(this.time >= 1200) this.time = 0
    this.io.to(this.room).emit("worldTime", this.time);

    if(this.time >= 700 && this.time <= 1100){//Nighttime, spawn mobs
      if(this.mobCount < 24 && this.mobCount < Object.keys(this.players).length*3){ //Spawn mobs if not maxed out
        const random = Math.random()
        if(random <= 0.2){ //20% chance of mob spawning in this second
          const chunkKeys = Object.keys(this.chunks)
          const randomChunk = this.chunks[chunkKeys[Math.round(Math.random()*(chunkKeys.length-1))]] //Get random Chunk in which it will spawn
          if(randomChunk){ //Check if chunk exists
            const x = Math.round(Math.random()*10) //x and y coordinate of chunk in which it will spawn
            const y = Math.round(Math.random()*10)
            this.spawnNewMob(randomChunk.x*10+x, randomChunk.y*10+y, 20, this.io)
          }
        }
      }
    }
  }

  //gets called every 250ms in script.js with setinterval() to update world data which is connected to time
  update250(){
    for(const mob in this.mobs){ //Mob pathfinding
      this.mobs[mob].pathfind(this.players, this.io, this.chunks)
    }
  }

  //gets called every 5ms in script.js with setinterval() to update world data which is connected to time
  update5(){
    for(const mob in this.mobs){ //Mob movement
      this.mobs[mob].move(this.io, this.chunks, this.mobs)
      this.mobs[mob].reduceCooldown()
    }
  }

  playerJoined(socket, name, loggedIn){
    console.log(name + " joined world " + this.room)
    socket.to(this.room).emit("userJoined", socket.id) //Other player get told about new player
    socket.to(this.room).emit("playerDataChange", {id: socket.id, name: name}) //tell other player name of new player
    //socket.emit("connectionData", {players: this.players}) //Player gets sent data about other players

    this.players[socket.id] = {}
    Object.assign(this.players[socket.id], playerLayout); //Create new Object for Player and assign playerLayout to it
    this.players[socket.id].name = name
    this.players[socket.id].loggedIn = loggedIn

    let publicPlayersData = JSON.parse(JSON.stringify(this.players)) //make deep copy Object with data from other players that will get sent to player
    for(const player in publicPlayersData)
      for(const data in publicPlayersData[player]) if(sOVars.indexOf(data) != -1) delete publicPlayersData[player][data] //Delete keys that wont be sent

    if(loggedIn && this.existingPlayers.indexOf(name) != -1){ //Check if player has already played on this world
      const data = fs.readFileSync(this.path + "playerData/" + name + ".json", "utf8", (err) => {
        if(err){console.log("error trying to read Player File"); return;}
      })
      const playerData = JSON.parse(data)
      Object.assign(this.players[socket.id], playerData) //put saved playerData into object

      var publicSelfData = JSON.parse(JSON.stringify(this.players[socket.id]))//make deep copy of Object with data that will get sent to other players
      for(const data in publicSelfData) if(sOVars.indexOf(data) != -1) delete publicSelfData[data] //Delete keys that wont be sent

      socket.to(this.room).emit("playerDataChange", {id: socket.id, ...publicSelfData}) //Send new data to other players
      socket.emit("connectionData", {players: publicPlayersData, self: playerData, canMove:this.spawnPointCreated}) //Player gets sent data about other players and himself
      return
    }
    socket.emit("connectionData", {players: publicPlayersData, self: {x: this.spawnX, y: this.spawnY, spawnX: this.spawnX, spawnY: this.spawnY}, canMove: this.spawnPointCreated}) //Player gets sent data about other players and spawnPoint
    socket.to(this.room).emit("playerDataChange", {id: socket.id, x: this.spawnX, y: this.spawnY}) //Send new data to other players
    Object.assign(this.players[socket.id], {x: this.spawnX, y: this.spawnY, spawnX: this.spawnX, spawnY: this.spawnY})
  }

  //Update data about Player and send to other Players, if serverOnly is true it wont be sent to other players
  playerChange(socket, data){
    //keyname of value in data is changed var and value is new value
    for(let i = 0; i < Object.keys(data).length; i++){
      //Get name of changed key and put in value
      if(Object.keys(data)[i] != "serverOnly" && this.players[socket.id][Object.keys(data)[i]] != null) 
        this.players[socket.id][Object.keys(data)[i]] = Object.values(data)[i]
    } //Emit to others
    if(!data.serverOnly) socket.to(this.room).emit("playerDataChange", {id: socket.id, ...data}); //Add id to data and send to other players
  }

  //Update data about player inventory
  inventoryChange(socket, data){
    if(!isNaN(parseInt(data.index) && typeof data.item == "object")){//Check if data is valid
      if(data.type == "inventory" || data.type == "toolBar"){
        if(this.players[socket.id][data.type][data.index] == null) return //Check if index isnt too high
        this.players[socket.id][data.type][data.index] = data.item
      }
    }
  }

  playerLeft(socket, callback){
    const player = this.players[socket.id]
    this.savePlayerData(player) //save Playerdata in file
    
    for(const chunk in this.chunks){ //delete player in list of players inside of chunks
      const index = this.chunks[chunk].players.indexOf(socket.id)
      if(index != -1){ //Delete player from list if chunk has that player
        this.chunks[chunk].players.splice(index, 1)
        if(this.chunks[chunk].players.length == 0) this.deleteChunk(this.chunks[chunk], false) //Delete chunk if its now empty
      }
    }
    delete this.players[socket.id] //Delete player from server list
    socket.to(this.room).emit("userLeft", socket.id); //Emit left player to others
    if(Object.keys(this.players).length == 0 || socket.id == this.hostId) {this.closeWorld(); callback({closed: true, players: this.players}); return}  //Close world if no more Players are active or host left
    //send players with callback to remove them from rooms and kick them from game

    callback({closed: false}) //world is not being closed
  }

  //change Block when player does and tell other players
  blockChanged(data, socket){
    if(isNaN(data.x) || isNaN(data.y) || isNaN(data.index) || isNaN(data.level) || isNaN(data.block)) return //Check if data is valid
    if(data.index < 0 || data.index > 100 || data.block < 0) return //Check if data is valid

    if(parseInt(data.level) == 1 || parseInt(data.level) == 2){ //check data validity one last time
      const chunk = this.getChunk(data.x, data.y)
      if(!chunk) return //Check if chunk exists

      chunk.changeBlock(data.index, data.level, data.block)
      for(let i = 0; i < chunk.players.length; i++) if(chunk.players[i] != socket.id) socket.to(chunk.players[i]).emit("worldData", data)
    }
  }

  //Player has hit something
  handleDamage(socket, data){
    if(isNaN(data.damage) || data.damage < 0 || typeof data.id != "string" || typeof data.type != "string") return //Check if data is valid

    if(data.type == "mob"){ //mob has taken damage
      const mob = this.mobs[data.id]
      if(mob) mob.takeDamage(data.damage, this)

    }else if(data.type == "player"){ //player has taken damage
      if(this.players[data.id]) socket.to(data.id).emit("damage", data.damage) //Tell player that it has taken damage
    }
  }

  //Save Data when player generates new Chunk
  receiveChunkData(data, socket){
    if(isNaN(data.x) || isNaN(data.y) || !Array.isArray(data.blocks1) || !Array.isArray(data.blocks2) ) return
    if(data.blocks1.length != 100 || data.blocks2.length != 100) return //Check if data is valid
    const chunk = this.getChunk(data.x, data.y)
    if(!chunk) return //Check if chunk exists

    chunk.blocks1 = data.blocks1
    chunk.blocks2 = data.blocks2
    this.saveChunkData(chunk)
  }

  //Player loads new chunk
  enterChunk(x, y, socket){
    if(isNaN(x) || isNaN(y)) return //Check if data is valid

    let chunk = this.getChunk(x, y)
    if(chunk){ //Chunk is already loaded, send chunk data to player
      socket.emit("worldData", {type: "chunkData", x: x, y: y, blocks1: chunk.blocks1, blocks2:chunk.blocks2, items:chunk.items})
      if(chunk.mobs.length != 0) //Check if mobs are in chunk
        for(const mobId of chunk.mobs){ //Tell player about mobs in chunk
          const mob = this.mobs[mobId]
          socket.emit("mob", {type:"spawn", id:mob.id, x:mob.x, y:mob.y})
        }
      chunk.players.push(socket.id) //Add player into list of players in chunk
      return
    }

    this.chunks[x + "/" + y] = new Chunk(x, y) //Create Chunk object
    chunk = this.getChunk(x, y)

    //Check if Region is loaded, load if it isnt
    if(!this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY]){//Region isnt loaded
      const path = this.path + "chunkData/"+chunk.lRegion+"-"+chunk.sRegionX+"_"+chunk.sRegionY+".json"
      if (!fs.existsSync(path)) {//Region doesnt exist
        this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY] = {large: chunk.lRegion, smallX: chunk.sRegionX, smallY:chunk.sRegionY, indexes:0, chunksLoaded:0} //Create Region object
      }else{ //Region exists, load it in
        const data = fs.readFileSync(path, {encoding:'utf8', flag:'r'}); //Read data from region file
        this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY] = JSON.parse(data) //Apply data to region object
        this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY].chunksLoaded = 0 //create chunksLoaded variable
      }
    }//Region is now definetly loaded
    const regionObj = this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY]

    if(regionObj[x + "/" + y]){//Chunk has already been generated once
      //Read data from file and apply once it is done
      this.readChunkBlocks(chunk.lRegion+"-"+chunk.sRegionX+"_"+chunk.sRegionY, regionObj[x + "/" + y].index, data => {
        chunk.blocks1 = data[0]
        chunk.blocks2 = data[1]

        const chunkData = this.readChunkData(chunk)
        chunk.items = chunkData[0] //Get items

        if(Object.keys(chunkData[1]).length != 0){ //Get mobs
          for(const mobId in chunkData[1]){ //Spawn all mobs
            const mob = chunkData[1][mobId]
            this.spawnNewMob(mob.x, mob.y, mob.health, null, mob.id) //Spawn all mobs
            socket.emit("mob", {type: "spawn", id:mob.id, x:mob.x, y:mob.y}) //Tell player to spawn mobss
          }
        }
        socket.emit("worldData", {type: "chunkData", x: x, y: y, blocks1: chunk.blocks1, blocks2:chunk.blocks2, items:chunk.items})
      })
    }else{//generate Chunk
      socket.emit("worldData", {type: "generateChunk", x: x, y: y, seed: this.seed}) //Tell player to generate itself
      regionObj[x + "/" + y] = {index: regionObj.indexes++} //Save index of chunk in obj
    }
    chunk.players.push(socket.id) //Add player into list of players in chunk
    chunk.index = regionObj[x + "/" + y].index //Save index of chunk in chunk
    regionObj.chunksLoaded++ //increase number of chunksLoaded in regionObj
  }

  //Gets called when player no longer has chunk loaded
  leaveChunk(x, y, socket){
    if(isNaN(x) || isNaN(y)) return //Check if data is valid

    const chunk = this.getChunk(x, y)
    if(!chunk) return //Check if chunk exists

    const playersArr = chunk.players
    if(playersArr.indexOf(socket.id) == -1) return //Check if player is in chunk

    playersArr.splice(playersArr.indexOf(socket.id), 1) //Remove player from players list of chunk
    if(chunk.mobs.length != 0) for(const mob of chunk.mobs) {socket.emit("mob", {type:"delete", id:mob})}//Delete all mobs inside chunk

    if(playersArr.length == 0) this.deleteChunk(chunk)//Delete Chunk if no more players are in it
  }

  //delete a chunk
  deleteChunk(chunk, deleteMobs = true){
    if(chunk.mobs.length != 0 && deleteMobs){//Delete all mobs inside chunk
      for(const mob of chunk.mobs) {delete this.mobs[mob]; this.mobCount--}
      chunk.mobs = []
    }

    this.saveChunkData(chunk)  //Save Chunk Data to file
    const region = this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY] //Get Region
    if(--region.chunksLoaded == 0){ //Save and delete Region if no more chunks are loaded
      this.saveRegionData(region)
      delete this.regions[chunk.lRegion][chunk.sRegionX+"/"+chunk.sRegionY]
    }
    const x = chunk.x
    const y = chunk.y
    delete this.chunks[x + "/" + y]
  }

  //Host has created the spawnchunks, only gets called when world first gets created
  spawnChunksGenerated(name, socket){
    if(name != this.host || this.spawnPointCreated) return; //check if username corresponds with hostname and spawnPoint hasnt already been calculated
    if(this.chunks["0/0"].blocks1[0] != 0){ //set spawnPoint to zero if 0 has block on it
      this.spawnX = 0
      this.spawnY = 0
      socket.emit("selfDataChange", {x: this.spawnX, y: this.spawnY, spawnX:this.spawnX, spawnY:this.spawnY}) //Tell host to change own position
      this.spawnPointCreated = true
      return
    }
    for(const chunk in this.chunks){ //Go through all chunks and search for valid block
      for(let i = 0; i < 100; i++)
        if(this.chunks[chunk].blocks1[i] != 0){ //
          this.spawnX = this.chunks[chunk].x*10+(i%10)
          this.spawnY = this.chunks[chunk].y*10+(Math.floor(i/10))
          this.spawnPointCreated = true
          socket.emit("selfDataChange", {x: this.spawnX, y: this.spawnY, spawnX:this.spawnX, spawnY:this.spawnY}) //Tell host to change own position
          this.players[socket.id].spawnX = this.spawnX
          this.players[socket.id].spawnY = this.spawnY
          socket.to(this.room).emit("playerDataChange", {id: socket.id, x: this.spawnX, y: this.spawnY, spawnX: this.spawnX, spawnY: this.spawnY}); //Tell other players host pos changed, shouldnt be needed but added for securityd
          return
        }
    }
  }

  //item has been modified, spawned or removed, toDo, x, y, id, itemId
  itemChange(data, socket){
    if(isNaN(data.x) || isNaN(data.y) || isNaN(data.id)) return //Check if data is valid
    const chunk = this.getChunkCords(data.x, data.y)
    if(!chunk) return //Check if chunk exists

    if(data.toDo == "create"){ //Create new Item
      if(isNaN(data.itemId) || isNaN(data.id) || isNaN(data.amn)) return //Check if data is valid
      if(data.itemId < 1 || data.id < 0 || data.amn < 1) return //Check if data is valid
      chunk.items[data.id] = new Item(data.x, data.y, data.itemId, data.id, data.amn, data.durability)
    }else if(data.toDo == "delete"){ //Delete existing item
      if(!chunk.items[data.id]) return //Check if item exists
      delete chunk.items[data.id]
    }else if(data.toDo == "modifyAmn"){ //Amount of item has been changed
      if(!chunk.items[data.id] || isNaN(data.amn)) return //Check if data is valid
      chunk.items[data.id].amn = data.amn
    }else return //data is invalid
    for(let i = 0; i < chunk.players.length; i++) if(chunk.players[i] != socket.id) socket.to(chunk.players[i]).emit("worldData", data) //Send new data to everyone that has that chunk loaded
  }

  //Read block data from file, return array with blocks1 and blocks2
  readChunkBlocks(region, index, callback){
    let buffer = new Buffer.alloc(200) //create Buffer where data is stored, 200
    openFile(this.path + "chunkData/blocks/" + region, data => { //Open neccesary file
      fs.read(data, buffer, 0, 200, index*200, (err, bytes) =>{ //Read part where chunkData is
        if(err){console.log("error trying to read bytes for chunkBlocks"); return;}

        let blocks1 = [], blocks2 = [];
        for(let i = 0; i < 100; i++)  blocks1.push(parseInt(buffer[i].toString(2), 2)) //Convert binary data to numbers and store in Array
        for(let i = 100; i < 200; i++)  blocks2.push(parseInt(buffer[i].toString(2), 2))
        closeFile(data) //Close the file
        callback([blocks1, blocks2])
      });
    })
  }

  //Get data from Chunk that isnt stored in blocks files, return array (0 = items, 1 = mobs)
  readChunkData(chunk){
    let data = []
    const regionChunk = this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY][chunk.x+"/"+chunk.y]

    if(regionChunk.items && Object.keys(regionChunk.items).length != 0) data[0] = regionChunk.items //Get Items
    else data[0] = {}

    if(regionChunk.mobs && Object.keys(regionChunk.mobs).length != 0) data[1] = regionChunk.mobs //Get mobs
    else data[1] = {}
    return data
  }

  //Save Chunk data in file
  saveChunkData(chunk){
    //Save items in region object or remove them if none exist
    const regionChunk = this.regions[chunk.lRegion][chunk.sRegionX+"_"+chunk.sRegionY][chunk.x+"/"+chunk.y]
    if(Object.keys(chunk.items).length != 0) regionChunk.items = chunk.items
    else delete regionChunk.items

    if(chunk.mobs.length != 0){ //Save mobs in regionchunk object if any exist
      regionChunk.mobs = {}
      for(const mobId of chunk.mobs){
        const mob = this.mobs[mobId]
        regionChunk.mobs[mobId] = {id:mob.id, x:mob.x, y:mob.y, health:mob.health}
      }
    }else delete regionChunk.mobs

    let buffer = new Buffer.alloc(200) //Create buffer where the written content will be saved, 200 bytes because 200 blocks
    //Save values from Array in buffer as 8bit binary numbers
    for(let i = 0; i < 100; i++) buffer[i] = "0b" + to8Binary(chunk.blocks1[i])
    for(let i = 100; i < 200; i++) buffer[i] = "0b" + to8Binary(chunk.blocks2[i-100])

    const path = this.path + "chunkData/blocks/"+chunk.lRegion+"-"+chunk.sRegionX+"_"+chunk.sRegionY
    if(!fs.existsSync(path)) fs.closeSync(fs.openSync(path, 'w')); //create file if it doesnt exist

    openFile(path, data => { //Open File
      //Write data to file
      fs.write(data, buffer, 0, 200, chunk.index*200, (err) =>{
        if(err){console.log("error trying to write bytes to save Chunk Blocks"); return;}
        closeFile(data) //Close the file
      });
    })
  }

  saveRegionData(region){//Save data from region objects in file
    delete region.chunksLoaded
    const jsonData = JSON.stringify(region)

    const path = this.path + "chunkData/"+region.large+"-"+region.smallX+"_"+region.smallY+".json"

    fs.writeFile(path, jsonData, err => {
      if(err) console.log("error saving region data in json File")
    })
  }

  savePlayerData(player){
    if(!player.loggedIn) return //Check if should be saved

    for(const data in player) if(noSave.indexOf(data) != -1) delete player[data] //Delete keys that wont be saved
    const jsonData = JSON.stringify(player)
    fs.writeFileSync(this.path + "playerData/" + player.name + ".json", jsonData, err => {
      if(err) console.log("error saving player data in json File")
    })
    if(this.existingPlayers.indexOf(player.name) == -1) this.existingPlayers.push(player.name) //Add player to world list if not already
  }

  closeWorld(){ //Close the world once no more Players are on it
    this.closing = true

    if(Object.keys(this.players).length != 0){ //save playerData if there are still players remaining
      for(const player in this.players) this.savePlayerData(this.players[player])
    }

    if(!this.save){//Delete folder and stop function if world isnt being saved
      fs.rm(this.path, { recursive: true }, (err) => {
        if(err) console.log("error deleting world")
        console.log("world deleted:" + this.room);
        return
      });
    }

    //Save worldData to json
    let jsonObject = {}
    for(const key in this){ //Go through every key in this world object and check if should be saved
      if(mapSaveVars.indexOf(key) != -1) jsonObject[key] = this[key]
    }
    const jsonData = JSON.stringify(jsonObject)
    fs.writeFile(this.path + "mapData.json", jsonData, err => {
      if(err) console.log("error writing world data to json File")
    })

    for(const c in this.chunks){ //Save all Chunks
      this.saveChunkData(this.chunks[c])
    }

    for(let i = 0; i < 4; i++){//Save all regions
      for(const r in this.regions[i]){
        this.saveRegionData(this.regions[i][r])
      }
    }

    setFileTime(this.path) //Change date modified of world so it displays in correct order
    console.log("closed World: " + this.room) //Final deletion occurs in server.js after this
  }

  //Get a chunk by its chunkcoordinates
  getChunk(x, y){
    return this.chunks[x + "/" + y]
  }

  //Get a chunk by its coordinates
  getChunkCords(x, y){
    return this.chunks[Math.floor(x/10) + "/" + Math.floor(y/10)]
  }

  spawnNewMob(x, y, health, io, idToAssign=0){
    const chunk = this.getChunkCords(x, y)
    if(!chunk) return //Check if spawnpoint is valid
    const id = idToAssign == 0 ? Math.round(Math.random()*1000000) : idToAssign //Get random id for mob or use which is already assigned
    this.mobs[parseInt(id)] = new Monster(x, y, id, health)
    this.mobCount++

    chunk.mobs.push(id)
    if(io != null) for(let i = 0; i < chunk.players.length; i++) io.to(chunk.players[i]).emit("mob", {type: "spawn", id:id, x:x, y:y})
  }

  deleteMob(id){
    const mob = this.mobs[id]
    if(!mob) return //Check if mob exists

    const chunk = this.getChunk(mob.xChunk, mob.yChunk) 
    for(const playerId of chunk.players) this.io.to(playerId).emit("mob", {type:"delete", id:id}) //Tell players that have loaded mob to delete it
    chunk.mobs.splice(chunk.mobs.indexOf(id), 1) //Remove from chunk list

    this.mobCount--
    delete this.mobs[id]
  }
}

//open a file
function openFile(path, callback){
  fs.open(path, "r+", (err, data) => {
    if(err){console.log("error trying to open File: " + path); return;}
    callback(data)
  })
}

//close a file, data
function closeFile(file){
  fs.close(file, err => {
    if (err) {console.log("error trying to close file"); return;}
  });
}

//Convert an integer into 8bit binary number
function to8Binary(int){
  if(int < 0 || int > 255 || !Number.isInteger(int)) return;
  let bin = int.toString(2)
  //Add zeros at the start if string.length isnt 8
  while(bin.length < 8) bin = "0" + bin
  return bin
}

//Change the modifiedDate of File, used so Worlds display correctly
function setFileTime(filePath) {
  const date = new Date()
  fs.utimesSync(filePath, date, date);
}

//Detect collision between objects with pos and size
function collision(x1, y1, w1, h1, x2, y2, w2, h2){
  if (x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2)
    return true;
  else
    return false;
}

//Fast inverse Square root, from https://gist.github.com/starfys/aaaee80838d0e013c27d
function Q_rsqrt(number)
{
    var i;
    var x2, y;
    const threehalfs = 1.5;

    x2 = number * 0.5;
    y = number;
    //evil floating bit level hacking
    var buf = new ArrayBuffer(4);
    (new Float32Array(buf))[0] = number;
    i =  (new Uint32Array(buf))[0];
    i = (0x5f3759df - (i >> 1)); //What the fuck?
    (new Uint32Array(buf))[0] = i;
    y = (new Float32Array(buf))[0];
    y  = y * ( threehalfs - ( x2 * y * y ) );   // 1st iteration
//  y  = y * ( threehalfs - ( x2 * y * y ) );   // 2nd iteration, this can be removed

    return y;
}

class Chunk{
  constructor(x, y){
    this.x = x
    this.y = y
    this.blocks1 = []
    this.blocks2 = []
    this.players = []
    this.index = 0
    this.items = {}
    this.mobs = []

    //largeRegion, ranges from 0-3
    this.lRegion = 0
    if(this.x < 0) this.lRegion+=2
    if(this.y < 0) this.lRegion+=1

    //Small Region, from 0 to infinity
    this.sRegionX = Math.floor(Math.abs(this.x)/15) //Divide coordinate by 15 and floor it
    this.sRegionY = Math.floor(Math.abs(this.y)/15)
  }

  changeBlock(index, level, block){
    const chunk = this //this["..."] isnt possible, workaround
    chunk["blocks" + level][index] = block
  }
}

class Item{
  constructor(x, y, itemId, id, amn=1, durability){
    this.x = x
    this.y = y
    this.id = id //random number to identify item
    this.itemId = itemId
    this.amn = amn
    this.durability = durability
    this.timeLeft = 120 //Timeleft in seconds, goes down when item is loaded
  }
}

class Monster{
  constructor(x, y, id, health = 20){
    this.x = x
    this.y = y
    this.width = 0.9
    this.height = 0.9
    this.xChunk = Math.floor(x/10)
    this.yChunk = Math.floor(y/10)
    this.id = parseInt(id)
    this.speed = 0.075
    this.health = health
    this.damage = 4
    this.cooldownMax = 30
    this.cooldown = 0

    this.xVelocity = 0
    this.yVelocity = 0
    this.collCorrection = 0.00001 //Add when colliding to prevent bugs where game thinks its inside another mob
  }

  //Move mob, io to tell players
  move(io, chunks, mobs){
    if(this.xVelocity == 0 && this.yVelocity == 0) return //stop if not moving

    if(this.xVelocity != 0) this.x = this.collisionX(this.xVelocity, mobs)
    if(this.yVelocity != 0) this.y = this.collisionY(this.yVelocity, mobs)

    const newxChunk = Math.floor(this.x/10)
    const newyChunk = Math.floor(this.y/10)

    if(newxChunk != this.xChunk || newyChunk != this.yChunk){
      const oldChunk = chunks[this.xChunk + "/" + this.yChunk]
      const newChunk = chunks[newxChunk + "/" + newyChunk]
      this.xChunk = newxChunk
      this.yChunk = newyChunk
      oldChunk.mobs.splice(oldChunk.mobs.indexOf(this.id), 1) //remove from old chunk
      if(newChunk) newChunk.mobs.push(this.id) //Add to new Chunk

      for(const player of newChunk.players){
        if(oldChunk.players.indexOf(player) == -1) io.to(player).emit("mob", {type: "spawn", id:this.id, x:this.x, y:this.y}) //tell players that werent in chunk before to spawn
        else io.to(player).emit("mob", {type: "varChange", id: this.id, xChunk: this.xChunk, yChunk: this.yChunk}) //tell players that were in chunk before to change x/yChunks vars
      }
      for(const player of oldChunk.players){
        if(newChunk.players.indexOf(player) == -1) io.to(player).emit("mob", {type: "delete", id: this.id}) //tell players that arent in newchunk to delete mob
      }
    }
    const chunk = chunks[this.xChunk + "/" + this.yChunk]
    if(chunk) //Check if chunk exists
      for(let i = 0; i < chunk.players.length; i++) io.to(chunk.players[i]).emit("mob", {type: "varChange", id:this.id, x:this.x, y:this.y})
  }

  //Check if will be colliding with mob in y direction, addToX is movement, basically copied from player.js
  collisionX(addToX, mobs){
    const direction =  Math.sign(addToX) //Moving in negative or positive, -1 = negative
    for(const mobId in mobs){
      if(mobId == this.id) continue

      const mob = mobs[mobId]
      if(collision(this.x+addToX, this.y, this.width, this.height, mob.x, mob.y, mob.width, mob.height)){
        return direction == 1 ? mob.x - this.width - this.collCorrection : mob.x + mob.width + this.collCorrection
      }
    }

    return this.x + addToX //Nothing was hit
  }

  //Check if will be colliding with mob in y direction, addToY is movement, basically copied from player.js
  collisionY(addToY, mobs){
    const direction =  Math.sign(addToY) //Moving in negative or positive, -1 = negative
    for(const mobId in mobs){
      if(mobId == this.id) continue

      const mob = mobs[mobId]
      if(collision(this.x, this.y+addToY, this.width, this.height, mob.x, mob.y, mob.width, mob.height)){ //Check if would be colliding with other mob
        return direction == 1 ? mob.y - this.width - this.collCorrection : mob.y + mob.height + this.collCorrection
      }
    }
    
    return this.y + addToY //Nothing was hit
  }

  //Reduce cooldown of attack
  reduceCooldown(){
    if(this.cooldown <= 0) return
    this.cooldown--
  }

  //Set velocity to go to nearest player
  pathfind(players, io, chunks){
    let target, targetId //player to attack (closest one) and its id

    //Get target player
    const playerKeys = Object.keys(players)
    if(playerKeys.length == 1) {target = players[playerKeys[0]]; targetId = playerKeys[0]} //if only one player in game set as target
    else{
      let closest //store closest player and its distance
      for(const p in players){ //Go through all players and check which is closest
        const player = players[p]
        const distance = (this.x-player.x)**2+(this.y-player.y)**2
        if(closest == null || distance < closest[1]) closest = [p, distance] //Set as new closest if closer than last one
      }
      target = players[closest[0]]
      targetId = closest[0]
    }

    const diffX = target.x - this.x //x and y differences of mob and target location
    const diffY = target.y - this.y
    const hypothenuse = diffX**2+diffY**2 //Hypothenuse^2 of right triangle with diffX/Y as catheters
    if(hypothenuse <= 1){
      this.xVelocity = 0
      this.yVelocity = 0
      this.attack(targetId, io)
      return
    }
    const reductionFactor = this.speed*Q_rsqrt(hypothenuse) //factor with which to reduce diffX/Y to get velocity
    this.xVelocity = diffX*reductionFactor
    this.yVelocity = diffY*reductionFactor

    const chunk = chunks[this.xChunk + "/" + this.yChunk] //Tell players about direction which mob is facing, 
    for(let i = 0; i < chunk.players.length; i++) io.to(chunk.players[i]).emit("mob", {type: "varChange", id:this.id, direction:Math.sign(this.xVelocity) == 1 ? true : false})
  }

  //Attack a player
  attack(player, io){
    if(this.cooldown > 0) return
    io.to(player).emit("damage", this.damage) //Tell player it got attacked
    this.cooldown = this.cooldownMax //Reset attack cooldown
  }

  //Callback says if mob died
  takeDamage(damage, worldObject){
    this.health -= damage
    if(this.health <= 0) worldObject.deleteMob(this.id)
  }
}

//Export Class so it can be used in other scripts
module.exports = {World}
