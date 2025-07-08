let backgroundImg;
let spritesheet;
let racoonSpriteSheet;
let catSpriteSheet;
let blockSprites = [];
let racoonRunning = [], racoonIdle = [], racoonDash, racoonInAir, racoonSleeping;
let catRunning = [], catIdle = [], catDash, catInAir, catSleeping;
let blockInfo;
let pixelDownFont
let menuBg, vignette
let song, cakeSound, dashSound, hurtSound;

function preload(){
  backgroundImg = loadImage("rsc/images/bg.png");
  spritesheet = loadImage("rsc/images/world_tileset.png");
  racoonSpriteSheet = loadImage("rsc/images/racoon_sprites.png");
  catSpriteSheet = loadImage("rsc/images/cat_sprites.png");
  menuBg = loadImage("rsc/images/menuBG.png");
  vignette = loadImage("rsc/images/vignette.png");

  blockSprites[3] = loadImage("rsc/images/spike.png")
  blockSprites[4] = loadImage("rsc/images/cake.png")
  blockSprites[6] = blockSprites[3]
  blockSprites[7] = loadImage("rsc/images/spike_rotated.png")
  blockSprites[8] = loadImage("rsc/images/spike_rotated.png")

  blockInfo = loadJSON("rsc/json/blocks.json");

  song = loadSound("rsc/sounds/song.mp3")
  cakeSound = loadSound("rsc/sounds/cake.wav")
  dashSound = loadSound("rsc/sounds/dash.mp3")
  hurtSound = loadSound("rsc/sounds/hurt.wav")

  pixelDownFont = loadFont("rsc/fonts/pixeldown.ttf")
}

function preloadSetup(){
  blockSprites[1] = spritesheet.get(0, 0, 16, 16); // grass
  blockSprites[2] = spritesheet.get(0, 16, 16, 16); // dirt
  blockSprites[5] = spritesheet.get(8*16, 0, 16, 16); // stone
  blockSprites[9] = spritesheet.get(5*16, 0, 16, 16); // brown stone
  blockSprites[10] = spritesheet.get(3*16-8, 5*16-2, 32, 48+2); // palm
  blockSprites[11] = spritesheet.get(0, 3*16, 16, 48); // tall tree
  blockSprites[12] = spritesheet.get(16, 3*16, 16, 16); // big bush
  blockSprites[13] = spritesheet.get(16, 4*16, 16, 16); // small bush
  blockSprites[14] = spritesheet.get(8*16, 3*16, 16, 16); // sign
  blockSprites[15] = spritesheet.get(0*16, 8*16, 16, 16); // bottle
  blockSprites[16] = spritesheet.get(4*16, 8*16, 16, 16); // pumpkin
  blockSprites[17] = spritesheet.get(7*16, 8*16, 16, 16); // shroom
  blockSprites[18] = spritesheet.get(1*16, 6*16, 16, 16); // flower bush

  racoonDash = racoonSpriteSheet.get(1*32+6, 2*32+12, 20, 20)
  racoonInAir = racoonSpriteSheet.get(2*32+6, 2*32+12, 20, 20)
  racoonSleeping = racoonSpriteSheet.get(2*32+6, 3*32+12, 22, 22)
  for(let i = 0; i < 8; i++){
    racoonRunning[i] = racoonSpriteSheet.get(i*32+6, 1*32+12, 20, 20);
    racoonIdle[i] = racoonSpriteSheet.get(i*32+6, 0*32+12, 20, 20);
  }

  catDash = catSpriteSheet.get(1*32+6, 8*32+12, 20, 20)
  catInAir = catSpriteSheet.get(4*32+6, 8*32+12, 20, 20)
  catSleeping = catSpriteSheet.get(0*32+6, 6*32+12, 22, 22)
  for(let i = 0; i < 8; i++){
    catRunning[i] = catSpriteSheet.get(i*32+6, 5*32+12, 20, 20);
  }
  for(let i = 0; i < 16; i++){
    catIdle[i] = catSpriteSheet.get((i%4)*32+6, floor(i/4)*32+12, 20, 20);
  }

  song.setVolume(0.2);
  cakeSound.setVolume(0.2);
  dashSound.setVolume(0.2);
  hurtSound.setVolume(0.2);
}
