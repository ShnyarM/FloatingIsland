let racoonSpriteSheet, catSpriteSheet, hornetSpriteSheet;
let spriteCharacterRunning = [], spriteCharacterIdle = [], spriteCharacterDash = [], spriteCharacterInAir = [], spriteCharacterSleeping = [];
let chosen_character;

const CHARACTER_ENUM = {
  WASHINGTON: 0,
  TABSY: 1,
  HORNET: 2
}
const CHARACTER_NAMES = [
  "Washington",
  "Tabsy",
  "Hornet" 
]
const CHARACTER_COUNT = Object.keys(CHARACTER_ENUM).length;
const DEFAULT_CHARACTER = CHARACTER_ENUM.WASHINGTON;

const SPRITE_TYPES = {
  SLEEPING: 0,
  IN_AIR: 1,
  DASH: 2,
  IDLE_LIST: 3,
  RUNNING_LIST: 4
}

function charactersPreLoad(){
  racoonSpriteSheet = loadImage("rsc/images/racoon_sprites.png");
  catSpriteSheet = loadImage("rsc/images/cat_sprites.png");
  hornetSpriteSheet = loadImage("rsc/images/hornet_sprites.png");
}

function charactersPreLoadSetup(){
  setupWashington();
  setupTabsy();
  setupHornet();
  chosen_character = DEFAULT_CHARACTER;
}

function setupWashington(){
  spriteCharacterDash[CHARACTER_ENUM.WASHINGTON] = racoonSpriteSheet.get(1*32+6, 2*32+12, 20, 20)
  spriteCharacterInAir[CHARACTER_ENUM.WASHINGTON] = racoonSpriteSheet.get(2*32+6, 2*32+12, 20, 20)
  spriteCharacterSleeping[CHARACTER_ENUM.WASHINGTON] = racoonSpriteSheet.get(2*32+6, 3*32+12, 22, 22)

  spriteCharacterRunning[CHARACTER_ENUM.WASHINGTON] = [];
  spriteCharacterIdle[CHARACTER_ENUM.WASHINGTON] = [];
  for(let i = 0; i < 8; i++){
    spriteCharacterRunning[CHARACTER_ENUM.WASHINGTON][i] = racoonSpriteSheet.get(i*32+6, 1*32+12, 20, 20);
    spriteCharacterIdle[CHARACTER_ENUM.WASHINGTON][i] = racoonSpriteSheet.get(i*32+6, 0*32+12, 20, 20);
  }
}

function setupTabsy(){
  spriteCharacterDash[CHARACTER_ENUM.TABSY] = catSpriteSheet.get(1*32+6, 8*32+12, 20, 20)
  spriteCharacterInAir[CHARACTER_ENUM.TABSY] = catSpriteSheet.get(4*32+6, 8*32+12, 20, 20)
  spriteCharacterSleeping[CHARACTER_ENUM.TABSY] = catSpriteSheet.get(0*32+6, 6*32+12, 22, 22)

  spriteCharacterRunning[CHARACTER_ENUM.TABSY] = [];
  for(let i = 0; i < 8; i++){
    spriteCharacterRunning[CHARACTER_ENUM.TABSY][i] = catSpriteSheet.get(i*32+6, 5*32+12, 20, 20);
  }
  spriteCharacterIdle[CHARACTER_ENUM.TABSY] = [];
  for(let i = 0; i < 16; i++){
    spriteCharacterIdle[CHARACTER_ENUM.TABSY][i] = catSpriteSheet.get((i%4)*32+6, floor(i/4)*32+12, 20, 20);
  }
}

function setupHornet(){
  spriteCharacterDash[CHARACTER_ENUM.HORNET] = hornetSpriteSheet.get(122, 360, 40, 40)
  spriteCharacterInAir[CHARACTER_ENUM.HORNET] = hornetSpriteSheet.get(132, 143, 33, 33)
  spriteCharacterSleeping[CHARACTER_ENUM.HORNET] = hornetSpriteSheet.get(93, 96, 32, 32)

  spriteCharacterRunning[CHARACTER_ENUM.HORNET] = [];
  spriteCharacterRunning[CHARACTER_ENUM.HORNET][0] = hornetSpriteSheet.get(27, 48, 32, 32);
  spriteCharacterRunning[CHARACTER_ENUM.HORNET][1] = hornetSpriteSheet.get(62, 48, 32, 32);
  spriteCharacterRunning[CHARACTER_ENUM.HORNET][2] = hornetSpriteSheet.get(96, 48, 32, 32);
  spriteCharacterRunning[CHARACTER_ENUM.HORNET][3] = hornetSpriteSheet.get(132, 48, 32, 32);

  spriteCharacterIdle[CHARACTER_ENUM.HORNET] = [];
  spriteCharacterIdle[CHARACTER_ENUM.HORNET][0] = hornetSpriteSheet.get(132, 0, 33, 33);
}

function get_current_character_name(){
  return CHARACTER_NAMES[chosen_character];
}

function get_current_character(){
  return chosen_character;
}

function cycle_character(){
  chosen_character++;
  chosen_character = chosen_character % CHARACTER_COUNT;
}

function get_character_sprite(type){  
  switch(type){
    case SPRITE_TYPES.SLEEPING:
      return spriteCharacterSleeping[get_current_character()];
    case SPRITE_TYPES.IN_AIR:
      return spriteCharacterInAir[get_current_character()];
    case SPRITE_TYPES.DASH:
      return spriteCharacterDash[get_current_character()];
    case SPRITE_TYPES.IDLE_LIST:
      return spriteCharacterIdle[get_current_character()];
    case SPRITE_TYPES.RUNNING_LIST:
      return spriteCharacterRunning[get_current_character()];
  }
}
