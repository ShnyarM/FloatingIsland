//Start express server
var express = require("express");
const cookieParser = require("cookie-parser")
var app = express();
var server = app.listen(80)
app.use(express.static("public"));
//Parse incoming POST requests to make them useable
app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cookieParser())

//filereading
var fs = require("fs")

//Start socket
var socket = require("socket.io");
var io = socket(server);
var users = {}
var usersByName = {} //Stores id of user with name being the key, makes it easy to get users object by name

console.log("Server is running");


//---------------GAMESERVER---------------------------------------
//Script to manage different running games
var worldScript = require("./scripts/worldHandler.js");
//Store current running games
let worlds = {}
var worldIDs //Existing worlds
//Read worldIds from file, try syntax because it needs to be sync
worldIDs = parseInt(fs.readFileSync("worlds/IDs.txt", "utf8"))


io.on("connection", socket => { //New socket/New Player connected to server
  console.log("new connection: " + socket.id)
  users[socket.id] = new User(socket.id)
  socket.emit("dataRequest") //request name of player

  socket.on("createWorld", data => {
    if(typeof data != "object") return
    data.host = users[socket.id].name

    if(data.createNew){ //World has to be newly created
      const id = ++worldIDs
      fs.writeFile("worlds/IDs.txt", worldIDs.toString(), err => {if(err)console.log("error saving worldIds")})//Save new worldIDs in file

      if(isNaN(data.seed) || data.seed < 0 || data.seed > 65536) data.seed = Math.floor(Math.random()*65536) //Get random seed if given seed is invalid

      if(typeof data.name != "string") data.name = "New World" //Set default world name if data is invalid
      data.name = removeSpecialChars(data.name)//remove forbidden chars from name
      if(data.name.length > 18) data.name = data.name.slice(0, 18) //Limit world name if name is too long

      worlds[id] = new worldScript.World(socket, id, data.host, io, true, data.seed, data.name, users[socket.id].loggedIn)
      console.log("created World: " + id)
    }else {//World already exists
      if(!checkLogin(data.host, data.userId) || isNaN(data.id)) return //Make sure user has permission and data is valid
      if(!fs.existsSync("worlds/" + data.host + "/" + data.id + "/")) return //Check if world exists

      worlds[data.id] = new worldScript.World(socket, data.id, data.host, io)
      console.log("created World: " + data.id)
    }
  })

  //Player has joined a game, data is id of world
  socket.on("join", data => {
    if(!worlds[data]) return //Check if world exists, automatically checks if data is valid

    if(users[socket.id].loggedIn || worlds[data].hostId == socket.id){ //Check if player is allowed to join
      if(worlds[data].hostId != socket.id && !areFriends(users[socket.id].name, worlds[data].host)) return //Check if host and player are friends if not host

      socket.join(data) //Add Player to room of game he joined
      users[socket.id].room = data
      users[socket.id].inGame = true
      worlds[data].playerJoined(socket, users[socket.id].name, users[socket.id].loggedIn) //Add to world
    }
  })

  //Get username and loginStatus from user
  socket.on("name", data => {
    if(typeof data != "object" || typeof data.name != "string" || typeof data.loggedIn != "boolean" || typeof data.id != "string") return //Check if data is valid

    if(data.loggedIn && checkLogin(data.name, data.id) && (usersByName[data.name] == null || usersByName[data.name] == socket.id)){ //Check if actually logged in
      users[socket.id].name = data.name
      users[socket.id].loggedIn = true
      usersByName[data.name] = socket.id //Store id by name
    }else{ //Player is not logged in
      users[socket.id].name = "Player"
      users[socket.id].loggedIn = false
    }
  })

  //Data about player has changed ingame
  socket.on("playerDataChange", data => {
    if(!users[socket.id].inGame || !worlds[getRoom(socket)] || typeof data != "object") return //Check if data is valid and player can send the data
    worlds[getRoom(socket)].playerChange(socket, data) //Tell world class changed data
  })

  //Player has attacked something ingame
  socket.on("damage", data => {
    if(!users[socket.id].inGame || !worlds[getRoom(socket)] || typeof data != "object") return //Check if data is valid and player can send the data
    worlds[getRoom(socket)].handleDamage(socket, data) //Tell world class
  })

  //Something in inventory of player Changed, vars: type = (toolbar/backbag), index, item
  socket.on("inventoryChange", data => {
    if(!users[socket.id].inGame || !worlds[getRoom(socket)] || typeof data != "object") return //Check if data is valid and player can send the data
    worlds[getRoom(socket)].inventoryChange(socket, data) //Tell world class changed data
  })

  socket.on("worldData", data => { //Data about world
    if(!users[socket.id].inGame || !worlds[getRoom(socket)] || typeof data != "object") return //Check if data is valid and player can send the data
    switch(data.type){
      case "enterChunk": //player loaded chunk
        worlds[getRoom(socket)].enterChunk(data.x, data.y, socket)
        break;
      case "leaveChunk": //player unloaded chunk
        worlds[getRoom(socket)].leaveChunk(data.x, data.y, socket)
        break;
      case "generatedChunk": //player generated a chunk
        worlds[getRoom(socket)].receiveChunkData(data, socket)
        break;
      case "blockChange": //player changed a block
        worlds[getRoom(socket)].blockChanged(data, socket)
        break;
      case "spawnChunks": //host generated spawnChunks
        worlds[getRoom(socket)].spawnChunksGenerated(users[socket.id].name, socket)
        break;
      case "itemChange": //item has been spawned or removed
        worlds[getRoom(socket)].itemChange(data, socket)
        break;
    }
  })

  socket.on("leave", () => { //Player leaves current world
    if(!users[socket.id].inGame || !worlds[getRoom(socket)]) return //Check if player is in a loaded game

    removePlayerFromWorld(socket)
    socket.leave(getRoom(socket)) //make socket leave room
    users[socket.id].room = "not set"
    users[socket.id].inGame = false
  })

  //Gets sent when socket disappearss
  socket.on("disconnecting", () => {
    console.log("lost connection:" + socket.id)
    const user = users[socket.id]
    if(user.inGame) removePlayerFromWorld(socket)
    if(user.loggedIn) delete usersByName[user.name]
    delete users[socket.id]
  })
});

//get the room of a socket
function getRoom(socket){
  return users[socket.id].room
}

function removePlayerFromWorld(socket){
  if(!worlds[getRoom(socket)]) return //Check if world exists

  worlds[getRoom(socket)].playerLeft(socket, data => { //if closed is true, world is being closed
    if(data.closed) delete worlds[getRoom(socket)] //delete world
    if(data.players){ //kick players and remove from rooms if any are left
      for(const player in data.players){
        const playerSocket = io.sockets.sockets.get(player)
        playerSocket.leave(getRoom(playerSocket))
        users[player].room = "not set"
        users[player].inGame = false
        playerSocket.emit("leaveGame")
      }
    }
  })
}

setInterval(() => { //Used to update data inside worlds (daytime, remaining itemlife)
  for(const world in worlds){
    worlds[world].update1000();
  }
}, 1000)

setInterval(() => { //Used to update data inside worlds (mob pathfinding)
  for(const world in worlds){
    worlds[world].update250();
  }
}, 250)

setInterval(() => { //Used to update data inside worlds (mob movement)
  for(const world in worlds){
    worlds[world].update5();
  }
}, 25)

//Class which stores information about users that are connected
class User{
  constructor(id){
    this.id = id
    this.name = ""
    this.loggedIn = false
    this.inGame = false
    this.room = "not set"
  }
}

//---------------HTTPHANDLING---------------------------
//Get JSON layout of a user
let userLayout;
fs.readFile("json/userLayout.json", "utf8", (err, data) => {
  if(err){console.log("error trying to read userLayout File"); return;}
  userLayout = JSON.parse(data)
})

//create a new account
app.post("/req/register", (req, res) => {
  const postData = req.body
  if(typeof postData[0] != "string" || typeof postData[1] != "string" || postData[0] == "" || postData[1] == "" || postData[0].length > 15) {res.status(400).send("InvalidData"); return}
  postData[0] = removeSpecialChars(postData[0])
  postData[1] = removeSpecialChars(postData[1])
  const filename = postData[0] + ".json"

  if(fs.existsSync("accountData/" + filename)){res.status(400).send("usernameTaken"); return} //Check if username is taken
  let userObject = Object.assign({}, userLayout) //Create object for user
  userObject.username = postData[0] //Assign values from post Data
  userObject.password = postData[1]

  const randNumb = Math.floor(Math.random()*1000000000); //Get random number for id
  userObject.id = randNumb

  saveUserData(postData[0], userObject) //Save Data to json file
  res.cookie("user", postData[0], {maxAge: 365 * 24 * 60 * 60 * 1000}) //Set cookies of user, expire in a year
  res.cookie("id", randNumb, {maxAge: 365 * 24 * 60 * 60 * 1000})
  res.sendStatus(201) //Tell user its done
})

//Check if password and name from user is correct and log him in
app.post("/req/login", (req, res) => {
  const postData = req.body
  if(typeof postData[0] != "string" || typeof postData[1] != "string" || postData[0] == "" || postData[1] == "" || postData[0].length > 15) {res.sendStatus(400); return}
  postData[0] = removeSpecialChars(postData[0])
  postData[1] = removeSpecialChars(postData[1])
  
  const userObject = getUserData(postData[0])
  if(userObject == false) {res.sendStatus(400); return} //return error if user doesnt exist

  //Check if password is correct, set cookie if true
  if(postData[1] == userObject.password){
    res.cookie("user", postData[0], {maxAge: 365 * 24 * 60 * 60 * 1000}) //Set cookies of user, expire in a year
    res.cookie("id", userObject.id, {maxAge: 365 * 24 * 60 * 60 * 1000})
    res.sendStatus(202) //Tell user its done
  }else res.sendStatus(400)
})

//Check if user is logged in
app.get("/req/checkLogin", (req, res) => {
  checkLogin(req.cookies.user, req.cookies.id) ? res.sendStatus(202) : res.sendStatus(400)
})

//Get friends of user
app.get("/req/getFriends", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.sendStatus(400); return}//Check if logged in
  
  const userObject = getUserData(req.cookies.user) //Get data

  if(userObject.friends.length == 0){
    res.status(202).send("") //No friends, send back empty string
  }else{
    let friendsString = "" //Add name of all friends to string
    for(const name of userObject.friends) friendsString += (name + "°")
    res.status(202).send(friendsString.slice(0, -1)) //Send back, delete last char
  }
})

//Get own friendrequests
app.get("/req/getFriendRequests", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.sendStatus(400); return}//Check if logged in

  const userObject = getUserData(req.cookies.user) //Get data

  if(userObject.friendrequests.length == 0){
    res.status(202).send("") //No friendrequests, send back empty string
  }else{
    let requestsString = "" //Add name of all friendrequests to string
    for(const name of userObject.friendrequests) requestsString += (name + "°")
    res.status(202).send(requestsString.slice(0, -1)) //Send back, delete last char
  }
})

//Handle a friendrequest, index 1 in array says if accepted or not (true/false)
app.post("/req/handleFriendRequest", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.sendStatus(400); return}//Check if logged in
  if(typeof req.body[0] != "string" || typeof req.body[1] != "boolean" || req.body[0] == ""){res.sendStatus(400); return}//Check if data is valid
  req.body[0] = removeSpecialChars(req.body[0])

  let userObject = getUserData(req.cookies.user) //Get data

  if(userObject.friendrequests.indexOf(req.body[0]) == -1) {res.sendStatus(401); return}//Check if request exists
  else userObject.friendrequests.splice(userObject.friendrequests.indexOf(req.body[0]), 1) //remove request from list

  if(req.body[1]){ //Was accepted, add both to friendslists
    let user2Object = getUserData(req.body[0])//Get data from other user
    if(user2Object != false){ //Check if user exists
      if(user2Object.friends.indexOf(req.cookies.user) == -1) user2Object.friends.push(req.cookies.user) //Add to arrayof other user
      saveUserData(req.body[0], user2Object) //Save data from other user

      if(userObject.friends.indexOf(req.body[0]) == -1) userObject.friends.push(req.body[0]) //add to array
    }
  }

  saveUserData(req.cookies.user, userObject)
  res.sendStatus(202)
})

//Get information about friend status with other user
app.post("/req/getFriendStatus", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.sendStatus(400); return}//Check if logged in
  if(typeof req.body[0] != "string" || req.body[0] == ""){res.sendStatus(400); return} //Check if data is valid
  req.body[0] = removeSpecialChars(req.body[0])

  if(req.cookies.user == req.body[0]) {res.status(202).send("Self"); return} //Check if user is searching for himself

  const userObject = getUserData(req.body[0])
  if(userObject == false) {res.status(202).send("User not found"); return} //Check if user exists

  if(userObject.friends.indexOf(req.cookies.user) != -1){res.status(202).send("Friend"); return} //Users are friends
  if(userObject.friendrequests.indexOf(req.cookies.user) != -1){res.status(202).send("Friendrequest sent"); return} //Friendrequest has been sent to that person

  const requesterObject = getUserData(req.cookies.user) //Get JSON file of user that requestet information
  if(requesterObject.friendrequests.indexOf(req.body[0]) != -1 ){res.status(202).send("Friendrequest received"); return} //requester has received friendrequest from person
  
  res.status(202).send("Not Friend"); //If here, users are not friends
})

//check if player is online/in game
app.post("/req/onlineStatus", (req, res) => {
  if(typeof req.body[0] != "string" || req.body[0] == ""){res.sendStatus(400); return} //Check if data is valid
  req.body[0] = removeSpecialChars(req.body[0])

  const name = req.body[0]
  if(!fs.existsSync("accountData/" + name + ".json")){res.status(202).send("Offline"); return} //Check if user exists

  if(usersByName[name]){ //Player is online
    if(users[usersByName[name]].inGame) res.status(202).send("In Game");
    else res.status(202).send("Online");
  }else res.status(202).send("Offline");
})

//Send a friend request to another user
app.post("/req/sendFriendRequest", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.sendStatus(400); return}//Check if logged in
  if(typeof req.body[0] != "string" || req.body[0] == ""){res.sendStatus(400); return} //Check if data is valid
  req.body[0] = removeSpecialChars(req.body[0])

  let userObject = getUserData(req.body[0])
  if(userObject == false) {res.sendStatus(400); return} //Check if receiver exists

  if(userObject.friends.indexOf(req.cookies.user) != -1 || userObject.friendrequests.indexOf(req.cookies.user) != -1){res.sendStatus(400); return} //Check if request can be sent
  userObject.friendrequests.push(req.cookies.user) //Add user to friendrequests list

  saveUserData(req.body[0], userObject) //Save data
  res.sendStatus(202)
})

//Get list of worlds which friends are hosting
app.get("/req/getJoinableWorlds", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.sendStatus(400); return}//Check if logged in

  const friends = getUserData(req.cookies.user).friends //Get list of friends
  if(friends.length == 0) {res.status(202).send(""); return} //Return empty if user has no friends

  let joinableWorlds = []
  for(const friend of friends){
    const user = users[usersByName[friend]]
    if(user && user.inGame){ //Check if friend is online and in a game
      if(worlds[user.room].host == friend) joinableWorlds.push(user.room)
    }
  }
  if(joinableWorlds.length == 0) {res.status(202).send(""); return} //No joinable worlds, return empty

  let worldsString = ""
  for(const world of joinableWorlds){ //Add all worlds to a single string
    worldsString += (world + "§" + worlds[world].name + "§" + worlds[world].host + "°") //Add world id, worldname and friendname to string
  }
  res.status(202).send(worldsString.slice(0, -1)) //Send back worldInformation, remove last char
})

//Get list of own worlds
app.get("/req/getOwnWorlds", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.status(202).send(""); return}//Check if logged in

  const path = "worlds/" + req.cookies.user + "/"
  let worldsData = ""
  if(!fs.existsSync(path)){res.status(202).send(""); return}//Check if userworld folder exists

  fs.readdir(path, (err, files) => { //Get all worlds
    if(err){console.log("error reading userWorld directory"); return}

    files.sort((a, b) => { //Sort the worlds based on Modifiedtime, last played is first
      return fs.statSync(path + b).mtime.getTime() -
        fs.statSync(path + a).mtime.getTime();
    });

    files.forEach(file => { //Add all the worlds to string
      const name = fs.readFileSync(path + file + "/name", "utf8", err => {console.log("error reading worldname"); return}) //Get name of world
      worldsData += (file + "§" + name + "°") //Add world Information to string
    });
    res.status(202).send(worldsData.slice(0, -1)) //Send back worldInformation, remove last char
  });
})

//Delete a world
app.post("/req/deleteWorld", (req, res) => {
  if(!checkLogin(req.cookies.user, req.cookies.id)){res.sendStatus(400); return}//Check if logged in
  if(typeof req.body[0] != "string" || req.body[0] == ""){res.sendStatus(400); return} //Check if data is valid
  req.body[0] = removeSpecialChars(req.body[0])

  if(!fs.existsSync("worlds/" + req.cookies.user + "/" + req.body[0])) {res.sendStatus(400); return}//Check if world exists

  fs.rm("worlds/" + req.cookies.user + "/" + req.body[0], { recursive: true }, (err) => { //Delete world folder
    if(err) console.log("error deleting world")
    console.log("world deleted: " + req.body[0]);
  });
  res.sendStatus(202);
})

//---------------FUNCTIONS---------------------------
//Check if user is logged in by validating id
function checkLogin(user, id){
  if(!Number.isInteger(parseInt(id)) || typeof user != "string") return false //Check values
  if(removeSpecialChars(user) != user) return false //Remove forbidden Chars

  const userObject = getUserData(user) //Get object from JSON file of user
  if(userObject == false) return false

  if(id == userObject.id) return true
  else return false
}

function removeSpecialChars(string){
  return string.replace(/[^a-zA-Z0-9 _-]/g, "")
}

//Check if 2 users are friends
function areFriends(user1, user2){
  if(typeof user1 != "string" || typeof user2 != "string") return false //Check if data is valid
  user1 = removeSpecialChars(user1)
  user2 = removeSpecialChars(user2)

  const user1Object = getUserData(user1)
  if(!user1Object) return false //Check if user exists

  if(user1Object.friends.indexOf(user2) != -1) return true //check if in friendslist
  else return false
}

//Get data about user from json file
function getUserData(name){
  if(typeof name != "string" || name != removeSpecialChars(name)) return false //Check values
  if(!fs.existsSync("accountData/" + name + ".json")) return false; //Check if user exists

  const userText = fs.readFileSync("accountData/" + name + ".json") //Get JSON file of user
  return JSON.parse(userText) //Convert to object and return
}

//Save data from userobject and save as json
function saveUserData(name, userObject){
  if(typeof name != "string" || name != removeSpecialChars(name) || typeof userObject != "object") return //Check values

  const jsonString = JSON.stringify(userObject) //Convert object into string
  fs.writeFileSync("accountData/" + name + ".json", jsonString) //save in json File
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

//---------------SERVER SHUT DOWNS---------------------------

//catches uncaught exception
process.on('uncaughtException', err => { //Add crashes to crashlog for debugging
  fs.appendFileSync("crashlog.txt", new Date() + "\n" + err.stack + "\n\n")
  console.log(err);
  io.emit("serverShutDown")
  process.exit(1); // mandatory (as per the Node.js docs)
});

//catches ctrl+c event
process.on('SIGINT', async () => {
  io.emit("serverShutDown")
  await sleep(1000) //Wait a few seconds so worlds can be saved
  process.exit(1);
});
