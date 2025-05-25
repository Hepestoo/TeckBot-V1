// deploy-commands.js
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción por nombre o URL.')
    .addStringOption(option =>
      option.setName('cancion').setDescription('Nombre o URL de la canción').setRequired(true)),
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Agrega una canción a la cola sin interrumpir.')
    .addStringOption(option =>
      option.setName('cancion').setDescription('Nombre o URL de la canción').setRequired(true)),
  new SlashCommandBuilder().setName('pause').setDescription('Pausa la canción actual.'),
  new SlashCommandBuilder().setName('resume').setDescription('Reanuda la canción pausada.'),
  new SlashCommandBuilder().setName('skip').setDescription('Salta la canción actual.'),
  new SlashCommandBuilder().setName('stop').setDescription('Detiene y limpia la cola.'),
  new SlashCommandBuilder().setName('queue').setDescription('Muestra la cola de reproducción.'),
  new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Cambia el volumen.')
    .addIntegerOption(option =>
      option.setName('percent').setDescription('Porcentaje (1-100)').setRequired(true)),
  new SlashCommandBuilder().setName('nowplaying').setDescription('Muestra la canción actual.')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⌛ Registrando comandos...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Slash commands registrados');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
