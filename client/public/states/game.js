//** GLOBALS **//
// var socket = io();
var players = [];
var bullets;
var land;
var powerup;
var rainbowColor = [0xffff00, 0x80ff00, 0x0000ff, 0xff00ff, 0xff0000];
var colors = [0x00cc00, 0x1a1aff, 0xffff00, 0xffa31a];
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
            players.push(new Tank(i));
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
        game.time.events.repeat(5000, 1, function() {
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
