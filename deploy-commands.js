
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('play').setDescription('Reproducir música').addStringOption(option =>
    option.setName('cancion').setDescription('Nombre o link de la canción').setRequired(true)),
  new SlashCommandBuilder().setName('pause').setDescription('Pausar la música'),
  new SlashCommandBuilder().setName('resume').setDescription('Reanudar la música'),
  new SlashCommandBuilder().setName('stop').setDescription('Detener la música y limpiar la cola'),
  new SlashCommandBuilder().setName('skip').setDescription('Saltar a la siguiente canción'),
  new SlashCommandBuilder().setName('volumen').setDescription('Ajustar el volumen').addIntegerOption(option =>
    option.setName('nivel').setDescription('Nivel de volumen (1-100)').setRequired(true)),
  new SlashCommandBuilder().setName('buscar').setDescription('Buscar una canción en YouTube').addStringOption(option =>
    option.setName('consulta').setDescription('Nombre de la canción').setRequired(true)),
  new SlashCommandBuilder().setName('queue').setDescription('Mostrar la cola de reproducción'),
  new SlashCommandBuilder().setName('panel').setDescription('Mostrar botones de control'),
  new SlashCommandBuilder().setName('help').setDescription('Mostrar todos los comandos disponibles')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ Registrando slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log('✅ Slash commands registrados correctamente.');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
