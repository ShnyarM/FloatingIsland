let menuState = 0 //0 = main menu screen, 1=play, 2=join game, 3=Settings, 4=CreateWorld, 5=Add Friends, 6=errorMessage, 7=How to play
let ownWorlds = [], joinWorlds = [] //Array of worlds than can be joined, only get loaded when requested
let worldNameInput, worldSeedInput; //Inputs for creating new World
let page = 0, selected = false; //Says which page is selected during level select and what level is selected
let searchSelected = true, friendSearchInput //Says if search or friendrequests is selected on add friends screen, input for searching for friends
let userSearchResult = "" //Response of server when searching for user
let friendrequests = [] //List of friendrequests
let errorMessage = "", errorSkipable = true //Error message to pop up when on error message screen and if it is skipable (OK button)

//Draws the menu, buttonRect is a function that creates a button, returnFunction of button gets called when button is clicked
//String in buttonRect usually says what the button does, returnFunction can also help understanding
function menuDraw(){
  switch(menuState){
    case 0:
      drawMainMenu()
      break;
    case 1:
      drawChooseWorld()
      break;
    case 2:
      drawJoinWorld()
      break;
    case 4:
      drawCreateWorld()
      break;
    case 5:
      drawAddFriends()
      break;
    case 6:
      drawErrorMessage()
      break;
    case 7:
      drawGuide()
      break;
  }
}





function drawMainMenu(){
  image(menuBGIsland, 0, 0, width, height)
  fill("white")
  stroke("#414149")
  strokeWeight(height/180)

  textAlign(CENTER, CENTER)
  textSize(height/15)
  text("Floating Island", width*0.5, height*0.075)

  buttonRect(width*0.25, height / 2.5 - height / 8, width / 5, height/ 10, "Play", height / 45, () => { //get own world
    if(loggedIn){
      axios.get('/req/getOwnWorlds') //Get worlds
      .then(response => {
        if(response.data == "") ownWorlds = [] //Leave empty if no worlds exist
        else{
          ownWorlds = response.data.split("°") //Convert string into arrays
          for(let i = 0; i<ownWorlds.length; i++) ownWorlds[i] = ownWorlds[i].split("§") //Split string of name and id to array
        }
        page = 0
        menuState=1 //Change screen
        selected = 0
      })
      }else openCreateWorldScreen() //Directly go to createWorldscreen when not logged in
  })
  if(loggedIn){ //Display joingame button when logged in
    buttonRect(width*0.25, height / 2.5, width / 5, height/ 10, "Join Game", height / 45, () => { //get joinable worlds
      axios.get("/req/getJoinableWorlds")
      .then(response => {
        if(response.data == "") joinWorlds = [] //Leave empty if no worlds exist
        else{
          joinWorlds = response.data.split("°") //Convert string into arrays
          for(let i = 0; i<joinWorlds.length; i++) joinWorlds[i] = joinWorlds[i].split("§") //Split string of name and id to array
        }
        page = 0
        menuState=2 //Change screen
        selected = 0
      })
    })
    buttonRect(width*0.25, height / 2.5 + height/ 8, width / 5, height/ 10, "How To Play", height / 45, () => {
      menuState=7
      page=0
    })
  }
  else{
    buttonRect(width*0.25, height / 2.5, width / 5, height/ 10, "How To Play", height / 45, () => {
      menuState=7
      page=0
    })
  }

  textAlign(LEFT)
  if(loggedIn){ //Friends
    text("Friends:", width*0.7, height*0.25)
    for(let i = 0; i < 6; i++){
      if(friends[page*6+i]){ //Check if exists
        textSize(height/55) //Name
        fill("white")
        text(friends[page*6+i], width*0.7, height*0.3+height*0.09*i)

        if(friendsStatus[friends[page*6+i]] == "Online" || friendsStatus[friends[page*6+i]] == "In Game") fill("lightgreen") //Activitystatus
        else fill("lightgray")
        textSize(height/80)
        text(friendsStatus[friends[page*6+i]], width*0.7, height*0.34+height*0.09*i)
      }
    }
    buttonRect(width*0.95, height*0.25, width*0.04, width*0.04, "+", height / 45, () => {menuState = 5; addFriendsInputs()})
    if(page!=0) buttonRect(width*0.75, height*0.85, width*0.04, width*0.04, "<", height / 45, () => page--) //Arrow buttons
    if(friends[(page+1)*6]) buttonRect(width*0.9, height*0.85, width*0.04, width*0.04, ">", height / 45, () => page++)
  }

  textSize(height/70) //Log in and register buttons
  fill("white")
  textAlign(LEFT)
  if(loggedIn){
    text("Logged in as: " + username, width * 0.02, height * 0.85)
    buttonRect(width*0.08, height*0.93, width / 8, height/ 13, "Log Out", height / 55, () => {
      deleteCookie("id") //Delete cookies and reload game
      deleteCookie("user")
      window.location.reload();
    })
  }else{
    text("Not logged in, progress will not be saved", width * 0.02, height * 0.85)
    buttonRect(width*0.08, height*0.93, width / 8, height/ 13, "Register", height / 55, () => window.open("register.html", "_self")) //open register site in same tab
    buttonRect(width*0.22, height*0.93, width / 8, height/ 13, "Login", height / 55, () => window.open("login.html", "_self"))//open login site in same tab
  }
}

function drawChooseWorld(){
  image(menuBG, 0, 0, width, height)
  textAlign(CENTER, CENTER)
  textSize(height/15)
  fill("white")
  text("Choose World", width/2, height*0.075)

  if(ownWorlds.length != 0){
    for(let i = 0; i < 2; i++){ //Draw Different buttons for the worlds
      for(let j = 0; j < 5; j++){
        if(ownWorlds[page*10+i*5+j]) //Check if array exists
          buttonRect(width*0.3 + i*width*0.4, height/4+j*height/9, width / 2.8, height/ 13, ownWorlds[page*10+i*5+j][1], height / 50, () => selected = page*10+i*5+j+1,
          {curve: 0, colNor:selected == page*10+i*5+j+1 ? "#4D4D4D" : "darkgray", colHigh:selected == page*10+i*5+j+1 ? "#4D4D4D" : "gray", strokeW: height/360}) //tell Server to create World
      }
    }
  }
  if(selected != 0){//A World has been selected
    buttonRect(width*0.3, height*0.85, width/4, height/12, "Delete World", height/40, () => {
      axios.post("/req/deleteWorld", [ownWorlds[selected-1][0]])
      ownWorlds.splice(selected-1, 1) //Remove world from array
      selected = 0
    })
    buttonRect(width*0.7, height*0.85, width*0.15, height/12, "Play", height/40, () => socket.emit("createWorld", {id: ownWorlds[selected-1][0], host: username, userId: getCookie("id")}))
  }
  if((page+1)*10<ownWorlds.length) buttonRect(width*0.95, height/2, height/15, height/15, ">", height/50, () => page++, {curve: height*0.02}) //Arrow right
  if(page != 0) buttonRect(width*0.05, height/2, height/15, height/15, "<", height/50, () => page--, {curve: height*0.02}) //Arrow right

  buttonRect(width*0.88, height*0.92, width / 5, height/ 12, "New World", height / 50, openCreateWorldScreen)
  buttonRect(width*0.08, height*0.06, width / 8, height/ 15, "Back", height / 50, () => {menuState = 0; page = 0; getFriends()})
}

function drawJoinWorld(){
  image(menuBG, 0, 0, width, height)
  textAlign(CENTER, CENTER)
  textSize(height/15)
  fill("white")
  text("Join Game", width/2, height*0.075)

  
  if(joinWorlds.length != 0){
    for(let i = 0; i < 2; i++){ //Draw Different buttons for the worlds
      for(let j = 0; j < 5; j++){
        if(joinWorlds[page*10+i*5+j]) //Check if array exists
          buttonRect(width*0.3 + i*width*0.4, height/4+j*height/9, width / 2.8, height/ 13, joinWorlds[page*10+i*5+j][1], height / 50, () => selected = page*10+i*5+j+1,
          {curve: 0, colNor:selected == page*10+i*5+j+1 ? "#4D4D4D" : "darkgray", colHigh:selected == page*10+i*5+j+1 ? "#4D4D4D" : "gray", strokeW: height/360}) //tell Server to create World
      }
    }
  }else{
    textSize(height/50)
    text("No available games to join", width*0.5, height*0.5)
  }
  if(selected != 0){//A World has been selected
    text("Hosted by: " + joinWorlds[selected-1][2], width*0.3, height*0.85)
    buttonRect(width*0.7, height*0.85, width/4, height/12, "Play", height/40, () => joinGame(int(joinWorlds[selected-1][0])))
  }
  if((page+1)*10<joinWorlds.length) buttonRect(width*0.95, height/2, height/15, height/15, ">", height/50, () => page++, {curve: height*0.02}) //Arrow right
  if(page != 0) buttonRect(width*0.05, height/2, height/15, height/15, "<", height/50, () => page--, {curve: height*0.02}) //Arrow right

  buttonRect(width*0.08, height*0.06, width / 8, height/ 15, "Back", height / 50, () => {menuState = 0, page = 0, getFriends()})
}

function drawCreateWorld(){
  image(menuBG, 0, 0, width, height)
  textAlign(CENTER, CENTER)
  textSize(height/15)
  fill("white")
  text("New World", width/2, height*0.075)

  textSize(height/30)
  text("Name", width/2, height*0.25)
  text("Seed", width/2, height*0.58)

  buttonRect(width*0.88, height*0.92, width / 5, height/ 12, "Create World", height / 50, createWorld)
  buttonRect(width*0.08, height*0.06, width / 8, height/ 15, "Back", height / 50, () => {
    menuState= loggedIn ? 1 : 0//Go back to play menu/main menu and remove inputs
    worldNameInput.remove()
    worldSeedInput.remove()
  })
}

function drawAddFriends(){
  image(menuBG, 0, 0, width, height)
  textAlign(CENTER, CENTER)
  textSize(height/15)
  fill("white")
  text("Add Friends", width/2, height*0.075)

  buttonRect(width*0.35, height*0.2, width*0.2, height/ 15, "Search", height / 50, () => { //Open search screen
    if(!searchSelected) addFriendsInputs()
    searchSelected = true
  }, searchSelected ? {colNor: color(150, 150, 150, 200), colHigh: color(120, 120, 120, 200)} : {}) //Hightlight when selected

  buttonRect(width*0.65, height*0.2, width*0.2, height/ 15, "Friend Requests", height / 50, () => { //Open friendrequest screen
    if(searchSelected) {
      page=0
      friendSearchInput.remove(); 
      userSearchResult = ""
      axios.get("req/getFriendRequests")
      .then(response => {
        if(response.data == "") {friendrequests = []}
        else friendrequests = response.data.split("°") //Convert string into array
      })
    }
    searchSelected = false
  }, !searchSelected ? {colNor: color(150, 150, 150, 200), colHigh: color(120, 120, 120, 200)} : {})

  if(searchSelected){
    if(userSearchResult != ""){
      textSize(height/30)
      if(userSearchResult == "User not found"){
        text(userSearchResult, width*0.5, height*0.6)
      }else{
        text(friendSearchInput.value(), width*0.5, height*0.5)
        if(userSearchResult == "Not Friend"){
          buttonRect(width*0.5, height*0.6, width / 4, height/ 12, "Send Friend Request", height / 50, () => { //Send friend request when clicking button
            userSearchResult = "Friendrequest sent"
            axios.post("req/sendFriendRequest", [friendSearchInput.value()]) //Send request to server
          })
        }else if(userSearchResult == "Friend"){
          textSize(height / 50)
          text("Already in friendslist", width*0.5, height*0.6)
        }else if(userSearchResult == "Friendrequest sent"){
          textSize(height / 50)
          text("Friend request sent", width*0.5, height*0.6)
        }else if(userSearchResult == "Self"){
          textSize(height / 50)
          text("Can't send friend request to yourself", width*0.5, height*0.6)
        }else{
          textSize(height / 50)
          text("Friend request received from this user", width*0.5, height*0.6)
        }
      }
    }
  }else{ //Friendrequest screen
    for(let i = 0; i < 6; i++){
      if(friendrequests[page*6+i]){//check if exists
        textAlign(LEFT)
        text(friendrequests[page*6+i], width*0.15, height*0.3+height*0.1*i)
        buttonRect(width*0.65, height*0.3+height*0.1*i, width*0.15, height/ 12, "Accept", height / 50, () => {
          axios.post("req/handleFriendRequest", [friendrequests[page*6+i], true]) //Send request to server
          friendrequests.splice(page*6+i, 1) //remove from list
        })
        buttonRect(width*0.8, height*0.3+height*0.1*i, width*0.15, height/ 12, "Decline", height / 50, () => {
          axios.post("req/handleFriendRequest", [friendrequests[page*6+i], false]) //Send request to server
          friendrequests.splice(page*6+i, 1) //remove from list
        })
      }
    }
    if(page != 0) buttonRect(width*0.05, height/2, height/15, height/15, "<", height/50, () => page--) //Arrow right
    if(friendrequests[(page+1)*6]) buttonRect(width*0.95, height/2, height/15, height/15, ">", height/50, () => page++) //Arrow right
  }

  buttonRect(width*0.08, height*0.06, width / 8, height/ 15, "Back", height / 50, () => {
    menuState = 0; 
    searchSelected=true; 
    friendSearchInput.remove(); 
    page=0; 
    getFriends()
  })
}

function drawErrorMessage(){
  image(menuBG, 0, 0, width, height)
  fill(color(0, 0, 0, 120))
  rect(0, 0, width, height)

  fill("white")
  textAlign(CENTER)
  text(errorMessage, width*0.5, height*0.5)

  if(errorSkipable) buttonRect(width*0.5, height*0.8, width / 8, height/ 15, "OK", height / 50, () => {
    menuState = 0; 
    page=0; 
    getFriends()
  })
}

function drawGuide(){
  imageMode(CORNER)
  image(menuBG, 0, 0, width, height)
  fill(color(0, 0, 0, 80))
  rect(0, 0, width, height)
  fill("white")
  stroke("#414149")
  strokeWeight(height/180)

  textAlign(CENTER, CENTER)
  textSize(height/15)
  text("How To Play", width*0.5, height*0.075)
  
  const imgSize = height/17
  imageMode(CENTER)
  image(guideImgs[page], width*0.5, height*0.5, imgSize*16, imgSize*9)

  textSize(height/50)
  rectMode(CENTER)
  text(guideTexts[page], width*0.5, height*0.8)

  if((page+1)<guideTexts.length) buttonRect(width*0.95, height/2, height/15, height/15, ">", height/50, () => page++, {curve: height*0.02}) //Arrow right
  if(page != 0) buttonRect(width*0.05, height/2, height/15, height/15, "<", height/50, () => page--, {curve: height*0.02}) //Arrow right

  buttonRect(width*0.08, height*0.06, width / 8, height/ 15, "Back", height / 50, () => {
    menuState = 0; 
    page=0; 
    getFriends()
    imageMode(CORNER)
  })
}



//Created the search input for addfriends screen
function addFriendsInputs(){
  //Create Inputs, center them
  friendSearchInput = createInput("").size(width*0.5, height/15).position(canvas.position().x + width/2-width/4, canvas.position().y + height*0.3-height/30).style("font-size", height/25)
  friendSearchInput.attribute("placeholder", "Username")
  friendSearchInput.attribute("maxlength", 18)
  friendSearchInput.input(() => {
    if(friendSearchInput.value() == ""){
      userSearchResult = ""
      return
    }
    axios.post("req/getFriendStatus", [friendSearchInput.value()]) //
    .then(response => {
      userSearchResult = response.data
    })
  })
}

//Opens the createWorldscreen
function openCreateWorldScreen(){
  menuState=4
  page = 0
  //Create Inputs, center them
  worldNameInput = createInput("New World").size(width/2, height/15).position(canvas.position().x + width/2-width/4, canvas.position().y + height/3-height/30).style("font-size", height/25)
  worldSeedInput = createInput("").size(width/2, height/15).position(canvas.position().x + width/2-width/4, canvas.position().y + height*0.66-height/30).style("font-size", height/25)
  worldSeedInput.attribute("placeholder", "Leave empty for random Seed")
  worldNameInput.attribute("maxlength", 18)
  worldNameInput.input(() => worldNameInput.value(removeSpecialChars(worldNameInput.value()))) //remove forbidden chars
}

function createWorld(){
  if(worldNameInput.value()=="") return

  //Convert seed into something usable
  const value = worldSeedInput.value()
  let seed = 1
  if(value!=""){
    if(isNaN(value)){ //Seed is string, convert into int with algorithm using ascii code
      for(let i = 0; i < value.length; i++){
        seed *= (value.charCodeAt(i)/10)
        if(seed>1000000)seed/=100000
      }
      seed = int(seed)%65536
    }else{
      seed = int(value)%65536 //Seed is number, convert into something between 0, 65536
    }
  }else seed = int(random(0, 65536)) //No seed Specified, choose random seed

  socket.emit("createWorld", {createNew:true, seed:seed, name:worldNameInput.value()}) //Tell server to create world, game gets joined in serverClient.js
  worldNameInput.remove() //remove the two Inputs
  worldSeedInput.remove()
}

function windowResizedMenu(){
  if(menuState==4){//Resize CreateWorld inputs if in that screen
    worldNameInput.position(canvas.position().x + width/2-width/4, canvas.position().y + height/3-height/30)
    worldNameInput.size(width/2, height/15)
    worldNameInput.style("font-size", height/25)
    worldSeedInput.position(canvas.position().x + width/2-width/4, canvas.position().y + height*0.66-height/30)
    worldSeedInput.size(width/2, height/15)
    worldSeedInput.style("font-size", height/25)
  }else if(menuState==5&&searchSelected){ //Search user screen is open
    friendSearchInput.size(width*0.5, height/15)
    friendSearchInput.position(canvas.position().x + width/2-width/4, canvas.position().y + height*0.3-height/30)
    friendSearchInput.style("font-size", height/25)
  }
}
