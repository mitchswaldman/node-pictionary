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
var bodyParser = require('body-parser');
// var methodOverride = ('methodOverride');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var _ = require('underscore');
var mongoose = require('mongoose');
var URL = 'mongodb://172username:172password@ec2-52-32-28-93.us-west-2.compute.amazonaws.com:27017/pictionarydb';
var Game = require('./Game');
var games = [];
var socketDict = {};
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var Schema_Word = new mongoose.Schema({
    _id     : ObjectId,
    word_id : Number,
    word    : String
});
server.listen(process.env.PORT || 8080);

// app.use(express.bodyParser());
// app.use(express.methodOverride());
app.use(express.static(__dirname + '/public'));

mongoose.connect(URL);
// CONNECTION EVENTS // When successfully connected 
mongoose.connection.on('connected', function () { console.log('Mongoose default connection open to ' + URL); }); 
// If the connection throws an error 
mongoose.connection.on('error',function (err) { console.log('Mongoose default connection error: ' + err); }); 
// When the connection is disconnected 
mongoose.connection.on('disconnected', function () { console.log('Mongoose default connection disconnected'); });

mongoose.connection.once('open', function(){
    console.log("CONNECTED");
    var collection = mongoose.model('pictionary_collection', Schema_Word, 'pictionary_collection');
    collection.find(function(err, word){
        if (err) {
            console.log(err);
        } 
        console.log(word);
    });
});
console.log(mongoose.connection.readyState);

// app.get('/', function(req, res){
    
// });
// var data = collection.find({});
// console.log(data);

// collection.find({}, function(err, words) {
//     if (err) {
//         console.log("ERROR!!");
//     }
//         console.log(words);
// });

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

  socket.on('snapshot', function(data){
  	var game = socketDict[socket.id];
  	if(typeof game != 'undefined') {
  		game.storeSnapshot(socket, data);
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