let playerLayout;
let grassImage, waterImage;
let blockInfo, itemInfo, sky
let pixelDownFont
let menuBGIsland, menuBG
let toolBarImg, craftScreenImg
let playerImg, playerMove1Img, playerMove2Img, arrowImg, monsterImg
let fullHeartImg, halfHeartImg
let guideTexts, guideImgs = []

function preload(){
  playerLayout = loadJSON("rsc/json/playerLayout.json")
  blockInfo = loadJSON("rsc/json/blockInfo.json")
  itemInfo = loadJSON("rsc/json/itemInfo.json", () => {
    for(let i in itemInfo){
      itemInfo[i].image = loadImage('/rsc/images/items/' + i + '.png')
    }
  })

  sky = loadImage("rsc/images/sky.png")
  menuBGIsland = loadImage("rsc/images/menuBGIsland.png")
  menuBG = loadImage("rsc/images/menuBG.png")
  toolBarImg = loadImage("rsc/images/toolBar.png")
  craftScreenImg = loadImage("rsc/images/craftScreen.png")
  playerImg = loadImage("rsc/images/player.png")
  playerMove1Img = loadImage("rsc/images/playerMove1.png")
  playerMove2Img = loadImage("rsc/images/playerMove2.png")
  monsterImg = loadImage("rsc/images/monster.png")
  arrowImg = loadImage("rsc/images/arrow.png")
  fullHeartImg = loadImage("rsc/images/fullHeart.png")
  halfHeartImg = loadImage("rsc/images/halfHeart.png")

  pixelDownFont = loadFont("rsc/fonts/pixeldown.ttf")

  guideTexts = loadStrings("rsc/txt/guide.txt", () => {
    for(let i = 0; i < guideTexts.length; i++){
      guideImgs[i] = loadImage("rsc/images/guides/"+i+".png")
    }
  })
}
