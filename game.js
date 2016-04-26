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
	var team = _.find(this.teams, function(team){return team.members.length < Game.MAX_MEMBERS_PER_TEAM});
	var member = {
		username: username,
		socket: socket,
		id: socket.id,
		isDrawer: false
	};
	if(team){
		team.members.push(member);
		if(_.every(this.teams, function(team){return team.length >= Game.MAX_MEMBERS_PER_TEAM;})){
			this.hasRoom = false;
		}
		return;
	}
	// Check if the game has maximum number of teams. Add a team if possible
	if(this.teams.length < Game.MAX_TEAMS_PER_GAME){
		var team = {
			name: this.teams.length == 0 ? "Red Team" : "Blue Team",
			members: [member]
		}
		this.teams.push(team);
	}


}

module.exports = Game;