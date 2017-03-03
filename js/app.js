// general game state setting data, sizes in pixels
var rows = 7;
var cols = 5;
var tile_width = 101;
// note: not actual height of the img, just the square 'above ground' part
var tile_height = 83;
// actual height of the tile png image
var full_img_tile_height = 171;
// gameplay field bounds for keeping the player from leaving the canvas
// adjustment factor of 114 to keep player sprite from going out of bounds
var play_boundary_bottom = rows * tile_height - 114;
// below 0 to adjust for our player sprite img having extra empty space on top
var play_boundary_top = -30;
// start boundary at 1 since our centered sprite cant really be perfectly centered
// on 101px wide tile so it has 1 extra pixel on the side
var play_boundary_left = 1;
// substract the width of a tile since sprite is centered on tiles, boundary
// is actually one less tile than the total width to account for 2 halves of
// tiles on the right and left side being effectively out of play
var play_boundary_right = cols * tile_width - tile_width;


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

/*
check if players move will move it out of the canvas bounds.

clamp(0,canvas.width)
should return the new position if legal otherwise keep the same position
*/

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
  // create the player class by calling the entity superclass
  Entity.call(this, settings);

  // initialize a move distance tracker for animating player movement
  this.distance_moved = 0;

};
// delegate player prototype to entity prototype
Player.prototype = Object.create(Entity.prototype);
// set player constructor prop to correct function instead of Entity
Player.prototype.constructor = Player;

Player.prototype.update = function(dt) {

};

// change all these player movement functions to be part of the player prototype
var distance_moved = 0;
function animate_player() {
  // check what kind of direction of movement was made
  var horizontal_move = key_pressed == 'left' || key_pressed == 'right';
  var vertical_move = key_pressed == 'up' || key_pressed == 'down';

  // check if the animation has completed moving a tile and stop it if so
  // check keypress type for appropriate distance/tile comparison
  if (horizontal_move) {
    // check if we've travelled 1 tile's width
    if (distance_moved >= tile_width) {
      // reset the distance
      distance_moved = 0;
      // exit animation function
      return;
    }
  } else if (vertical_move) {
    // check if we've travelled 1 tile's height
    if (distance_moved >= tile_height) {
      // reset the distance
      distance_moved = 0;
      // exit animation function
      return;
    }
  }

  // run recursive animation function and store id for canceling animation
  var request_id = requestAnimationFrame(animate_player);
  // draw a frame of the animation and pass in the request id
  // player_animate_a_frame();
  player_move(key_pressed);

}

function player_move(direction) {
  /*
  Moves the player sprite a set distance based on the direction.
  */
  var position;
  var tile_distance;
  var move_amount_per_frame = 1/3;
  var speed;

  // set the movement
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

    speed = tile_distance*move_amount_per_frame;

    // increment the appropriate player x or y position (x:horizontal, y:vertical)
    if (direction == 'left' || direction == 'right') {
      player.x += speed;
    } else {
      player.y += speed;
    }

    // increment distance moved so far tracker with the absolute value of the speed
    distance_moved += Math.abs(speed);

}


// testing the value of this
Player.prototype.test = function() {
  console.log(this);
  this.test2();
};

Player.prototype.test2 = function() {
  console.log(this);
};


function player_animate_a_frame() {

  switch(key_pressed) {
    case 'left':
      if (distance_moved < tile_width) {
        player.x -= tile_width/3;
        distance_moved += tile_width/3;
      }
      break;
    case 'up':
      if (distance_moved < tile_height) {
        player.y -= tile_height/3;
        distance_moved += tile_height/3;
      }
      break;
    case 'right':
      if (distance_moved < tile_width) {
        player.x += tile_width/3;
        distance_moved += tile_width/3;
      }
      break;
    case 'down':
      if (distance_moved < tile_height) {
        player.y += tile_height/3;
        distance_moved += tile_height/3;
      }
      break;
  }
}

// listen for/let keys control player movement on the screen
Player.prototype.handleInput = function(key) {
  switch(key) {
    case 'left':
      this.x = clamp(this.x - tile_width, play_boundary_left, play_boundary_right);
      break;
    case 'up':
      this.y = clamp(this.y - tile_height, play_boundary_top, play_boundary_bottom);
      break;
    case 'right':
      this.x = clamp(this.x + tile_width, play_boundary_left, play_boundary_right);
      break;
    case 'down':
      this.y = clamp(this.y + tile_height, play_boundary_top, play_boundary_bottom);
      break;
  }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

// pixel position adjustments for centering the sprite on the tile
var player_center_x_adjustment = 50;
var enemy_center_y_adjustment = 30;

// figure out number of rows that need enemies spawned in
// subtract 3 for the water row and the 2 grass rows
var enemy_rows = rows - 3;
var enemy_row_y_positions = [];
for (var i=0; i <= enemy_rows.length; i+=1) {
  // multiply i+1 (+1 accounts for the first 'goal' row we skip over)
  //
  enemy_row_y_positions.push((i+1)*tile_width);
}
// array to store all enemy instances
var allEnemies = [];

// loop and create bunch of enemies with varying positions on the different
// road tile rows

// spawn enemies onto the map
allEnemies.push(new Enemy({x: 1 * tile_width, y: 1 * tile_height - enemy_center_y_adjustment}, 1));

// instantiate the player character
var player = new Player({
  // start the player in the middle tile by finding horizontal center pixel value
  // adjust sprite to center it since it aligns position based on the edge of the img
  x: (tile_width * cols) / 2 - player_center_x_adjustment,
  // start the player at the bottom of the rows, adjust position to center sprite
  // feet on the tile 'ground', adjustment is just to get a perfect centering
  y: (tile_height * rows) - (full_img_tile_height * 2/3)
});

player.test();

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
var key_pressed;
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };
    key_pressed = allowedKeys[e.keyCode];
    console.log(key_pressed);

    //player.handleInput(key_pressed);
    // only run the animation if an arrow key was pressed
    if (key_pressed) {
      requestAnimationFrame(animate_player);
    }


});
