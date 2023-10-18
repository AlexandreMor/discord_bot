const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('new')
		.setDescription('Crée une nouvelle session'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
