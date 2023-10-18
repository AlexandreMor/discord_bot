const { REST, Routes } = require("discord.js");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [];

const filesPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(filesPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(filesPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log("Il manque un attribut");
  }
}

(async () => {
  try {
    console.log("Début du rafraichissement des commandes");
    const rest = new REST().setToken(token);
    await rest.put(Routes.applicationCommands(clientId, guildId), {
      body: commands,
    });
    console.log("Fin du rafraichissement des commandes");
  } catch (error) {
    console.error(error);
  }
})();
