importScripts("../libs/noise.js")
let chunkSize;
const noiseSmooth = 0.05;
let generationInfo
fetch("/rsc/json/generation.json").then(data => data.json()).then(out => generationInfo = out)

function updateVariables(e){
  chunkSize = e["chunkSize"]
}

function calculateChunk(x, y, seed){
  noise.seed(seed)
  let blocks1 = []
  let blocks2 = []
  //Go through every y and x and apply block based on noise Map
  for(let i = 0; i < chunkSize; i++){
    for(let j = 0; j < chunkSize; j++){
      const noiseLevel = noise.perlin2((chunkSize*x+i)*noiseSmooth, ((chunkSize*y+j)*noiseSmooth))
      blocks1[j*chunkSize+i] = noiseLevel > -0.15 ? 0 : 1; //Determine if grass or air

      let blockPlaced = false //Says if a block has been placed
      for(const block in generationInfo){ //Go through all possible blocks
        const blockspawns = generationInfo[block]
        for(let k = 0; k < blockspawns.length; k+=2){ //Check if noiselevel is within noise range of block
          if(noiseLevel > blockspawns[k] && noiseLevel < blockspawns[k+1]){
            blocks2[j*chunkSize+i] = parseInt(block)
            blockPlaced = true
            break
          }
        }
        if(blockPlaced) break //Stop loop if block has been placed
      }
      if(!blockPlaced) blocks2[j*chunkSize+i] = 0 //add empty block if none has been added
    }
  }
  postMessage({x: x, y:y, blocks1: blocks1, blocks2: blocks2}) //pass data to map.js
}

onmessage = async function(e){
  switch(e.data["type"]){
    case "vars":
      updateVariables(e.data)
      break;
    case "chunk":
      calculateChunk(e.data.x, e.data.y, e.data.seed)
      break;
  }
}
