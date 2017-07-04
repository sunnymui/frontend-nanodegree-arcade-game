![Swim Free or Die Hard Logo](https://github.com/sunnymui/frontend-nanodegree-arcade-game/raw/master/images/title-hq.png)
===============================

An online frogger style game featuring several kinds of enemies, pickups, scoring, adjustable difficulty, and more!

## Play the Game

Play right now by clicking over to the hosted version:
### [Play Now](https://sunnymui.github.io/frontend-nanodegree-arcade-game/)

Or clone the repo and open index.html on a local server. Local server is required to run locally due to cross origin request restrictions. If you want what I used and have node.js installed, [try downloading http-server.](https://www.npmjs.com/package/http-server)

Follow the instructions to install http-server, which should be just entering the following in a command prompt, as long as Node Package Manager (NPM) is installed:

`npm install http-server -g`

Afterwards, in the command prompt, start http-server with:

`http-server [path]``

Where `[path]` should be the directory path to wherever you put the game files. Once that's running (don't close the command prompt!) switch over to a web browser and enter the following in the address bar:

`http://localhost:8080`

You should be taken to the game and you can start SWIMMING FREE OR DYING HARD.

## How to Play

It's a hot day and your character is looking for a nice dip in the river. First, select a difficulty level, then get familiar with the controls. The goal of the game is to guide your player character from the bottom of the screen to the top of the screen, where the water is.

Enemies will be blocking you way as you try to cross. Be careful and avoid getting hit, otherwise you'll lose your life and have to start over! Watch out for different enemy types--each has different characteristics.

Different pickups will be randomly placed on tiles. Every pickup increases your score by a varying amount and some will have additional effects as well.

If you get hit, move quickly afterwards during a temporary invulnerability period.

Try to get a high score, then try to beat it on your next playthrough! Good luck!

Everytime you successfully cross, you earn 10 points.

## Controls

*Movement:*
Arrow Keys
←↑↓→

*Continue/Select:*
Enter

*Pause:*
P

*Mute:*
M

## Features

* Hilarious writing
* Ultrarealistic 4K VR HDR shader-mapped photo-realistic graphics in your imagination
* Multiple enemy types with special enemies that have unique characteristics
* Selectable difficulty that changes the playfield and number of enemies on the fly
* Several types of pickups and collectables
* Randomly assigned enemy positions, enemy speed (with speed ranges dependent on enemy type), and randomly placed pickups with different rarity levels mean no 2 playthroughs are the same
* Player life meter that tracks how much life players have left
* Collision detection with basic optimization to only run calculations on things that can reasonably collide with you
* Rich sprite animations
* Sound effects and changing music
* Pause and mute capabilities
* Autopause the game when switching to another tab
* Crossfade transitions between levels
* Scorekeeping and level tracking
* High score tracking for each difficulty level
* Level and game statistics displayed in victory/defeat popup overlays after clearing each round and at game over
* Preloading screen to ensure assets are loaded before game starts
* On screen controls toggled for mobile play
* Starting intro screen with helpful BROTIPS
* Pickup type tracking shows what you missed and what you collected

## Pickups

#### Blue Gem

Adds 2 point to your score.

#### Green Gem

Adds 5 points to your score.

#### Yellow Gem

Adds 10 points to your score.

#### Heart

Adds 1 point to your score and adds 1 life back to your life meter. Won't increase your life beyond the maximum though.

#### Key

The rarest item, the key whisks you away to the water for an instant win and gives you 1 extra point.

## Credits

* Art assets from [itch.io](https://itch.io/game-assets/free)

* Sound and art assets from [OpenGameArt.org](https://opengameart.org/)

* SoundJS plugin from [CreateJS](http://www.createjs.com/soundjs)

* Sprite mini-plugin from [JLongster](http://jlongster.com/Making-Sprite-based-Games-with-Canvas)

* Online sprite image editor and spritemap generation from [Piskel](http://www.piskelapp.com/)
