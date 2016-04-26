var _ = require('underscore');

function Game(){
	this.id = Date.now();
	this.teams = [];
	this.winningTeam = null;
	this.scoreToWin = 25;
	this.hasRoom = true;
}

Game.MAX_TEAMS_PER_GAME = 2;
Game.MAX_MEMBERS_PER_TEAM = 2;

Game.prototype.addTeam = function(team){
	if(this.teams.length < Game.MAX_TEAMS_PER_GAME) {
		this.teams.push(team);
	}	
}

Game.prototype.addMember = function(socket, username) {
	var team = _.find(this.teams, function(team){console.log("team: " + team + "\nmembers: " + team.members); return team.members.length < Game.MAX_MEMBERS_PER_TEAM});
	var member = {
		username: username,
		socket: socket,
		id: socket.id,
		isDrawer: false
	};

	if(typeof team != 'undefined'){
		team.members.push(member);
		if(this.isFull()){
			this.hasRoom = false;
		}
		return;
	}// Check if the game has maximum number of teams. Add a team if possible
	else if(this.teams.length < Game.MAX_TEAMS_PER_GAME){
		var name = this.teams.length == 0 ? "Red Team" : "Blue Team";
		var team = {
			name: name,
			score: 0,
			members: [member]
		}
		this.teams.push(team);
	}
}

Game.prototype.isFull = function(){
	return this.teams.length >= Game.MAX_TEAMS_PER_GAME &&
			_.every(this.teams, function(t){return t.members.length >= Game.MAX_MEMBERS_PER_TEAM;});
}

Game.prototype.mouseMove = function(socket, data){
	var team = _.find(this.teams, function(t){ return _.some(t.members, function(member){return member.socket == socket;})});
	_.each(team.members, function(member){
		if(member.socket != socket){
			console.log('emitting to team member with socket id: ' + member.socket.id);
			member.socket.emit('moving', data);
		}
	})	
}
module.exports = Game;