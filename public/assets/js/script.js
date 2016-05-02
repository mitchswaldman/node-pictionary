$(function(){
	$('#user_message').hide(0);
	$('#imageContainer').hide(0);
	// This demo depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))){
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}


	// The URL of your web server (the port is set in app.js)
	var url = 'http://localhost:8080';

	var doc = $(document),
		win = $(window),
		canvas = $('#paper'),
		ctx = canvas[0].getContext('2d'),
		instructions = $('#instructions'),
		username_entry = $('#username_entry'),
		username_button = $('#username_button'),
        timer = $('#timer'),
        wordBox = $('#draw'),
        guess_word = $('#guess_word'),
        guess_button = $('#guess_button');
	

	//Set canvas to match window
	var cvs = document.getElementById('paper');
	cvs.width = window.innerWidth;
	cvs.style.width = window.innerWidth;
	cvs.height = window.innerHeight;
	cvs.style.height = window.innerHeight;

	//Set image container to same height as canvas
	$('#imageContainer').css({top: $('#mainBar').position().top + $('#mainBar').height()});

	// Generate an unique ID
	var id = Math.round($.now()*Math.random());
	
	// A flag for drawing activity
	var drawing = false;
	var currentUserIsDrawer = false;
	var clients = {};
	var cursors = {};

	var socket = io.connect('/');
	var client;
	var roundDuration;
	socket.on('roundstart', function(data){
		$('#imageContainer').hide(100);
		roundDuration = data.roundDuration;
        // Find client
        _.find(data.game.teams, function(team){
            return _.find(team.members, function(member){
                if (member.socketId.includes(socket.id)) {
                    return client = member;
                }
            });
        });
        console.log(client);
		// update a div with team.score
		// can get a reference to the member object
		// if(member.isDrawer) enable the canvas.
        ctx.clearRect(0, 0, canvas.width(), canvas.height()); // Hard-coded length and width for now.
        if(client.isDrawer) {
        	$('#drawOrGuessHeader').html('Draw');
            $('#guessInput').hide();
            $('#guess_button').hide();
            $('#word').show();
        }
        else {
            $('#drawOrGuessHeader').html('Guess');
            $('#word').hide();
            $('#guessInput').show();
            $('#guess_button').show();
        }
        $('#word').html(data.game.word);
        $('#message').html('Ready?');
        $('#user_message').show(1000);
        // update scores
		console.log('round start');
		console.log(data);
	});

	socket.on('gamepause', function(data){
        $('#time').html('0');
        $('#message').html('Someone left the room. Hold on. This round won\'t count towards the score.');
        $('#user_message').show(1000);
        ctx.clearRect(0, 0, canvas.width(), canvas.height());
        console.log('game pause');
		console.log(data);
	});

	socket.on('roundover', function(data){
        // broadcast snapshot for drawing client
        $('#message').html('Stop!\n The correct word was: ' + data.game.word+'.\nThe winning team is: ' + (data.winningTeam ? data.winningTeam : 'No one. You all suck.'));
        $('#user_message').show(500);
        var team = _.find(data.game.teams, function(team){
            return _.some(team.members, function(member){
                return member.socketId.includes(socket.id);
            });
        });
        if(client.isDrawer){
	        var imgData = document.getElementById('paper').toDataURL();
	        socket.emit('snapshot', {snapshot : imgData});
	        console.log(imgData);
    	}	
        $('#score').html(team.score);
		console.log('round over');
		console.log(data);
	});

	socket.on('gametime', function(data){
		if(data.secondsLeft == roundDuration){
			$('#message').html(client.isDrawer ? 'Draw!' : 'Guess!');
			$('#user_message').hide(1000);
		}
        document.getElementById('time').innerHTML = data.secondsLeft;
		console.log('game time');
		console.log(data);
	});

	socket.on('drawingreview', function(data){
		ctx.clearRect(0, 0, canvas.width(), canvas.height()); 
        // display drawings on canvas
        // clear canvas
        //$('#imageContainer').show({duration: 1000, complete: function(){setTimeout($('#imageContainer').hide(1000), 5000);}});
        $('#imageContainer').show(1000);

        var blueImage = document.getElementById('blueTeamImage');
        blueImage.src = data["Blue Team"].snapshot;
        var redImage =document.getElementById('redTeamImage');
        redImage.src = data["Red Team"].snapshot;
        var canvasRatio = 2.1;
        blueImage.width = canvas.width() / canvasRatio;
        blueImage.height = canvas.height() / canvasRatio;
        redImage.width = canvas.width() / canvasRatio;
        redImage.height = canvas.height() / canvasRatio;
		console.log('drawing review');
		console.log(data);
	});

	socket.on('gameover', function(data){
        // broadcast snapshot for drawing client
        $('#message').html('Stop!\n The correct word was: ' + data.game.word+'.\nThe winner of the game is: ' + (data.winningTeam ? data.winningTeam : 'No one. You all suck.'));
        $('#user_message').show(500);
        var team = _.find(data.game.teams, function(team){
            return _.some(team.members, function(member){
                return member.socketId.includes(socket.id);
            });
        });
        if(client.isDrawer){
	        var imgData = document.getElementById('paper').toDataURL();
	        socket.emit('snapshot', {snapshot : imgData});
	        console.log(imgData);
    	}	
        $('#score').html(team.score);
		console.log('gameover');
		console.log(data);
	});

	socket.on('moving', function (data) {
		
		if(! (data.id in clients)){
			// a new user has come online. create a cursor for them
			cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
		}
		
		// Move the mouse pointer
		cursors[data.id].css({
			'left' : data.x,
			'top' : data.y
		});
		
		// Is the user drawing?
		if(data.drawing && clients[data.id]){
			
			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer
			
			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
		}
		
		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	});

	var prev = {};
	
	canvas.on('mousedown',function(e){
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;
		
		// Hide the instructions
		instructions.fadeOut();
	});
	
	doc.bind('mouseup mouseleave',function(){
		drawing = false;
	});

	var lastEmit = $.now();

	doc.on('mousemove',function(e){
		if(client && !client.isDrawer) return;
		if($.now() - lastEmit > 30){
			socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'id': id
			});
			lastEmit = $.now();
		}
		
		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above
		
		if(drawing){
			
			drawLine(prev.x, prev.y, e.pageX, e.pageY);
			
			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});

	username_button.on('click', function(e){
		var username = $('input[name="username"]').val();
		socket.emit('signon', {username: username});
		username_entry.fadeOut();
	});
    
    guess_button.on('click', function(e) {
        var guess = $('input[name="guess"]').val();
        socket.emit('guess', {guess: guess});
    });
    
	// Remove inactive clients after 10 seconds of inactivity
	setInterval(function(){
		
		for(ident in clients){
			if($.now() - clients[ident].updated > 10000){
				
				// Last update was more than 10 seconds ago. 
				// This user has probably closed the page
				
				cursors[ident].remove();
				delete clients[ident];
				delete cursors[ident];
			}
		}
		
	},10000);

	function drawLine(fromx, fromy, tox, toy){
        ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
        ctx.closePath();
	}

});