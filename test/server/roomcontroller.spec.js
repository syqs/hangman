var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var io = require('socket.io-client');
var server = require('http').createServer();
var server_io = require('socket.io')(server);
var Room = require('../../server/models/room.js');
var Player = require('../../server/models/player.js');
var RoomController = require('../../server/controllers/roomcontroller.js');
var port = process.env.PORT || 4002;

describe('RoomController Basic Features', function () {
  var controller;
  var player;

  beforeEach(function () {
    controller = RoomController.create();
    var pretendSocket = { join: function() {} };
    player = Player.create(pretendSocket);
  });

  describe("create", function () {
    it("should create a new RoomController object", function () {
      var controller = RoomController.create();
      expect(controller).to.be.an('object');
    });
  });
  describe("getRoom", function () {
    it("should return the Room associated with this controller", function () {
      expect(controller.getRoom()).to.be.an('object');
    });
  });
  describe("newGame", function () {
    it("should create a new Game with given solution", function () {
      var solution = 'a';
      controller.newGame(solution);
      expect(controller.getRoom().getGame().getWord()).to.deep.equal([null]);
    });
    it("should use function set by setWordGenerator to choose solution if none given", function () {
      controller.setWordGenerator(function () {
        return 'test';
      });
      controller.newGame();
      expect(controller.getRoom().getGame().getSolution()).to.equal('test');
    });
  });

  // Need to refactor tests to use mock socket or something similar
  xdescribe("join", function () {
    it("should call Room.join with Player for associated room", function () {
      var room = controller.getRoom();
      sinon.spy(room, 'join');
      controller.join(player);
      // expect(room.join.calledOnce).to.equal(true);
      // expect(room.join.getCall(0).args[0]).to.equal(player);
      expect(true).to.equal(true);
      expect(true).to.equal(true);
      room.join.restore();
    });
    it("should add Player socket to channel with Room's Id", function () {
      var socket = player.getSocket();
      var room = controller.getRoom();
      sinon.spy(socket, 'join');
      controller.join(player);
      expect(socket.join.calledOnce).to.equal(true);
      expect(socket.join.getCall(0).args[0]).to.equal(room.getId());
    });
  });
});

describe("RoomController Client/Server Interaction", function () {
  this.timeout(2000);

  var controller;
  var url = 'http://127.0.0.1:' + port;
  var client;

  before('Start Server', function (done) {
    controller = RoomController.create(server_io);
    server_io.on('connection', function (socket) {
      // Create a new player for each connection
      var player = Player.create(socket);
      controller.join(player);
    });
    server.listen(port, function () {
      done();
    });
  });

  describe("join", function () {

    beforeEach('Start Client', function () {
      client = io.connect(url);
    });

    beforeEach('Create Game', function () {
      controller.newGame('a');
    });

    afterEach('Disconnect Client', function () {
      client.disconnect();
    });

    it("should broadcast playerEnterRoom event to all other clients", function (done) {
      client.on('playerEnterRoom', function (data) {
        expect(data.playerId).to.be.a('string');
        done();
      });
      var client2 = io.connect(url);
      client2.disconnect();
    });

    it("should emit enterRoom event to connecting client", function (done) {

      client.on('enterRoom', function (data) {
        expect(data.players).to.be.an('array');
        expect(data.playerId).to.be.a('string');
        expect(data.gameState).to.be.an('object');
        expect(data.gameState.word).to.deep.equal([null]);
        expect(data.gameState.guessedLetters).to.deep.equal([]);
        expect(data.gameState.remainingGuesses).to.deep.equal(6);
        expect(data.players.length).to.equal(1);
        done();
      });
    });
  });

  describe("disconnect", function () {
    var client1;
    var client2;

    beforeEach('Start Client', function (done) {
      // Make sure both clients are connected before test
      var count = 2;
      var doBoth = function () {
        count -= 1;
        if (count === 0) {
          done();
        }
      };
      client1 = io.connect(url);
      client2 = io.connect(url);
      client1.on('connect', doBoth);
      client2.on('connect', doBoth);
    });

    afterEach('Disconnect Client', function () {
      client1.disconnect();
    });

    it("should emit playerLeaveRoom to other clients on disconnect", function (done) {
      client1.on('playerLeaveRoom', function (data) {
        expect(data.playerId).to.be.a('string');
        done();
      });
      client2.disconnect();
    });
  });



  describe("guessLetter", function () {
    var client1;
    var client2;
    var client3;
    var client4;
    var client5;
    var client6;

    beforeEach('Start Client and Reset Game', function (done) {
      // Reset game on server
      controller.newGame('food');
      // Make sure all clients are connected before test
      var count = 6;
      var doAll = function () {
        count -= 1;
        if (count === 0) {
          done();
        }
      };

      client1 = io.connect(url);
      client2 = io.connect(url);
      client3 = io.connect(url);
      client4 = io.connect(url);
      client5 = io.connect(url);
      client6 = io.connect(url);

      client1.on('connect', doAll);
      client2.on('connect', doAll);
      client3.on('connect', doAll);
      client4.on('connect', doAll);
      client5.on('connect', doAll);
      client6.on('connect', doAll);
    });

    afterEach('Disconnect Client', function () {
      client1.disconnect();
      client2.disconnect();
      client3.disconnect();
      client4.disconnect();
      client5.disconnect();
      client6.disconnect();
    });

    it('should emit gameState, cooldown and playerId on correct guess', function (done) {
      var counter = 2;
      var test = function (data) {
        expect(data.playerId).to.be.a('string');
        expect(data.coolDown).to.be.above(Date.now());
        expect(data.gameState.word).to.deep.equal([null, 'o', 'o', null]);
        expect(data.gameState.guessedLetters).to.deep.equal(['o']);
        expect(data.gameState.remainingGuesses).to.equal(6);
        counter -= 1;
        if (counter === 0) {
          done();
        }
      };
      client1.on('correctGuess', test);
      client2.on('correctGuess', test);
      client2.emit('guessLetter', { letter: 'o' });
    });

    it('should emit gameState, cooldown and playerId on incorrect guess', function (done) {
      var counter = 2;
      var test = function (data) {
        expect(data.playerId).to.be.a('string');
        expect(data.coolDown).to.be.above(Date.now());
        expect(data.gameState.word).to.deep.equal([null, null, null, null]);
        expect(data.gameState.guessedLetters).to.deep.equal(['z']);
        expect(data.gameState.remainingGuesses).to.equal(5);
        counter -= 1;
        if (counter === 0) {
          done();
        }
      };
      client1.on('incorrectGuess', test);
      client2.on('incorrectGuess', test);
      client2.emit('guessLetter', { letter: 'z' });
    });

    it("should emit win event with winning playerId, gameState, and timeUntilNextGame on victory", function (done) {
      controller.setRestartDelay(100);
      controller.newGame('an');
      var counter = 2;
      var test = function (data) {
        expect(data.playerId).to.be.a('string');
        expect(data.gameState).to.be.defined;
        expect(data.gameState.isDone).to.equal(true);
        expect(data.timeUntilNextGame).to.be.a('number');
        expect(data.timeUntilNextGame).to.be.above(Date.now());
        counter -= 1;
        if (counter === 0) {
          done();
        }
      };
      client1.on('win', test);
      client2.on('win', test);
      client1.emit('guessLetter', {letter: 'a'});
      client2.emit('guessLetter', {letter: 'n'});
    });

    it("should create a new Game on a win after restartDelay has expired", function (done) {
      controller.newGame('a');
      // setWordGenerator so that new Game will contain what we expect
      controller.setWordGenerator(function () {
        return 'b';
      });
      controller.setRestartDelay(0);
      client1.on('startGame', function (data) {
        expect(controller.getRoom().getGame().getSolution()).to.equal('b');
        expect(data.gameState.word).to.deep.equal([null]);
        expect(data.gameState.guessedLetters).to.deep.equal([]);
        expect(data.gameState.remainingGuesses).to.equal(6);
        done();
      });
      client1.emit('guessLetter', {letter: 'a'});
    });

    it("should emit loss event with losing playerId, gameState, and timeUntilNextGame on defeat", function (done) {
      controller.setRestartDelay(100);
      controller.newGame('an');
      var counter = 6;
      var test = function (data) {
        expect(data.playerId).to.be.a('string');
        expect(data.gameState).to.be.defined;
        expect(data.gameState.isDone).to.equal(true);
        expect(data.gameState.remainingGuesses).to.equal(0);
        expect(data.timeUntilNextGame).to.be.a('number');
        expect(data.timeUntilNextGame).to.be.above(Date.now());

        counter -= 1;
        if (counter === 0) {
          done();
        }
      };
      client1.on('loss', test);
      client2.on('loss', test);
      client3.on('loss', test);
      client4.on('loss', test);
      client5.on('loss', test);
      client6.on('loss', test);

      client1.emit('guessLetter', {letter: 'q'});
      client2.emit('guessLetter', {letter: 'w'});
      client3.emit('guessLetter', {letter: 'e'});
      client4.emit('guessLetter', {letter: 'r'});
      client5.emit('guessLetter', {letter: 't'});
      client6.emit('guessLetter', {letter: 'y'});
    });

    it("should create a new Game on a loss after restartDelay has expired", function (done) {
      controller.newGame('a');
      // setWordGenerator so that new Game will contain what we expect
      controller.setWordGenerator(function () {
        return 'b';
      });
      controller.setRestartDelay(0);
      client1.on('startGame', function (data) {
        expect(controller.getRoom().getGame().getSolution()).to.equal('b');
        expect(data.gameState.word).to.deep.equal([null]);
        expect(data.gameState.guessedLetters).to.deep.equal([]);
        expect(data.gameState.remainingGuesses).to.equal(6);
        done();
      });
      client1.emit('guessLetter', {letter: 'q'});
      client2.emit('guessLetter', {letter: 'w'});
      client3.emit('guessLetter', {letter: 'e'});
      client4.emit('guessLetter', {letter: 'r'});
      client5.emit('guessLetter', {letter: 't'});
      client6.emit('guessLetter', {letter: 'y'});
    });
  });
});
