var socket = io();

// socket.on('start-game', function() {
//   console.log('starting game');
//   $('.container').hide();
//   startGame();
// })

var game = new Phaser.Game(800,600, Phaser.AUTO, 'Cyber-Tanks');
function Main() {};

Main.prototype = {
  preload: function() {
    game.load.image('background', 'assets/goodbackground.jpg');
    game.load.image('loading', 'assets/loading.png');
    game.load.image('logo', 'assets/tankwithturret.png');
    game.load.script('splash', 'states/splash.js');
  },
  create: function() {
    game.state.add('Splash', Splash);
    game.state.start('Splash');
  }
};

game.state.add('Main', Main);
game.state.start('Main');
