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
