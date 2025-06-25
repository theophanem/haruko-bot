const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, ActivityType } = require('discord.js');
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildBans, GatewayIntentBits.MessageContent], 
	partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User]});
const config = require('./config.json');
const Snake = require('./classes/Snake');
const TicTacToe = require('./classes/TicTacToe');
const DBHelper = require("./helpers/DBHelper");
const fs = require("fs");

client.commands = new Collection();
const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${commandsPath}/${file}`);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity("BOX 15", { type: ActivityType.Listening });
	client.guilds.cache.forEach(g => DBHelper.initDb(g))
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(config.token);

client.on('guildCreate', guild => {
	DBHelper.initDb(guild);
});

client.on('guildMemberAdd', member => {
	if(member.user.username === "Moderation Academy")
		member.ban()
});
client.on('messageCreate', msg => {
	if (msg.content.substring(0, 2) == 'h:') {
		const channel = msg.channel;
		let args = msg.content.substring(2).split(' ');
		let user = null;
		const cmd = args[0];
		args = args.splice(1);
		const dbPath = "db/"+channel.guild.id+"/";
		switch(cmd) {
			case 'talktalk':
				msg.delete();
				channel.send(args.join(" "));
				break;
			case 'massban':
				if (isAdmin(msg)) {
					const toBan = channel.guild.cache.members.filter(m => m.user.username === "Moderation Academy");
					toBan.forEach(t => {console.log(t);t.ban()})
					//  = channel.guild.members.filter(m => m.presence.status === 'online').
				}
				break;
			case 'clear':
				const embed = new EmbedBuilder();
				user = channel.guild.members.cache.get(msg.author.id);
				if (user.permissions.has("MANAGE_MESSAGES") || isModerator(msg, dbPath)) {
					msg.delete();
					const amount = parseInt(args[0]);
					if (isNaN(amount)) {
						embed.setColor('#ff0000').setDescription('Error: argument is not a number');
						channel.send({ embeds: [embed]}).then(message => message.delete({timeout:3000})).catch(() => console.log("Unable to delete auto message"));
					} else if (amount > 100)
						amount = 100;
					channel.bulkDelete(amount).then(() => {
						embed.setColor('#10c218').setDescription(amount + ' messages deleted!');
						channel.send({ embeds: [embed]}).then(message => message.delete({timeout:3000})).catch(() => console.log("Unable to delete auto message"));
					}).catch(() => {
						embed.setColor('#ee0000').setDescription("You can only bulk delete messages that are under 14 days old.");
						channel.send({ embeds: [embed]});
					});
				}
				break;
			case 'snake':
				if (this.snakes === undefined)
					this.snakes = {};
				if (this.snakes[channel.guild.id] === undefined || this.snakes[channel.guild.id].over == true) {					
					this.snakes[channel.guild.id] = new Snake(channel, msg.author);
					this.snakes[channel.guild.id].play();
				} else {
					channel.send("A Snake game is already ongoing in this server.");
				}
				break;
			case 'tictactoe':
				if (this.ticTacToes === undefined)
					this.ticTacToes = {};
				if (this.ticTacToes[channel.guild.id] === undefined || this.ticTacToes[channel.guild.id].winner !== false) {
					if (args.join(" ")) {
						findUser(msg, args.join(" "), false).then(response => {
							const player2 = response;
							if (player2.bot)
								channel.send("You can't play with a bot!");
							else if (msg.author.id === player2.user.id)
								channel.send("Just go out and get some friends instead of trying to play with yourself! (Man that sounds kinda bad now that I think about it...)");
							else {
								this.ticTacToes[channel.guild.id] = new TicTacToe(client, channel, msg.author, player2.user);
								this.ticTacToes[channel.guild.id].play();
							}
						}).catch(err => {
							console.error(err)
							channel.send("Couldn't find the opponent.");
						});
					} else
						channel.send("Please specify a player to play with! (ex: `h:tictactoe JohnDoe`)");
				} else
					channel.send("A Tic Tac Toe game is already ongoing in this server.");
				break;
			case 'setmod':
				if (isAdmin(msg)) {
					let roles = null;
					fs.readFile(dbPath + "BRole.json", (err, data) => {
						if (err) throw err;
						roles = JSON.parse(data);
						if (!roles)
							roles = {};
						const role = findRole(msg, args.join(" "))
						if (role) {
							if (!roles[role.id])
								roles[role.id] = {name: role.name};
							const isMod = !roles[role.id].isMod;
							roles[role.id].isMod = isMod;
							fs.writeFile(dbPath + "BRole.json", JSON.stringify(roles, null, 2), (err) => {
								if (err) throw err;
								channel.send("The **"+role.name+"** role is " + (isMod ? "now a moderator role!" : "no more moderator!"));
							});
						}
					});
				}
				
				break;
			case 'debug':
				break;
		}
	} else if (msg.author.id === "172294376142274560") {//genocidalmachine
		if (msg.content.includes("gumby"))
			msg.reply({content: "How about you shut the hell up and get some gumbitches instead?", allowedMentions: { repliedUser: true }});
		else if (msg.content.includes("gronk"))
			msg.reply({content: "Pretty sure nobody cares, at least nobody asked", allowedMentions: { repliedUser: true }});
	}
});

const findUser = (message, username, displayMessage = true) => {
	return new Promise((resolve, reject) => {
		if (username) {
			const mention = message.mentions.members.first();
			if (mention)
				resolve(mention);
			else {
				const re = username.match(new RegExp("\\d{18}"));
				if (re && re.index === 0)
					client.users.fetch(username).then(response => {
						resolve({user: response});
					}).catch(er => {						
						reject(er)
						if (displayMessage)
							message.channel.send("There is no member with this username/nickname/id. Try again!");
					})
				else {
					username = username.toUpperCase();
					result = message.channel.guild.members.cache.find(m => m.user.username.toUpperCase().indexOf(username) !== -1 || m.nickname && m.nickname.toUpperCase().indexOf(username) !== -1);
					if (result)
						resolve(result);
					else {
						reject("There is no member with this username/nickname. Try again!");
						if (displayMessage)
							message.channel.send("There is no member with this username/nickname/id. Try again!");
					}
				}
			}
		} else {
			reject("No input");
			if (displayMessage)
				message.channel.send("Please specify username/nickname/id to search");
		}

	});
}

const findRole = (message, rolename) => {
	let result = null;
	if (rolename) {
		const mention = message.mentions.roles.first();
		if (mention)
			result = mention;
		else {
			rolename = rolename.toUpperCase();
			result = message.channel.guild.roles.cache.find(r => r.name.toUpperCase().indexOf(rolename) !== -1);
		}
	}
	if (result == null)
		message.channel.send("There is no role with this name. Try again!");
	return result;
}

const isAdmin = message => {
	const user = message.channel.guild.members.cache.get(message.author.id);
	const isAdmin = user.permissions.has("ADMINISTRATOR");
	if (!isAdmin)
		message.channel.send("Nice try, but you don't have the permission to do that :)");	
	return isAdmin;
}

const isModerator = (message, dbPath) => {
	const user = message.channel.guild.members.cache.get(message.author.id);
	let isMod = false;
	const roles = JSON.parse(fs.readFileSync(dbPath + "BRole.json"));
	if (roles) {
		let i = 0;
		while (i < user._roles.length && isMod === false) {
			const role = user._roles[i];
			if (roles[role] && roles[role].isMod) {
				isMod = true;
			}
			i++;
		}
	}
	if (!isMod)
		message.channel.send("Nice try, but you don't have the permission to do that :)");	
	return isMod;
}