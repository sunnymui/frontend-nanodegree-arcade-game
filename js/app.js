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
// init delta time to make timing equal across different performing browsers
var dt;
// timer for collisions
var collision_timer = 0;

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

    // var to store the sprite img url to insert in settings
    var sprite_img;
    // check for enemy type and assign appropriate settings for that enemy type
    switch (type) {
      case 'red bug':
        sprite_img = 'images/enemy-bug.png';
        // set bottom of hitbox to the bottom of the actual sprite art
        this.hitbox_bottom_edge = 139;
        break;
    }

    // settings object to set the basics of each enemy instance
    var settings = {
      // image url location for this enemy
      sprite: sprite_img,
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
      this.default_sprite_img = 'images/char-boy.png';
      this.collision_img = 'images/char-boy-hit.gif';
      break;
  }

  var settings = {
    // image url location for this enemy
    sprite: this.default_sprite_img,
    position: start_position,
    // set the size for the hitbox used for collision detection
    size: {
      width: 50,
      height: 60
    }
  };
  // create player class by calling entity class, resetting that this to player this
  Entity.call(this, settings);

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
  // invulnerability flag to disable collisions
  this.invulnerable = false;

};
// delegate player prototype to entity prototype
Player.prototype = Object.create(Entity.prototype);
// set player constructor property to correct function instead of Entity
Player.prototype.constructor = Player;

// PLAYER FUNCTIONS

Player.prototype.update = function(dt) {

  this.check_status();

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

Player.prototype.collided = function(entity) {
  /*
  Does stuff to player object when a collision happens
  Args: entity(obj) - the entity that player collided with
  Return:
  */
    var counter = 0;
    var original_pos = this.y;
    console.log('COLLISION OH NO');

    if (entity instanceof Enemy) {
      console.log('and its an enemy!');
      // make player invulnerable temporarily to stop like 60 collisions/sec from happening
      this.invulnerable = true;
      // change sprite to collision sprite image
      this.sprite = this.collision_img;
    }

};

Player.prototype.check_status = function() {
  /*
  Check status conditions of the player instance and do appropriate things for each.
  */

  // INVULNERABILITY STATUS CONDITION

  // time limit for invulnerable state (in number of frames, typically 60/sec)
  var invulnerability_time_limit = 180;
  // check if player state is currently invulnerable
  if (this.invulnerable) {
    // increment the timer
    collision_timer += 1;
    // if the timer reaches the invulnerability time limit
    if (collision_timer >= invulnerability_time_limit) {
      console.log('invulnerable time limit reached');
      // rest the timer
      collision_timer = 0;
      // make player vulnerable again
      this.invulnerable = false;
      // this.sprite back to default
      this.sprite = this.default_sprite_img;
    }
  }


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
    allEnemies.push(
      new Enemy({x: current_enemy_x_pos,
                 y: current_enemy_y_pos,
                 // adding 2 to make the row grid start at 1 and skip the first goal row
                 row: i+2},
                current_enemy_speed,
                'red bug')
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
  y: (tile_height * rows) - (full_img_tile_height * 2/3),
  // adding 1 to make the row grid starting at 1
  row: rows
};

// instantiate the player character
var player = new Player(player_start_position, 'boy');
console.log(player.sprite);
console.log(player.default_sprite_img);

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
      // update player's current row position

      // call the player movement animation which handles player movement
      // checks key_pressed value from this outer scope for movement direction
      requestAnimationFrame(function() {
        // passing this in anonymous function lets the correct context
        // of player be used instead of window
        player.animate_player();
      });
    }

});
