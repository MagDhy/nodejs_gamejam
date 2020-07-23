let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io').listen(server);

let players = {};

//star collectibles position and scores of the players
let star = {
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 700) + 50
};
let scores = {
    blue: 0,
    red: 0
};

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log('a user connected');

    players[socket.id] = {  //create new player and add it to the players object
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
    };
    //send the players object to the new player
    socket.emit('currentPlayers', players);
    //send the star object to the new player
    socket.emit('starLocation', star);
    //send the current scores
    socket.emit('scoreUpdate', scores);
    //update the new player to all the players
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('disconnect', function() {
        console.log('user disconnected');
        delete players[socket.id]; //remove the player from the players object
        io.emit('disconnect', socket.id);  //emit a message to all the players to remove the player
    });

    socket.on('playerMovement', function(movementData) {
        //when a player moves update the player data
        players[socket.id].x = movementData.x;
        players[socket.id].y = movementData.y;
        players[socket.id].rotation = movementData.rotation;
        //emit a message to all players about the player that moved
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });
    socket.on('starCollected', function () {
        if (players[socket.id].team === 'red') {
            scores.red += 10;
        } else {
            scores.blue += 10;
        }
        star.x = Math.floor(Math.random() * 700) + 50;
        star.y = Math.floor(Math.random() * 500) + 50;
        io.emit('starLocation', star);
        io.emit('scoreUpdate', scores);
    });
});

server.listen(8080, function() {
    console.log(`Listening on ${server.address().port}`);
});