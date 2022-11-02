let gamePaused = false

function drawPauseMenu(){
  if(!gamePaused)return
  strokeWeight(0)
  fill(color(0, 0, 0, 180))
  rect(0, 0, width, height)

  textAlign(CENTER, CENTER)
  textSize(height/15)
  strokeWeight(height/180)
  fill("white")
  text("Paused", width/2, height*0.075)

  buttonRect(width*0.15, height / 2.5 - height / 8, width / 5, height/ 10, "Continue", height / 45, () => gamePaused = false)
  buttonRect(width*0.15, height / 2.5, width / 5, height/ 10, "Exit Game", height / 45, leaveGame)
  //buttonRect(width*0.15, height / 2.5, width / 5, height/ 10, "Settings", height / 45, () => {console.log("settings")})
  //buttonRect(width*0.15, height / 2.5 + height/ 8, width / 5, height/ 10, "Exit Game", height / 45, leaveGame)
}

function drawDeathScreen(){
  if(gamePaused) return //Dont draw if game is paused
  fill(color(255, 0, 0, 120))
  rect(0, 0, width, height)
  textAlign(CENTER)
  textSize(height/15)
  stroke("#414149")
  strokeWeight(height/180)
  fill("white")
  text("You Died!", width/2, height*0.2)
  buttonRect(width*0.5, height*0.55, width / 4, height/ 10, "Respawn", height / 30, () => {self.respawn()})
  buttonRect(width*0.5, height*0.7, width / 4, height/ 10, "Exit Game", height / 30, leaveGame)
}
