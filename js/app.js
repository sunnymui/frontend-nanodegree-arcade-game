// general game state setting data, sizes in pixels

// game state

// is game paused?
var paused = false;
// are we on the starting difficulty selection screen
var on_start_screen = true;
// is this the first level of the current game
var first_level = true;
// current difficulty, ranges from 0 to 3 for easy to very hard
var current_difficulty = 1;

// playing field and tile sizes
var rows = 7;
var cols = 7;

// width of sprite tiles
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
// initialize a var to store the allowed key that was pressed by user
var key_pressed;
// goal row player must reach to score
var goal_row = 1;
// y coordinate for the goal row position
var goal_row_y_pos = tile_height - (full_img_tile_height * 2/3);
// figure out number of rows that will hold enemies
// subtract 3 for the goal water row and the 2 grass rows
var enemy_rows = rows - 3;

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

// start screen ui and text

// tracker for selector animation and moved distance so far
var selector_moved_distance = 0;
// flag for if the selector is currently in motion
var selector_is_moving = false;

// object containing difficulty information
var difficulty = [{
    id: 1,
    label:'Easy',
    rows: 6,
    sprite: 'images/char-pink-girl.png'
  },{
    id: 2,
    label:'Normal',
    rows: 7,
    sprite: 'images/char-cat-girl.png'
  },{
    id: 3,
    label:'Hard',
    rows: 8,
    sprite: 'images/char-horn-girl.png'
  },{
    id: 4,
    label:'DIEHARD',
    rows: 12,
    sprite: 'images/char-princess-girl.png'
}];

// where to start placing start screen elements
var start_element_top_y_pos = 200;

// start screen title image dimensions
var title_width = 550;
var title_height = 250;

// text for various elements
var start_game_text = 'Press ENTER to Start Game';
var select_difficulty_text = 'Select Difficulty with ARROW Keys';

// game ui and messages

var popup_overlay_class = 'popup_overlay';
var popup_win_class = 'win';
var popup_game_over_class = 'game_over';
var popup_level_class = 'level';
var popup_level_class_on = popup_level_class +' on';
var secondary_popup_class = 'secondary';
// text to put in the win message displayed when the goal row is reached
var win_text_content = "You win, let's swim!";
// text to put in the game over message box
var game_over_text_content = 'Wipeout! Game Over Dude!';
var instruction_text_content = 'Press ENTER to Continue >';
// text for pause message
var pause_text_content = 'Paused';
var pause_sub_text_content = 'Press P to Unpause';

// score text
var score_label = 'SCORE ';
var score_text = '0';

// level text
var level_label = 'LEVEL ';
var level_text = '1';

// time in ms before the level popup is hidden
var level_popup_delay = 1200;

// some globalish vars for instantiation functions

// counters for incrementing loops
var i;
var j;

// animation vars

// counter for the crossfade animation to work in incrementing 0 to 1 to 0
var animation_fade_counter = 0;
// how many steps for the crossfade animation to have is pi
// divided by the # you want, determines how long the animation lasts
// and how many frames the animation has
var animation_fade_increase = Math.PI / 100;
// flag to track if transition animation is running
var animation_running = false;

// ================
// Utility functions
// ================

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

// ============================
// Entity Generation Functions
// ============================

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

  // init var to get the last rows which will have higher difficulty enemies
  var last_rows;
  // init var for number of enemies to generate in current row
  var enemies_in_current_row;
  // init vars for the current enemy horizontal and vertical position
  var current_enemy_x_pos;
  var current_enemy_y_pos;
  // enemy row position
  var current_enemy_row;
  // init var for enemy speed
  var current_enemy_speed;
  // init var for pixel margin between each enemy sprite in the row
  var space_between_enemies;
  // scale max allowed enemies with the number of columns
  var hard_max_enemies = Math.ceil(cols/2);
  // scale max enemies for easy rows also
  var easy_max_enemies = Math.ceil(cols/3);
  // regular enemy type
  var regular_enemy_type = 'red bug';
  // special enemy type setting
  var special_enemy_type = 'special';

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
      current_enemy_speed = Math.floor(random_num_in_range(120, 190));
    } else {
      // less possible enemies for regular rows
      enemies_in_current_row = random_num_in_range(1, easy_max_enemies);
      // lower range speed for enemies in these rows
      current_enemy_speed = Math.floor(random_num_in_range(60, 155));
    }

    // calculate the enemy y position by getting the current row's pixel height
    // then subtracting pixels to center the enemy vertically in the row
    // i+1 to skip spawning enemies in the top goal row
    current_enemy_y_pos = (i+1) * tile_height - enemy_center_y_adjustment;
    // calculate evenly distributed pixel space between each enemy sprite
    space_between_enemies = cols * tile_width / enemies_in_current_row;
    // row is i + 2 since rows start at 1 and we skip the goal row
    current_enemy_row = i + 2;

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
          row: current_enemy_row},
          regular_enemy_type,
          current_enemy_speed)
        );
      }
  }

  // generate special enemies

  // determine how many special enemies to generate, make it a bit rarer
  var number_of_special_enemies = Math.floor(random_num_in_range(1, enemy_rows-1));

  // generate specified number of special enemies
  for (i=0; i < number_of_special_enemies; i+=1) {
    // randomly select a row to have the special enemy within the enemy rows
    current_enemy_row = Math.floor(random_num_in_range(1, enemy_rows));
    // generate the x position somewhere in the canvas bounds
    current_enemy_x_pos = random_num_in_range(0, cols * tile_width);
    // generate the y position from the current enemy's row
    current_enemy_y_pos = current_enemy_row * tile_height - enemy_center_y_adjustment;
    // construct the special enemies and push to enemies array
    enemies_array.push(
      new Enemy({x: current_enemy_x_pos,
        y: current_enemy_y_pos,
        // add 1 to skip the goal row since row numbering starts at 1
        row: current_enemy_row + 1},
        special_enemy_type)
      );
    }

  return enemies_array;
}

function generate_pickups() {
  /*
  Construct randomly selected pickups/powerups on the enemy rows according to
  item drop rates. Note that this function acts like a dice roll--there's a chance
  no items will be generated.
  Args: na
  Return: na
  */
  // init var to store all the constructed pickup objects
  var pickups = [];
  // determine how many pickups to try generating
  var number_of_pickups = Math.floor(random_num_in_range(0, enemy_rows+4));
  // row location of pickup
  var pickup_row;
  // column location of pickup
  var pickup_col;
  // init vars for pickup position coordinates
  var pickup_x_pos;
  var pickup_y_pos;

  // generate specified number of special enemies
  for (i=0; i < number_of_pickups; i+=1) {
    // randomly select a row place the pickup in the enemy rows
    pickup_row = Math.floor(random_num_in_range(1, enemy_rows));
    // randomly select a col to place the pickup in
    pickup_col = Math.floor(random_num_in_range(1, cols));
    // generate the x position somewhere in the canvas bounds
    pickup_x_pos = pickup_col * tile_width;
    // generate the y position from the current enemy's row
    pickup_y_pos = pickup_row * tile_height;
    // construct the pickup and push to pickup array
    pickups.push(
      new Pickup({x: pickup_x_pos,
        y: pickup_y_pos,
        // add 1 to skip the goal row
        row: pickup_row+1,
        col: pickup_col+1})
      );
  }

  // remove pickups that are in the same space as other pickups
  // length-1 because the last item won't have a next item to compare
  for (i = 0; i < pickups.length-1; i+=1 ) {
    // inner loop to compare current element with next element
    for (j = 0; j < pickups.length-1; j+=1) {
      // if row and col are equal for both elements they are in the same spot
      if (pickups[i].row === pickups[j+1].row && pickups[i].col === pickups[j+1].col) {
        // remove the element from the pickups array
        pickups.splice(i,1);
      }
    }
  }

  return pickups;
}

function generate_ui() {
  /*
  Generates the game chrome/ui like score tracker, level counter, etc.
  Args: na
  Return: na
  */
  // obj literal to store all the ui things that will be manipulated
  var ui_elements = {};

  // init array for each life heart entity
  ui_elements.lives = [];
  // create the life counter
  for (i = 0; i < player.lives; i += 1) {
    ui_elements.lives.push(
      new Entity({
        // create the sprite for the lives graphic
        sprite: new Sprite('images/Heart-map.png',
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
          // top of the canvas
          y: 0
        }
      })
    );
  }

  // create game score tracker

  ui_elements.game_ui_score = new Entity({
      position: {
        // position them spaced apart in a row
        x: canvas_width,
        // top of the canvas
        y: 33
      },
      text: score_label + score_text,
      font: 'bold 27px Arial',
      stroke_text: true,
      text_align: 'right'
  });

  // create the level tracker

  ui_elements.game_ui_level = new Entity({
    position: {
      // position them spaced apart in a row
      x: 110,
      // top of the canvas
      y: 33
    },
    text: level_label + level_text,
    font: 'bold 27px Arial',
    font_color: 'rgba(131, 131, 131, 0.54)'
  });

  // create controls text instructions

  ui_elements.instructions = new Entity({
      position: {
        // position them spaced apart in a row
        x: canvas_width/2,
        // bottom of the canvas
        y: canvas_height - 5
      },
      text: 'Movement: Arrow Keys ←↑↓→  -  Pause: P  -  Continue: Enter',
      font: '18px Arial',
      font_color: '#444',
      text_align: 'center'
  });

return ui_elements;
}

// ============================
// General Game Functions
// ============================

function animate_selector_move() {
/*
Animates the selector sprite on the start screen when keyboard input
has been taken in the outer scope. Didn't pass it as an arg b/c
requestanimationframe keeps a function from being passed with args.

Args: na, but depends on key_pressed (string) being defined in outer scope
Return: na
*/
  // how fast the selector should move per frame
  var speed = difficulty_x_padding/4;

  // move left by substracting x in the amount items are spaced apart
  if (key_pressed === 'left') {
    // add to the moved distance tracker
    selector_moved_distance += speed;
    // move left by substracting x in the amount items are spaced apart
    selector.x = clamp(selector.x - speed, difficulty_x_min_border, difficulty_x_max_border);
  } else if (key_pressed === 'right') {
    // add to the moved distance tracker
    selector_moved_distance += speed;
    // move right by adding to x in the amount items are spaced apart
    selector.x = clamp(selector.x + speed, difficulty_x_min_border, difficulty_x_max_border);
  }
  // exit out when we've moved distance to the next difficulty label
  if (selector_moved_distance >= difficulty_x_padding) {
    // reset moving and moved distance tracker
    selector_is_moving = false;
    selector_moved_distance = 0;

    // set corresponding current difficulty to movement direction
    if (key_pressed === 'left') {
      // set the current difficulty to the corresponding value
      current_difficulty = clamp(current_difficulty-1, 0, 3);
    } else if (key_pressed === 'right') {
      // set current difficulty to corresponding value
      current_difficulty = clamp(current_difficulty+1, 0, 3);
    }
    // exit animation
    return;
  }
  requestAnimationFrame(animate_selector_move);
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
  // regenerate pickups
  pickups = generate_pickups();
  // if game over reset the lives sprites too
  if(player.game_over) {
    // reset player position and stats, but also reset game over stats
    player.reset(true);
    // loop through the lives array to reset the sprites
    for (i=0; i < ui.lives.length; i+=1) {
      // reset back to the full life sprite in the map
      ui.lives[i].sprite.pos = [0, 0];
    }
  } else {
    // move player back to start and reset condition
    player.reset();
  }
  // update the rendered level text displayed
  ui.game_ui_level.text = level_label + player.current_level;
  // update the rendered score text displayed
  ui.game_ui_score.text = score_label + player.score;

}

function toggle_message(settings) {
  /*
  Toggles the winner message overlay popup.
  Args: css class for the specific type of message (string)
  text string to put in the main message text (string),
  whether the standard subtext should be included (boolean),
  whether this is a secondary level popup (boolean)
  Return: none;
  */
  // on class to show popup
  var on_class = ' on';
  // show class is the container class with the on class added
  var show_class = settings.container_class + on_class;

  // check if this is the secondary popup
  if (!settings.secondary) {
    // set popup text to appropriate message content
    box_message.textContent = settings.message_text;
    // if no subtext parameter is true clear out the instruction text
    if (settings.no_subtext) {
      sub_message.textContent = '';
    } else {
      // add the sub text in
      sub_message.textContent = instruction_text_content;
    }

    // set current popup container class to passed in class if not set
    // and/or toggle popup visibility by adding on class
    if (box_container.className !== show_class) {
      // set container to the on class
      box_container.className = show_class;
      // if its a different class or more than just the single class expected
    } else {
      // make popup invisible by removing the on class
      box_container.className = settings.container_class;
    }
  } else {
    // show the secondary box popup
    // if class isn't equal to on class
    if (secondary_box_container.className !== show_class) {
      // set container to the on class
      secondary_box_container.className = show_class;
      // if its a different class or more than just the single class expected
    } else {
      // remove the on class
      secondary_box_container.className = settings.container_class;
    }
  }

}

function fade_out_rebuild_fade_in(back_to_start) {
  /*
  Sets the canvas opacity to 0 to it becomes transparent. Depends on
  a CSS3 transition style to be defined for the animation heavy lifting.
  Also rebuilds the game world and fades back in after a set time.
  Args: back_to_start (boolean) - whether we're going back to start screen
  Returns: na
  */
  // how long to wait until the fade in function is run
  var fade_back_in_wait_time = 1000;

  // set canvas opacity to 0 to let css transition it out
  canvas.style.opacity = 0;
  // wait 1s since that's how long our css transition time is
  setTimeout(function(){
    // toggle start screen flag, back to start from in game or off otherwise
    on_start_screen = !on_start_screen;
    if (back_to_start) {
      // build start screen size world
      rebuild_world(true);
    } else {
      // build the game world with selected difficulty
      rebuild_world();
    }
    // fade game canvas back in
    fade_in();
    // show the level indicator at start of first level
    if (player.current_level === 1 && !on_start_screen){
      // toggle message on
      toggle_message({container_class: popup_level_class,
                      message_text: ui.game_ui_level.text,
                      no_subtext: true});
      // toggle first level flag so this doesn't show again
      first_level = false;
      setTimeout(function() {
        // only switch level popup if it still is the level popup
        if (box_container.className === popup_level_class_on) {
          // wait before toggling message off
          toggle_message({container_class: popup_level_class,
                          message_text: ui.game_ui_level.text,
                          no_subtext: true});
        }
      }, level_popup_delay);
    }
  }, fade_back_in_wait_time);
}

function fade_in() {
  /*
  Sets the canvas opacity back to non transparent so the css transition
  can work its animation.
  Args: na
  Return: na
  */
  // set opacity back to full to allow css transition to work
  canvas.style.opacity = 1;
}

function crossfade_canvas_and_reset() {
  /*
  Fade's the canvas elements out then back in again. Resets the level when
  the canvas is transparent then fades everything back in and displays a
  current level popup.
  Args: na
  Return: na
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
    // don't show level indicator after transitioning back to start screen
    if (!on_start_screen) {
      // show the current level message
      toggle_message({container_class: popup_level_class,
                      message_text: ui.game_ui_level.text,
                      no_subtext: true});
      setTimeout(function() {
        // only hide the popup if it's still the level popup
        if (box_container.className === popup_level_class + ' on') {
          // make it go away after a bit
          toggle_message({container_class: popup_level_class,
                          message_text: ui.game_ui_level.text,
                          no_subtext: true});
        }
      }, level_popup_delay);
    }
    animation_running = false;
    // exit the animation
    return;
  }

  // run recursively
  requestAnimationFrame(crossfade_canvas_and_reset);
}

function pause_toggle() {
  /*
  Toggles the pause flag off and on. If it's false it switches to true, if true
  it switches to false.
  Args: na
  Return: na
  */
  // simple boolean toggler for paused flag
  paused = !paused;
  // show the secondary message popup for the pause message
  toggle_message({container_class: secondary_popup_class,
                  no_subtext: false,
                  secondary: true});

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
  // the sprite object and settings for the visuals of this entity
  this.sprite = settings.sprite;
  // these coordinates determine location, default is top left corner
  this.x = settings.position.x || 0;
  this.y = settings.position.y || 0;
  // the width of the image sprite, including empty space, used for hitbox calc
  this.img_width = settings.img_width || tile_width;
  // set size for collision detection functions if defined
  if (typeof settings.size !== 'undefined') {
    this.width = settings.size.width;
    this.height = settings.size.height;
  }
  // settings for text rendering if this is a text entity
  if (typeof this.sprite === 'undefined') {
    // actual text content of the text
    this.text = settings.text || '';
    // whether it should have a stroke or not
    this.stroke_text = settings.stroke_text || false;
    // font and font size
    this.font = settings.font || 'bold 24px Arial';
    // font color
    this.font_color = settings.font_color || 'black';
    // text stroke color
    this.stroke_color = settings.stroke_color || 'white';
    // text alignment
    this.text_align = settings.text_align || 'start';
    // blinking text
    this.blink = settings.blink || false;
    // blink time limit ie time between blinks
    this.blink_time_limit = 40;
    // blink timer
    this.blink_timer = 0;

  }
  // sets the horizontal position of the hitbox within the sprite img,
  // basically how far in px from the left edge of the image to put the hitbox
  this.hitbox_x = Math.floor(this.img_width/2) - this.width/2;
};

Entity.prototype.render = function() {
  // displays the entity on the canvas
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Entity.prototype.render_text = function() {
  // check if this is blinking text
  if (this.blink) {
    // add another count to the timer
    this.blink_timer += 1;
    // if blink timer is less than the time limit
    if (this.blink_timer < this.blink_time_limit) {
      // end the function early to not render the text
      return;
    } else if (this.blink_timer > this.blink_time_limit*2) {
      // if we've reached the blink time limit then reset timer
      // and let the text rendering continue unabated
      this.blink_timer = 0;
    }
  }
  // set the text styles
  ctx.fillStyle = this.font_color;
  ctx.font = this.font;
  // align the text according to input settings
  ctx.textAlign = this.text_align;
  // if this is stroke text use the stroketext drawing functions
  if (this.stroke_text) {
    ctx.strokeStyle = this.stroke_color;
    ctx.lineWidth = 3;
    // do the actual drawing
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
  } else {
    // draw regular text
    ctx.fillText(this.text, this.x, this.y);
  }
};

Entity.prototype.update = function(dt) {
  // update the sprite for any animations
  this.sprite.update(dt);
};

/////////////////////////
//   ENEMY SUBCLASS    //
/////////////////////////

// Enemies our player must avoid
var Enemy = function(start_position, type, speed) {
/*
Constructor for the Enemy subclass, built on top of the Entity superclass.
Args: start_position (object) - obj literal containing {x:, y:} location info
      speed (number) - speed that this enemy should move across the canvas at
      type (string) - name of the type of enemy to get specific settings for it
Return: Constructed Enemy instance (object)
*/

    // set the default height to 50 for most enemies
    var default_height = 50;
    // set default height to 100 for most enemies
    var default_width = 100;
    // default sprite image width
    var default_img_width = tile_width;
    // default hitbox bottom edge
    var default_hitbox_bottom_edge = 139;
    // the type of enemy this will be
    this.type = type;

    // check for enemy type and assign appropriate settings for that enemy type
    switch (type) {
      case 'red bug':
        this.default_sprite_img = 'images/enemy-bug.png';
        // define speed of animated movement for this enemy instance
        this.speed = speed;
        break;
      case 'special':
        // array with the special enemy types
        var special_types = [
          'slow bug',
          'reverse bug',
          'fat bug'
        ];
        // randomly select a special enemy to generate
        this.type = special_types[Math.floor(random_num_in_range(0,special_types.length))];
        // set enemy properties based on special type
        // slow bug moves sloooooooow
        if (this.type === 'slow bug') {
          this.default_sprite_img = 'images/slow-bug.png';
          // make it slow
          this.speed = Math.floor(random_num_in_range(25, 70));
        // reverse bug moves in the opposite direction
        } else if (this.type === 'reverse bug') {
          this.default_sprite_img = 'images/reverse-bug.png';
          // negative speed to go in reverse
          this.speed = Math.floor(random_num_in_range(-100, -140));
        // fat bug has a larger sprite/hitbox
        } else if (this.type === 'fat bug') {
          this.default_sprite_img = 'images/fat-bug.png';
          // a little slow
          this.speed = Math.floor(random_num_in_range(50, 70));
          // heighten the hitbox
          default_hitbox_bottom_edge = 160;
          // set a bigger default height
          default_height = 90;
          // bigger default_width;
          default_width = 154;
          // bigger default img width
          default_img_width = 155;
        }
        break;
    }

    // settings object to set the basics of each enemy instance
    var settings = {
                        // image url location for this enemy
      sprite: new Sprite(this.default_sprite_img,
                        // where to start in the sprite map
                         [0,0],
                         // dimensions of visible portion to take from sprite map
                         [default_width, full_img_tile_height]),
      // a data object with the x, y coordinates, and row
      position: start_position,
      // size of hitbox for collision detection
      size: {
        width: default_width,
        height: default_height
      },
      // width of the
      img_width: default_img_width
    };

    // delegate settings to the Entity superclass
    Entity.call(this, settings);

    // the row # the enemy is in (starting at 1 at top, 2 for row below, etc)
    this.row = start_position.row;
    // calculate the top y position of the hitbox upwards using the height
    this.hitbox_y = default_hitbox_bottom_edge - this.height;
};
// set the enemy prototype equal to an instance of the Entity's prototype
Enemy.prototype = Object.create(Entity.prototype);
// set constructor property to correct constructor since it still points to Entity
Enemy.prototype.constructor = Enemy;

// Update the enemy's position, required method for
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // move the enemy sprite across the row
    this.animate_move();
};

Enemy.prototype.animate_move = function() {
  /*
   animate enemy moving across the screen according to type
   increment the horizontal position of the sprite, use delta time to keep
   movement consistent across devices.
   Args: na
   Return: na
  */
  // adjust speed by delta time to account for performance differences
  this.x += this.speed*dt;

  // exclude special cases from the standard enemy offscreen check
  if (this.type !== 'reverse bug' && this.type !== 'fat bug') {
    // check if sprite moved all the way across screen and out of visible canvas
    if (this.x > canvas_width + 100) {
      // reset position back to the beginning but start off screen
      this.x = -100;
    }
  }
  // reverse bug has reversed off screen checking since it goes the other way
  else if (this.type === 'reverse bug' && this.x < -100) {
    this.x = canvas_width + 100;
  }
  // fat bug has larger offscreen boundaries since the img is larger
  else if (this.type === 'fat bug' && this.x > canvas_width + 150) {
    this.x = -155;
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
  // player lives, player starts out with this
  this.lives = 3;
  // max amount of lives player can have
  this.max_lives = 3;
  // min amount of lives, player loses when they hit this number
  this.min_lives = 0;
  // number of games finished without getting hit once
  this.streak = 0;
  // current level player is on
  this.current_level = 1;
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
  // flag for frozen status condition
  this.frozen = false;
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
    goal_limit: 1400,
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
  // since request animation frame has window as the context
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
    // run winning functions and set the player stats
    this.execute_win();
  }

};

Player.prototype.execute_win = function() {
  /*
  Executes all of the functions, messages, and setting of stats, etc when player
  has won or beat a level.
  Args: na
  Return: na
  */
  // make player invulnerable
  this.invulnerable = true;
  // toggle goal reached flag
  this.goal_reached = true;
  // add points to the player's score
  this.score += 10;
  // update the game score tracker
  ui.game_ui_score.text = score_label + this.score;
  // increment the current level
  this.current_level += 1;
  // immobilize the player
  this.immobile = true;
  // reset sprite in it's in the collision animation
  this.reset_sprite();
  // change the sprite to goal animation
  this.set_win_sprite();
  // show the winner message
  toggle_message({container_class: popup_win_class,
                  message_text: win_text_content});

  // if the player had a perfect game of not getting hit once
  if (this.collision_count === 0) {
    // add to the streak counter
    this.streak += 1;
  } else {
    // reset the collision counter for the next game if they got hit this round
    this.collision_count = 0;
  }

};

Player.prototype.reset = function(game_over) {
  /*
  Reset the player position and status in prep for a new level.
  Args: whether this is a game over player reset, or just regular reset
        (boolean), default is falsey (undefined) aka regular reset.
  Return: na
  */
  // reset the player's x and y position to the starting positin
  this.x = player_start_position.x;
  this.y = player_start_position.y;
  // reset the row tracker
  this.row = player_start_position.row;
  // reset player invulnerability
  this.invulnerable = false;
  // reset goal reached flag
  player.goal_reached = false;
  // reset player sprite
  this.reset_sprite();
  // resets additional stuff if it's a game over player reset
  if (this.game_over) {
    // reset player lives
    this.lives = this.max_lives;
    // reset the current level
    this.current_level = 1;
    // reset game over flag
    this.game_over = false;
    // reset streak counter
    this.streak = 0;
    // reset the score
    this.score = 0;
    // no more first level

  }
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
      // increment the current game collision count
      this.collision_count += 1;
      // decrement the player's health/life counter
      this.lives = clamp(this.lives - 1, this.min_lives, this.max_lives);
      // change the the lives sprite map to display a lost life
      // selects the last life sprite and changes the sprite map pos
      // to show the empty life sprite
      ui.lives[this.lives].sprite.pos = [tile_width, 0];
      console.log('lives sprite changed should be');
      // trigger game over if player got hit with no lives left
      if(this.lives === this.min_lives) {
        // show the death animation
        this.set_game_over_sprite();
        // show the game over message
        toggle_message({container_class: popup_game_over_class,
                        message_text: game_over_text_content});
        // set player status to game over
        this.game_over = true;
        // freeze the player and prevent further collisions
        this.invulnerable = true;
        this.immobile = true;
        // prevent typical collision behavior by exiting function
        return;
      }
      // toggle frozen flag if we hit a slow bug
      if (entity.type === 'slow bug') {
        this.frozen = true;
      }
      // set enemy-player collision flag to true since we player got hit
      this.enemy_collided = true;
      // make player invulnerable temporarily to stop 60 collisions/sec from happening
      this.invulnerable = true;
      // stop player from being able to move
      this.immobile = true;
      // change sprite to collision sprite image animation for corresponding thing
      this.set_collision_sprite(entity.type);
    }

    if (entity instanceof Pickup) {
      switch (entity.type) {
        case 'blue gem':
          // add points to player score
          this.score += 2;
          break;
        case 'green gem':
          this.score += 5;
          break;
        case 'orange gem':
          this.score += 10;
          break;
        case 'heart':
          // add a life to the player life bar
          this.lives = clamp(this.lives + 1, this.min_lives, this.max_lives);
          // make the corresponding heart sprite back to full
          ui.lives[this.lives-1].sprite.pos = [0, 0];
          break;
        case 'key':
          // prevent edge case of enemy collision at 1 life when also getting key
          if (!this.game_over){
            // cache ref to this as self for use in requestAnimationFrame
            var self = this;
            // set distance moved to completion of player move so movement stops
            this.distance_moved = full_img_tile_height;
            // animate flying to goal row coordinates
            requestAnimationFrame(function(){
              self.fly_to_goal();
            });
            // instant victory for player
            this.execute_win();
          }
          break;
      }
      // update the game score tracker
      ui.game_ui_score.text = score_label + this.score;
      // get the index of the current entity
      var pickup_index = pickups.indexOf(entity);
      // remove the pickup from the pickups array
      pickups.splice(pickup_index, 1);
    }

};

Player.prototype.fly_to_goal = function() {
  /*
  Make's player sprite fly on over to the center of the screen in the
  goal row in an animated manner.
  Args: na
  Return: na
  */
  // how fast player sprite will fly to goal row
  var speed = 20;
  // store reference to this as this Player instance in the outer scope
  // since request animation frame has window as the context
  var self = this;

  // exit animation when we've reached the goal row
  if (this.x === center_tile && this.y === goal_row_y_pos) {
    return;
  }

  // move player horizontally towards the center tile position
  if (this.x > center_tile) {
    // move player to the left if they're too far right
    this.x = clamp(this.x - speed, center_tile, canvas_width);
  } else {
    // move player to the right if the're too far left
    this.x = clamp(this.x + speed, player_boundary_left, center_tile);
  }

  // move player towards the goal row
  this.y = clamp(this.y - speed, goal_row_y_pos, canvas_height);

  // run animation recursively
  requestAnimationFrame(function() {
    self.fly_to_goal();
  });

};

Player.prototype.set_collision_sprite = function(type) {
  /*
  Changes the player sprite to the collision animation sprite
  Args: entity type (string) - kind of enemy so we can use the right sprites
  Return: na
  */
  // set speed of animation, higher numbers = slower animation
  this.sprite.speed = 1;
  // if slow type enemy we're colliding with
  if (type == 'slow bug') {
    // use the freeze animation sprite row in the map
    this.sprite.pos = [0,342];
  }
  // sets the regular sprites in the map to use as animation frames
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
  this.sprite.speed = 3;
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
  Immmobility should be a little shorter than invulnerable to give player time
  to move.
  */

  //// STATUS CONDITIONS ////

  // ENEMY COLLIDED WITH PLAYER

  var invulnerable_time_limit = this.timers.invulnerability_limit;
  var immobile_time_limit = this.timers.immobile_limit;

  // check if an enemy collided with player
  if (this.enemy_collided) {
    // increment collision timer
    this.timers.collision += 1;

    // FROZEN

    if (this.frozen) {
      // increase the status condition time
      invulnerable_time_limit = immobile_time_limit*3;
      immobile_time_limit *= 2.6;
    }

    // INVULNERABLE

    // if the timer reaches the invulnerability time limit
    if (this.timers.collision >= invulnerable_time_limit) {
      // reset the timer
      // this.timers.collision = 0;
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
    if (this.timers.collision >= immobile_time_limit && !this.goal_reached && !this.game_over) {
      // let player move again
      this.immobile = false;
      // remove frozen status condition if player is frozen
      this.frozen = false;
    }

    if (this.timers.collision >= invulnerable_time_limit) {
      this.timers.collision = 0;
    }
  }

};

/////////////////////////
//   PICKUP SUBCLASS   //
/////////////////////////

// Enemies our player must avoid
var Pickup = function(start_position) {
/*
Constructor for the Pickup subclass, built on top of the Entity superclass.
Args: start_position (object) - obj literal containing {x:, y:} location info
Return: Constructed Pickup instance (object)
*/

    // set the default height for the hitbox
    var default_height = 100;
    // set default width for the hitbox
    var default_width = tile_width;
    // scale size of the actual rendered sprite visuals
    var scaled_img_width = tile_width*0.7;
    var scaled_img_height = full_img_tile_height*0.7;
    // default sprite image width
    var default_img_width = tile_width;
    // default hitbox bottom edge
    var default_hitbox_bottom_edge = 163;
    // adjust vertical position centering on tile, # of pixels from the top
    var center_y_adjustment = 5;
    // adjust horizontal position centering on tile, # of pixels from left
    var center_x_adjustment = 15;
    // array to hold pickups with matching drop rates to our random drop chance
    var possible_pickups = [];

    // pickup drop rates, higher numbers are more common/likely to be picked
    // scale is from 1 - 100, 1 being rarer, 100 being considered every time
    var pickup_drop_rates = {
      'blue gem': 50,
      'green gem': 60,
      'orange gem': 20,
      'heart': 40,
      'key': 100,
    };

    // generate random number for the drop chance to compare with the drop rate
    // chance determines rarity of item added, lower numbers are rarer
    var drop_chance = Math.floor(random_num_in_range(0,101));

    // compare generated drop chance to every item's drop rate
    for (var item in pickup_drop_rates) {
      // lower drop chance means selecting rarer items
      // check if generated drop chance matches or beats item's rarity/drop rate
      if (drop_chance <= pickup_drop_rates[item]) {
        // push item to possible pickups array for final selection of item
        possible_pickups.push(item);
      }
    }

    // select a single item at random from our possible pickups array
    this.type = possible_pickups[Math.floor(random_num_in_range(0, possible_pickups.length))];

    // check for Pickup type and assign appropriate settings for that Pickup type
    switch (this.type) {
      case 'blue gem':
        this.default_sprite_img = 'images/Gem Blue.png';
        break;
      case 'green gem':
        this.default_sprite_img = 'images/Gem Green.png';
        break;
      case 'orange gem':
        this.default_sprite_img = 'images/Gem Orange.png';
        break;
      case 'heart':
        this.default_sprite_img = 'images/Heart.png';
        // adjust to center the img
        center_y_adjustment = 22;
        center_x_adjustment = 22;
        // scale it down a little bit
        scaled_img_width *= 0.8;
        scaled_img_height *= 0.8;
        // move bottom edge of hitbox to account for smaller size
        default_hitbox_bottom_edge = 140;
        break;
      case 'key':
        this.default_sprite_img = 'images/Key.png';
        center_x_adjustment = 19;
        // smaller item, move the hitbox
        default_hitbox_botom_edge = 140;
        break;
    }

    // settings object to set the basics of each Pickup instance
    var settings = {
                        // image url location for this Pickup
      sprite: new Sprite(this.default_sprite_img,
                        // where to start in the sprite map
                         [0,0],
                         // dimensions of visible area in the sprite map
                         [tile_width,
                          full_img_tile_height,
                          // image scaling size settings
                          scaled_img_width,
                          scaled_img_height]),
      // a data object with the x, y coordinates, and row
      position: {
        x: start_position.x + center_x_adjustment,
        y: start_position.y + center_y_adjustment
      },
      // size of hitbox for collision detection
      size: {
        width: default_width,
        height: default_height
      },
      img_width: default_img_width
    };

    // delegate settings to the Entity superclass
    Entity.call(this, settings);

    // the row # the Pickup is in (starting at 1 at top, 2 for row below, etc)
    this.row = start_position.row;
    // the col # the pickup is in, starting at 1
    this.col = start_position.col;
    // calculate the top y position of the hitbox upwards using the height
    this.hitbox_y = default_hitbox_bottom_edge - this.height;

};
// set the Pickup prototype equal to an instance of the Entity's prototype
Pickup.prototype = Object.create(Entity.prototype);
// set constructor property to correct constructor since it still points to Entity
Pickup.prototype.constructor = Pickup;

//////////////////////////////////
//     INSTANTIATE OBJECTS      //
//////////////////////////////////

// Instantiate everything
// All enemy objects in an array called allEnemies
// Player object in a variable called player

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

/////////////////////////
// ENEMY INSTANTIATION //
/////////////////////////

// array to store all enemy instances
var allEnemies = generate_enemies();

//////////////////////////
// PICKUP INSTANTIATION //
//////////////////////////

// array to store all the pickup instances
var pickups = generate_pickups();

/////////////////////////
//   UI INSTANTATION   //
/////////////////////////

var ui = generate_ui();


/////////////////////////
// START INSTANTATION  //
/////////////////////////

// array to store all the start screen elements
var start_screen_elements = [];
// difficulty elements x position
var difficulty_x_pos = 0;
var difficulty_x_padding = 141;
var difficulty_x_min_border = difficulty_x_padding-tile_width/2;
var difficulty_x_max_border = (difficulty_x_padding*4)-tile_width/2;
// height of the tips sprite image
var demo_width = 500;
var demo_height = 175;

// instantiate the selector with a var for use in movement
var selector =  new Entity({
                  // create the sprite for the selector graphic
                  sprite: new Sprite('images/Selector.png',
                                     [0,0],
                                     // size settings array
                                     [tile_width,
                                      full_img_tile_height]),
                  position: {
                    // position selector at normal difficulty aka 2nd item
                    x: (difficulty_x_padding * 2) - tile_width/2,
                    y: start_element_top_y_pos+10
                  }
                });

// push selector element to start screen array
start_screen_elements.push(selector);

// generate the difficulty label elements
for (i = 0; i < difficulty.length; i += 1) {
  // horizontal space in between difficulty elements
  difficulty_x_pos += difficulty_x_padding;

  // push difficulty labels to start screen array
  start_screen_elements.push(
    new Entity({
        position: {
          x: difficulty_x_pos,
          y: start_element_top_y_pos+210
        },
        text: difficulty[i].label,
        text_align: 'center',
        font: 'bold 24px Arial',
        font_color: '#fff'
    })
  );

  // push difficulty characters to start screen array
  start_screen_elements.push(
    new Entity({
        // create the sprite for the character graphic
        sprite: new Sprite(difficulty[i].sprite,
                           [0,0],
                           // size settings array
                           [tile_width,
                            full_img_tile_height]),
        position: {
          x: difficulty_x_pos - tile_width/2,
          y: start_element_top_y_pos + 10
        }
    })
  );
}

start_screen_elements.push(
  new Entity({
    // create the sprite for the title graphic
    sprite: new Sprite('images/title.png',
                       // starting point in the sprite sheet
                       [0,0],
                       // size settings array
                       [title_width,
                        title_height],
                        // speed
                        6,
                        // frames array
                        range(0,18),
                        // direction of frames
                        'horizontal',
                        // play once
                        true,
                        // final frame
                        18),
    position: {
      // center the title
      x: canvas_width/2 - title_width/2,
      // move it above the top
      y: start_element_top_y_pos-230
    }
  })
);

// difficulty selection instruction text
start_screen_elements.push(
  new Entity({
        position: {
          x: canvas_width/2,
          y: start_element_top_y_pos+40
        },
        text: select_difficulty_text,
        text_align: 'center',
        font: '20px Arial',
        font_color: '#fff',
        stroke_text: true,
        stroke_color: '#000'
  })
);

// start game instruction text
start_screen_elements.push(
  new Entity({
    position: {
      x: canvas_width/2,
      y: start_element_top_y_pos+260
    },
    text: start_game_text,
    text_align: 'center',
    font: '20px Arial',
    font_color: '#fff',
    stroke_text: true,
    stroke_color: '#000',
    blink: true
  })
);

// instantiate the demo brotips area
start_screen_elements.push(
  new Entity({
    // create the sprite for the brotips graphic
    sprite: new Sprite('images/brotips.png',
                       // starting point in the sprite sheet
                       [0,0],
                       // size settings array
                       [demo_width,
                        demo_height],
                        // speed
                        20,
                        // frames array
                        range(0,81),
                        // direction of frames
                        'vertical'),
    position: {
      x: canvas_width/2-demo_width/2,
      y: start_element_top_y_pos+280
    }
  })
);

//////////////
// CONTROLS //
//////////////

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    // keyboard event keycodes for various game CONTROLS
    var p_key = 80;
    var enter_key = 13;
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    // p for pause as long as not goal reached or game over
    if (e.keyCode === p_key &&
       !player.goal_reached &&
       !player.game_over &&
       !on_start_screen) {
      // toggle the pause flag
      pause_toggle();
    }

    // enter key triggers level reset but not if animation is already running
    if(e.keyCode === enter_key && !animation_running) {

      // only trigger transition during the game over or goal reached phase
      if (player.goal_reached || player.game_over) {
        // turn flag for animation being run on
        animation_running = true;
        // initiate crossfade animation
        requestAnimationFrame(crossfade_canvas_and_reset);

        // on a win
        if (player.goal_reached) {
          // hide the win message overlay popup
          toggle_message({container_class: popup_win_class,
                          message_text: win_text_content});
        }

        // on a game loss
        if (player.game_over) {
          // toggle the message popup off
          toggle_message({container_class: popup_game_over_class,
                          message_text: game_over_text_content});
          // fade out canvas
          fade_out_rebuild_fade_in(true);
          // clear out any excess canvas bg
          ctx.clearRect(0,0,canvas_width, rows * tile_width);
        }
      }

      // if we're on a start menu screen allow exiting
      if (on_start_screen) {
        // fade out the canvas
        fade_out_rebuild_fade_in();
      }

    }

    // only run the animation if an allowed key was pressed
    // disallow keypress being passed to movement if immobile
    // or if already in a movement action so current move animation
    // completes instead of reversing midway
    if (e.keyCode in allowedKeys &&
       !player.immobile &&
       !player.moving &&
       !paused &&
       !selector_is_moving) {

      // set key_pressed to inputted keycode's corresponding human readable value
      key_pressed = allowedKeys[e.keyCode];

      // handle difficulty selector movement on start screen
      if (on_start_screen) {
        // toggle selector moving flag to true so we dont get midmove changes
        selector_is_moving = true;
        // animate the movement of the selector sprite
        requestAnimationFrame(animate_selector_move);
      } else {
        // call the player movement animation which handles player movement
        // checks key_pressed value from this outer scope for movement direction
        requestAnimationFrame(function() {
          // passing this in anonymous function lets the correct context
          // of player be used instead of window
          player.animate_player_move();
        });
      }
    }

});

// check if user tabs away from the window
document.addEventListener('visibilitychange', function() {
  // if tab is hidden and not already paused or the other endgame popups arent on
  if (document.hidden &&
      !paused &&
      !player.goal_reached &&
      !player.game_over &&
      !on_start_screen) {
    // pause the game
    pause_toggle();
  }
});
