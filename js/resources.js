/* Resources.js
 * This is simply an image loading utility. It eases the process of loading
 * image files so that they can be used within your game. It also includes
 * a simple "caching" layer so it will reuse cached images if you attempt
 * to load the same image multiple times.
 */
(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];

    /* This is the publicly accessible image loading function. It accepts
     * an array of strings pointing to image files or a string for a single
     * image. It will then call our private image loading function accordingly.
     */
    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            /* If the developer passed in an array of images
             * loop through each value and call our image
             * loader on that image file
             */
            urlOrArr.forEach(function(url) {
                _load(url);
            });
        } else {
            /* The developer did not pass an array to this function,
             * assume the value is a string and call our image loader
             * directly.
             */
            _load(urlOrArr);
        }
    }

    /* This is our private image loader function, it is
     * called by the public image loader function.
     */
    function _load(url) {
        if(resourceCache[url]) {
            /* If this URL has been previously loaded it will exist within
             * our resourceCache array. Just return that image rather
             * re-loading the image.
             */
            return resourceCache[url];
        } else {
            /* This URL has not been previously loaded and is not present
             * within our cache; we'll need to load this image.
             */
            var img = new Image();
            img.onload = function() {
                /* Once our image has properly loaded, add it to our cache
                 * so that we can simply return this image if the developer
                 * attempts to load this file in the future.
                 */
                resourceCache[url] = img;

                /* Once the image is actually loaded and properly cached,
                 * call all of the onReady() callbacks we have defined.
                 */
                if(isReady()) {
                    readyCallbacks.forEach(function(func) { func(); });
                }
            };

            /* Set the initial cache value to false, this will change when
             * the image's onload event handler is called. Finally, point
             * the image's src attribute to the passed in URL.
             */
            resourceCache[url] = false;
            img.src = url;
        }
    }

    /* This is used by developers to grab references to images they know
     * have been previously loaded. If an image is cached, this functions
     * the same as calling load() on that URL.
     */
    function get(url) {
        return resourceCache[url];
    }

    /* This function determines if all of the images that have been requested
     * for loading have in fact been properly loaded.
     */
    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    /* This function will add a function to the callback stack that is called
     * when all requested images are properly loaded.
     */
    function onReady(func) {
        readyCallbacks.push(func);
    }

    /* This object defines the publicly accessible functions available to
     * developers by creating a global Resources object.
     */
    window.Resources = {
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady
    };

    // utility plugin for sprite class
    // grabbed from this tutorial: http://jlongster.com/Making-Sprite-based-Games-with-Canvas
    // https://github.com/jlongster/canvas-game-bootstrap/blob/a878158f39a91b19725f726675c752683c9e1c08/js/sprite.js
    function Sprite(url, pos, size, speed, frames, dir, once, final_frame) {
      this.pos = pos;
      this.size = size;
      this.speed = typeof speed === 'number' ? speed : 0;
      this.frames = frames;
      this._index = 0;
      this.url = url;
      this.dir = dir || 'horizontal';
      this.once = once;
      this.final_frame = final_frame;
      this.frame_counter = 0;
      // if 3rd, 4th parameters added to size array
      if (size.length > 2) {
        // use those parameters to scale the drawn image size
        this.scale = [size[2], size[3]];
      } else {
        // default to initial defined size if no scaled size defined
        this.scale = size;
      }
    }

    Sprite.prototype = {
      update: function(dt) {
          this._index += this.speed*dt;
      },

      render: function(ctx) {
          var frame;

          if(this.speed > 0) {
              var max = this.frames.length;
              var idx = Math.floor(this._index);

              frame = this.frames[this.frame_counter];
              this.frame_counter += 1;

              if (this.once && this.frame_counter >= max) {
                  this.done = true;
                  frame = this.final_frame;
              }
          }
          else {
              frame = 0;
          }


          var x = this.pos[0];
          var y = this.pos[1];

          if(this.dir == 'vertical') {
              y += frame * this.size[1];
          }
          else {
              x += frame * this.size[0];
          }

          ctx.drawImage(Resources.get(this.url),
                        x, y, // where in the map to draw from
                        this.size[0], this.size[1], // size of the sprite within the sprite map
                        0, 0, // where to place in the canvas
                        this.scale[0], this.scale[1]); // size to scale image
      }
    };

    window.Sprite = Sprite;
})();
