//** GLOBALS **//
// var socket = io();
var players = [];
var bullets;
var land;
var powerup;
var rainbowColor = [0xffff00, 0x80ff00, 0x0000ff, 0xff00ff, 0xff0000];
var colors = [0x00cc00, 0x1a75ff, 0xe5e600, 0xe67300];
var timer;
var obstacles;
var inputs = [];
var emitter = null;


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

    },
    create: function() {
        land = game.add.sprite(0, 0, 'land');
        land.tint = 0x5396ac;
        // land.filters = [ this.game.add.filter('Glow') ];
        land.height = window.innerHeight;
        land.width = window.innerHeight;
        players = [];



        // create socket
        socket.on('game-update', function(data) {
            inputs[data.player] = data;
        });
        for (var i = 0; i < this.playerCount; i++) {
            players.push(new Tank(game, i));
        }
        game.physics.startSystem(Phaser.Physics.ARCADE);

        emitter = game.add.group();
        obstacles = game.add.group();
        createMap1(game);

        // powerup
        powerup = game.add.sprite(game.world.centerX, game.world.centerY, 'powerup');
        game.physics.enable(powerup, Phaser.Physics.ARCADE);
        powerup.animations.add('spin', [0,1,2,3], 10, true);
        powerup.anchor.setTo(0.5, 0.5);
        powerup.tint = 0xcc00ff;

        // center obstacle to protect powerup
        this.centerObstacle =  new Obstacle(game.world.centerX, game.world.centerY, 0.5, 0.5);
        obstacles.add(this.centerObstacle.sprite);
        var randomTime = Math.floor(Math.random() * 10000) + 5000;
        game.time.events.repeat(randomTime, 1, function() {
            this.centerObstacle.sprite.destroy();
        }.bind(this), game);

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

        // bullets.setAll('filters',[ this.game.add.filter('Glow') ]);
    },
    update: function() {
        this.getGamepadInput();

        powerup.play('spin');
        var count = 0;
        var winner;
        for (var i = 0; i < players.length; i++) {
            if (players[i].sprite.alive) {
                count++;
                players[i].update();
                game.physics.arcade.overlap(bullets, players[i].sprite, handleBulletCollision, null, this);
                winner = i;
            }
        }

        // if only one player or less  is alive, then end game.
        if (count <= 1) {
            game.time.events.repeat(2000, 1, function() {
                game.state.start('GameOver', true, false, winner, this.playerCount);
            }.bind(this), game);
        }

        game.physics.arcade.collide(bullets, obstacles);
        for (var k = 0; k < players.length; k++) {
            game.physics.arcade.collide(players[k].sprite, obstacles);
            game.physics.arcade.overlap(players[k].sprite, powerup, function(player, powerup) {
                players[player.playerId].rainbow();
                powerup.kill();
            });
            for (var l = 0; l < players.length; l++) {
                game.physics.arcade.collide(players[k].sprite, players[l].sprite, null, function(player1, player2) {
                    // FIXME: refactor this super collision
                    // if (players[player1.playerId].super && player1 !== player2) {
                    //     players[player2.playerId].sprite.health = 0;
                    // }

                    // when super collides with non-super, kill that player
                    if ((players[player1.playerId].super || players[player2.playerId].super) && player1 !== player2) {
                        if (players[player1.playerId].super) {
                            players[player2.playerId].sprite.health = 0;
                        } else {
                            players[player1.playerId].sprite.health = 0;
                        }
                    }
                });
            }
        }
        game.physics.arcade.overlap(bullets, obstacles, function(bullet, obstacle) {
            bullet.kill();
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
    },
};


// Tank object constructor.
function Tank(game, controller) {
    var x, y, startAngle;
    this.game = game;
    this.rotation;
    this.super = false;
    this.superTime;
    //give specific starting location based on controller
    switch (true) {
        case controller === 0:
        x = this.game.world.width * 0.25;
        y = this.game.world.height * 0.25;
        startAngle = 0;
        this.rotation = 90;
        break;
        case controller === 1:
        x = this.game.world.width * 0.75;
        y = this.game.world.height * 0.25;
        startAngle = 180;
        this.rotation = 270;
        break;
        case controller === 2:
        x = this.game.world.height * 0.25;
        y = this.game.world.width * 0.75;
        startAngle = 0;
        this.rotation = 90;
        break;
        case controller === 3:
        x = this.game.world.height * 0.75;
        y = this.game.world.width * 0.75;
        startAngle = 180;
        this.rotation = 270;
        break;
    }
    this.velocity = 200;
    this.fireRate = 1000;
    this.nextFire = 0;
    // Controller is the index of input array where this tanks inputs are stored.
    this.controller = controller;
    this.sprite = game.add.sprite(x, y, 'tank' + (this.controller));
    this.sprite.health = 100;
    this.sprite.maxHealth = 100;
    this.sprite.danger = false;
    this.sprite.frame = 1;
    this.sprite.animations.add('move', [0,1,2], 10, true);
    // this.sprite.animations.add('move', [0,1,2], 10, true);
    //set initial angle
    this.sprite.angle = startAngle;
    this.sprite.anchor.set(0.5, 0.5);

    // Enable arcade style physics on the tank.
    game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
    this.sprite.body.immovable = false;
    // Keep the tank on the screen
    this.sprite.body.collideWorldBounds = true;
    this.sprite.playerId = this.controller;
    this.sprite.body.bounce.setTo(1, 1);
    this.sprite.body.drag.set(0.2);
    this.sprite.body.maxVelocity.set(500);
    this.sprite.tint = colors[this.controller];
    // this.sprite.filters = [ this.game.add.filter('Glow') ];


}

Tank.prototype = {
    update: function () {
        //** Check Super Status **//
        if (this.super) {
            if (this.superTime + 5000 > game.time.now) {
                this.velocity = 500;
            } else {
                this.super = false;
                this.velocity = 200;
                this.sprite.tint = colors[this.controller];
            }
        } else if (!this.danger) {
            this.sprite.tint = colors[this.controller];
        }

        //** Check heatlh **//
        if (this.sprite.health <= 0 && this.sprite.alive) {
            this.sprite.kill();
            this.die();

            //** Particle Explosion **//
            var tint = this.sprite.tint;
            emitter.forEachAlive(function(p){
                p.alpha = p.lifespan / emitter.lifespan;
                p.tint = tint;
                p.scale.setTo(0.5, 0.5);
            });
        } else if (this.sprite.health <= 25  && this.sprite.danger === false) {
            this.sprite.danger = true;
            this.danger();
        }

        // if danger for certain time, regen health
        if (this.sprite.danger) {
            if (this.dangerTime + 5000 <= game.time.now) {
                this.sprite.health += 25;
                this.sprite.danger = false;
            }
        }

        //keep tank rotaion between 0 and 360
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
            this.rotation += 3;
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
                vector = {};
                vector.x = 40 * Math.sin(radians);
                vector.y = 40 * Math.cos(radians);
                if (this.rotation >= 0 && this.rotation <= 90) {
                    bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
                } else if (this.rotation > 90 && this.rotation <= 180) {
                    bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
                } else if (this.rotation > 180 && this.rotation <= 270) {
                    bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
                } else if (this.rotation > 270 && this.rotation <= 360) {
                    bullet.reset(this.sprite.x + vector.x, this.sprite.y - vector.y);
                }
                bullet.lifespan = 4000;

                bullet.angle = this.sprite.angle;
                game.physics.arcade.velocityFromAngle(this.sprite.angle, 300, bullet.body.velocity);
                // console.log(bullet);
                bullet.tint = colors[this.controller];
                bullet.scale.setTo(2);
                this.nextFire = this.game.time.now + this.fireRate;
            }
        }
    },
    die: function() {
        //create sprites for each debris piece
        var piece1 = game.add.sprite(this.sprite.x, this.sprite.y, 'tank'+ (this.controller) + 'debris1');
        var piece2 = game.add.sprite(this.sprite.x, this.sprite.y, 'tank' + (this.controller) + 'debris2');
        var piece3 = game.add.sprite(this.sprite.x, this.sprite.y, 'tank' + (this.controller) + 'debris3');

        //enable physics on each debris piece and set tint
        game.physics.enable(piece1, Phaser.Physics.ARCADE);
        game.physics.enable(piece2, Phaser.Physics.ARCADE);
        game.physics.enable(piece3, Phaser.Physics.ARCADE);
        piece1.anchor.set(0.5, 0.5);
        piece2.anchor.set(0.5, 0.5);
        piece3.anchor.set(0.5, 0.5);
        piece1.tint = colors[this.controller];
        piece2.tint = colors[this.controller];
        piece3.tint = colors[this.controller];
        piece1.outOfBoundsKill = true;
        piece2.outOfBoundsKill = true;
        piece3.outOfBoundsKill = true;

        // Take player out of players array
        // players.splice(this.controller, 1);

        //shoot out pieces and specified angle and velocities
        var angle1 = (Math.random() * 90);
        var angle2 = (Math.random() * 90) + 90;
        var angle3 = -(Math.random() * 90) - 45;
        game.physics.arcade.velocityFromAngle(angle1, 200, piece1.body.velocity);
        game.physics.arcade.velocityFromAngle(angle2, 200, piece2.body.velocity);
        game.physics.arcade.velocityFromAngle(angle3, 200, piece3.body.velocity);

        //adds spin to each piece of debris
        piece1.body.angularVelocity = 400;
        piece2.body.angularVelocity = 400;
        piece3.body.angularVelocity = 400;

        //** PARTICLE STROM ON DEATH **//
        emitter = game.add.emitter(this.sprite.x, this.sprite.y, 200);
        emitter.makeParticles('tankBurst');
        emitter.lifespan = 750;
        emitter.gravity = 0;
        emitter.start(true, 750, null, 150);
    },
    rainbow: function() {
        this.super = true;
        this.superTime = game.time.now;

        game.time.events.repeat(100, 50, function() {
            var tintIndex = Math.floor(Math.random() * rainbowColor.length);
            this.sprite.tint = rainbowColor[tintIndex];
        }.bind(this), game);
    },
    danger: function () {
        this.dangerTime = game.time.now;
        game.time.events.repeat(500, 10, function() {
            if (this.sprite.tint === 0xff0000) {
                this.sprite.tint = colors[this.controller];
            } else {
                this.sprite.tint = 0xff0000;
            }
        }.bind(this), game);
    }
};


function quadrantSeperator() {
    this.sprite = game.add.sprite(game.world.centerX, game.world.centerY, 'seperator');
}

function Obstacle(x, y, scaleX, scaleY) {
    this.scaleX = scaleX || 1;
    this.scaleY = scaleY || 1;
    this.sprite = game.add.sprite(x, y, 'obstacleSquare');
    // this.sprite.filters = [game.add.filter('Glow')];
    game.physics.enable(this.sprite, Phaser.Physics.ARCADE);
    this.sprite.anchor.set(0.5, 0.5);
    this.sprite.body.immovable = true;
    this.sprite.scale.setTo(this.scaleX, this.scaleY);
}


function handleBulletCollision(tank, bullet) {
    bullet.kill();
    tank.health -= 25;
}

function createMap1() {
    //corner blocks
    obstacles.add(new Obstacle(game.world.width / 8, game.world.height / 8, 0.75, 0.75).sprite);
    obstacles.add(new Obstacle(game.world.width / 8, game.world.height - game.world.height / 8, 0.75, 0.75).sprite);
    obstacles.add(new Obstacle(game.world.width - game.world.width / 8, game.world.height / 8, 0.75, 0.75).sprite);
    obstacles.add(new Obstacle(game.world.width - game.world.width / 8, game.world.height - game.world.height / 8, 0.75, 0.75).sprite);

    //middle blocks
    obstacles.add(new Obstacle(game.world.width / 2, game.world.height/4, 0.5, 1.5).sprite);
    obstacles.add(new Obstacle(game.world.width / 2, game.world.height - game.world.height/4, 0.5, 1.5).sprite);
    obstacles.add(new Obstacle(game.world.width / 4, game.world.height - game.world.height/2, 1.5, 0.5).sprite);
    obstacles.add(new Obstacle(game.world.width - game.world.width / 4, game.world.height - game.world.height/2, 1.5, 0.5).sprite);
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

function multiView(id) {
    alert('test');
}

Phaser.Filter.Glow.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Glow.prototype.constructor = Phaser.Filter.Glow;
