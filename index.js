require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [new YtDlpPlugin()]
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member } = interaction;
  const voiceChannel = member.voice?.channel;

  if (!voiceChannel && commandName !== 'help' && commandName !== 'buscar') {
    return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
  }

  try {
    if (commandName === 'play') {
      const query = options.getString('cancion');
      await interaction.deferReply();
      await distube.play(voiceChannel, query, {
        textChannel: interaction.channel,
        member: interaction.member
      });
      return interaction.editReply(`🎶 Reproduciendo: \`${query}\``);
    }

    if (commandName === 'pause') {
      await interaction.reply('⏸️ Música pausada.');
      return distube.pause(interaction);
    }

    if (commandName === 'resume') {
      await interaction.reply('▶️ Música reanudada.');
      return distube.resume(interaction);
    }

    if (commandName === 'stop') {
      await interaction.reply('⏹️ Reproducción detenida.');
      return distube.stop(interaction);
    }

    if (commandName === 'skip') {
      await interaction.reply('⏭️ Canción saltada.');
      return distube.skip(interaction);
    }

    if (commandName === 'volumen') {
      const vol = options.getInteger('nivel');
      if (vol < 1 || vol > 100)
        return interaction.reply('🔊 Usa un número entre 1 y 100.');
      distube.setVolume(interaction, vol);
      return interaction.reply(`🔊 Volumen establecido al ${vol}%`);
    }

    if (commandName === 'buscar') {
      const query = options.getString('consulta');
      const results = await distube.search(query);
      if (!results || results.length === 0) {
        return interaction.reply({ content: '❌ No se encontraron resultados.', ephemeral: true });
      }

      const optionsMenu = results.slice(0, 5).map((song, i) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${i + 1}. ${song.name}`)
          .setDescription(song.formattedDuration)
          .setValue(song.url)
      );

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('search_select')
          .setPlaceholder('Selecciona una canción...')
          .addOptions(optionsMenu)
      );

      return interaction.reply({
        content: '🎧 Resultados de búsqueda:',
        components: [row]
      });
    }

    if (commandName === 'queue') {
      const queue = distube.getQueue(interaction);
      if (!queue) return interaction.reply('📭 No hay canciones en la cola.');

      const embed = new EmbedBuilder()
        .setColor('Blurple')
        .setTitle('🎶 Cola de reproducción')
        .setDescription(
          queue.songs
            .map((s, i) => `${i === 0 ? '🔊 **' : `${i + 1}. `}${s.name}** \`(${s.formattedDuration})\``)
            .join('\n')
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'panel') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('pause').setLabel('⏸️ Pausar').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('resume').setLabel('▶️ Reanudar').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('skip').setLabel('⏭️ Saltar').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('stop').setLabel('⏹️ Detener').setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        content: '🎛️ Controles de reproducción:',
        components: [row]
      });
    }

    if (commandName === 'help') {
      return interaction.reply(`📚 **Comandos disponibles:**\n
/play [canción]\n
/pause | /resume | /stop | /skip\n
/volumen [1-100]\n
/buscar [nombre]\n
/queue\n
/panel\n
/help`);
    }

  } catch (err) {
    console.error(err);
    return interaction.reply({ content: '❌ Hubo un error al ejecutar el comando.', ephemeral: true });
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'search_select') {
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
    }

    const url = interaction.values[0];
    await interaction.deferReply();
    await distube.play(voiceChannel, url, {
      textChannel: interaction.channel,
      member: interaction.member
    });
    return interaction.editReply(`🎶 Reproduciendo: ${url}`);
  }

  if (interaction.isButton()) {
    const action = interaction.customId;
    if (!interaction.member.voice?.channel) {
      return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
    }

    switch (action) {
      case 'pause':
        distube.pause(interaction);
        return interaction.reply('⏸️ Música pausada.');
      case 'resume':
        distube.resume(interaction);
        return interaction.reply('▶️ Música reanudada.');
      case 'skip':
        distube.skip(interaction);
        return interaction.reply('⏭️ Canción saltada.');
      case 'stop':
        distube.stop(interaction);
        return interaction.reply('⏹️ Reproducción detenida.');
    }
  }
});

client.login(process.env.TOKEN);
