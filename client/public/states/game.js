//** GLOBALS **//
// var socket = io();
var players = [];
var bullets;
var land;
var explosions;
var inputs = [];
var manager = null;
var emitter = null;
var image = null;

function Game() {
    this.playerCount;
    this.gamepads = [];
}

Game.prototype = {
  init: function(playerCount) {
      this.playerCount = playerCount;
      console.log(playerCount);
      for (var i = 0; i <= playerCount; i++) {
          inputs.push({left: 1, right: 1, fire: false});
      }
      for (var k = 0; k < game.input.gamepad.padsConnected; k++) {
          this.gamepads.push({pad: game.input.gamepad['pad'+(k+1)], player: k});
      }
  },

  preload: function() {
    game.load.image('land', 'assets/floortile2.png');
    game.load.image('bullet', 'assets/bullet.png');
    game.load.image('tank1debris1', 'assets/tank1debris1.png');
    game.load.image('tank1debris2', 'assets/tank1debris2.png');
    game.load.image('tank1debris3', 'assets/tank1debris3.png');
    game.load.image('tankBurst', 'assets/tank-burst.png');
    game.load.spritesheet('tank0', 'assets/tanksheet.png', 42, 40);
    game.load.spritesheet('tank1', 'assets/tanksheet2.png', 42, 40);
    game.load.spritesheet('tank2', 'assets/tanksheet3.png', 42, 40);
    game.load.spritesheet('tank3', 'assets/tanksheet4.png', 42, 40);
  },

  create: function() {
    land = game.add.tileSprite(0, 0, 800, 600, 'land');
    land.tint = 0x5396ac;
    land.filters = [ this.game.add.filter('Glow') ];

    socket.on('game-update', function(data) {
      inputs[data.player] = data;
    });
    for (var i = 0; i < this.playerCount; i++) {
        players.push(new Tank(game, i));
    }
    game.physics.startSystem(Phaser.Physics.ARCADE);

    emitter = game.add.group();


    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;
    bullets.createMultiple(30, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);
    // bullets.setAll('outOfBoundsKill', true);
    bullets.setAll('body.collideWorldBounds', true);
    bullets.setAll('body.bounce.x', 1);
    bullets.setAll('body.bounce.y', 1);

    bullets.setAll('filters',[ this.game.add.filter('Glow') ]);
  },
    update: function() {
        this.getGamepadInput();
        for (var i = 0; i < players.length; i++) {
            // console.log(inputs);
            players[i].update();
            game.physics.arcade.overlap(bullets, players[i].sprite, handleBulletCollision, null, this);

        }
        for (var k = 0; k < players.length; k++) {
          for (var l = 0; l < players.length; l++) {
            game.physics.arcade.collide(players[k].sprite, players[l].sprite);
          }
        }
        emitter.forEachAlive(function(p){
  		    p.alpha= p.lifespan / emitter.lifespan;
  	    });
    },
    getGamepadInput: function() {
        //   console.log(this.gamepads);
        for (var i = 0; i < this.gamepads.length; i++) {
            var pad = this.gamepads[i].pad;
            var player = this.gamepads[i].player;
            if (pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.5) {
                inputs[player].left = 2;
            } else if (pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.5) {
                inputs[player].left = 0;
            } else {
                inputs[player].left = 1;
            }
            if (pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) < -0.5) {
                inputs[player].right = 2;
            } else if (pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) > 0.5) {
                inputs[player].right = 0;
            } else {
                inputs[player].right = 1;
            }
            if (pad.isDown(Phaser.Gamepad.XBOX360_RIGHT_TRIGGER)) {
                inputs[player].fire = true;
            } else {
                inputs[player].fire = false;
            }

        }

    }
};


// Tank object constructor.
function Tank(game, controller) {
  this.game = game;
  var x = game.world.randomX;
  var y = game.world.randomY;
  this.velocity = 125;
  this.fireRate = 1000;
  this.nextFire = 0;
  this.rotation = 1;
  this.colors = [0x00cc00, 0x1a75ff, 0xe5e600, 0xe67300];
  // Controller is the index of input array where this tanks inputs are stored.
  this.controller = controller;
  this.sprite = game.add.sprite(x, y, 'tank' + (this.controller + 1));
  this.sprite.health = 100;
  this.sprite.frame = 1;
  this.sprite.animations.add('move', [0,1,2], 10, true);
  // this.sprite.animations.add('move', [0,1,2], 10, true);
  //set initial angle
  this.sprite.angle = -90;
  this.sprite.anchor.set(0.5, 0.5);

  // Enable arcade style physics on the tank.
  game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
  this.sprite.body.immovable = false;
  // Keep the tank on the screen
  this.sprite.body.collideWorldBounds = true;
  this.sprite.body.bounce.setTo(1, 1);
  this.sprite.body.drag.set(0.2);
  this.sprite.body.maxVelocity.set(100);
  this.sprite.tint = this.colors[this.controller + 2];
  // this.sprite.filters = [ this.game.add.filter('Glow') ];

}

Tank.prototype = {
  update: function () {
    //** Check heatlh **//
    if (this.sprite.health <= 0 && this.sprite.alive) {
      this.sprite.kill();
      this.die();
      //add explosion animation
    }
    if (this.rotation > 360){
      this.rotation = this.rotation - 360;
    } else if (this.rotation < 0) {
      this.rotation = 360 + this.rotation;
    }

    //** Steering and movement controls **//
    if (inputs[this.controller].left === 2 && inputs[this.controller].right === 2) {
      // Both tracks moving forward, move the tank forward
      game.physics.arcade.velocityFromAngle(this.sprite.angle, this.velocity, this.sprite.body.velocity);
      this.sprite.play('move');
    } else if (inputs[this.controller].left === 0 && inputs[this.controller].right === 0) {
      // Both tracks moving backward, move the tank backward. Reverse is the opposite angle of the tank front
      var reverse = this.sprite.angle > 0 ? this.sprite.angle - 180 : this.sprite.angle + 180;
      game.physics.arcade.velocityFromAngle(reverse, this.velocity, this.sprite.body.velocity);
      this.sprite.play('move');
    } else if (inputs[this.controller].left === 2 && inputs[this.controller].right === 1) {
      // Left track forward, right neutral, turn the tank right.
      this.sprite.angle += 1;
      this.rotation += 1;
      game.physics.arcade.velocityFromAngle(this.sprite.angle, 0, this.sprite.body.velocity);
      this.sprite.play('move');
    } else if (inputs[this.controller].left === 1 && inputs[this.controller].right === 2) {
      // Left track neutral, right track forward, turn the tank left.
      this.sprite.angle -= 1;
      this.rotation -= 1;
      game.physics.arcade.velocityFromAngle(this.sprite.angle, 0, this.sprite.body.velocity);
      this.sprite.play('move');
    } else if (inputs[this.controller].left === 0 && inputs[this.controller].right === 1) {
      // Left track reverse, right track neutral, turn the tank left.
      this.sprite.angle -= 1;
      this.rotation -= 1;
      game.physics.arcade.velocityFromAngle(this.sprite.angle, 0, this.sprite.body.velocity);
      this.sprite.play('move');
    } else if (inputs[this.controller].left === 1 && inputs[this.controller].right === 0) {
      // Left track neutral, right track reverse, turn the tank right.
      this.sprite.angle += 1;
      this.rotation += 1;
      game.physics.arcade.velocityFromAngle(this.sprite.angle, 0, this.sprite.body.velocity);
      this.sprite.play('move');
    } else if (inputs[this.controller].left === 2 && inputs[this.controller].right === 0) {
      // Left track forward, right track reverse, turn the tank fast right.
      this.sprite.angle += 3;
      this.rotation += 3
      game.physics.arcade.velocityFromAngle(this.sprite.angle, 0, this.sprite.body.velocity);
      this.sprite.play('move');
    } else if (inputs[this.controller].left === 0 && inputs[this.controller].right === 2) {
      // Left track reverse, right track forward, turn the tank fast left.
      this.sprite.angle -= 3;
      this.rotation -= 3;
      game.physics.arcade.velocityFromAngle(this.sprite.angle, 0, this.sprite.body.velocity);
      this.sprite.play('move');
    } else {
      // No inputs? Stop the tank.
      game.physics.arcade.velocityFromAngle(this.sprite.angle, 0, this.sprite.body.velocity);
      this.sprite.animations.stop();
    }

    //** Firing Controls **//
    if (inputs[this.controller].fire) {
      // Some logic for firing
      bullet = bullets.getFirstExists(false);
      if (bullet && this.game.time.now > this.nextFire) {
        //  And fire it
        var radians = this.rotation * (Math.PI/180);
        // console.log((this.sprite.x + 20) * Math.sin(radians), (this.sprite.y + 20) * Math.cos(radians));
        // console.log(this.rotation);
        vector = {};
        vector.x = 33 * Math.sin(radians);
        vector.y = 33 * Math.cos(radians);
        if (this.rotation >= 0 && this.rotation <= 90) {
            bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
        } else if (this.rotation > 90 && this.rotation <= 180) {
          bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
        } else if (this.rotation > 180 && this.rotation <= 270) {
          bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
        } else if (this.rotation > 270 && this.rotation <= 360) {
          bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
        }
        bullet.lifespan = 2000;

        // bullet.reset(this.sprite.x, this.sprite.y);
        bullet.angle = this.sprite.angle;
        game.physics.arcade.velocityFromAngle(this.sprite.angle, 400, bullet.body.velocity);
        // bullet.reset(this.sprite.x, this.sprite.y);
        // console.log(bullet);

        this.nextFire = this.game.time.now + this.fireRate;
      }
    }
  },
  die: function() {
      var piece1 = game.add.sprite(this.sprite.x, this.sprite.y, 'tank1debris1');
      var piece2 = game.add.sprite(this.sprite.x, this.sprite.y, 'tank1debris2');
      var piece3 = game.add.sprite(this.sprite.x, this.sprite.y, 'tank1debris3');
      game.physics.enable(piece1, Phaser.Physics.ARCADE);
      game.physics.enable(piece2, Phaser.Physics.ARCADE);
      game.physics.enable(piece3, Phaser.Physics.ARCADE);
      piece1.anchor.set(0.5, 0.5);
      piece2.anchor.set(0.5, 0.5);
      piece3.anchor.set(0.5, 0.5);
      piece1.tint = this.sprite.tint;
      piece2.tint = this.sprite.tint;
      piece3.tint = this.sprite.tint;

      emitter = game.add.emitter(this.sprite.x, this.sprite.y, 200);

      emitter.makeParticles('tankBurst');
      emitter.lifespan = 2000

      emitter.start(true, 1000, null, 300);





      game.physics.arcade.velocityFromAngle(100, 200, piece1.body.velocity);
      game.physics.arcade.velocityFromAngle(-85, 200, piece2.body.velocity);
      game.physics.arcade.velocityFromAngle(0, 200, piece3.body.velocity);
      piece1.body.angularVelocity = 800;
      piece2.body.angularVelocity = 800;
      piece3.body.angularVelocity = 800;
  }
};

function handleBulletCollision(tank, bullet) {
  bullet.kill();
  tank.health -= 50;
}

Phaser.Filter.Glow = function (game) {
    Phaser.Filter.call(this, game);

    this.fragmentSrc = [
        "precision lowp float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        'uniform sampler2D uSampler;',

        'void main() {',
            'vec4 sum = vec4(0);',
            'vec2 texcoord = vTextureCoord;',
            'for(int xx = -4; xx <= 4; xx++) {',
                'for(int yy = -3; yy <= 3; yy++) {',
                    'float dist = sqrt(float(xx*xx) + float(yy*yy));',
                    'float factor = 0.0;',
                    'if (dist == 0.0) {',
                        'factor = 2.0;',
                    '} else {',
                        'factor = 2.0/abs(float(dist));',
                    '}',
                    'sum += texture2D(uSampler, texcoord + vec2(xx, yy) * 0.002) * factor;',
                '}',
            '}',
            'gl_FragColor = sum * 0.025 + texture2D(uSampler, texcoord);',
        '}'
    ];
};

Phaser.Filter.Glow.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Glow.prototype.constructor = Phaser.Filter.Glow;
