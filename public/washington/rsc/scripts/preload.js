let backgroundImg;
let spritesheet;
let blockSprites = [];
let blockInfo;
let pixelDownFont
let menuBg, vignette
let main_theme, cakeSound, dashSound, hurtSound, shawSound, choral_chambers;

function preload(){
  backgroundImg = loadImage("rsc/images/bg.png");
  spritesheet = loadImage("rsc/images/world_tileset.png");
  racoonSpriteSheet = loadImage("rsc/images/racoon_sprites.png");
  catSpriteSheet = loadImage("rsc/images/cat_sprites.png");
  hornetSpriteSheet = loadImage("rsc/images/hornet_sprites.png");
  menuBg = loadImage("rsc/images/menuBG.png");
  vignette = loadImage("rsc/images/vignette.png");

  blockSprites[3] = loadImage("rsc/images/spike.png")
  blockSprites[4] = loadImage("rsc/images/cake.png")
  blockSprites[6] = blockSprites[3]
  blockSprites[7] = loadImage("rsc/images/spike_rotated.png")
  blockSprites[8] = loadImage("rsc/images/spike_rotated.png")
  blockInfo = loadJSON("rsc/json/blocks.json");

  main_theme = loadSound("rsc/sounds/song.mp3")
  choral_chambers = loadSound("rsc/sounds/choral_chambers.mp3")
  cakeSound = loadSound("rsc/sounds/cake.wav")
  dashSound = loadSound("rsc/sounds/dash.mp3")
  shawSound = loadSound("rsc/sounds/shaw.mp3")
  hurtSound = loadSound("rsc/sounds/hurt.wav")

  pixelDownFont = loadFont("rsc/fonts/pixeldown.ttf")

  charactersPreLoad();
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

  main_theme.setVolume(0.2);
  choral_chambers.setVolume(0.2);
  cakeSound.setVolume(0.2);
  dashSound.setVolume(0.2);
  shawSound.setVolume(0.2);
  hurtSound.setVolume(0.2);
  
  charactersPreLoadSetup();
}
