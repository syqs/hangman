// Automatically join the room on connection
var Room = require('../models/room.js');
var Bing = require('../models/bingAPI.js');

var RoomController = {};

RoomController.create = function (io) {
  var room = Room.create();
  console.log("Creating new room with ID:", room.getId());
  var restartDelay = 30000;
  var imageUrl = null;


  // wordGenerator is used to create new Games, should be set in setWordGenerator
  var wordGenerator = function () {
    return '';
  };

  // Setup Controller's Public API
  var controller = {
    newGame: function (solution) {
      var word = solution !== undefined ? solution : wordGenerator();
      Bing.getImage(word, function(url){
        io.in(room.getId()).emit('getImageUrl', { url: url });
      });
      room.newGame(word);
    },
    //Generates new word
    setWordGenerator: function (fn) {
      wordGenerator = fn;
    },
    //sets delay before game for anamations and loading time
    setRestartDelay: function (delay) {
      restartDelay = delay;
    },
    // returns the room at current state
    getRoom: function () {
      return room;
    },
    // allows user to join, 
    // TODO:
    // allow more then 1 user to join a game
    join: function (player) {
      room.join(player); //adds current player to room
      var socket = player.getSocket();
      socket.join(room.getId());
      // Configure Events
      socket.on('disconnect', function () {
          // Leave our Room model
          room.leave(socket.id);
          // Broadcast a playerLeaveRoom event to other sockets
          console.log("player left:", room.getId()) //tells player left
          io.in(room.getId()).emit('playerLeaveRoom', { playerId: player.getId(), roomId:room.getId()});
      });

      socket.on('guessLetter', function (data) {
        room.guessLetter(player, data.letter);
      });

      // Send initial Events
      socket.emit('enterRoom', {
        playerId: player.getId(),
        gameState: room.getGame().getState(),
        players: room.getPlayers().map(function (player) {
          return player.getId();
        }),
        roomId: room.getId()
      });
      
      socket.broadcast.to(room.getId())
        .emit('playerEnterRoom', { playerId: player.getId(), roomId:room.getId() });

    }
  }

  // Configure Room Events
  room.onCorrectGuess(function (player, letter, cooldown) {
    io.in(room.getId()).emit('correctGuess', {
      playerId: player.getId(),
      coolDown: cooldown,
      gameState: room.getGame().getState(),
    });
  });

  room.onIncorrectGuess(function (player, letter, cooldown) {
    io.in(room.getId()).emit('incorrectGuess', {
      playerId: player.getId(),
      coolDown: cooldown,
      gameState: room.getGame().getState(),
    });
  });
  //starts the game and emits it to API
  var startGameAfterRestartDelay = function () {
    setTimeout(function () {
      controller.newGame();
      io.emit('startGame', {
        gameState: room.getGame().getState(), 
      });
    }, restartDelay);
  }
  // emits win and resets all the game states
  room.onWin(function (player) {
    io.in(room.getId()).emit('win', {
      playerId: player.getId(),
      gameState: room.getGame().getState(),
      timeUntilNextGame: restartDelay + Date.now()
    });
    startGameAfterRestartDelay();
  });
  // emit lose and resets all the game states
  room.onLose(function (player) {
    io.in(room.getId()).emit('loss', {
      playerId: player.getId(),
      gameState: room.getGame().getState(),
      timeUntilNextGame: restartDelay + Date.now()
    });
    startGameAfterRestartDelay();
  })

  return controller;
}

module.exports = RoomController;
