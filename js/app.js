// general game state setting data, sizes in pixels

// playing field and tile sizes
var rows = 7;
var cols = 7;
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

// Utility functions

function clamp(number, min, max) {
/*
Check if a given number falls within the range of the min and max.
If so, return it, if not return the max or min.
Args: number to check, the minimum value, the maximum value allowed
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

/////////////////////////
//     ENTITY CLASS    //
/////////////////////////

var Entity = function(settings) {
/*
Superclass constructor for all the interactive entities in the game
ie player, enemies, powerups.
Args: settings object containing data the a particular entity
Return: constructor returned entity object
*/
  this.sprite = settings.sprite;
  this.x = settings.position.x;
  this.y = settings.position.y;
  this.width = settings.size.width;
  this.height = settings.size.height;
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
var Enemy = function(start_position, speed) {
/*
Constructor for the Enemy subclass, built on top of the Entity superclass.
Args: start_position (object) - obj literal containing {x:, y:} location info
      speed (number) - speed that this enemy should move across the canvas at
Return: Constructed Enemy instance
*/
    // define speed of animated movement for this enemy instance
    this.speed = speed;

    // settings object to set the basics of each enemy instance
    var settings = {
      // image url location for this enemy
      sprite: 'images/enemy-bug.png',
      position: start_position,
      // size of hitbox for collision detection
      size: {
        width: 100,
        height: 50
      }
    };

    // delegate settings to the Entity superclass
    Entity.call(this, settings);
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

    // animate these moving across the screen, unique to enemy
    // increment the horizontal position of the sprite, use delta time to keep
    // movement consistent across devices
    this.x += this.speed*dt;
    // check if sprite moved all the way across screen and out of visible canvas
    if (this.x > canvas_width+50) {
      // reset position back to the beginning but start off screen
      this.x = -100;
    }

};

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

/////////////////////////
//   PLAYER SUBCLASS   //
/////////////////////////

var Player = function(start_position) {

  var settings = {
    // image url location for this enemy
    sprite: 'images/char-boy.png',
    position: start_position,
    // set the size for the hitbox used for collision detection
    size: {
      width: 50,
      height: 50
    }
  };
  // create player class by calling entity class, resetting that this to player this
  Entity.call(this, settings);

  // initialize a move distance tracker for animating player movement
  this.distance_moved = 0;

};
// delegate player prototype to entity prototype
Player.prototype = Object.create(Entity.prototype);
// set player constructor property to correct function instead of Entity
Player.prototype.constructor = Player;

Player.prototype.update = function(dt) {

};

// function for the request animation frame player animation loop
Player.prototype.animate_player = function() {
/*
Runs animation loop for player movement and checks to see if a movement has
completed before ending the animation.
Args: na, but relys on key pressed to be defined in outer scope
Return: none
*/

  // check what kind of movement was made (in the x plane or y plane)
  var horizontal_move = key_pressed == 'left' || key_pressed == 'right';
  var vertical_move = key_pressed == 'up' || key_pressed == 'down';

  // check if the animation has completed moving a tile and stop it if so
  // check keypress type for appropriate distance/tile comparison
  if (horizontal_move) {

    // stop the movement animation when moving offscreen or move completed
    if (// check if we've travelled 1 tile's width
        this.distance_moved >= tile_width ||
        // check if we're moving off screen on the left
        key_pressed == 'left' && this.x <= player_boundary_left ||
        // check if we're moving offscreen on the right
        key_pressed == 'right' && this.x >= player_boundary_right) {
          // reset the distance
          this.distance_moved = 0;
          // exit animation function
          return;
    }

  } else if (vertical_move) {

    // stop the movement animation when moving offscreen or move completed
    if (// check if we've travelled 1 tile's height
        this.distance_moved >= tile_height ||
        // check if we're moving off screen at the top
        key_pressed == 'up' && this.y <= player_boundary_top ||
        // check if we're moving off screen at the bottom
        key_pressed == 'down' && this.y >= player_boundary_bottom) {
          // reset the distance
          this.distance_moved = 0;
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
    self.animate_player();
  });
  // draw a frame of the animation
  this.player_move(key_pressed);

};

Player.prototype.player_move = function(direction) {
/*
Moves the player sprite a set distance for one frame of a requestanimationframe
loop, based on the direction from the key press.
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
      tile_distance = tile_width;
      break;
    case 'up':
      // make negative because moving up in y position means subtracting pixels
      tile_distance = -Math.abs(tile_height);
      break;
    case 'down':
      tile_distance = tile_height;
      break;
    }

    // convert the unitless percentage speed into a speed in pixels
    speed_in_pixels = tile_distance * speed_per_frame;

    // increment the appropriate player x or y position (x:horizontal, y:vertical)
    if (direction == 'left' || direction == 'right') {
      this.x += speed_in_pixels;
    } else {
      this.y += speed_in_pixels;
    }

    // increment distance moved so far tracker with the absolute value of the speed
    this.distance_moved += Math.abs(speed_in_pixels);

};

//////////////////////////////////
//     INSTANTIATE OBJECTS      //
//////////////////////////////////

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

// counters for incrementing loops
var i;
var j;

// array to store all enemy instances
var allEnemies = [];
// pixel position adjustments for centering the sprite on the tile
var player_center_x_adjustment = 50;
var enemy_center_y_adjustment = 30;
// figure out number of rows to spawn enemies in
// subtract 3 for the water row and the 2 grass rows
var enemy_rows = rows - 3;
// y position value of the middle of the goal row, where player would be
var goal_row = -31;

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

/////////////////////////
// ENEMY INSTANTIATION //
/////////////////////////

// enemy spawning loop to fill the allEnemies array
for (i=0; i < enemy_rows; i+=1) {

  // find the last few rows because they will have more enemies
  // ceiling rounding to make more high difficulty rows
  last_rows = Math.ceil(enemy_rows/3);

  // check if the current row is one of the last for increased difficulty
  if (i < last_rows) {
    // set more enemies in current row if one of the last rows
    enemies_in_current_row = random_num_in_range(1, hard_max_enemies);
    // higher range for the enemy speed
    current_enemy_speed = Math.floor(random_num_in_range(150, 200));
  } else {
    // less possible enemies for regular rows
    enemies_in_current_row = random_num_in_range(1, easy_max_enemies);
    // standard enemy speed 50-180 px per sec
    current_enemy_speed = Math.floor(random_num_in_range(50, 180));
  }

  // calculate the enemy y position by getting the current row's pixel height
  // then subtracting pixels to center the enemy vertically in the row
  current_enemy_y_pos = (i+1) * tile_height - enemy_center_y_adjustment;
  // calculate evenly distributed pixel space between each enemy sprite
  space_between_enemies = cols * tile_width / enemies_in_current_row;

  // loop through number of enemies in the current row and set x,y positions for each
  for (j=0; j < enemies_in_current_row; j+=1) {
    // enemy x position determined by number of enemies spaced equally on the row
    // round it down to make a nice round integer for the position value
    current_enemy_x_pos = Math.floor(j * space_between_enemies);

    // construct the enemies for the current row and push to the allEnemies array
    allEnemies.push(
      new Enemy({x: current_enemy_x_pos, y: current_enemy_y_pos}, current_enemy_speed)
    );
  }
}

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
  y: (tile_height * rows) - (full_img_tile_height * 2/3)
};

// instantiate the player character
var player = new Player(player_start_position);

//////////////
// CONTROLS //
//////////////

// initialize a var to store the allowed key that was pressed by user
var key_pressed;
// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    // only run the animation if an allowed key was pressed
    if (e.keyCode in allowedKeys) {
      // set key_pressed to inputted keycode's corresponding human readable value
      key_pressed = allowedKeys[e.keyCode];

      // call the player movement animation which handles player movement
      // checks key_pressed value from this outer scope for movement direction
      requestAnimationFrame(function() {
        // passing this in anonymous function lets the correct context
        // of player be used instead of window
        player.animate_player();
      });
    }

});
