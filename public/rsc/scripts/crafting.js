//recipe arrays always first say the itemId of needed object and after that the amn needed
let recipes = {} //Store all recipes in object for later use
let availableRecipes = [] //variable with indexes of all reciped that can be crafted, gets calculated in getAvailableRecipes()
let recipeSelected = 0, recipePage = 0 //which recipe is selected in craftscreen and which page is selected
let craftingScreen = false; inventoryCrafting = true //says if craftingscreen is open

function craftingSetup(){
    for(const i in itemInfo){ //Go through every item and store recipe if one exists
        const item = itemInfo[i]
        if(item.recipe) recipes[i] = item.recipe
    }
}

function craftingDraw(){
    if(craftingScreen && self.alive && !gamePaused)
        drawCraftScreen() //draw the screen if it is open
}

function drawCraftScreen(){
    fill(color(0, 0, 0, 180)) //Black background
    strokeWeight(0)
    rect(0, 0, width, height)

    stroke("#414149")
    strokeWeight(height/180)
    fill("white")
    textSize(height*0.012)
    textAlign(CENTER)

    image(craftScreenImg, width*0.25, height*0.02, width*0.5, height*0.4) //Draw craftscreen background

    if(availableRecipes.length != 0){
        for(let i = 0; i<4; i++){
            if(!availableRecipes[4*recipePage+i]) continue //See if there is recipe
            const itemId = availableRecipes[4*recipePage+i]
            image(itemInfo[itemId].image, width*0.26, height*0.05+i*height*0.098, height*0.05, height*0.05) //Draw craftable item
            if(itemInfo[itemId].craftAmn) text(itemInfo[itemId].craftAmn, width*0.285, height*0.09+i*height*0.098)
            for(let j = 0; j < recipes[itemId].length; j+=2){
                image(itemInfo[recipes[itemId][j]].image, width*0.3+j*width*0.01, height*0.08+i*height*0.098, height*0.025, height*0.025)
            }
        }
    }

    if(availableRecipes.length > (recipePage+1)*4){ //Arrowbutton to go to next page
        buttonRect(width*0.4, height*0.45, width*0.03, width*0.03, ">", height*0.02, () => {recipePage++})
    }
    if(recipePage > 0){ //Arrowbutton to go to last page
        buttonRect(width*0.26, height*0.45, width*0.03, width*0.03, "<", height*0.02, () => {recipePage--})
    }

    if(recipeSelected != 0){ //Draw border around selected recipe and ingredients on right
        const index = recipeSelected-recipePage*4-1 //Border
        if(index < 4 && index >= 0)borderRect(width*0.25, height*0.02+index*height*0.098, width*0.5*0.34, height*0.1)

        stroke("#414149")
        strokeWeight(height/180)
        fill("white")
        textSize(height*0.015)

        const itemId = availableRecipes[recipeSelected-1]
        for(let j = 0; j < recipes[itemId].length; j+=2){ //Ingredients
            image(itemInfo[recipes[itemId][j]].image, width*0.446, height*0.05+j*height*0.03, height*0.05, height*0.05)
            text(recipes[itemId][j+1], width*0.459, height*0.07+j*height*0.03, height*0.05, height*0.05)
        }

        imageMode(CENTER) //Draw craftable item right
        image(itemInfo[itemId].image, width*0.625, height*0.22, height*0.2, height*0.2)
        text(itemInfo[itemId].name, width*0.625, height*0.37)
        if(itemInfo[itemId].craftAmn){
            textSize(height*0.04)
            text(itemInfo[itemId].craftAmn, width*0.67, height*0.28)
        }
        imageMode(CORNER)
        if(buttonCenter(width*0.625, height*0.22, height*0.25, height*0.25)){ //Button is hovering over item
            rectMode(CENTER)
            borderRect(width*0.625, height*0.22, height*0.25, height*0.25)
            rectMode(CORNER)
            if(mouseClick){ //Mouse was clicked, pick it up
                const amn = itemInfo[itemId].craftAmn ? itemInfo[itemId].craftAmn : 1
                let craftDone = false
                if(self.selected.holding == false){ //Nothing on mouse, just pick it up
                    self.selected = {holding: true, item: {id: itemId, amn:amn}}
                    craftDone = true         
                }else if(self.selected.item.id == itemId && self.selected.item.amn+amn <= itemInfo[itemId].stackable){ //Add to stack on hand
                    self.selected.item.amn += amn
                    craftDone = true
                }
                if(craftDone){ //Item was crafted, remove items
                    for(let i = 0; i < recipes[itemId].length; i+=2){
                        const info = self.getItemFromInventory(recipes[itemId][i], recipes[itemId][i+1]) //return place and index of item
                        self.addToAmnInventorySlot(info[0], info[1], -recipes[itemId][i+1])
                    }
                }
            }
        }
    }

    if(button(width*0.25, height*0.02, width*0.5*0.34, height*0.4)){ //Mouse is over selectable craftables
        const index = floor((mouseY-height*0.02)/(height*0.1)) //hightlight correct one
        borderRect(width*0.25, height*0.02+index*height*0.098, width*0.5*0.34, height*0.1)
        if(mouseClick && availableRecipes[recipePage*4+index]){
            recipeSelected = recipePage*4+index+1
        }
    }

    self.drawInventory(false)
}

//inventorycraft says if craftingscreen was opened from inventory
function toggleCraftingScreen(inventoryCraft = true){
    inventoryCrafting = inventoryCraft
    if(!self.alive || self.inventoryOpen || gamePaused) return
    craftingScreen = !craftingScreen
    if(craftingScreen){
        recipeSelected = 0;
        recipePage = 0;
        getAvailableRecipes(true)
    }
}

//reset says if it should remove old found recipes
function getAvailableRecipes(reset=true){
    let idSelected = 0 //Save id of recipe selected incase index gets moved around
    if(reset) availableRecipes = [] //reset
    else idSelected = availableRecipes[recipeSelected-1]

    for(const r in recipes){
        const recipe = recipes[r]
        let available = true //Says if current recipe is available

        if(inventoryCrafting && !itemInfo[r].inventoryCraftable) available=false //check if craftable in inventory
        else{
            for(let i = 0; i < recipe.length; i+=2){
                if(!self.getItemFromInventory(recipe[i], recipe[i+1])){ //Item not available, cant be crafted
                    available = false
                    break
                }
            }
        }

        if(available){ //Can be crafted
            if(reset || availableRecipes.indexOf(r) == -1) //Add to Array if not already in there
                availableRecipes.push(r) //push itemId into array

        }else if(!reset){ //cant be crafted, remove from array if still available
            const index = availableRecipes.indexOf(r)
            if(index != -1) availableRecipes.splice(index, 1) //Remove from array
        } 
    }
    if(!reset && idSelected != availableRecipes[recipeSelected-1]){ //Change selected since array was modified
        const index = availableRecipes.indexOf(idSelected) 
        if(index == -1) recipeSelected = 0 //Recipe doesnt exist anymore
        else recipeSelected = index+1 //update index
    }
}

function craftingKeyPressed(){
    switch(keyCode){
        case 84: //T
            toggleCraftingScreen()
            break
    }
}

function deleteCrafting(){ //reset all variables when leaving game
    recipes = {}
    craftingScreen=false
    recipeSelected = 0
    recipePage = 0
}