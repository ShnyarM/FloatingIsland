let player;

function playerSetup(){
  player = new Player();
}

function playerDraw(){
  player.updateTimers()
  player.move()
  player.draw()
}

class Player{
  constructor(){
    this.x = 3
    this.y = 1
    this.width = 0.91
    this.height = 0.91
    this.drawExpansion = 0.5

    this.moveSpeed = 7.5
    this.xVelocity = 0
    this.yVelocity = 0
    this.direction = 1;

    this.relativeGround = 0
    this.onGround = true
    this.jumpVelocity = 12

    this.dashed = false;
    this.dashedUp = false;
    this.dashStrength = 50;
    this.dashTimer = 0;
    this.dashRecharge = 0.2;

    this.collCorrection = 0.00001 //Add when colliding to prevent bugs where game thinks its inside block

    // timers for animations
    this.runningTimer = 0;
    this.runningAnimationSpeed = 23;
    this.idleTimer = 0;
    this.idleAnimationSpeed = 3;

    this.cat = catMode;
    this.score = 0;
    this.hurt = false;

    this.hasLetGoOfSpace = false //this variable is to detect if player has let go of space in this round
    // used to prevent player jumping at start when retrying with space
  }

  draw(){
    let imageToDraw;
    if(!this.cat){
      imageToDraw = racoonIdle[floor(this.idleTimer) % 8];
      if(this.xVelocity != 0) imageToDraw = racoonRunning[floor(this.runningTimer) % 8]
      if(!this.onGround) imageToDraw = racoonInAir;
      if(this.dashed) imageToDraw = racoonDash;
    }else{
      imageToDraw = catIdle[floor(this.idleTimer) % 16];
      if(this.xVelocity != 0) imageToDraw = catRunning[floor(this.runningTimer) % 8]
      if(!this.onGround) imageToDraw = catInAir;
      if(this.dashed) imageToDraw = catDash;
    }

    unitImage(imageToDraw, player.x-0.5*this.drawExpansion, player.y+this.drawExpansion, player.width+this.drawExpansion, player.height+this.drawExpansion, this.direction != 1);
    noFill();
    //unitRect(player.x, player.y, player.width, player.height);
  }

  move(){
    if(this.hurt) return;

    if(!keyIsDown(32)) this.hasLetGoOfSpace = true;
    if(this.dashTimer > 0) this.dashTimer -= sdeltaTime

    let xDirection = 0;
    let yDirection = 0;
    if(keyIsDown(68)) xDirection += 1; // d
    if(keyIsDown(65)) xDirection -= 1; // a
    if(keyIsDown(87)) yDirection += 1; // w

    this.relativeGround = this.getGroundHeight()
    if(this.relativeGround < this.y-this.height) this.onGround = false;

    this.xVelocity = moveToward(this.xVelocity, xDirection*this.moveSpeed, sdeltaTime);
    
    // dash
    if(keyIsDown(16) && !this.dashed && !this.onGround && this.dashTimer <= 0){
      dashSound.play()
      this.dashed = true;
      this.dashTimer = this.dashRecharge;

      if(yDirection == 1){
        if(xDirection != 0){
          this.xVelocity = 0.8*this.dashStrength*xDirection;
          this.yVelocity = 0.8*this.dashStrength;
        }else{
          this.yVelocity = 0.9*this.dashStrength;
        }
        this.dashedUp = true;
      }else{
        this.xVelocity = this.dashStrength * xDirection;
      }
    }

    if(!this.onGround){
      if(this.dashedUp && this.yVelocity > 0) this.yVelocity = moveToward(this.yVelocity, 0, sdeltaTime)
      this.yVelocity -= (gravity*sdeltaTime)
    }

    // jump
    if(keyIsDown(32) && this.onGround && this.hasLetGoOfSpace){
      this.yVelocity = this.jumpVelocity;
      this.onGround = false;
    }

    const toMoveX = this.xVelocity*sdeltaTime;
    const toMoveY = this.yVelocity*sdeltaTime
    this.x = this.collisionX(toMoveX);
    this.y = this.collisionY(toMoveY);

    // gravity
    if(!this.onGround && this.y-this.height < this.relativeGround){
      this.onGround = true;
      this.dashed = false;
      this.dashedUp = false;
      this.yVelocity = 0;
      this.y = this.relativeGround + this.height;
    }

    const direction = Math.sign(this.xVelocity)
    if(direction != 0) this.direction = direction

    if(this.x + this.width < camera.offsetX) this.damage()
    if(this.y < -10) this.damage()
  }

  getGroundHeight(){
    let highest = -50;

    for(const s of structures){
      for(const b of s.blocks){
        if(this.x + this.width >= b.x && this.x <= b.x+b.width && this.y - this.height >= b.y && b.y > highest && b.isGround()) 
          highest = b.y
      }
    }
    return highest;
  }

  //Check if will be colliding with block in x direction, addToX is movement
  collisionX(addToX){
    const direction =  Math.sign(addToX) //Moving in negative or positive, -1 = negative
    const updatedXPos = this.x + addToX;
    for(const s of structures){
      for(const b of s.blocks){
        if(this.relativeGround == b.y) continue;
        if((b.hasCollision() || b.id == CAKE) && b.collide(updatedXPos, this.y, this.width, this.height)){ // minus to change coordinate system
          if(b.isLethal()){
            this.damage();
            return updatedXPos;
          }
          if(b.id == CAKE){
            this.cakePickup(b)
            continue;
          }
          this.xVelocity = 0;
          return direction == 1 ? b.x - this.width - this.collCorrection : b.x + b.width + this.collCorrection
        }
      }
    }

    if(updatedXPos+this.width > camera.offsetX + uwidth) return camera.offsetX + uwidth - this.width;

    return updatedXPos; // Nothing was hit
  }

  collisionY(addToY){
    const direction =  Math.sign(addToY) //Moving in negative or positive, -1 = negative
    const updatedYPos = this.y + addToY;
    if(direction == -1) return updatedYPos; // dont bother when going down, already handled by groundheight
    //return updatedYPos

    for(const s of structures){
      for(const b of s.blocks){
        if((b.hasCollision() || b.id == CAKE) && b.collide(this.x, updatedYPos, this.width, this.height)){ // minus to change coordinate system
          if(b.isLethal()) {
            this.damage();
            return updatedYPos
          }
          if(b.id == CAKE){
            this.cakePickup(b)
            continue;
          }
          this.yVelocity = 0;
          return b.y - b.height - this.collCorrection;
        }
      }
    }

    return updatedYPos; // Nothing was hit
  }

  updateTimers(){
    this.runningTimer += sdeltaTime*this.runningAnimationSpeed;
    this.idleTimer += sdeltaTime*this.idleAnimationSpeed;
  }

  cakePickup(cakeBlock){
    this.score++;
    cakeBlock.active = false;
    cakeSound.play();
  }

  damage(){
    this.hurt = true;
    playerHurt = true;
    this.xVelocity = 0;
    this.yVelocity = 0;
    hurtSound.play();

    if(this.score > highscore){
      newHighScore(this.score)
    }
  }
}