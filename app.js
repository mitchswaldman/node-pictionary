// PORT TO EXPRESS
var express = require('express');
var app = require('express')();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');
var mongoose = require('mongoose');
var Game = require('./Game');
var games = [];
var socketDict = {};
var database = require('./Database');
var wordRetrival = require('./word-retrival');
server.listen(process.env.PORT || 8080);

app.use(express.static(__dirname + '/public'));

var db = new database();
db.connectTo();

app.get('/', function (req, res) {
  res.sendFile('/index.html');
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });

  socket.on('signon', function(data){
  	console.log("User signed on: " + data.username);
  	var game = _.find(games, function(game){return game.hasRoom;});
  	if(typeof game == 'undefined') {
  		game = new Game();
  		games.push(game);
  	}
  	game.addMember(socket, data.username);
  	socketDict[socket.id]=  game;
  });

  socket.on('error', function(data){
  	console.log(data);
  });

  socket.on('disconnect', function(data){
  	var game = socketDict[socket.id];
  	if(typeof game != 'undefined') {
	  	game.dropMember(socket);
	  	game.gamePause();
  	}
  });

  socket.on('guess', function(data){
  	var game = socketDict[socket.id];
  	if(typeof game != 'undefined') {
  		game.checkGuess(socket, data);
  	}
  });

  socket.on('snapshot', function(data){
  	var game = socketDict[socket.id];
  	if(typeof game != 'undefined') {
  		game.storeSnapshot(socket, data);
  	}
  });

  socket.on('clearcanvas', function(data){
    var game = socketDict[socket.id];
    if(typeof game != 'undefined') {
      game.clearCanvas(socket, data);
    }
  });

  socket.on('mousemove', function (data) {
    //console.log(data);

    var game = socketDict[socket.id];
    if(typeof game != 'undefined'){
    	game.mouseMove(socket, data);
    }
    //socket.broadcast.emit('moving', data);
  });
});