let menuState = 0;

function menuDraw(){
  image(menuBg, 0, 0, width, height)
  image(vignette, 0, 0, width, height)  

  switch(menuState){
    case 0:
      drawMainMenu();
      break;
    case 1:
      drawDifficultySelect();
      break;
    case 2:
      drawHowToPlay();
      break;
  }
}

function drawMainMenu(){
  imageMode(CENTER)
  image(catMode ? catSleeping : racoonSleeping, width*0.75, height*0.4, height/2, height/2)
  imageMode(CORNER)

  textSize(height/20)
  text("Washingtons birthday", width/2, height*0.1)
  buttonRect(width/8, height*0.35, 0.2*width, 0.1*height, "Start", height/40, () => {menuState = 1})
  buttonRect(width/8, height*0.45, 0.2*width, 0.1*height, "How to play", height/40, () => {menuState = 2})

  textSize(height/50)
  text("Help " + (catMode ? "Tabsy" : "Washington") + " collect pieces\n\nof cake on " + (catMode ? "her" : "his") + " birthday", width*0.75, height*0.7)

  text("Easy Mode Highscore: " + easyHighscore, width*0.75, height*0.85)
  text("Normal Mode Highscore: " + highscore, width*0.75, height*0.91)

  if(highscore >= 50){
    buttonRect(width*0.75, height*0.5, height/2, height/4, "", height/40, () => {
      catMode = !catMode
    }, {colHigh: color(0, 0, 0, 0)})
  }
}

function drawDifficultySelect(){
  textSize(height/20)
  text("Choose Difficulty", width/2, height*0.1)

  buttonRect(width/2, height*0.5, 0.2*width, 0.1*height, "Easy", height/40, () => {easyMode = true; startGame()})
  buttonRect(width/2, height*0.65, 0.2*width, 0.1*height, "Normal", height/40, () => {easyMode = false; startGame()})

  buttonRect(width*0.06, height*0.05, 0.1*width, 0.075*height, "Back", height/60, () => {menuState = 0})
}

function drawHowToPlay(){
  textSize(height/20)
  text("How To Play", width/2, height*0.1)

  textSize(height/50)
  text("Use WASD to move\n\nPress Space to jump\n\n\n\nPress shift while in the air to dash\n\nUse WASD to control the direction of the dash\n\n\n\nCollect as many cakes as possible", width/2, height*0.5)

  buttonRect(width*0.06, height*0.05, 0.1*width, 0.075*height, "Back", height/60, () => {menuState = 0})
}

function gameUI(){
  if(playerHurt){
    endScreen();
    return;
  }

  fill("white")
  textSize(height/50)
  text(player.score, width*0.5, height*0.1);
}

function endScreen(){
  fill(255, 0, 0, 100);
  rect(0, 0, width, height)

  fill("white")
  textSize(height/30)
  text((catMode ? "Tabsy" : "Washington") + " has been hurt!", width/2, height*0.1)

  textSize(height/50)
  text("Score: " + player.score, width/2, height*0.4)
  text("Highscore: " + getHighScore(), width/2, height*0.5)

  buttonRect(width/2, height*0.7, 0.2*width, 0.1*height, "Retry", height/40, startGame)
  buttonRect(width/2, height*0.85, 0.2*width, 0.1*height, "Menu", height/40, leaveGame)
}