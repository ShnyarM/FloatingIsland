let chunkSize
let blockRes
let imgs = []; //Bitmap of all blocks
//Universal canvases so the same can be used the whole time
let cCanvas, cCtx
let blockInfo = {}
let strokeImg

//Load the images for the blocks
async function loadInfo(blocks){
  blockInfo = blocks //blockInfo
  for(let i in blockInfo){ //Get images of blocks
    const blob = await fetch('/rsc/images/blocks/' + i + '.png').then(r => r.blob())
    blockInfo[i].image = await createImageBitmap(blob);
  }
  const blob = await fetch('/rsc/images/stroke.png').then(r => r.blob()) //Get stroke image
  strokeImg = await createImageBitmap(blob);
  postMessage("loaded")
}

function updateVariables(e){
  chunkSize = e["chunkSize"]
  blockRes = e["blockRes"]

  cCanvas = new OffscreenCanvas(blockRes * chunkSize, blockRes * chunkSize)
  cCtx = cCanvas.getContext("2d")
  cCtx.imageSmoothingEnabled = false
  cCtx.strokeStyle = "black"
  cCtx.lineWidth = 0.3
}

function updateWorld(e){
  //Draw new Chunks
  for(let i = 0; i < e["chunks"].length; i++){
    drawChunkOnCanvas(e["chunks"][i].blocks1, e["chunks"][i].x, e["chunks"][i].y)
  }
}

async function drawChunkOnCanvas(blocks1, blocks2, x, y){
  cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height)
  for(let i = 0; i < blocks1.length; i++){
    let block; //Info of block
    let level; //height of block
    const row = Math.floor(i/chunkSize) //Find out y of block inside Chunk

    if(blocks2[i] == 0){
      if(blocks1[i] != 0) {block = blockInfo[blocks1[i]]; level = 1} //No Block on second
      else level = 0//No block on eiter
    }else { //Block on second
      block = blockInfo[blocks2[i]];
      level = 2
    }

    //Add to Canvas
    if(level == 1) cCtx.drawImage(block.image, (i-row*chunkSize)*blockRes, row*blockRes, blockRes, blockRes) //Draw block on level 1
    else if(level == 2){ //block on level 2
      if(block.translucent){ //Draw block below if block on level 2 is translucent
        const blockBelow = blockInfo[blocks1[i]]
        if(blocks1[i] != 0) cCtx.drawImage(blockBelow.image, (i-row*chunkSize)*blockRes, row*blockRes, blockRes, blockRes)
      }

      cCtx.drawImage(block.image, (i-row*chunkSize)*blockRes, row*blockRes, blockRes, blockRes) //Draw block on level 2
      if(!block.noStroke) cCtx.drawImage(strokeImg, (i-row*chunkSize)*blockRes, row*blockRes, blockRes, blockRes)//Add stroke if needed
    }
  }
  const bitmap = await createImageBitmap(cCanvas)
  postMessage({x:x, y:y, image: bitmap})
  bitmap.close()
}

onmessage = async function(e){
  switch(e.data.type){
    case "vars":
      updateVariables(e.data)
      break;
    case "blockInfo":
      loadInfo(e.data.ids)
      break;
    case "chunk":
      drawChunkOnCanvas(e.data.blocks1, e.data.blocks2, e.data.x, e.data.y)
      break;
    case "newChunks":
      updateWorld(e.data)
      break;
  }
}
