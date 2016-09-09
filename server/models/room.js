var Game = require('./hangmangame.js');
var uuid = require('node-uuid');

function nullCallback () {
  return;
}

var Room = {};

Room.create = function () {
  //creates closures, aka private varibles:
  var id = uuid.v4();
  var playersById = {};
  var cooldownDuration = 1000;
  var cooldowns = {}; // stores cooldowns by player id
  var game = null; // current game
  var onCorrectGuessCallback = nullCallback;
  var onIncorrectGuessCallback = nullCallback;
  var onCooldownCallback = nullCallback;
  var onWinCallback = nullCallback;
  var onLoseCallback = nullCallback;
  //creates the room itself
  var room = {
    /*returns the UUID of the room/game */
    getId: function () {
      return id;
    },
    /*returns the UUID of the players in the room */
    getPlayers: function () {
      return Object.keys(playersById).map(id => playersById[id]);
    },
    join: function (player) {
      playersById[player.getId()] = player;
      cooldowns[player.getId()] = 0;
    },
    leave: function (socketId) {
      for (var id in playersById) {
        if (playersById[id].id === socketId) {
          delete playersById[id];
        }
      }
    },
    getGame: function () {
      return game;
    },
    /*starts a new game with a solution */
    newGame: function (solution) {
      room.resetCooldowns(); 
      console.log('Solution new room:',solution); // for testing showing the solution for the new game 
      game = Game.create(solution);
    },
    /*on guess of letter and the player who guessed it */
    guessLetter: function (player, letter) {
      // Invoke onCooldownCallback and return early if cooldown hasn't expired
      if (cooldowns[player.getId()] > Date.now()) {
        onCooldownCallback(player, cooldowns[player.getId()]);
        return;
      }
      // Return early if letter has already been guessed
      if (game.hasBeenGuessed(letter)) {
        return;
      }
      // Update cooldown
      var cooldown = Date.now() + cooldownDuration;
      cooldowns[player.getId()] = cooldown;
      if (game.guessLetter(letter)) {
        if (game.isWon()) {
          onWinCallback(player);
        } else {
          onCorrectGuessCallback(player, letter, cooldown);
        }
      } else {
        if (game.isLoss()) {
          onLoseCallback(player);
        } else {
          onIncorrectGuessCallback(player, letter, cooldown);
        }
      }
    },
    /*resets Cooldowns for all*/
    resetCooldowns: function () {
      for (var playerId in cooldowns) {
        cooldowns[playerId] = 0;
      }
    },
    /*resets Cooldowns for player by id*/
    getCooldownByPlayerId: function (playerId) {
      return cooldowns[playerId];
    },
    // Event Listeners
    onPlayerJoin: function (callback) {
      onPlayerJoinCallback
    },
    onCorrectGuess: function (callback) {
      onCorrectGuessCallback = callback;
    },
    onIncorrectGuess: function (callback) {
      onIncorrectGuessCallback = callback;
    },
    onCooldown: function (callback) {
      onCooldownCallback = callback;
    },
    onWin: function (callback) {
      onWinCallback = callback;
    },
    onLose: function (callback) {
      onLoseCallback = callback;
    }
  };
  return room;
}

module.exports = Room;
