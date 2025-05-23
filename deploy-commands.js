require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción por nombre o link')
    .addStringOption(option =>
      option.setName('cancion')
        .setDescription('Nombre o enlace de la canción')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la reproducción actual'),

  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la canción pausada'),

  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la música y limpia la cola'),

  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canción actual'),

  new SlashCommandBuilder()
    .setName('volumen')
    .setDescription('Cambia el volumen de la música')
    .addIntegerOption(option =>
      option.setName('nivel')
        .setDescription('Volumen entre 1 y 100')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('buscar')
    .setDescription('Busca canciones para elegir')
    .addStringOption(option =>
      option.setName('consulta')
        .setDescription('Nombre de la canción')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones'),

  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Muestra botones de control de música'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra los comandos disponibles')
].map(command => command.toJSON());

// Usa tu CLIENT_ID y GUILD_ID
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🚀 Registrando comandos...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados exitosamente');
  } catch (error) {
    console.error('❌ Error al registrar los comandos:', error);
  }
})();
