// // Including libraries

// var app = require('http').createServer(handler),
// 	io = require('socket.io').listen(app),
// 	static = require('node-static'); // for serving files

// // This will make all the files in the current folder
// // accessible from the web
// var fileServer = new static.Server('./');
	
// // This is the port for our web server.
// // you will need to go to http://localhost:8080 to see it
// app.listen(8080);

// // If the URL of the socket server is opened in a browser
// function handler (request, response) {

// 	request.addListener('end', function () {
//         fileServer.serve(request, response);
//     });
// }

// // Delete this row if you want to see debug messages
// //io.set('log level', 1);

// // Listen for incoming connections from clients
// io.sockets.on('connection', function (socket) {

// 	// Start listening for mouse move events
// 	socket.on('mousemove', function (data) {
		
// 		// This line sends the event (broadcasts it)
// 		// to everyone except the originating client.
// 		socket.broadcast.emit('moving', data);
// 	});
// });


// PORT TO EXPRESS
var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');
var Game = require('./Game');
var games = [];
var socketDict = {};
server.listen(process.env.PORT || 8080);
app.use(express.static(__dirname + '/public'));

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
  	var id = socket.id;
  	socketDict[id]=  game;
  });
  socket.on('mousemove', function (data) {
    console.log(data);

    var game = socketDict[socket.id];
    if(typeof game != 'undefined'){
    	game.mouseMove(socket, data);
    }
    //socket.broadcast.emit('moving', data);
  });
});