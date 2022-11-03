function socketSetup(){
  //socket = io.connect("http://localhost:16761/")
  socket = io.connect("https://floatingisland.ch/", {secure: true})

  socket.on("dataRequest", () => {
    if(loggedIn != null) socket.emit("name", {name: username, loggedIn: loggedIn, id: getCookie("id")}) //Tell name to server
    if(menuState == 6 && errorSkipable == false){ //Server has previously crashed and is now online again, remove error screen
      menuState=0
      page=0
      getFriends()
    }
  })
  
  socket.on("connectionData", connectData)
  socket.on("userJoined", userJoined)
  socket.on("userLeft", userLeft)

  socket.on("playerDataChange", playerDataUpdate)
  socket.on("selfDataChange", selfDataUpdate)
  socket.on("worldData", worldData)
  socket.on("mob", mobChange) //in mobs.js
  socket.on("damage", (data) => self.takeDamage(data)) //in players.js
  socket.on("worldTime", (data) => worldTime = data)
  socket.on("worldCreated", worldCreated)
  socket.on("leaveGame", () => {leaveGame(true)}) //_main.js

  socket.on("serverShutDown", serverShutDown)
  socket.on("disconnect", disconnect)
}

//Gets data back once successfully connected to game
function connectData(data){
  console.log("successfully connected to world")
  //Add existing players into players array
  for(var id in data.players){
    if(id != socket.id){
      players[id] = new OnlinePlayer(data.players[id])
    }
  }

  for(let i = 0; i < Object.keys(data.self).length; i ++){
    //Get name of changed key and put in value
    self[Object.keys(data.self)[i]] = Object.values(data.self)[i]
  }
  self.xChunk = floor(self.x / chunkSize)
  self.yChunk = floor(self.y / chunkSize)
  camera.offsetX = self.x - 0.5*uwidth
  camera.offsetY = self.y - 0.5*uheight
  self.armX = self.direction ? 0.9 : 0.1

  self.canMove = data.canMove //player can move if has been set on proper spawnpoint, else allowance will be given when spawnchunks have been created

  mapSetup()//Continue Setup
}

//Add new Player into players Array/New Player joined
function userJoined(id){
  players[id] = new OnlinePlayer();
  console.log("user joined")
}

//Gets called when user leaves
function userLeft(id){
  delete players[id]
}

//Updates data of other player when data is changed
function playerDataUpdate(data){
  //first key is id, rest is data with keyname being changed var
  for(let i = 1; i < Object.keys(data).length; i ++){
    //Get name of changed key and put in value
    players[data.id][Object.keys(data)[i]] = Object.values(data)[i]
    if(Object.keys(data)[i] == "x" || Object.keys(data)[i] == "y") players[data.id].movedThisFrame = true //for walking animation
  }
}

//Updates data of self when server tells to
function selfDataUpdate(data){
  //data with keyname being changed var
  for(let i = 0; i < Object.keys(data).length; i ++){
    //Get name of changed key and put in value
    self[Object.keys(data)[i]] = Object.values(data)[i]
    if((Object.keys(data)[i] == "x" || Object.keys(data)[i] == "y") && !self.canMove) self.canMove = true //If player pos has been changed and still cant move, make able to move, since now it must be on proper block
  }
  self.teleport(self.x, self.y) //Teleport player incase pos was changed
}

function worldData(data){
  switch(data.type){
    case "generateChunk": //Generate not existing chunk
      chunks[data.x + "/" + data.y].generate(data.seed, data.index)
      break;
    case "chunkData": //Get data about chunk from server and save it
      chunks[data.x + "/" + data.y].setBlocks(data.blocks1, data.blocks2)
      if(Object.keys(data.items).length != 0){ //Create the items if some were sent
        for(const i in data.items){
          const item = data.items[i]
          createItem(item.x, item.y, item.itemId, item.id, true, item.amn, item.durability)
        }
      }
      break;
    case "blockChange": //Block has been changed
      chunks[data.x + "/" + data.y].changeBlock(data.index, data.level, data.block, true) //Change to new Block
      break;
    case "itemChange": //Something about an item has been changed
      switch (data.toDo){
        case "create": //New item has been created
          createItem(data.x, data.y, data.itemId, data.id, true, data.amn, data.durability)
          break
        case "delete": //Item has been deleted
          deleteItem(data.x, data.y, data.id, true);
          break
        case "modifyAmn": //Amn of item has been changed
          getChunkCords(data.x, data.y).items[data.id].amn = data.amn
          break
      }
      break
  }
}

//Gets sent to client when requested world has been created
function worldCreated(data){
  joinGame(int(data), true)
  console.log("gameCreated")
}

function sendChunkData(x, y){
  const chunk = chunks[x + "/" + y]
  socket.emit("chunkData", {blocks1: chunk.blocks1, blocks2: chunk.blocks2})
}

//server has crashed, disconnect from world and display error message
function serverShutDown(){
  if(gameState == 1) leaveGame() //Leave game or remove inputs if neccesary
  else if(menuState == 4){
    worldNameInput.remove()
    worldSeedInput.remove()
  }else if(menuState == 5 && searchSelected) friendSearchInput.remove()

  menuState = 6
  errorSkipable = false
  errorMessage = "The server has unexpectedly shut down.\n\n\nYou will be reconnected automatically."
}

//Player has lost connection to server, display error message
function disconnect(){
  if(menuState == 6 && !errorSkipable) return //Server has shut down, error message already being displayed

  if(gameState == 1) leaveGame() //Leave game or remove inputs if neccesary
  else if(menuState == 4){
    worldNameInput.remove()
    worldSeedInput.remove()
  }else if(menuState == 5 && searchSelected) friendSearchInput.remove()

  menuState = 6
  errorSkipable = true
  errorMessage = "Connection to the server has been lost."
}
