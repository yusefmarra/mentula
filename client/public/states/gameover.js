function GameOver() {}

GameOver.prototype = {
    // We can take input from the init function
    init: function(winner, playerCount) {
        this.winner = winner;
        this.playerCount = playerCount;
        console.log(playerCount);
        this.titleText = game.make.text(game.world.centerX, 100, 'Cyber Tanks ', {
            font: 'bold 65pt MGS',
            fill: '#30DEF8',
            align: 'center'
        });
        this.titleText.anchor.setTo(0.5);
        this.winnerText = game.make.text(game.world.centerX, 300, 'Winner! ', {
            font: '30pt OR',
            fill: '#FFFFFF',
            align: 'center'
        });
        this.winnerText.anchor.setTo(0.5);
    },
    create: function() {
        game.add.sprite(0, 0, 'menu-bg');
        game.add.existing(this.titleText);
        game.add.existing(this.winnerText);
        this.tank = game.add.sprite(game.world.centerX, game.world.centerY, 'tank' + this.winner);
        this.tank.anchor.setTo(0.5, 0.5);
        this.tank.scale.setTo(3.0);
        this.tank.tint = colors[this.winner];
        this.addRestart();
    },
    addRestart: function() {
        var optionStyle = { font: '25pt OR', fill: 'white', align: 'left', stroke: 'rgba(0,0,0,0)', srokeThickness: 4};
        var txt = game.add.text(game.world.centerX, game.world.height * 0.8, 'Play Again?', optionStyle);
        txt.anchor.setTo(0.5, 0.5);

        var onOver = function (target) {
            target.fill = "#30DEF8";
            target.stroke = "rgba(200,200,200,0.5)";
        };
        var onOut = function (target) {
            target.fill = "white";
            target.stroke = "rgba(0,0,0,0)";
        };
        var onClick = function() {
            game.state.start('Game', true, false, this.playerCount);
        }.bind(this);
        txt.stroke = "rgba(0,0,0,0";
        txt.strokeThickness = 4;
        txt.inputEnabled = true;
        txt.events.onInputUp.add(onClick);
        txt.events.onInputOver.add(onOver);
        txt.events.onInputOut.add(onOut);
    },
    preload: function () {

    },
    update: function() {

    }
};
