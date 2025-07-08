function menuDraw(){
  image(menuBg, 0, 0, width, height)
  image(vignette, 0, 0, width, height)
  
  imageMode(CENTER)
  image(catMode ? catSleeping : racoonSleeping, width*0.75, height*0.4, height/2, height/2)
  imageMode(CORNER)

  textSize(height/20)
  text("Washingtons birthday", width/2, height*0.1)
  buttonRect(width/8, height/3, 0.2*width, 0.1*height, "Start", height/40, startGame)

  textSize(height/50)
  text("Help " + (catMode ? "Tabsy" : "Washington") + " collect cakes\n\non his birthday", width*0.75, height*0.7)

  text("Highscore: " + highscore, width*0.75, height*0.8)

  if(highscore >= 50){
    buttonRect(width*0.75, height*0.5, height/2, height/4, "", height/40, () => {
      catMode = !catMode
    }, {colHigh: color(0, 0, 0, 0)})
  }
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
  text("Highscore: " + highscore, width/2, height*0.5)

  buttonRect(width/2, height*0.7, 0.2*width, 0.1*height, "Retry", height/40, startGame)
  buttonRect(width/2, height*0.85, 0.2*width, 0.1*height, "Menu", height/40, leaveGame)
}