const {EmbedBuilder} = require('discord.js');
//const empty = "<:void:781191958517383178>";
const empty = "\\⬛️";
const fruit = "🍎";
const snake = "\\🟦";

module.exports = class Snake {
	constructor(channel, user) {
		this.channel = channel;
		this.user = user;
		this.score = 0;
		this.width = 20;
		this.height = 16;
		this.length = 3;
		this.direction = "▶";
		this.over = false;
		this.pos = [
			{x: 0, y: 0},
			{x: 1, y: 0},
			{x: 2, y: 0}
		];
	}
	
	play = () => {
		const self = this;
		const progress = self.generateProgress();
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Snake game')
			.setDescription('Click on ✅ to start')
			.addFields({name: "Score: " + self.score, value: progress})
			.setTimestamp()
			.setFooter({text: 'Haruko bot - Snake', iconURL: self.client.user.avatarURL()})
			.setAuthor({name: "Current user: " + self.user.tag});

		self.channel.send({ embeds: [embed]}).then(function (message) {
			const game = self.currentGame = message;
			game.react("◀")
			.then(reaction => game.react("▶")
			.then(reaction => game.react("🔼")
			.then(reaction => game.react("🔽")
			.then(reaction => game.react("✅")))));
			//game.react("700287410625445889");
			
			const collector = game.createReactionCollector((reaction, user) => user.id == self.user.id, { time: 60000 });
			collector.on("collect", reaction => {
				switch(reaction._emoji.name) {
					case "◀":
						if (self.direction !== "▶")
							self.direction = reaction._emoji.name;
						reaction.users.remove(self.user.id);
						break;
					case "▶":
						if (self.direction !== "◀")
							self.direction = reaction._emoji.name;
						reaction.users.remove(self.user.id);
						break;
					case "🔼":
						if (self.direction !== "🔽")
							self.direction = reaction._emoji.name;
						reaction.users.remove(self.user.id);
						break;
					case "🔽":
						if (self.direction !== "🔼")
							self.direction = reaction._emoji.name;
						reaction.users.remove(self.user.id);
						break;
					case "✅":
						self.start();
						break;
					case "❌":
						self.stop();
						break;
					default:
				}
			});
		}).catch(function(error) {
			console.error(error);
		});
	}
	
	generateProgress = () => {
		let progress = "";
		for (let i = 0;i < this.height; i++) {
			for (let j = 0;j < this.width; j++) {
				const pos = this.isSnake(j, i);
				if (pos) {
					if (this.pos.indexOf(pos) === this.pos.length - 1)
						progress += this.over ? "🔥" : this.direction;
					else
						progress += snake;
				} else if (this.fruit && j === this.fruit.x && i === this.fruit.y)
					progress += fruit;
				else
					progress += empty;
				//progress += "<:Cursed:700287410625445889>";
			}
			if (i < this.height - 1)
				progress += "\n";
		}
		return progress;
	}

	generateNewFruit = () => {
		let x = Math.floor(Math.random() * this.width);
		let y = Math.floor(Math.random() * this.height);
		while (this.isSnake(x, y)) {
			x = Math.floor(Math.random() * this.width);
			y = Math.floor(Math.random() * this.height);
		}
		this.fruit = {x: x, y: y};
	}

	isSnake = (x, y) => {
		const result = this.pos.filter(function (coor) {
			return coor.x === x && coor.y === y;
		})
		return result.length === 0 ? null : result[0];
	}
	
	start = () => {
		const self = this;
		self.currentGame.react("❌");
		self.generateNewFruit();
		self.interval = setInterval(() => {
			const newPos = {...self.pos[self.pos.length - 1]};
			switch(self.direction) {
				case "◀":
					newPos.x--;
					break;
				case "▶":
					newPos.x++;
					break;
				case "🔼":
					newPos.y--;
					break;
				case "🔽":
					newPos.y++;
					break;
			}
			if (0 <= newPos.x && newPos.x < self.width && 0 <= newPos.y && newPos.y < self.height && !self.isSnake(newPos.x, newPos.y)) {
				self.pos.push(newPos);
				if (newPos.x === self.fruit.x && newPos.y === self.fruit.y) {
					self.score++;
					self.generateNewFruit();
				} else
					self.pos.shift();
				const progress = this.generateProgress();
				const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle('Snake game')
				.setDescription('Click on ✅ to start')
				.addFields({name: "Score: " + self.score, value: progress})
				.setTimestamp()
				.setFooter({text: 'Haruko bot - Snake', iconURL: self.client.user.avatarURL()})
				.setAuthor({name: "Current user: " + self.user.tag});
				self.currentGame.edit(embed);
			} else {
				self.stop();
			}
		}, 1000);
		
	}
	
	stop = () => {
		this.over = true;
		clearInterval(this.interval);
		const progress = this.generateProgress();
		const embed = new EmbedBuilder()
			.setColor('#ee0000')
			.setTitle('Snake game')
			.setDescription('Game over!')
			.addFields({name: "Final score: " + self.score, value: progress})
			.setTimestamp()
			.setFooter({text: 'Haruko bot - Snake', iconURL: self.client.user.avatarURL()})
			.setAuthor({name: "Current user: " + self.user.tag});
		this.currentGame.edit(embed);
	}
}