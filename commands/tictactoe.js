const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tictactoe')
		.setDescription('Play Tic Tac Toe')
        .addStringOption(option =>
            option.setName('opponent')
                .setDescription('The username/nickname/id of your opponent')
                .setRequired(true)),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};