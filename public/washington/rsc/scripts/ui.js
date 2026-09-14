const MenuStates = {
  MAIN: 0,
  DIFFICULTY_SELECT: 1,
  HOW_TO_PLAY: 2,
}

let menuState = MenuStates.MAIN;

function menuDraw(){
  image(menuBg, 0, 0, width, height)
  image(vignette, 0, 0, width, height)  

  switch(menuState){
    case MenuStates.MAIN:
      drawMainMenu();
      break;
    case MenuStates.DIFFICULTY_SELECT:
      drawDifficultySelect();
      break;
    case MenuStates.HOW_TO_PLAY:
      drawHowToPlay();
      break;
  }
}

function drawMainMenu(){
  imageMode(CENTER)
  image(get_character_sprite(SPRITE_TYPES.SLEEPING), width*0.75, height*0.4, height/2, height/2)
  imageMode(CORNER)

  textSize(height/20)
  text("Washingtons birthday", width/2, height*0.1)
  buttonRect(width/8, height*0.35, 0.2*width, 0.1*height, "Start", height/40, () => {menuState = MenuStates.DIFFICULTY_SELECT})
  buttonRect(width/8, height*0.45, 0.2*width, 0.1*height, "How to play", height/40, () => {menuState = MenuStates.HOW_TO_PLAY})
  buttonRect(width/8, height*0.55, 0.2*width, 0.1*height, "Editor", height/40, () => {menuState = 2})

  textSize(height/50)
  text("Help " + get_current_character_name() + " collect pieces\n\nof cake on their birthday", width*0.75, height*0.7)

  text("Easy Mode Highscore: " + easyHighscore, width*0.75, height*0.85)
  text("Normal Mode Highscore: " + highscore, width*0.75, height*0.91)

  if(highscore >= 50 || easyHighscore >= 50){
    buttonRect(width*0.75, height*0.5, height/2, height/4, "", height/40, cycle_character, {colHigh: color(0, 0, 0, 0)})
  }
}

function drawDifficultySelect(){
  textSize(height/20)
  text("Choose Difficulty", width/2, height*0.1)

  buttonRect(width/2, height*0.5, 0.2*width, 0.1*height, "Easy", height/40, () => {easyMode = true; startGame()})
  buttonRect(width/2, height*0.65, 0.2*width, 0.1*height, "Normal", height/40, () => {easyMode = false; startGame()})

  buttonRect(width*0.06, height*0.05, 0.1*width, 0.075*height, "Back", height/60, () => {menuState = MenuStates.MAIN})
}

function drawHowToPlay(){
  textSize(height/20)
  text("How To Play", width/2, height*0.1)

  textSize(height/50)
  text("Use WASD to move\n\nPress Space to jump\n\n\n\nPress shift while in the air to dash\n\nUse WASD to control the direction of the dash\n\n\n\nCollect as many cakes as possible", width/2, height*0.5)

  buttonRect(width*0.06, height*0.05, 0.1*width, 0.075*height, "Back", height/60, () => {menuState = MenuStates.MAIN})
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
  text(get_current_character_name() + " has been hurt!", width/2, height*0.1)

  textSize(height/50)
  text("Score: " + player.score, width/2, height*0.4)
  text("Highscore: " + getHighScore(), width/2, height*0.5)

  buttonRect(width/2, height*0.7, 0.2*width, 0.1*height, "Retry", height/40, startGame)
  buttonRect(width/2, height*0.85, 0.2*width, 0.1*height, "Menu", height/40, leaveGame)
}
