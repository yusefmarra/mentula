var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
// var mongoose = require('mongoose');

var app = express();

// *** Models *** //
// require('./models/user');
// var User = mongoose.model('users');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

app.use(express.static(path.join(__dirname, '../client/public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../client', 'public', 'index.html'));
});

app.get('/controller', function(req, res) {
  //Serve up phone page here.
  res.sendFile(path.join(__dirname, '../client', 'public', 'controller.html'));
});


//** SOCKET.IO STUFFS **//
var io = require('socket.io')(server);

// object to keep track of game rooms and viewerIDs
var rooms = {};

io.on('connection', function(socket){
    // new-player emit comes from controller after entering unique game code
    socket.on('new-player', function(data) {
        // if game room does not exist or the game has already start, do not let the player join.
        if (!rooms[data.gameRoom] || rooms[data.gameRoom].started) {
            socket.emit('invalid-room');
        } else {
            // socket.join(data.gameRoom);
            socket.room = data.gameRoom;

            //check to see how many players have joined the game room
            if (rooms[data.gameRoom].players) {
              rooms[data.gameRoom].players++;
            } else {
              rooms[data.gameRoom].players = 1;
            }
            console.log('Phone Controller: room ' + data.gameRoom)
            io.sockets.in(rooms[socket.room].id).emit('player-joined', rooms[data.gameRoom].players);
            //send unqiue player identifier to controller
            socket.emit('success-join', rooms[data.gameRoom].players - 1);

            // check to see if there is more than one player, to start the game then emits start-game event to viewer
            if (rooms[data.gameRoom].players >= 1) {
              io.sockets.in(rooms[socket.room].id).emit('start-game');
            }
        }
    });

    socket.on('gamepad-player', function(data) {
        if (rooms[data.gameRoom].players) {
            rooms[data.gameRoom].players++;
        } else {
            rooms[data.gameRoom].players = 1;
        }
        console.log('Gamepad: room ' + data.gameRoom);
        console.log(rooms[socket.room]);
        io.sockets.in(rooms[data.gameRoom].id).emit('player-joined', rooms[data.gameRoom].players);
    });


    // listens for game-update from controller and emits update to viewer
    socket.on('game-update', function(data) {
        if (rooms[socket.room]) {
            io.sockets.in(rooms[socket.room].id).emit('game-update', data);
        }
    });

    // listens for create-game from viewer and creates a unique game room on the server
    socket.on('create-game', function(data) {
        // data.gameRoom & data.viewerId
        if (!rooms[data.gameRoom]) {
            console.log('Creating Game: ' + data.gameRoom);
            rooms[data.gameRoom] = {id:data.viewerId};
            rooms[data.gameRoom].started = false;
            socket.join(data.viewerId);
            socket.emit('success-create', data);
        } else {
            socket.emit('invalid-room');
        }
    });

    socket.on('game-started', function(data) {
        console.log('Starting Game Number: ', data.gameRoom);
        rooms[data.gameRoom].started = true;
        io.sockets.in(rooms[data.gameRoom].id).emit('game-started');
    });

    socket.on('multi-view', function(id) {
        socket.join(rooms[id].id);
        socket.emit('multi-view', rooms[id].players);
    });

    socket.on('end-game', function(id) {
        console.log('Ending Game: ', id);
        rooms[id] = null;
    });

    // socket.on('disconnect', function() {
    //     if (socket.room) {
    //         io.sockets.in(rooms[socket.room].id).emit('player-left');
    //         rooms[socket.room].players--;
    //     }
    // });

});


module.exports = app;
