var chai = require('chai');
var expect = chai.expect;
var Room = require('../../server/models/room.js');
var Player = require('../../server/models/player.js');
var Room = require('../../server/models/room.js');

describe("Room", function () {
  describe("create", function () {
    it('should create a new Room', function () {
      var room = Room.create();
      expect(room).to.be.defined;
      expect(room).to.be.an('object');
    });
  });

  describe("getId", function () {
    it("should return the Room's Id", function () {
      var room = Room.create();
      expect(room.getId()).to.be.a('string');
    });
  });

  describe("getPlayers", function () {
    it("should return a list of Players in the room", function () {
      var room = Room.create();
      expect(room.getPlayers()).to.deep.equal([]);
    });
  });

  describe("join", function () {
    it("should add a Player to the Room", function () {
      var room = Room.create();
      var player = Player.create();
      room.join(player);
      // expect(room.getPlayers()).to.deep.equal([player]);
      expect(room.getPlayers()).to.deep.equal([player]);
    });
  });

  describe("leave", function () {
    it("should remove a Player with given socket Id from Room", function () {
      var room = Room.create();
      var player = Player.create({ id: 1 });
      room.join(player);
      room.leave(1);
      expect(room.getPlayers()).to.deep.equal([]);
    });
  });

  describe("getGame", function () {
    it("should return null if no game has started", function () {
      var room = Room.create();
      expect(room.getGame).to.be.a('function');
      expect(room.getGame()).to.equal(null);
    });
  });

  describe("newGame", function () {
    it("should start a new Game`", function () {
      var room = Room.create();
      room.newGame('monday');
      expect(room.newGame).to.be.a('function');
      expect(room.getGame()).to.be.an('object');
      expect(room.getGame().getWord()).to.deep.equal([null, null, null, null, null, null]);
    });
    it("should reset all player cooldowns", function () {
      var room = Room.create();
      room.newGame('monday');
      var player = Player.create();
      room.join(player);
      room.guessLetter(player, 'x');
      var cooldown = room.getCooldownByPlayerId(player.getId());
      expect(cooldown).to.be.above(Date.now());
      room.newGame('tuesday');
      var cooldown2 = room.getCooldownByPlayerId(player.getId());
      expect(cooldown2).to.not.equal(cooldown);
    });
  });


  describe("guessLetter", function () {
    var room;
    var player;
    beforeEach(function () {
      room = Room.create();
      player = Player.create();
      room.join(player);
      room.newGame('food');
    });

    it("should allow a player to guess a letter", function () {
      room.guessLetter(player, 'o');
      expect(room.getGame().getWord()).to.deep.equal([null, 'o', 'o', null]);
    });

    it("should fire onCorrectGuess callback with player, letter, and cooldown on a good guess", function (done) {
      room.onCorrectGuess(function (guessingPlayer, guessedLetter, cooldown) {
        expect(guessingPlayer).to.equal(player);
        expect(guessedLetter).to.equal('f');
        expect(cooldown).to.be.above(Date.now());
        done();
      });
      room.guessLetter(player, 'f');
    });

    it("should not fire onCorrectGuess callback if letter already guessed", function () {
      var player2 = Player.create();
      room.join(player2);
      var ncalls = 0;
      room.onCorrectGuess(function (guessingPlayer, guessedLetter, cooldown) {
        ncalls += 1;
      });
      room.guessLetter(player, 'f');
      room.guessLetter(player2, 'f'); // guess the same letter
      expect(ncalls).to.equal(1);
    });

    it("should fire onIncorrectGuess callback with player, letter, and cooldown on an incorrect guess", function (done) {
      room.onIncorrectGuess(function (guessingPlayer, guessedLetter, cooldown) {
        expect(guessingPlayer).to.equal(player);
        expect(guessedLetter).to.equal('x');
        expect(cooldown).to.be.above(Date.now());
        done();
      });
      room.guessLetter(player, 'x');
    });

    it("should fire onCooldown callback with player and timestamp when player guesses before cooldown has expired", function (done) {
      room.onCooldown(function (coolingPlayer, cooldown) {
        expect(coolingPlayer).to.be.equal(player);
        expect(cooldown).to.be.above(Date.now());
        done();
      });
      room.guessLetter(player, 'f');
      room.guessLetter(player, 'x');

    });
  });

  describe("getCooldownByPlayerId", function () {
    var room;
    var player;
    beforeEach(function () {
      room = Room.create();
      player = Player.create();
      room.join(player);
      room.newGame('food');
    });

    it("should return a timestamp before now if player has not guessed", function () {
      var cooldown = room.getCooldownByPlayerId(player.getId());
      expect(cooldown).to.be.a('number');
      expect(cooldown).to.be.below(Date.now());
    });

    it("should return a timestamp after now right after a player's guess", function () {
      room.guessLetter(player, 'f');
      var cooldown = room.getCooldownByPlayerId(player.getId());
      expect(cooldown).to.be.above(Date.now());
    });
  });

  describe("End of game", function () {
    var room;
    var player;
    beforeEach(function () {
      room = Room.create();
      player = Player.create();
      room.join(player);
      room.newGame('a');
    });
    describe("onWin", function () {
      it("should fire onWinCallback with winning player when game is won", function (done) {
        room.onWin(function (winner) {
          expect(winner).to.equal(player);
          done();
        });
        room.guessLetter(player, 'a');
      });
    });
    describe("onLose", function () {
      it("should fire onLoseCallback with losing player when a game is lost", function (done) {
        room.onLose(function (loser) {
          expect(loser).to.equal(player6);
          done();
        });
        var player2 = Player.create();
        room.join(player2);
        var player3 = Player.create();
        room.join(player3);
        var player4 = Player.create();
        room.join(player4);
        var player5 = Player.create();
        room.join(player5);
        var player6 = Player.create();
        room.join(player6);
        room.guessLetter(player,  'q');
        room.guessLetter(player2, 'w');
        room.guessLetter(player3, 'e');
        room.guessLetter(player4, 'r');
        room.guessLetter(player5, 't');
        room.guessLetter(player6, 'y');
      });
    });
  });

});
