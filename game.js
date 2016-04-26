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
	console.log("Found team: " + team);
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
			members: [member]
		}
		this.teams.push(team);
		console.log("Current teams: " + (this.teams));
	}
}

Game.prototype.isFull = function(){
	return this.teams.length >= Game.MAX_TEAMS_PER_GAME &&
			_.every(this.teams, function(t){return t.members.length >= Game.MAX_MEMBERS_PER_TEAM;});
}

module.exports = Game;