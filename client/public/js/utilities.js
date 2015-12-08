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

Phaser.Filter.Glow.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Glow.prototype.constructor = Phaser.Filter.Glow;
