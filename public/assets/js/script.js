$(function(){

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
	
	// Generate an unique ID
	var id = Math.round($.now()*Math.random());
	
	// A flag for drawing activity
	var drawing = false;
	var currentUserIsDrawer = false;
	var clients = {};
	var cursors = {};

	var socket = io.connect('/');
	var client;
	socket.on('roundstart', function(data){
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
        // update scores
		console.log('round start');
		console.log(data);
	});

	socket.on('gamepause', function(data){
        document.getElementById('time').innerHTML = '';
        ctx.clearRect(0, 0, canvas.width(), canvas.height());
        console.log('game pause');
		console.log(data);
	});

	socket.on('roundover', function(data){
        // broadcast snapshot for drawing client
		console.log('round over');
		console.log(data);
	});

	socket.on('gametime', function(data){
        document.getElementById('time').innerHTML = data.secondsLeft;
		console.log('game time');
		console.log(data);
	});

	socket.on('drawingreview', function(data){
        // display drawings on canvas
        // clear canvas
		console.log('drawing review');
		console.log(data);
	});

	socket.on('gameover', function(data){
        // broadcast snapshot 
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