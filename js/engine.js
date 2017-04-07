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
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime;
    // var to store the rendered background img
    var background;

    canvas.width = cols * tile_width;
    // multiply by the width to because tile height is only the 'above ground' art
    canvas.height = rows * tile_width;
    doc.body.appendChild(canvas);

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

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */

        update(dt);
        render();

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    }

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        reset();
        lastTime = Date.now();
        // render background once to cache in the background var since it stays the same
        renderBackground();
        main();
    }

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data. Based on how
     * you implement your collision detection (when two entities occupy the
     * same space, for instance when your character should die), you may find
     * the need to add an additional function call here. For now, we've left
     * it commented out - you may or may not want to implement this
     * functionality this way (you could just implement collision detection
     * on the entities themselves within your app.js file).
     */
    function update(dt) {
        updateEntities(dt);
        checkCollisions();
    }

    /* This is called by the update function and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
        player.update(dt);
    }

    function renderBackground() {
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
          }
      }
      // save the background image data to avoid a complete redraw in every frame
      background = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */

    function render() {

        // render the background using the saved, prerendered background image data
        ctx.putImageData(background, 0, 0);
        // render the info top bar area
        //ctx.fillStyle = '#008286';
        //ctx.fillRect(0,0, canvas.width, 50);

        //renderEntities();
        renderEntities(allEnemies);
        renderEntity(player);

    }

    /* This function is called by the render function and is called on each game
     * tick. Its purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    // function renderEntities() {
    //     /* Loop through all of the objects within the allEnemies array and call
    //      * the render function you have defined.
    //      */
    //     allEnemies.forEach(function(enemy) {
    //         enemy.render();
    //     });
    //
    //     player.render();
    // }

    //TODO finish this

    function renderEntities(list) {
        for(var i=0; i<list.length; i++) {
            renderEntity(list[i]);
        }
    }

    function renderEntity(entity) {
        ctx.save();
        ctx.translate(entity.x, entity.y);
        entity.sprite.render(ctx);
        ctx.restore();
    }

    /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {
        // noop
    }

    function canCollide(entity_array) {
      /*
      Checks if entities are close enough to the player for possible collision.
      If so, add it to the collidable objects array to be returned.
      Args:
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

    function collides(entity_1, entity_2) {
      /*
      Checks if any of the bounds of the first object are within the bounds of the
      second object by using their respective positions and the position of their
      top right and bottom left corners.
      Args: expects first object and second object to compare.
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
            x: player.x + player.hitbox_x,
            y: player.y + player.hitbox_y,
            r: player.x + player.hitbox_x + player.width,
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

    function checkCollisions() {
      /*
      check if player collided with any of the collidable objects
      run the boxcollides function on the player object and compare
      with every other entity. no projectiles or enemy on enemy
      collisions to deal with so we can just do player to entity comparisons
      Args:
      Return:
      */

      // var for the different arrays of entities to be checked by as collidable
      var entity_types;
      if (player.invulnerable) {
        entity_types = [];
      } else {
        entity_types = allEnemies; //allEnemies.concat(items);
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

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/char-boy-map.png',
        'images/char-boy-hit.png'
    ]);
    Resources.onReady(init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developers can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
    // // make canvas width and height globally accessible

})(this);
