// general game setting state data, sizes in pixels
var rows = 6;
var cols = 5;
var tile_width = 101;
// note: not actual height of the img, just the square 'above ground' part
var tile_height = 83;
var player_adjustment = 10;
var enemy_adjustment = 30;

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
  Entity.call(this, settings);
  console.log(settings);

};
// delegate player prototype to entity prototype
Player.prototype = Object.create(Entity.prototype);
// set player constructor prop to correct function instead of Entity
Player.prototype.constructor = Player;

Player.prototype.update = function(dt) {

};

// listen for/let keys control player movement on the screen
Player.prototype.handleInput = function(key) {
  switch(key) {
    case 'left':
      this.x -= tile_width;
      break;
    case 'up':
      this.y -= tile_height;
      break;
    case 'right':
      this.x += tile_width;
      break;
    case 'down':
      this.y += tile_height;
      break;
  }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

// array to store all enemy instances
var allEnemies = [];

// loop and create bunch of enemies with varying positions on the different
// road tile rows

// spawn enemies onto the map
allEnemies.push(new Enemy({x: 1 * tile_width, y: 1 * tile_height-enemy_adjustment}, 1));

// instantiate the player character
var player = new Player({
  // start the player in the middle tile
  x: (tile_width * cols) / 2 - 50,
  // start the player at the bottom of the rows, adjust position to center sprite
  // feet on the tile 'ground', adjustment is just to get a perfect centering
  y: ((tile_height * rows) - (tile_height*(2/3)) - 60)
});

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
