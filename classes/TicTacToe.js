const {EmbedBuilder} = require('discord.js');
const empty = "<:void:781191958517383178>";
const cross = "❌";
const circle = "⭕";

module.exports = class TicTacToe {
	constructor(client, channel, player1, player2) {
		this.client = client;
		this.channel = channel;
		this.player1 = player1;
		this.player2 = player2;
		this.currentPlayer = this.player1;
		this.winner = false;
		this.started = false;
		this.state = [[null, null, null], [null, null, null], [null, null, null]];
	}
	
	play = () => {
		const self = this;
		const progress = self.generateProgress();
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Tic Tac Toe')
			.setDescription('Click on ✅ to start')
			.addFields({name: "Turn: " + (self.currentPlayer ? self.currentPlayer.tag : ""), value: progress})
			.setTimestamp()
			.setFooter({text: 'Haruko bot - Tic Tac Toe', iconURL: self.client.user.avatarURL()})
			.setAuthor({name: (self.player1 ? self.player1.tag : "Unknown player") + " VS " + (self.player2 ? self.player2.tag : "Unknown player")});

		self.channel.send({ embeds: [embed]}).then(function (message) {
			const game = self.currentGame = message;
			game.react("↖️")
			.then(() => game.react("⬆️")
			.then(() => game.react("↗️")
			.then(() => game.react("⬅️")
			.then(() => game.react("*️⃣")
			.then(() => game.react("➡️")
			.then(() => game.react("↙️")
			.then(() => game.react("⬇️")
			.then(() => game.react("↘️")
			.then(() => game.react("✅"))))))))));
			
			const collector = game.createReactionCollector((reaction, user) => user.id !== self.client.user.id, { time: 60000 });
			collector.on("collect", (reaction, user) => {
				if (user.id === self.currentPlayer.id) {
					if (reaction._emoji.name === "✅") {
						self.started = true;
						reaction.remove();
					} else if (self.started) {
						switch(reaction._emoji.name) {
							case "↖️":
								self.state[0][0] = user;
								break;
							case "⬆️":
								self.state[0][1] = user;
								break;
							case "↗️":
								self.state[0][2] = user;
								break;
							case "⬅️":
								self.state[1][0] = user;
								break;
							case "*️⃣":
								self.state[1][1] = user;
								break;
							case "➡️":
								self.state[1][2] = user;
								break;
							case "↙️":
								self.state[2][0] = user;
								break;
							case "⬇️":
								self.state[2][1] = user;
								break;
							case "↘️":
								self.state[2][2] = user;
								break;
							default:
						}
						reaction.remove();
						self.checkWinner();
						if (self.winner !== false)
							self.stop();
						else
							self.progress();
					} else
						reaction.users.remove(user.id);
				} else if ([self.player1?.id, self.player2?.id].includes(user.id)) {
					self.channel.send("It is not your turn to play yet!").then(message => message.delete({timeout:3000})).catch(() => console.log("Unable to delete auto message"));
					reaction.users.remove(user.id);
				} else {
					self.channel.send("You are not part of this game, please wait for it to end before starting a new one!").then(message => message.delete({timeout:3000})).catch(() => console.log("Unable to delete auto message"));
					reaction.users.remove(user.id);
				}
			});
			setTimeout(() => {if (self.winner === false) self.stop()}, 60000);
		}).catch(function(error) {
			console.error(error);
		});
	}
	
	generateProgress = () => {
		const self = this;
		let progress = "";
		for (let x = 0; x < self.state.length; x++) {
			const row = self.state[x];
			for (let y = 0; y < row.length; y++) {
				switch(row[y]) {
					case self.player1:
						progress += circle;
						break;
					case self.player2:
						progress += cross;
						break;
					default:
						progress += empty;
				}
				if (y !== row.length - 1)
					progress += "|";
			}
			progress += "\n";
			if (x !== self.state.length - 1)
				progress += "―+―+―\n";
		}
		return progress;
	}

	checkWinner = () => {
		const self = this;
		if (self.state[0][0] === self.state[0][1] && self.state[0][0] === self.state[0][2] && self.state[0][0] !== null)
			self.winner = self.state[0][0];
		else if (self.state[1][0] === self.state[1][1] && self.state[1][0] === self.state[1][2] && self.state[1][0] !== null)
			self.winner = self.state[1][0];
		else if (self.state[2][0] === self.state[2][1] && self.state[2][0] === self.state[2][2] && self.state[2][0] !== null)
			self.winner = self.state[2][0];
		else if (self.state[0][0] === self.state[1][0] && self.state[0][0] === self.state[2][0] && self.state[0][0] !== null)
			self.winner = self.state[0][0];
		else if (self.state[0][1] === self.state[1][1] && self.state[0][1] === self.state[2][1] && self.state[0][1] !== null)
			self.winner = self.state[0][1];
		else if (self.state[0][2] === self.state[1][2] && self.state[0][2] === self.state[2][2] && self.state[0][2] !== null)
			self.winner = self.state[0][2];
		else if (self.state[0][0] === self.state[1][1] && self.state[0][0] === self.state[2][2] && self.state[0][0] !== null)
			self.winner = self.state[0][0];
		else if (self.state[0][2] === self.state[1][1] && self.state[0][2] === self.state[2][0] && self.state[0][2] !== null)
			self.winner = self.state[0][2];
		else {
			let over = true;
			this.state.forEach(r => {
				if (over)
					r.forEach(c => {
						if (over && c === null)
							over = false;
					})
			})
			self.winner = over ? null : false;
		}
	}
	
	progress = () => {
		const self = this;
		self.currentPlayer = self.currentPlayer.id === self.player1.id ? self.player2 : self.player1;
		const progress = self.generateProgress();
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Tic Tac Toe')
			.addFields({name: "Turn: " + (self.currentPlayer ? self.currentPlayer.tag : ""), value: progress})
			.setTimestamp()
			.setFooter({text: 'Haruko bot - Tic Tac Toe', iconURL: self.client.user.avatarURL()})
			.setAuthor({name: (self.player1 ? self.player1.tag : "Unknown player") + " VS " + (self.player2 ? self.player2.tag : "Unknown player")});
		self.currentGame.edit(embed);
	}
	
	stop = () => {
		const self = this;
		self.currentGame.reactions.removeAll();
		const progress = self.generateProgress();
		const embed = new EmbedBuilder()
			.setColor('#ee0000')
			.setTitle('Tic Tac Toe')
			.setDescription('Game over!')
			.addFields({name: 'Winner: ' + (self.winner ? self.winner.tag : "none"), value: progress})
			.setTimestamp()
			.setFooter({text: 'Haruko bot - Tic Tac Toe', iconURL: self.client.user.avatarURL()})
			.setAuthor({name: (self.player1 ? self.player1.tag : "Unknown player") + " VS " + (self.player2 ? self.player2.tag : "Unknown player")});
		self.currentGame.edit(embed);
	}
}