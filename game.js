var _ = require('underscore');

function Game(){
	this.id = Date.now();
	this.teams = [];
	this.winningTeam = null;
	this.scoreToWin = 25;
	this.hasRoom = true;
	this.word = "";
	this.memberSocketDict = {};
}

Game.MAX_TEAMS_PER_GAME = 2;
Game.MAX_MEMBERS_PER_TEAM = 2;
Game.ROUND_TIME = 10; //seconds
Game.TIMEOUT_TIME = 10000; //milliseconds

Game.prototype.addTeam = function(team){
	if(this.teams.length < Game.MAX_TEAMS_PER_GAME) {
		this.teams.push(team);
	}	
}

Game.prototype.addMember = function(socket, username) {
	var team = _.find(this.teams, function(team){return team.members.length < Game.MAX_MEMBERS_PER_TEAM});
	var member = {
		username: username,
		socketId: socket.id, //Id will have a '#/' appended to the id.
		isDrawer: false
	};
	if(typeof team != 'undefined'){
		team.members.push(member);
		this.memberSocketDict[member.socketId] = socket;
		if(this.isFull()){
			this.hasRoom = false;
			this.roundStart();
		}
	}// Check if the game has maximum number of teams. Add a team if possible
	else if(this.teams.length < Game.MAX_TEAMS_PER_GAME){
		var name = this.teams.length == 0 ? "Red Team" : "Blue Team";
		var team = {
			name: name,
			score: 0,
			members: [member]
		}
		this.teams.push(team);
		this.memberSocketDict[member.socketId] = socket;
	} 
}

Game.prototype.dropMember = function(socket) {
	var team = _.find(this.teams, function(t){ return _.some(t.members, function(member){return member.socketId == socket.id;})});
	team.members = _.reject(team.members, function(member){return member.socketId == socket.id;});
	delete this.memberSocketDict[socket.id];
	this.hasRoom = true;
}

Game.prototype.isFull = function(){
	return this.teams.length >= Game.MAX_TEAMS_PER_GAME &&
			_.every(this.teams, function(t){return t.members.length >= Game.MAX_MEMBERS_PER_TEAM;});
}

Game.prototype.checkGuess = function(socket, data) {
	if(data.guess == this.word) {
		var team = _.find(this.teams, function(t){ return _.some(t.members, function(member){return member.socketId == socket.id;})});
		team.score++;
		this.roundOver(team.name);	
	}
}

Game.prototype.storeSnapshot = function(socket, data){
	var team = _.find(this.teams, function(t){ return _.some(t.members, function(member){return member.socketId == socket.id;})});
	this.snapshots[team.name] = data;
	if(Object.keys(this.snapshots).length == Game.MAX_TEAMS_PER_GAME) {
		this.drawingreview(this.snapshots);
	}
}

Game.prototype.mouseMove = function(socket, data){
	var team = _.find(this.teams, function(t){ return _.some(t.members, function(member){return member.socketId == socket.id;})});
	var self = this;
	_.each(team.members, function(member){
		if(member.socketId != socket.id){
			self.memberSocketDict[member.socketId].emit('moving', data);
		}
	});	
}

Game.prototype.roundStart = function(){
	console.log('round start');
	clearTimeout(this.roundoverTimeout);
	this.setDrawers();
	this.word = "dog";
	var data = {
		game : {
			teams : this.teams,
			scoreToWin : this.scoreToWin,
			word : this.word
		}
	};
	this.broadcastToGame('roundstart', data);
	var self = this;
	this.roundCountdown = setTimeout(function(){self.gameTime.call(self);}, 3000);
}

Game.prototype.setDrawers = function(){
	_.each(this.teams, function(team){
		var nextDrawer = _.find(team.members, function(member){return !member.isDrawer; });
		_.each(team.members, function(member){member.isDrawer = false;});
		nextDrawer.isDrawer = true;
	});
}

Game.prototype.gameTime = function(){
	clearTimeout(this.roundCountdown);
	var seconds = Game.ROUND_TIME;
	var self = this;
	var func = function(){
			var data = {
				secondsLeft : seconds
			};
			self.broadcastToGame('gametime', data);
			seconds--;
			if(seconds == 0) {
				clearInterval(self.gameTimeInterval);
				self.roundOver.call(self, null);
			}
		}
	this.gameTimeInterval = setInterval( 
		func, 
		1000);
};

Game.prototype.broadcastSecondsToGame = function(seconds){
	var data = {
		secondsLeft : seconds
	};
	debugger;
	game.broadcastToGame('gametime', data);
	seconds--;
	if(seconds == 0) {
		clearInterval(game.gameTimeInterval);
		game.roundOver(null);
	}
}

Game.prototype.gamePause = function(){
	clearInterval(this.gameTimeInterval);
	clearInterval(this.timeoutInterval);
	clearTimeout(this.roundCountdown);
	var data = {
		game : {
			teams : this.teams,
			scoreToWin : this.scoreToWin,
			word : this.word
		}
	};
	this.broadcastToGame('gamepause', data)
}

Game.prototype.roundOver = function(winningTeam){
	var data = {
		winningTeam : winningTeam,
		game : {
			teams : this.teams,
			scoreToWin : this.scoreToWin,
			word : this.word
		}
	};
	this.broadcastToGame('roundover', data);
	var self = this;
	this.roundoverTimeout= setTimeout(function(){self.roundStart.call(self);}, Game.TIMEOUT_TIME);
}

Game.prototype.drawingReview = function(drawingData){
	this.broadcastToGame('drawingreview', drawingData);
}

Game.prototype.gameOver = function(winningTeam){
	var data = {
		winningTeam : winningTeam,
		game : {
			teams : this.teams,
			scoreToWin : this.scoreToWin,
			word : this.word
		}
	};
	this.broadcastToGame('gameover', data);
}

Game.prototype.broadcastToGame = function(event, data){
	var self = this;
	_.each(this.teams, function(team){
		_.each(team.members, function(member){
			self.memberSocketDict[member.socketId].emit(event, data);
		});
	});
	
}
module.exports = Game;