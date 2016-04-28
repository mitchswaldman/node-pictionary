
var express = require('express');
var app = require('express')();
var bodyParser = require('body-parser');

var client = require('http').Client(app);
var io = require('socket.io')(client);
var cursors = {};
var users;

io.on('connection', function (socket) {
	socket.on('mousemove', function (data) {

`
	var game = socketDict[socket.id];
	if(typeof game != 'undefined'){
	game.mouseMove(socket, data);
	}
  });

        socket.on('roundstart', function(data){
	var game = socketDict[socket.id];
  	if(typeof game != 'countdown') {
	io.sockets.emit('mousemoving', data);
	socket.emit("ClientObj",{
	 x:number coordinate,
	 y:number coordinate,
	 drawing: true || false,
	 id: client id	
  	}
   });
	socket.on('roundover', function(data){
	var game = socketDict[socket.id];
	socket.broadcast.emit('snapshot', data);
	if(typeof game != 'undefined'){
	game.mouseMove(socket, data);
	}
	socket.emit('CanvasData',{
	canvasData: image data
	}
  });
});
