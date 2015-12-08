// Tank object constructor.
function Tank(controller) {
    var x, y, startAngle;
    this.rotation;
    this.super = false;
    this.superTime;
    //give specific starting location based on controller
    switch (true) {
        case controller === 0:
        x = game.world.width * 0.25;
        y = game.world.height * 0.25;
        startAngle = 0;
        this.rotation = 90;
        break;
        case controller === 1:
        x = game.world.width * 0.75;
        y = game.world.height * 0.25;
        startAngle = 180;
        this.rotation = 270;
        break;
        case controller === 2:
        x = game.world.height * 0.25;
        y = game.world.width * 0.75;
        startAngle = 0;
        this.rotation = 90;
        break;
        case controller === 3:
        x = game.world.height * 0.75;
        y = game.world.width * 0.75;
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
    // this.sprite.filters = [ game.add.filter('Glow') ];
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
            if (bullet && game.time.now > this.nextFire) {
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
                this.nextFire = game.time.now + this.fireRate;
            }
        }
    },
    die: function() {
        //shoot out pieces and specified angle and velocities
        var angle1 = (Math.random() * 90);
        var angle2 = (Math.random() * 90) + 90;
        var angle3 = -(Math.random() * 90) - 45;

        for (var i = 1; i <= 3; i++) {
            var piece = game.add.sprite(this.sprite.x, this.sprite.y, 'tank' + this.controller + 'debris' + i);
            game.physics.enable(piece, Phaser.Physics.ARCADE);
            piece.anchor.set(0.5, 0.5);
            piece.tint = colors[this.controller];
            piece.outOfBoundsKill = true;
            piece.body.angularVelocity = 400;
            if (i === 1) {
                game.physics.arcade.velocityFromAngle(angle1, 200, piece.body.velocity);
            } else if (i === 2) {
                game.physics.arcade.velocityFromAngle(angle2, 200, piece.body.velocity);
            } else {
                game.physics.arcade.velocityFromAngle(angle3, 200, piece.body.velocity);
            }

        }

        //** PARTICLE EMITTER ON DEATH **//
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
