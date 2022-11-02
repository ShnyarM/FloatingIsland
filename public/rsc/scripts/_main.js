var socket;
let canvas;
let u, uwidth, uheight, zoom = 15; //Units are used instead of pixels, so there are no problems with different resolutions
let sdeltaTime
let blockRes = 16
let debug = false
let lastFrames = [], fps = 120
let gameState = 0; //Which state the game is in, 0 = main menu, 1 = in-game
let loggedIn=null, username, host //is loggedIn, own username, is host of world
let mouseClick = false, mouseClickUpdated = false //says if mouse was pressed in that frame, updated is used to make it possible
let godmode = false
let friends = [], friendsStatus = {} //Array of friends and their activitystatus

function setup() {
  canvas = createCanvas(1, 1)
  textFont(pixelDownFont)
  noSmooth()
  socketSetup()
  windowResized()
  frameRate(fps)
  angleMode(DEGREES)
  checkLogin(data => {
    loggedIn=data
    if(data){
      username = getCookie("user")
      getFriends()
    }
    else username = "Player"
    socket.emit("name", {name: username, loggedIn: loggedIn, id: getCookie("id")}) //Tell name to server
  })

  //Stop contextmenu
  document.getElementsByClassName("p5Canvas")[0].addEventListener("contextmenu", (e) => e.preventDefault());

  for(let i = 0; i < fps; i++) lastFrames.push(0)
}

function draw() {
  sdeltaTime=deltaTime/1000 //convert deltatime into seconds
  updateMouseClicked()
  background("#1b71c3")
  if(gameState == 0){
    menuDraw()
  }else{
    mapDraw()
    playerDraw();
    mobDraw()
    drawDayTime();
    cameraDraw();
    drawUI()
    if(debug) drawFramerate()
    if(!self.alive) drawDeathScreen()
    if(gamePaused) drawPauseMenu()
  }
}

//Draw the User Interface while in game
function drawUI(){
  if(debug) self.debug()
  for(var id in players){
    players[id].drawArrow()
  }
  if(self.alive){
    if(!self.inventoryOpen && !craftingScreen) self.drawToolBar()
    else if(!craftingScreen) self.drawInventory()
    craftingDraw()
  }
  if(debug) drawFramerate()
  if(!self.alive) drawDeathScreen()
  if(gamePaused) drawPauseMenu()
}

//Join a game, first part of Setup, second part starts in serverClient.js (update player and camera), and then third part starts (map)
function joinGame(id, isHost){
  gameState = 1;
  host = isHost
  spawnChunksLoaded = !isHost //spawnChunksLoaded is false if player is host, not needed if player not host
  playerSetup()
  cameraSetup()
  craftingSetup()
  socket.emit("join", id)
}

//Leave current world and go back to main menu, kicked says if player was kicked by server
function leaveGame(kicked = false){
  gameState = 0;
  gamePaused = false
  if(!kicked) {
    socket.emit("leave")
    menuState = 0
    getFriends()
  }else{ //Kicked by host leaving world
    menuState = 6
    errorMessage = "The host has left the game."
    errorSkipable = true
  }
  deleteMap()
  deleteCamera()
  deletePlayer()
  deleteCrafting()
  deleteMobs()
}

//Checks if mouse was clicked in that frame
function updateMouseClicked(){
  if(mouseIsPressed&&!mouseClickUpdated){mouseClick=true; mouseClickUpdated=true}
  else mouseClick = false
  if(!mouseIsPressed && mouseClickUpdated) mouseClickUpdated=false
}

function drawFramerate(){
  //Add current frame and remove last
  lastFrames.splice(0, 1)
  const currentFrame = round(frameRate())
  lastFrames.push(currentFrame)

  //Get average of array
  let sum = 0
  for(let i = 0; i < lastFrames.length; i++) sum += lastFrames[i]
  const average =  round(sum / lastFrames.length)

  textSize(height/50)
  textAlign(LEFT)
  stroke("#414149")
  strokeWeight(height/180)
  fill("white")
  text("Framerate: " + currentFrame, width*0.8, height*0.05)
  text("Average: " + average, width*0.8, height*0.1)
  text("Highest: " + Math.max(...lastFrames), width*0.8, height*0.15)
  text("Lowest: " + Math.min(...lastFrames), width*0.8, height*0.2)
}

function keyPressed(){
  if(gameState==1){
    switch(keyCode){
      case 90: //z, toggle debug mode
        debug = !debug;
        break;
      case 27: //esc, toggle pauseMenu
        gamePaused = !gamePaused
        break;
    }
    playerKeyPressed()
    craftingKeyPressed()
  }
}

function mousePressed(){
  if(gameState == 1) playerMouseClicked()
}

function mouseReleased(){
  if(gameState == 1) playerMouseReleased()
  return false
}

function mouseDragged(){
  if(gameState == 1) playerMouseDragged()
  return false
}

function mouseWheel(event){
  if(gameState == 1) playerMouseWheel(event)
  return false
}

//Creates button with specific design, returnfunction gets called when button was pressed
function buttonRect(x, y, l, h, _text, sizeText, returnFunction, options = {}){
  const defaults = {colNor: color(0, 0, 0, 0), colHigh: color(150, 150, 150, 200), curve: height/20, textCol: "white", strokeW: 0, strokeC: "#414149"} //Default values for options
  const calcOptions = Object.assign(defaults, options)
  rectMode(CENTER)
  strokeWeight(calcOptions.strokeW)
  stroke(calcOptions.strokeC)
  if(buttonCenter(x, y, l, h)){
    fill(calcOptions.colHigh)
    if(mouseClick) returnFunction()
  }else fill(calcOptions.colNor)
  rect(x, y, l, h, calcOptions.curve)
  strokeWeight(height/180)
  textSize(sizeText)
  fill(calcOptions.textCol)
  textAlign(CENTER, CENTER)
  text(_text, x, y)
  rectMode(CORNER)
}

//Draws two rects (bigger black one, smaller white one) which resemble a border, used for inventory
function borderRect(x, y, w, h){
  fill(color(0, 0, 0, 0))//Bigger black border around selected
  stroke("#414149")
  strokeWeight(height/100)
  rect(x, y, w, h)
  strokeWeight(height/250) //smaller white border
  stroke("white")
  rect(x, y, w, h)
}

//Check if mouse is over button with Top Left Mode
function button(x, y, l, h){
  if (mouseX > x && mouseX < x + l && mouseY > y && mouseY < y + h) {
    return true;
  } else {
    return false;
  }
}

//Check if mouse is over button with center mode
function buttonCenter(x, y, l, h){
  if (mouseX > x - l / 2 && mouseX < x + l / 2 && mouseY > y - h / 2 && mouseY < y + h / 2) {
    return true;
  } else {
    return false;
  }
}

//Draw Rect with unit coordinates and cameraOffset
function unitRect(x, y, rWidth, rHeight){
  rect((x-camera.offsetX)*u, (y-camera.offsetY)*u, rWidth*u, rHeight*u)
}

//Draw Image with unit coordinates and cameraOffset, last parameters says if image should be flipped
function unitImage(img, x, y, rWidth, rHeight, flip = false){
  if(!flip) image(img, (x-camera.offsetX)*u, (y-camera.offsetY)*u, rWidth*u, rHeight*u)
  else {
    push()
    scale(-1, 1)
    image(img, -(x-camera.offsetX)*u, (y-camera.offsetY)*u, rWidth*u, rHeight*u)
    pop()
  }
}

//Draw Text with unit coordinates and cameraOffset
function unitText(textString, x, y){
  text(textString, (x-camera.offsetX)*u, (y-camera.offsetY)*u)
}

//Draw a rotated image
function rotateImage(img, x, y, l, h, rotAmn){
  imageMode(CENTER);
  translate(x, y)
  rotate(rotAmn)
  image(img, 0, 0, l, h)
  rotate(-rotAmn)
  translate(-x, -y)
  imageMode(CORNER)
}

//Detect collision between objects with pos and size
function collision(x1, y1, w1, h1, x2, y2, w2, h2){
  if (x1 + w1 > x2 && x1 < x2 + w2 && y1 + h1 > y2 && y1 < y2 + h2)
    return true;
  else
    return false;
}

function windowResized(){
  //Resize and position canvas so it is always in 16:9 Ratio
  const divisedWidth = windowWidth/16
  const divisedHeight = windowHeight/9
  switch(true){
    case divisedWidth == divisedHeight:
      resizeCanvas(windowWidth, windowHeight)
      canvas.position(0, 0)
      break;
    case divisedWidth > divisedHeight:
      let calculatedWidth = windowHeight / 9 * 16
      resizeCanvas(calculatedWidth, windowHeight)
      canvas.position((windowWidth - calculatedWidth) * 0.5, 0)
      break;
    case divisedWidth < divisedHeight:
      let calculatedHeight = windowWidth / 16 * 9
      resizeCanvas(windowWidth, calculatedHeight)
      canvas.position(0, (windowHeight-calculatedHeight)*0.5)
      break;
  }
  u = height/zoom //Pixel per Unit
  uwidth = width/u //Width in units
  uheight = zoom //Height in units
  cPSize = chunkSize*u //Chunksize in Pixel
  if(gameState==0) windowResizedMenu() //If in main menu
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

//find array in array
//From: https://stackoverflow.com/questions/6315180/javascript-search-array-of-arrays
Array.prototype.containsArray = function(val) {
    var hash = {};
    for(var i=0; i<this.length; i++) {
        hash[this[i]] = i;
    }
    return hash.hasOwnProperty(val);
}
