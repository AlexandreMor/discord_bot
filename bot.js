// Require the necessary discord.js classes
const {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Collection,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();
const token = process.env.DISCORD_TOKEN;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User],
});
const path = require("path");
const fs = require("fs");

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.commands = new Collection();

const filesPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(filesPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(filesPath, file);
  const command = require(filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log("Il manque un attribut");
  }
}

// Tableau de participants initialisé
let participants = [];

// Fonction pour créer l'embed de la session
const createGameEmbed = (
  gameName,
  date,
  hour,
  mod,
  description,
  participants,
  participantsField 
) => {
  return new EmbedBuilder()
    .setColor(0x0099ff)
    .setThumbnail("attachment://embed.jpg")
    .setTitle(`Session ${gameName}`)
    .setDescription(description)
    .addFields(
      { name: "Date", value: date, inline: true },
      { name: "Heure", value: hour, inline: true },
      { name: "Mod", value: mod },
      {
        name: "-----------------------------------------------",
        value: "\u200B",
      },
      participantsField 
    )
    .addFields(participants)
    .setTimestamp()
    .setFooter({
      text: "Prenez votre bâton de style !",
    });
};

//Création des boutons
const createButtons = () => {
  const validButton = new ButtonBuilder()
    .setLabel("Je participe !")
    .setStyle(ButtonStyle.Success)
    .setCustomId("valid");

  const cancelButton = new ButtonBuilder()
    .setLabel("En fait non")
    .setStyle(ButtonStyle.Danger)
    .setCustomId("cancel");

  const row = new ActionRowBuilder().addComponents(validButton, cancelButton);

  return row;
};

// Création de la Modal
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "new") {
    const modal = new ModalBuilder()
      .setCustomId("newGame")
      .setTitle("Nouvelle session");

    const gameNameInput = new TextInputBuilder()
      .setCustomId("gameNameInput")
      .setLabel("Quel est le nom du jeu ?")
      .setStyle(TextInputStyle.Short)
      .setValue("Among us")
      .setRequired(true);

    const dateInput = new TextInputBuilder()
      .setCustomId("dateInput")
      .setLabel("Quel jour ?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const hourInput = new TextInputBuilder()
      .setCustomId("hourInput")
      .setLabel("Quelle heure ?")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const modInput = new TextInputBuilder()
      .setCustomId("modInput")
      .setLabel("Quel(s) mod(s) ?")
      .setStyle(TextInputStyle.Short)
      .setValue("Better Other Roles")
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("descriptionInput")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    const gameNameActionRow = new ActionRowBuilder().addComponents(
      gameNameInput
    );
    const dateActionRow = new ActionRowBuilder().addComponents(dateInput);
    const hourActionRow = new ActionRowBuilder().addComponents(hourInput);
    const modActionRow = new ActionRowBuilder().addComponents(modInput);
    const descriptionActionRow = new ActionRowBuilder().addComponents(
      descriptionInput
    );

    modal.addComponents(
      gameNameActionRow,
      dateActionRow,
      hourActionRow,
      modActionRow,
      descriptionActionRow
    );

    await interaction.showModal(modal);
  }
});

// Réagir à la soumission du formulaire et donc création de l'embed
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  await interaction.reply({
    content: "Le formulaire a été soumis avec succès !",
  });

  await interaction.deleteReply();

  const gameName = interaction.fields.getTextInputValue("gameNameInput");
  const date = interaction.fields.getTextInputValue("dateInput");
  const hour = interaction.fields.getTextInputValue("hourInput");
  const mod = interaction.fields.getTextInputValue("modInput");
  const description =
    interaction.fields.getTextInputValue("descriptionInput") || null;

  const emptyParticipants = [{ name: "Personne !", value: "Oh non..." }];

  const participantsField = { name: `Participants :`, value: "\u200B" }
  
  // Créer l'embed de la session
  const gameEmbed = createGameEmbed(gameName, date, hour, mod, description, emptyParticipants,participantsField );

  const row = createButtons();

  interaction.channel.send({
    embeds: [gameEmbed],
    components: [row],
    files: [
      {
        attachment: "./images/embed.jpg",
        name: "embed.jpg",
      },
    ],
  });
});

// Réagir aux boutons
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  await interaction.reply({
    content: "Enregistré !",
  });

  await interaction.deleteReply();

  if (
    interaction.customId === "valid" &&
    !participants.includes(interaction.user.globalName)
  ) {
    participants.push(interaction.user.globalName);
  } else if (
    interaction.customId === "cancel" &&
    participants.includes(interaction.user.globalName)
  ) {
    participants = participants.filter(
      (user) => user !== interaction.user.globalName
    );
  }

  // Création des champs en vue de faire une liste de participants dans l'embed
  let participantsEmbedList = participants.map((participant, index) => {
    return {
      name: `Joueur ${index + 1}`,
      value: participant,
    };
  });

  const gameName = interaction.message.embeds[0].data.title.replace(
    "Session ",
    ""
  );
  const date = interaction.message.embeds[0].data.fields.find(
    (field) => (field.name = "Date")
  ).value;
  const hour = interaction.message.embeds[0].data.fields.find(
    (field) => (field.name = "Heure")
  ).value;
  const mod = interaction.message.embeds[0].data.fields.find(
    (field) => (field.name = "Mod")
  ).value;
  const description = interaction.message.embeds[0].data.description;
  const participantsField = { name: `Participants (${participants.length}) :`, value: "\u200B" }

  // Mettre à jour l'embed de la session avec les nouveaux participants
  const newGameEmbed = createGameEmbed(
    gameName,
    date,
    hour,
    mod,
    description,
    participantsEmbedList,
    participantsField
  );

  const row = createButtons();

  interaction.message.edit({
    embeds: [newGameEmbed],
    components: [row],
    files: [
      {
        attachment: "./images/embed.jpg",
        name: "embed.jpg",
      },
    ],
  });
});

client.login(token);
