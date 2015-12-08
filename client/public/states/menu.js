var self;

function Menu() {
    self = this;
    this.gameRoom;
    this.viewerId;
    this.playerCount;
}


Menu.prototype = {
    init: function() {
        this.createGame();
        this.titleText = game.make.text(game.world.centerX, 100, 'Cyber Tanks ', {
            font: 'bold 65pt MGS',
            fill: '#30DEF8',
            align: 'center'
        });
        this.titleText.anchor.setTo(0.5);
        this.instructions = game.make.text(game.world.centerX, 250, '1. Hit the "create game" button below \n2. Visit this page on your phone \n3. Enter the ID below to connect', {
            font: '18pt OR',
            fill: '#FFFFFF',
            align: 'center'
        });
        this.instructions.anchor.setTo(0.5);
        game.input.gamepad.start();
        game.input.gamepad.onConnectCallback = function() {
            socket.emit('gamepad-player', {gameRoom: this.gameRoom})
        }.bind(this)
        game.input.gamepad.onDisconnectCallback = function() {
            this.playerCount--;
            // Remove player box
            // Send message to server decreasing player count
        }.bind(this)
    },
    create: function() {
        game.add.sprite(0, 0, 'menu-bg');
        game.add.existing(this.titleText);
        game.add.existing(this.instructions);
        socket.on('player-joined', function(data) {
            this.playerCount ? this.playerCount++ : this.playerCount = 1;
            console.log('Player ', this.playerCount, ' joined.')
            this.addPlayerBox();
            if (this.playerCount > 1) {
                this.addMenuStart();
            }
        }.bind(this));
        socket.on('success-create', function(data) {
            this.gameRoom = data.gameRoom;
            this.viewerId = data.viewerId;
            for (var i = 1; i <= game.input.gamepad.padsConnected; i++) {
                socket.emit('gamepad-player', {gameRoom: this.gameRoom});
            }
            this.createMenu = this.addMenuCreate();
        }.bind(this));
    },
    addMenuCreate: function() {
        var optionStyle = { font: '30pt OR', fill: 'white', align: 'center', stroke: 'rgba(0,0,0,0)', strokeThickness: 4};
        var txt = game.make.text(game.world.centerX, game.world.centerY, 'CREATE GAME ', optionStyle);
        txt.anchor.setTo(0.5, 0.5);
        var onOver = function (target) {
            target.fill = "#30DEF8";
            target.stroke = "rgba(200,200,200,0.5)";
        };
        var onOut = function (target) {
            target.fill = "white";
            target.stroke = "rgba(0,0,0,0)";
        };
        var onClick = function (target) {
            var txt = game.add.text(game.world.centerX, game.world.centerY, 'Game ID: ' + this.gameRoom, {
                font: '30pt OR',
                fill: 'white',
                align: 'center',
                stroke: 'rgba(0,0,0,0)',
                strokeThickness: 4
            });
            txt.anchor.setTo(0.5, 0.5);


            if (this.playerCount > 1) {
                this.addMenuStart();
            }
            target.destroy();
        }.bind(this);

        txt.stroke = "rgba(0,0,0,0";
        txt.strokeThickness = 4;
        txt.inputEnabled = true;
        txt.events.onInputUp.add(onClick);
        txt.events.onInputOver.add(onOver);
        txt.events.onInputOut.add(onOut);
        game.add.existing(txt);
        return txt;
    },
    createGame: function() {
        // Set gameRoom
        var tempGameRoom = Math.floor((Math.random() * 10000) + 10000);

        // Set viewerId
        var tempViewerId = Math.floor((Math.random() * 10000) + 10000);

        socket.emit('create-game', {gameRoom: tempGameRoom, viewerId: tempViewerId});
    },
    addMenuStart: function() {
        var optionStyle = { font: '30pt OR', fill: 'white', align: 'left', stroke: 'rgba(0,0,0,0)', srokeThickness: 4};
        var txt = game.add.text(game.world.centerX, game.world.centerY + 100, 'Start Game ', optionStyle);
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
            socket.emit('game-started', {gameRoom: this.gameRoom});
            game.state.start('Game', true, false, this.playerCount);
        }.bind(this);
        txt.stroke = "rgba(0,0,0,0";
        txt.strokeThickness = 4;
        txt.inputEnabled = true;
        txt.events.onInputUp.add(onClick);
        txt.events.onInputOver.add(onOver);
        txt.events.onInputOut.add(onOut);
    },
    addPlayerBox: function() {
        if (this.playerCount === 1) {
            var tank1 = game.add.sprite(game.world.width / 8, game.world.height * 0.8, 'tank0');
            tank1.anchor.setTo(0.5, 0.5);
            tank1.scale.setTo(2);
            tank1.tint = 0x00cc00;
        } else if (this.playerCount === 2) {
            var tank2 = game.add.sprite(game.world.width / 2 - game.world.width / 8, game.world.height * 0.8, 'tank1');
            tank2.anchor.setTo(0.5, 0.5);
            tank2.scale.setTo(2);
            tank2.tint = 0x1a75ff;

        } else if (this.playerCount === 3) {
            var tank3 = game.add.sprite(game.world.width / 2 + game.world.width /8, game.world.height * 0.8, 'tank2');
            tank3.anchor.setTo(0.5, 0.5);
            tank3.scale.setTo(2);
            tank3.tint = 0xe5e600;

        } else {
            var tank4 = game.add.sprite(game.world.width * 0.875, game.world.height * 0.8, 'tank3');
            tank4.anchor.setTo(0.5, 0.5);
            tank4.scale.setTo(2);
            tank4.tint = 0xe67300;

        }
    },
    preload: function () {

    },
    update: function() {

    }
};

function multiView(id) {
    socket.emit('multi-view', id);
    socket.on('multi-view', function(playerCount) {
        socket.emit('end-game', self.gameRoom)
        playerCount ? self.playerCount = playerCount : self.playerCount = 0;
    });
    socket.on('game-started', function() {
        console.log('game-started event');
        game.state.start('Game', true, false, self.playerCount);
    });
}
