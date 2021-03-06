/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */

// essentially creates a namespace for your game via the self executing function
// since everything else is defined within it
var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */

    // init some global setup vars
    var doc = global.document;
    var win = global.window;
    var lastTime;
    // var to store the rendered background img
    var background;
    var start_background;

    //////////////////////////////////////
    // DOM ELEMENT CREATION + INSERTION //
    //////////////////////////////////////

    // main content container creation

    // create a wrapper element for main
    var main_wrapper = doc.createElement('div');
    // assign class to wrapper
    main_wrapper.className = 'flex-fill-center';
    // create the main container element
    var main_container = doc.createElement('main');

    // append main container to main wrapper
    main_wrapper.appendChild(main_container);
    // get the footer element
    var main_footer = doc.getElementsByTagName('footer')[0];
    // append to the body in the dom before the footer
    doc.body.insertBefore(main_wrapper, main_footer);

    // canvas element creation

    var canvas = doc.createElement('canvas');
    var ctx = canvas.getContext('2d');
    // define canvas width using the number of columns
    canvas.width = cols * tile_width;
    // multiply by the width because tile height is only the 'above ground' art
    canvas.height = rows * tile_width;
    // append the created canvas element to the dom
    main_container.appendChild(canvas);

    // message popup overlay box creation

    create_message_popup_overlay();

    // create the onscreen controller keyboard

    // create onscreen mobile keyboard control container
    var onscreen_controls = create_on_screen_controls();
    // make onscreen controls div accessible globally
    global.onscreen_controls = onscreen_controls;
    // append onscreen controls to the main container
    main_container.appendChild(onscreen_controls);
    // get the toggle button div
    var toggle_button = doc.getElementsByClassName(toggle_key_class)[0];

    // add click handler to controls
    // check which child is the click target with handle key click function
    onscreen_controls.addEventListener('click', handle_key_click, false);

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now();
            dt = (now - lastTime) / 1000.0;

        if (on_start_screen) {
          // show the start screen
          start_screen();
        // only run if not currently paused
        } else if (!paused) {
          /* Call our update/render functions, pass along the time delta to
          * our update function since it may be used for smooth animation.*/

          update(dt);
          render();
        }

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    }

    function start_screen() {
      // render the background using the saved, prerendered background image data
      ctx.putImageData(start_background, 0, 0);
      // render start screen elements
      renderEntities(start_screen_elements);
    }

    function rebuild_world(back_to_start) {
      /*
      Rebuilds game world
      Args: back_to_start (boolean) - if going back to start screen reset height
      Return: na
      */
      if (back_to_start) {
        // set to default height for start screen
        rows = 7;
      } else {
        // reset the # rows to the corresponding current difficulty
        rows = difficulty[current_difficulty].rows;
      }
      // set starting player lives according to current difficulty
      player.lives = difficulty[current_difficulty].lives;
      // loop through lives sprites to match player lives
      for (i = 0; i < player.max_lives; i+=1) {
        // reset all lives sprites back to full before making changes
        ui.lives[i].sprite.pos = [0, 0];
        // only change to empty sprites for greater than the current player lives
        if (i > player.lives - 1) {
          // set to empty heart
          ui.lives[i].sprite.pos = [tile_width, 0];
        }
      }
      // set the canvas height to accomodate the new # of rows
      canvas.height = rows * tile_height + ui_height_spacer;
      // update the canvas_height var with new height
      canvas_height = canvas.height;
      // move instruction text to fit new canvas height
      ui.instructions.y = canvas.height - 5;
      // rerender the background
      renderBackground();
      // reset the enemy rows
      enemy_rows = rows - 3;
      // adjust bottom player boundary
      player_boundary_bottom = tile_height * (rows-1) - bottom_underground;
      // reposition player start on the new bottom row
      player_start_position = {
        x: center_tile,
        // start the player at the bottom of the rows, adjust position to center sprite
        // feet on the tile 'ground', adjustment is just to get a perfect centering
        y: (tile_height * rows) - (full_img_tile_height * 2/3),
        // adding 1 to make the row grid starting at 1
        row: rows
      };
      // set pickups game counter to 0
      player.pickups.game_total = 0;
      // avoid unnecesary level reset on start screen
      if (!back_to_start) {
        // regenerate the level
        level_reset();
      }
    }

    function init() {
    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
        lastTime = Date.now();
        // render background once to cache in the background var since it stays the same
        renderBackground();
        // render the start screen background
        renderBackground(true);
        main();

    }

    function update(dt) {
      /* This function is called by main (our game loop) and itself calls all
       * of the functions which may need to update entity's data.
       Args: delta time (number) - change in time from last frame
       Return: na
       */
        updateEntities(dt);
        checkCollisions();
    }

    function updateEntities(dt) {
      /* This is called by the update function and loops through all of the
       * objects within your allEnemies array as defined in app.js and calls
       * their update() methods. It will then call the update function for your
       * player object. These update methods should focus purely on updating
       * the data/properties related to the object. Do your drawing in your
       * render methods.
       */
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
        player.update(dt);
    }

    function renderBackground(is_start_screen) {
      /* This array holds the relative URL to the image used
       * for that particular row of the game level.
       */
      var rowImages = [
              'images/water-block.png',   // Top goal row is water
              'images/stone-block.png',   // Enemy zone rows are stone
              'images/grass-block.png',   // Player start zone rows are grass
          ],
          row, col;
      var safe_row = rows-2;

      /* Loop through the number of rows and columns we've defined above
       * and, using the rowImages array, draw the correct image for that
       * portion of the "grid"
       */
      for (row = 0; row < rows; row+=1) {
          for (col = 0; col < cols; col+=1) {
              /* The drawImage function of the canvas' context element
               * requires 3 parameters: the image to draw, the x coordinate
               * to start drawing and the y coordinate to start drawing.
               * We're using our Resources helpers to refer to our images
               * so that we get the benefits of caching these images, since
               * we're using them over and over.
               */
               if (is_start_screen) {
                 ctx.drawImage(Resources.get(rowImages[0]), col * tile_width, row * tile_height);
                 start_background = ctx.getImageData(0, 0, canvas.width, canvas.height);
               } else {
                 // draw the appropriate background tile by checking what row we're on
                 if (row === 0) {
                   // draw the water at the top
                   ctx.drawImage(Resources.get(rowImages[0]), col * tile_width, row * tile_height);
                 } else if (row < safe_row) {
                   // road in the middle
                   ctx.drawImage(Resources.get(rowImages[1]), col * tile_width, row * tile_height);
                 } else {
                   // grass on the bottom
                   ctx.drawImage(Resources.get(rowImages[2]), col * tile_width, row * tile_height);
                 }
                // save the background image data to avoid a complete redraw in every frame
                background = ctx.getImageData(0, 0, canvas.width, canvas.height);
               }
          }
      }

    }

    function render() {
      /* This function initially draws the "game level", it will then call
       * the renderEntities function. Remember, this function is called every
       * game tick (or loop of the game engine) because that's how games work -
       * they are flipbooks creating the illusion of animation but in reality
       * they are just drawing the entire screen over and over.
       */

        // render the background using the saved, prerendered background image data
        ctx.putImageData(background, 0, 0);

        // render the game interactive entities
        renderEntities(pickups);
        renderEntities(allEnemies);
        renderEntity(player);

        // render the game ui
        renderEntities(ui);
    }

    function renderEntities(list) {
      /* This function is called by the render function and is called on each game
       * tick. Its purpose is to then call the render functions you have defined
       * on your enemy and player entities within app.js
       */

      // render arrays of entities using a regular loop
      if (Array.isArray(list)) {
        for(i=0; i<list.length; i++) {
            renderEntity(list[i]);
        }
      // render object associative arrays of entities using for/in loop
      } else {
        for (var item in list) {
          // the current property in the object
          var current_item = list[item];
          // if property in object contains a sub-array
          if (Array.isArray(current_item)) {
            // loop through the subarray's entities to render each one
            for (i=0; i < current_item.length; i+=1) {
              // render current entity in the subarray
              renderEntity(current_item[i]);
            }
          } else {
            // otherwise render the current entity in the property
            renderEntity(current_item);
          }
        }
      }
    }

    function renderEntity(entity) {
        // save the context to preserve the positioning before translating the ctx
        ctx.save();
        // if entity is text
        if (!entity.sprite) {
          // use the regular render positioning system relative to the canvas
          // render the text at the current position
          entity.render_text();
        } else {
          // move rendering context to the entity position
          ctx.translate(entity.x, entity.y);
          // render the sprite at the current position
          entity.sprite.render(ctx);
        }
        // restore the context back to the regular positioning coordinates
        ctx.restore();
    }

    function checkCollisions() {
      /*
      High level manager of collision checking between player / collidable entities.
      Gets entities to check for collisions, filters close ones using canCollide,
      run the calc_hitbox_collision function on the player object and compares
      with every other entity we've selected. no projectiles or enemy on enemy
      collisions to deal with so we can just do player to entity comparisons
      Args: na
      Return: na
      */

      // var for the different arrays of entities to be checked by as collidable
      var entity_types = [];
      // check if player is invulnerable to cancel check for enemies
      if (player.invulnerable) {
        // make sure player is collidable
        if (player.collidable) {
          // only check pickup collisions
          entity_types = pickups;
        }
      } else {
        // create a new array by concatenating enemies and pickups
        entity_types = allEnemies.concat(pickups);
      }
      // array to hold all the entities to check for collisions
      var entities_to_check = canCollide(entity_types);

      // init vars for the current entity to check and collision happened check
      var current_entity;
      var collision_happened;

      // loop through the entities to check array
      for (i = 0; i < entities_to_check.length; i+=1) {
        // assign current entity to current array index element
        current_entity = entities_to_check[i];
        // compare player and entity hitbox locations to determine collision
        collision_happened = calc_hitbox_collision(player, current_entity);
        // if collision happened aka calc_hitbox_collision function returns true
        if (collision_happened) {
          // player collided function does all the animating and temp invulnerability
          player.collided(current_entity);
          // only one collision w/ something at a time for now so skip the rest
          break;
        }
      }

    }

    function canCollide(entity_array) {
      /*
      Checks if entities are close enough to the player for possible collision.
      If so, add it to the collidable objects array to be returned.
      Args: array of entity objects to check (array)
      Return: objects that player could possibly collide with (array)
      */
      var collidable_objects = [];
      // init vars to store current entity data
      var current_entity;
      var current_entity_row_pos;

      // loop entities array to find entity close enough to collide w/ player
      for (i=0; i < entity_array.length; i+=1) {
        // store current entity
        current_entity = entity_array[i];
        // store the current entity row position
        current_entity_row_pos = current_entity.row;

        // if current entity is in same row as the player
        if (current_entity_row_pos === player.row) {
          // add the entity to the collidable objects array
          collidable_objects.push(current_entity);
        }

        // check if player is moving to another row
        if (player.moving === true) {
          // if player is on the move, also need to check enemies in the destination row
          if (current_entity_row_pos === player.destination_row ) {
            // add entity to collidable objects array
            collidable_objects.push(current_entity);
          }
        }
      }

      return collidable_objects;
    }

    function calc_hitbox_collision(player, entity) {
    /*
    Calculate the hitbox corners of the player and the entity, then use those
    coordinates for the collision detection algorithm. The hitboxes aren't the
    same as where the images start, thus the adjustment.
    Args: player (object), entity (object) to compare with player hitbox
    Return: true if the hitboxes collide, false if no collision (boolean)
    */

        return collides(
          {
            // top right corner x coordinate
            x: player.x + player.hitbox_x,
            // top right corner y coordinate
            y: player.y + player.hitbox_y,
            // bottom left corner x coordinate
            r: player.x + player.hitbox_x + player.width,
            // bottom left corner y coordinate
            b: player.y + player.hitbox_y + player.height
          },
          {
            x: entity.x + entity.hitbox_x,
            y: entity.y + entity.hitbox_y,
            r: entity.x + entity.hitbox_x + entity.width,
            b: entity.y + entity.hitbox_y + entity.height
          }
        );
    }

    function collides(entity_1, entity_2) {
      /*
      Checks if any of the bounds of the first object are within the bounds of the
      second object by using their respective positions and the position of their
      top right and bottom left corners.
      Args: expects first object and second object to compare (obj, obj).
            each object requires this data -
            {
              x: x position on the left edge (integer),
              y: y position on top edge (integer),
              r: x position on the right edge (integer),
              b: y position on the bottom edge (integer),
            }
      Return: boolean,
              true if any of the bounds are within each other aka collision,
              false if not, aka no collision
      */
      return !(entity_1.r <= entity_2.x || entity_1.x > entity_2.r ||
             entity_1.b <= entity_2.y || entity_1.y > entity_2.b);
    }

    function create_message_popup_overlay() {
      /*
      Creates the message box popup overlay shown during triggering events.
      Examples: you win message and game over message
      args: na
      return: na
      */

      // create message box overlay container div
      var box_overlay = doc.createElement('div');
      // set container div class to win_overlay as default
      box_overlay.className = popup_overlay_class + ' ' + mobile_show_key_class;
      // create container for the popup content
      var box_container = doc.createElement('div');
      // set box container class to win content as default
      box_container.className = popup_win_class;
      // create an h1 for the text
      var box_message = doc.createElement('h1');
      // create an h3 for the subtitle message
      var sub_message = doc.createElement('h3');
      // create h4 for the rest of the information
      var other_message = doc.createElement('h4');
      // create the default text for the h1
      var box_text = doc.createTextNode(win_text_content);
      // create text content for the subttile message
      var sub_text = doc.createTextNode(instruction_text_content);
      // create high score text
      var high_score_text = doc.createTextNode(high_score_text_content);
      // create longest streak wins text
      var high_streak_text = doc.createTextNode(high_streak_text_content);
      // create current streak wins text
      var current_streak_text = doc.createTextNode(current_streak_text_content);
      // create current streak wins text
      var current_collision_text = doc.createTextNode(collision_text_content);
      // create pickups for collected/total text
      var pickups_total_text = doc.createTextNode(current_pickups_text_content);
      // create key pickup text
      var pickups_key_text = doc.createTextNode(pickups_key_text_content);
      // create heart pickups text
      var pickups_heart_text = doc.createTextNode(pickups_heart_text_content);
      // create gem pickups text
      var pickups_gem_text = doc.createTextNode(pickups_gem_text_content);

      // add the text to the h1 element
      box_message.appendChild(box_text);
      // add subtext to the subtitle h3 element
      sub_message.appendChild(sub_text);
      // add the h1 content to the popup container
      box_container.appendChild(box_message);
      // add the subheading to the popup container
      box_container.appendChild(sub_message);
      // add the other info element h4 to the popup container
      box_container.appendChild(other_message);
      // add the popup div to the larger overlay container
      box_overlay.appendChild(box_container);
      // append the win container div to the page
      main_container.appendChild(box_overlay);

      // create a secondary message container

      // create container for the secondary popup content
      var secondary_box_container = doc.createElement('div');
      // set box container class to win content as default
      secondary_box_container.className = secondary_popup_class;
      // create an h1 for the text
      var secondary_box_message = doc.createElement('h1');
      // create an h3 for the subtitle message
      var secondary_sub_message = doc.createElement('h3');
      // create the default text for the h1
      var secondary_box_text = doc.createTextNode(pause_text_content);
      // create text content for the subttile message
      var secondary_sub_text = doc.createTextNode(pause_sub_text_content);

      // add the text to the h1 element
      secondary_box_message.appendChild(secondary_box_text);
      // add subtext to the subtitle h3 element
      secondary_sub_message.appendChild(secondary_sub_text);
      // add the h1 content to the popup container
      secondary_box_container.appendChild(secondary_box_message);
      // add the subheading to the popup container
      secondary_box_container.appendChild(secondary_sub_message);
      // add the popup div to the larger overlay container
      box_overlay.appendChild(secondary_box_container);

      // make the message overlay globally accessible
      // need ability to change classes, content
      global.box_overlay = box_overlay;
      global.box_message = box_message;
      global.sub_message = sub_message;
      global.box_container = box_container;
      global.secondary_box_message = secondary_box_message;
      global.secondary_sub_message = secondary_sub_message;
      global.secondary_box_container = secondary_box_container;
      global.other_message = other_message;
      global.high_streak_text = high_streak_text;
      global.current_streak_text = current_streak_text;
      global.high_score_text = high_score_text;
      global.current_collision_text = current_collision_text;
      global.pickups_total_text = pickups_total_text;
      global.pickups_gem_text = pickups_gem_text;
      global.pickups_heart_text = pickups_heart_text;
      global.pickups_key_text = pickups_key_text;
    }

    function create_on_screen_controls() {
      /*
      Creates the dom elements for the on screen keyboard controls.
      */
      var keyboard = doc.createElement('div');
      var arrows;
      var inputs;

      // create a keyboard show/hide toggle button
      var toggle_button = doc.createElement('a');
      // set href
      toggle_button.href = "#";
      // add toggle keyboard class
      toggle_button.className = toggle_key_class;
      // add toggle button text
      toggle_button.textContent = toggle_key_text_content;
      // append the toggle button to the keyboard container div
      keyboard.appendChild(toggle_button);

      // append 2 ul's to the keyboard container div
      for (i=0; i < 2; i+=1) {
        keyboard.appendChild(doc.createElement('ul'));
      }

      // set references to each ul element for the arrows and input keys
      arrows = keyboard.childNodes[1];
      inputs = keyboard.childNodes[2];

      // assign respective classes to container and ul's
      keyboard.className = keyboard_class;
      arrows.className = arrows_class + ' ' + mobile_show_key_class +' ' + flex_wrap_class;
      inputs.className = inputs_class + ' ' + mobile_show_key_class +' ' + flex_wrap_class;

      // append 9 list item elements to the arrow keys ul
      for (i=0; i < 9; i+=1) {
        arrows.appendChild(doc.createElement('li'));
      }

      // set classes of the arrow keys
      arrows.childNodes[1].className = up_key_class+' '+flex_center_class;
      arrows.childNodes[3].className = left_key_class+' '+flex_center_class;
      arrows.childNodes[5].className = right_key_class+' '+flex_center_class;
      arrows.childNodes[7].className = down_key_class+' '+flex_center_class;

      // set text conetnt of arrow key li's
      arrows.childNodes[1].textContent = up_key_text_content;
      arrows.childNodes[3].textContent = left_key_text_content;
      arrows.childNodes[5].textContent = right_key_text_content;
      arrows.childNodes[7].textContent = down_key_text_content;

      // append 3 list items to the input keys ul
      for (i=0; i<3; i+=1) {
        inputs.appendChild(doc.createElement('li'));
      }

      // set classes of input keys
      inputs.childNodes[0].className = m_key_class+' '+flex_center_class;
      inputs.childNodes[1].className = p_key_class+' '+flex_center_class;
      inputs.childNodes[2].className = enter_key_class+' '+flex_center_class;

      // set text content of the input key li's
      inputs.childNodes[0].textContent = m_key_text_content;
      inputs.childNodes[1].textContent = p_key_text_content;
      inputs.childNodes[2].textContent = enter_key_text_content;

      return keyboard;
    }

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        // bg tiles
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        // enemies
        'images/enemy-bug.png',
        'images/slow-bug.png',
        'images/fat-bug.png',
        'images/reverse-bug.png',
        // pickups
        'images/Heart.png',
        'images/Gem Blue.png',
        'images/Gem Green.png',
        'images/Gem Orange.png',
        'images/Key.png',
        // ui
        'images/Heart-map.png',
        // player characters
        'images/char-boy-map.png',
        'images/char-cat-girl.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png',
        // start screen
        'images/brotips.png',
        'images/Selector.png',
        'images/title.png'
    ]);
    Resources.onReady(init);


    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developers can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
    global.canvas = canvas;
    // allows reset of game world globally
    global.rebuild_world = rebuild_world;

})(this);

///////////////
// PRELOADER //
///////////////

// get the #preloader dom element
var preloader = document.getElementById('preloader');
// get the .main dom element
var main_div = document.getElementsByTagName('main');
// set the main div to display none so there's no vertical scrollbar
main_div[0].style.display = 'none';

// fade in the canvas
window.onload = function() {
  // hide the loader overlay by moving it up, allows for css transition
  preloader.style.transform = 'translateY(-100em)';
  // make height 0 to allow canvas transition upwards from bottom
  preloader.style.height = 0;
  // delay taking it out of the document flow to allow transition to play
  window.setTimeout(function(){
    preloader.style.display = 'none';
    // start playing preloaded start screen music
    check_if_all_audio_loaded();
  }, 1100);
  main_div[0].removeAttribute('style');
  // make the canvas visible
  canvas.style.opacity = 1;

};
