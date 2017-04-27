// general game state setting data, sizes in pixels

// playing field and tile sizes
var rows = 7;
var cols = 7;
// goal row player must reach to score
var goal_row = 1;
var tile_width = 101;
// note: not actual height of the img, just the square 'above ground' part
var tile_height = 83;
// actual height of the tile png image
var full_img_tile_height = 171;
// playing field total width
var canvas_width = cols * tile_width;
// playing field total height (use width because it's only the 'above ground' art)
var canvas_height = rows * tile_width;
// pixel height for the bottom tile's little extra undeground part showing
var bottom_underground = 31;
// init delta time to make timing equal across different performing browsers
var dt;

// playing field boundaries keep the player from leaving the canvas

// beginning of canvas x coordinate system, it's 1 since tile width is 101 so
// can't move to exactly 0 with the sprite
var player_boundary_left = 1;
// cols (minus 1 since we only move to the middle of a column) times tile width
var player_boundary_right = tile_width * (cols-1);
// below 0 to adjust for our player sprite img having extra empty space on top
var player_boundary_top = -31;
// rows - 1 (since we start in middle of a tile) times tile height, adjust for
// the little undeground part on the bottom row
var player_boundary_bottom = tile_height * (rows-1) - bottom_underground;

// game ui and messages

var popup_overlay_class = 'popup_overlay';
var popup_win_class = 'win';
var popup_game_over_class = 'game_over';
// text to put in the win message displayed when the goal row is reached
var win_text_content = "You win, let's swim!";
// text to put in the game over message box
var game_over_text_content = "Wipeout dude! Game Over!";


// Utility functions

function clamp(number, min, max) {
/*
Check if a given number falls within the range of the min and max.
If so, return it, if not return the max or min.
Args: number to check, the minimum value, the maximum value allowed (inclusive for both)
Return: number falling within the specified range, with numbers below the min
        converted to the min and greater than max converted to the max.
*/
    return Math.min(Math.max(number,min), max);
}

function random_num_in_range(min, max) {
/*
Generates a random number that falls within the given range in the arguments.
Range is inclusive of the min, exclusive of the max since Math.random is exclusive
of the max of 1.
Args: miniumum number the random number can be, max number that can be generated
Return: a random number (floating point) in the range
*/
  return Math.random() * (max-min) + min;
}

function range(start, end) {
/*
Generates an array of a range of numbers starting at the start value and ending
at the end value.
Args: start (integer) - the first value in the array,
      end (integer) - the last value in the array
Return: array of length n containing values of each integer from start to end
*/
    var number_array = [];
    // set index equal to the start value for use in loop and end at end value
    for (var i = start; i <= end; i+=1) {
        // push the index value to the array
        number_array.push(i);
    }
    return number_array;
}

/////////////////////////
//     ENTITY CLASS    //
/////////////////////////

var Entity = function(settings) {
/*
Superclass constructor for all the interactive entities in the game
ie player, enemies, powerups.
Args: settings object containing data for a particular entity
Return: constructor returned entity (object)
*/
  this.sprite = settings.sprite;
  this.x = settings.position.x;
  this.y = settings.position.y;
  this.width = settings.size.width;
  this.height = settings.size.height;
  // sets the horizontal position of the hitbox within the sprite img,
  // basically how far in px from the left edge of the image to put the hitbox
  this.hitbox_x = Math.floor(tile_width/2) - this.width/2;
};

Entity.prototype.render = function() {
  // displays the entity on the canvas
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Entity.prototype.update = function(dt) {
  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.
};

/////////////////////////
//   ENEMY SUBCLASS    //
/////////////////////////

// Enemies our player must avoid
var Enemy = function(start_position, speed, type) {
/*
Constructor for the Enemy subclass, built on top of the Entity superclass.
Args: start_position (object) - obj literal containing {x:, y:} location info
      speed (number) - speed that this enemy should move across the canvas at
      type (string) - name of the type of enemy to get specific settings for it
Return: Constructed Enemy instance (object)
*/

    // the type of enemy this will be
    this.type = type;

    // check for enemy type and assign appropriate settings for that enemy type
    switch (type) {
      case 'red bug':
        this.default_sprite_img = 'images/enemy-bug.png';
        // set bottom of hitbox to the bottom of the actual sprite art
        this.hitbox_bottom_edge = 139;
        break;
    }

    // settings object to set the basics of each enemy instance
    var settings = {
      // image url location for this enemy
      sprite: new Sprite(this.default_sprite_img, [0,0], [tile_width, full_img_tile_height]),
      position: start_position,
      // size of hitbox for collision detection
      size: {
        width: 100,
        height: 50
      }
    };

    // delegate settings to the Entity superclass
    Entity.call(this, settings);

    // define speed of animated movement for this enemy instance
    this.speed = speed;
    // the row # the enemy is in (starting at 1 at top, 2 for row below, etc)
    this.row = start_position.row;
    // calculate the top y position of the hitbox upwards using the height
    this.hitbox_y = this.hitbox_bottom_edge - this.height;
};
// set the enemy prototype equal to an instance of the Entity's prototype
Enemy.prototype = Object.create(Entity.prototype);
// set constructor property to correct constructor since it still points to Entity
Enemy.prototype.constructor = Enemy;

// Update the enemy's position, required method for
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.

    // update the enemy sprite for any animations
    this.sprite.update(dt);
    // move the enemy sprite across the row
    this.animate_move();

};

Enemy.prototype.animate_move = function() {
  /*
   animate this enemy moving across the screen
   increment the horizontal position of the sprite, use delta time to keep
   movement consistent across devices
   Args: na
   Return: na
  */
  this.x += this.speed*dt;
  // check if sprite moved all the way across screen and out of visible canvas
  if (this.x > canvas_width + 50) {
    // reset position back to the beginning but start off screen
    this.x = -100;
  }
};

/////////////////////////
//   PLAYER SUBCLASS   //
/////////////////////////

var Player = function(start_position, type) {
  /*
  Constructor for the Player subclass, built on top of the Entity superclass.
  Args: start_position (object) - obj literal containing {x:, y:} location info
        type (string) - name of the type of player to get specific settings for it
  Return: Constructed Player instance (object)
  */

  // the type of character this will be
  this.type = type;

  // SPRITE IMAGES

  // var to store the sprite img url to insert in settings
  //var sprite_img;
  // check for player type and assign appropriate settings for that enemy type
  switch (type) {
    case 'boy':
      this.default_sprite_img = 'images/char-boy-map.png';
      break;
  }

  var settings = {
    // image url location for this enemy
    sprite: new Sprite(this.default_sprite_img, [0,0], [tile_width,full_img_tile_height]),
    position: start_position,
    // set the size for the hitbox used for collision detection
    size: {
      width: 50,
      height: 60
    }
  };
  // create player class by calling entity class, resetting that this to player this
  Entity.call(this, settings);

  // player score tracker
  this.score = 0;
  // player lives
  this.lives = 3;
  // number of games finished without getting hit once
  this.streak = 0;
  // initialize a move distance tracker for animating player movement
  this.distance_moved = 0;
  // track if player is moving rows
  this.moving = false;
  // track the row player is in
  this.row = start_position.row;
  // tracks the row player is moving to when moving
  this.destination_row = start_position.row;
  // set hitbox bottom y edge to bottom of player sprite artwork
  this.hitbox_bottom_edge = 114;
  // set hitbox top y position upwards from the bottom of the art to the height
  this.hitbox_y = this.hitbox_bottom_edge - this.height;
  // track if player has been hit during this games
  this.collision_count = 0;
  // enemy-player collision flag if player hit an enemy
  this.enemy_collided = false;
  // invulnerability flag to disable collisions
  this.invulnerable = false;
  // mobility flag to prevent movement when immobile status is triggered
  this.immobile = false;
  // flag for if the goal row has been reached
  this.goal_reached = false;
  // flag if player dies by losing all lives to trigger game over
  this.game_over = false;
  // timers for various statuses
  this.timers = {
    // track # of frames after the goal has been reached
    goal: 0,
    // track the # of frames after a collision for status condition time limits
    collision: 0,
    // # frames player is invulnerable after collision (typically 60 frames/sec)
    invulnerability_limit: 90,
    // # frames player will be unable to use keyboard movement
    immobile_limit: 70,
    // # milliseconds to wait after goal reached before resetting the level
    goal_limit: 1400
  };

};
// delegate player prototype to entity prototype
Player.prototype = Object.create(Entity.prototype);
// set player constructor property to correct function instead of Entity
Player.prototype.constructor = Player;

// PLAYER FUNCTIONS

Player.prototype.update = function(dt) {
/*
Thing that need updating or checking every frame executed in this function.
Args: dt (number) - the delta time for equalizing speeds across systems
Return: na
*/

  // update player sprite
  this.sprite.update(dt);
  // check for player status conditions
  this.check_status();
  //  checking for goal row done in player move function to prevent checking every frame

};

// function for the request animation frame player animation loop
Player.prototype.animate_player_move = function() {
/*
Runs animation loop for player movement and checks to see if a movement has
completed before ending the animation.
Args: na, but relys on key pressed to be defined in outer scope
Return: none
*/

  // check what kind of movement was made (in the x plane or y plane)
  var horizontal_move = key_pressed == 'left' || key_pressed == 'right';
  var vertical_move = key_pressed == 'up' || key_pressed == 'down';

  // set moving status of player to true since we're on the move
  this.moving = true;

  // check if the animation has completed moving a tile and stop it if so
  // check keypress type for appropriate distance/tile comparison
  if (horizontal_move) {

    // stop the movement animation if we've travelled 1 tile's width
    if (this.distance_moved >= tile_width) {
          // reset the distance
          this.distance_moved = 0;
          // movement complete so moving status should be back to false
          this.moving = false;
          // exit animation function
          return;
    }

  } else if (vertical_move) {

    // stop the movement animation if we've travelled 1 tile's height
    if (this.distance_moved >= tile_height ) {
          // reset the distance
          this.distance_moved = 0;
          // movement complete so moving status should be back to false
          this.moving = false;
          // set row value to destination row value, clamp to keep value in screen bounds
          this.row = clamp(this.destination_row, 1, rows);
          // check if the goal row reached for completed moves
          this.check_if_goal_reached();
          // exit animation function
          return;
    }

  }

  // store reference to this as this Player instance in the outer scope
  // since request animation frame changes has window as the context
  var self = this;
  // run recursive animation loop and store id for canceling animation if needed
  var request_id = requestAnimationFrame(function() {
    // run animate player with the correct context of the player instance
    self.animate_player_move();
  });
  // move the player some pixel distance in the key defined direction
  this.player_move(key_pressed);

};

Player.prototype.player_move = function(direction) {
/*
Moves the player sprite a set distance based on the direction from the key press.
Integrated boundary handling to keep player from moving off screen. This function
needs to keep being called by requestanimationframe until the distance is fully moved.
Args: the direction of movement (string) - expects an arrow key direction value
      string like 'left', 'right', 'up', 'down'
Return: n/a but increments the player postion x/y in the outer scope
*/

  var tile_distance;
  var speed_per_frame = 1/3;
  var speed_in_pixels;

  // set the distance that corresponds to 1 complete move
  switch (direction) {
    case 'left':
      // make negative since we're subtracting from x position to move left
      // using math.abs in case for some strange reason it's a negative number
      tile_distance = -Math.abs(tile_width);
      break;
    case 'right':
      // move the tile width, positive because we're moving right away from origin
      tile_distance = tile_width;
      break;
    case 'up':
      // make negative because moving up in y position means subtracting pixels
      tile_distance = -Math.abs(tile_height);
      // destination row is 1 less than current row since we're moving up
      this.destination_row = this.row - 1;
      break;
    case 'down':
      // positive because we're moving down away from the origin
      tile_distance = tile_height;
      // add 1 for destination row when moving down away from origin
      this.destination_row = this.row + 1;
      break;
    }

    // convert the unitless percentage speed into a speed in pixels
    speed_in_pixels = tile_distance * speed_per_frame;

    // increment the appropriate player x or y position (x:horizontal, y:vertical)
    // clamp keeps the player position from going off screen
    if (direction == 'left' || direction == 'right') {
      this.x = clamp(this.x + speed_in_pixels, player_boundary_left, player_boundary_right);
    } else {
      this.y = clamp(this.y + speed_in_pixels, player_boundary_top, player_boundary_bottom);
    }

    // increment distance moved so far tracker with the absolute value of the speed
    this.distance_moved += Math.abs(speed_in_pixels);

};

Player.prototype.check_if_goal_reached = function() {
  /*
  Checks if the player has reached the goal row and executes the appropriate stuff.
  args: na
  return: na
  */

  // initial check for goal row reached to only run
  // these functions once before setting the goal reached flag
  // just in case user tries to move up again while in the goal row
  if (this.row == goal_row && !this.goal_reached) {
    // cache reference to this for use in setTimeout
    var self = this;

    // toggle goal reached flag
    this.goal_reached = true;
    // add points to the player's score
    this.score += 10;
    // immobilize the player
    this.immobile = true;
    // reset sprite in it's in the collision animation
    this.reset_sprite();
    // change the sprite to goal animation
    this.set_win_sprite();
    // show the winner message
    toggle_message(popup_win_class, win_text_content);

    // if the player had a perfect game of not getting hit once
    if (this.collision_count === 0) {
      // add to the streak counter
      this.streak += 1;
    } else {
      // reset the collision counter for the next game if they got hit this round
      this.collision_count = 0;
    }

    // wait a little before initiating crossfade animation
    setTimeout(function(){
      // initiate crossfade animation
      requestAnimationFrame(crossfade_canvas_and_reset);
      // hide the win message overlay popup
      toggle_message(popup_win_class, win_text_content);

      // i should require user to press any key to continue to next level
      // reset goal reached flag
      self.goal_reached = false;

    }, (self.timers.goal_limit*2));

  }

};

Player.prototype.reset = function() {
  /*
  Reset the player position and status in prep for a new level.
  */
  // reset the player's x and y position to the starting positin
  this.x = player_start_position.x;
  this.y = player_start_position.y;
  // reset player lives
  this.lives = 3;
  // reset the row tracker
  this.row = player_start_position.row;
  // reset player invulnerability
  this.invulnerable = false;
  // reset player sprite
  player.reset_sprite();
};

Player.prototype.collided = function(entity) {
  /*
  Checks what player collided with and sets appropriate statuses
  and animations absed on the thing player collided with.
  Args: entity(obj) - the entity that player collided with
  Return: none
  */

    // if player collided with an enemy
    if (entity instanceof Enemy) {
      // increment the current game collsion count
      this.collision_count += 1;
      // decrement the player's health/life counter
      this.lives = clamp(this.lives - 1, 0, 3);
      // if no life left
      console.log(this.lives);
      // trigger game over if player got hit with no lives left
      if(this.lives === 0) {
        // show the death animation
        this.set_game_over_sprite();
        // show the game over message
        toggle_message(popup_game_over_class, game_over_text_content);
        // set player status to game over
        this.game_over = true;
        // freeze the player and prevent further collisions
        this.invulnerable = true;
        this.immobile = true;
        // prevent typical collision behavior by exiting function
        return;
        // go to new game menu
        // start the new game
        // temp level reset here before implementing the menu
      }
      // set enemy-player collision flag to true since we player got hit
      this.enemy_collided = true;
      // make player invulnerable temporarily to stop 60 collisions/sec from happening
      this.invulnerable = true;
      // stop player from being able to move
      this.immobile = true;
      // change sprite to collision sprite image animation
      this.set_collision_sprite();
    }

};

Player.prototype.set_collision_sprite = function() {
  /*
  Changes the player sprite to the collision animation sprite
  */
  // set speed of animation, higher numbers = slower animation
  this.sprite.speed = 1;
  // sets the sprites in the map to use as animation frames
  this.sprite.frames = range(0,22);
  this.sprite.once = true;
  this.sprite.final_frame = 22;
};

Player.prototype.set_win_sprite = function () {
  /*
  Changes the player sprite to the victory animation sprite
  */
  this.sprite.speed = 4;
  // move to the next row in the sprite map
  this.sprite.pos = [0,171];
  // sets the sprites in the map to use as animation frames
  this.sprite.frames = range(0,7);
  this.sprite.once = true;
  this.sprite.final_frame = 7;
};

Player.prototype.set_game_over_sprite = function () {
  /*
  Changes the player sprite to the game over animation sprite
  */
  this.sprite.speed = 2;
  // move to the next row in the sprite map
  this.sprite.pos = [0,171];
  // sets the sprites in the map to use as animation frames
  this.sprite.frames = range(8,22);
  this.sprite.once = true;
  this.sprite.final_frame = 22;
};

Player.prototype.reset_sprite = function() {
  /*
  Resets the player sprite back to the default.
  */
  // reset everything back to the default values
  this.sprite.pos = [0,0];
  this.sprite.speed = 0;
  this.sprite.frames = undefined;
  this.sprite.once = undefined;
  this.sprite.final_frame = undefined;
  this.sprite.frame_counter = 0;
};

Player.prototype.check_status = function() {
  /*
  Check status conditions of the player instance and do appropriate things for each.
  */

  //// STATUS CONDITIONS ////

  // ENEMY COLLIDED WITH PLAYER

  // check if an enemy collided with player
  if (this.enemy_collided) {
    // increment collision timer
    this.timers.collision += 1;

    // INVULNERABLE

    // if the timer reaches the invulnerability time limit
    if (this.timers.collision >= this.timers.invulnerability_limit) {
      // reset the timer
      this.timers.collision = 0;
      // make player vulnerable again
      this.invulnerable = false;
      // reset enemy collision flag
      this.enemy_collided = false;
      // don't reset the sprite if goal reached since goal animation will play
      if (!this.goal_reached) {
        // this.sprite back to default
        this.reset_sprite();
      }

    }

    // IMMOBILE

    // if immobile limit is reached, turn off immobility unless in a goal row
    // then we stay immobile since we'd be immobile during the win animation
    // or if game over
    if (this.timers.collision >= this.timers.immobile_limit && !this.goal_reached && !this.game_over) {
      // let player move again
      this.immobile = false;
    }
  }

};


//////////////////////////////////
//     INSTANTIATE OBJECTS      //
//////////////////////////////////

// Instantiate everything
// All enemy objects in an array called allEnemies
// Player object in a variable called player

// putting the enemy construction loop in a function for ease of resetting the level
function generate_enemies() {
  /*
  Constructs all the different enemies w/ their differing characteristsics
  into an array of all the enemies on the level.
  Args: na
  Return: all the Enemy instances (array)
  */

  var enemies_array = [];
  // pixel position adjustments for centering the sprite on the tile
  var enemy_center_y_adjustment = 30;
  // figure out number of rows to spawn enemies in
  // subtract 3 for the water row and the 2 grass rows
  var enemy_rows = rows - 3;

  // init var to get the last rows which will have higher difficulty enemies
  var last_rows;
  // init var for number of enemies to generate in current row
  var enemies_in_current_row;
  // init var for the current enemy horizontal and vertical position
  var current_enemy_x_pos;
  var current_enemy_y_pos;
  // init var for enemy speed
  var current_enemy_speed;
  // init var for pixel margin between each enemy sprite in the row
  var space_between_enemies;
  // scale max allowed enemies with the number of columns
  var hard_max_enemies = Math.ceil(cols/2);
  // scale max enemies for easy rows also
  var easy_max_enemies = Math.ceil(cols/3);

  // enemy spawning loop to fill the allEnemies array
  for (i=0; i < enemy_rows; i+=1) {

    // find the last few rows because they will have more enemies
    // ceiling rounding to make more high difficulty rows
    last_rows = Math.ceil(enemy_rows/3);

    // check if the current row is one of the last for increased difficulty
    if (i < last_rows) {
      // set more enemies in current row if one of the last rows
      enemies_in_current_row = random_num_in_range(2, hard_max_enemies);
      // higher range for the enemy speed
      current_enemy_speed = Math.floor(random_num_in_range(150, 200));
    } else {
      // less possible enemies for regular rows
      enemies_in_current_row = random_num_in_range(1, easy_max_enemies);
      // standard enemy speed 50-180 px per sec
      current_enemy_speed = Math.floor(random_num_in_range(50, 160));
    }

    // calculate the enemy y position by getting the current row's pixel height
    // then subtracting pixels to center the enemy vertically in the row
    // i+1 to skip spawning enemies in the top goal row
    current_enemy_y_pos = (i+1) * tile_height - enemy_center_y_adjustment;
    // calculate evenly distributed pixel space between each enemy sprite
    space_between_enemies = cols * tile_width / enemies_in_current_row;

    // loop through number of enemies in the current row and set x,y positions for each
    for (j=0; j < enemies_in_current_row; j+=1) {
      // enemy x position determined by number of enemies spaced equally on the row
      // round it down to make a nice round integer for the position value
      current_enemy_x_pos = Math.floor(j * space_between_enemies);

      // construct the enemies for the current row and push to the allEnemies array
      enemies_array.push(
        new Enemy({x: current_enemy_x_pos,
                   y: current_enemy_y_pos,
                   // adding 2 to make the row grid start at 1 and skip the first goal row
                   row: i+2},
                  current_enemy_speed,
                  'red bug')
      );
    }
  }

  return enemies_array;
}

function level_reset() {
  /*
  Resets the game level so player is back at the beginning and ready
  to tackle a new board of enemies.
  Args: na
  return: na
  */
  // clear the previous enemies array
  allEnemies.length = 0;
  // regenerate enemies so that they change from previous level
  allEnemies = generate_enemies();
  // move player back to start and reset condition
  player.reset();
}

function toggle_message(container_class, message_text) {
  /*
  Toggles the winner message overlay popup.
  Args: css class for the specific type of message (string)
  Return: none;
  */
  // show class is the container class with the on class added
  var show_class = container_class + ' on';
  // set popup text to appropriate message content
  box_message.textContent = message_text;

  // set popup container class name to win class if not set
  // and/or toggle off popup visibility by removing on class
  if (box_container.className !== show_class) {
    // set container to the win class
    box_container.className = show_class;
  // if its a different class or more than just the single class expected
  } else {
    // make popup visible by adding the on class/setting it to the appropriate popup
    box_container.className = container_class;
  }

}

// counter for the crossfade animation to work in incrementing 0 to 1 to 0
var animation_fade_counter = 0;
// how many steps for the crossfade animation to have is pi divided by the # you want
// determines how long the animation lasts
var animation_fade_increase = Math.PI / 100;

function crossfade_canvas_and_reset() {
  /*
  Fade's the canvas out then back in again. Resets stuff at certain points
  */

  // set the global alpha transparency from 1 to 0 back to 1ish
  // using math.sin since it goes up then down then back
  // multiply by -1 to count downwards
  // add 0.9 to make the transition actually increment reasonably
  ctx.globalAlpha = (-1*Math.sin(animation_fade_counter))+0.9;
  // increase the counter
  animation_fade_counter += animation_fade_increase;

  // do the resets when stuff is invisible
  if (ctx.globalAlpha < 0.01) {
    // reset the level
    level_reset();
  }

  // if the global transparency is almost back to full opacity
  if (ctx.globalAlpha > 0.99) {
    // reset the counter
    animation_fade_counter = 0;
    // set transparency back to full opacity
    ctx.globalAlpha = 1;
    // restore player mobility
    player.immobile = false;
    // exit the animation
    return;
  }
  requestAnimationFrame(crossfade_canvas_and_reset);
}

// counters for incrementing loops
var i;
var j;

/////////////////////////
// PLAYER INSTANTATION //
/////////////////////////

// divide number of columns by 2, then round to an even number to get the col
// of the middle tile, then multiply by the tile width to get actual pixel value
var center_tile = Math.floor(cols/2) * tile_width;

// settings for the starting position of the player sprite
var player_start_position = {
  x: center_tile,
  // start the player at the bottom of the rows, adjust position to center sprite
  // feet on the tile 'ground', adjustment is just to get a perfect centering
  y: (tile_height * rows) - (full_img_tile_height * 2/3),
  // adding 1 to make the row grid starting at 1
  row: rows
};

// instantiate the player character
var player = new Player(player_start_position, 'boy');

var lives = [];
// create the life counter
for (i = 0; i < player.lives; i += 1) {
  lives.push(
    new Entity({
      // image url location for this enemy
      // TODO gonna need a sprite map of an empty heart and full heart
      sprite: new Sprite('images/Heart.png',
                         [0,0],
                         // size settings array
                         [tile_width,
                          full_img_tile_height,
                          // scaled sprite size settings
                          tile_width/4,
                          full_img_tile_height/4]),
      position: {
        // position them spaced apart in a row
        x: 10 + i*25,
        y: 0
      },
      // size of hitbox for collision detection
      size: {
        width: 100,
        height: 50
      }
    })
  );
}

/////////////////////////
// ENEMY INSTANTIATION //
/////////////////////////

// array to store all enemy instances
var allEnemies = generate_enemies();

//////////////
// CONTROLS //
//////////////

// initialize a var to store the allowed key that was pressed by user
var key_pressed;
// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        13: 'enter',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    // if any key was pressed while game over
    if(player.game_over && allowedKeys[e.keyCode] === 'enter') {

        // reset game over flag
        player.game_over = false;
        // reset streak counter
        player.streak = 0;
        // reset the score
        player.score = 0;
        // transition the resets
        requestAnimationFrame(crossfade_canvas_and_reset);
        // toggle the message popup off
        toggle_message(popup_game_over_class, game_over_text_content);
        // let stuff fade out a bit before resetting the level
        setTimeout(function() {
          // reset the game back to the new game menu
          //reset();
        }, (player.timers.goal_limit/2));
    }

    // only run the animation if an allowed key was pressed
    if (e.keyCode in allowedKeys && player.immobile === false) {
      // set key_pressed to inputted keycode's corresponding human readable value
      key_pressed = allowedKeys[e.keyCode];

      // update player's current row position

      // call the player movement animation which handles player movement
      // checks key_pressed value from this outer scope for movement direction
      requestAnimationFrame(function() {
        // passing this in anonymous function lets the correct context
        // of player be used instead of window
        player.animate_player_move();
      });
    }

});
