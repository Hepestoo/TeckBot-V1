
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  InteractionType,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');
const { DisTube } = require('distube');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const distube = new DisTube(client, {
  emitNewSongOnly: true,
  searchSongs: 5,
  searchCooldown: 30
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, member, guild } = interaction;

  const voiceChannel = member.voice.channel;
  if (!voiceChannel && commandName !== 'help') {
    return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
  }

  try {
    switch (commandName) {
      case 'play': {
        const query = options.getString('cancion');
        await distube.play(voiceChannel, query, {
          textChannel: interaction.channel,
          member: interaction.member
        });
        await interaction.reply(`🎶 Reproduciendo: \`${query}\``);
        break;
      }

      case 'pause':
        distube.pause(interaction);
        await interaction.reply('⏸️ Música pausada.');
        break;

      case 'resume':
        distube.resume(interaction);
        await interaction.reply('▶️ Música reanudada.');
        break;

      case 'stop':
        distube.stop(interaction);
        await interaction.reply('⏹️ Reproducción detenida.');
        break;

      case 'skip':
        distube.skip(interaction);
        await interaction.reply('⏭️ Canción saltada.');
        break;

      case 'volumen': {
        const vol = options.getInteger('nivel');
        if (vol < 1 || vol > 100)
          return interaction.reply('🔊 Usa un número entre 1 y 100.');
        distube.setVolume(interaction, vol);
        await interaction.reply(`🔊 Volumen establecido al ${vol}%`);
        break;
      }

      case 'buscar': {
        const query = options.getString('consulta');
        const results = await distube.search(query);
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

        await interaction.reply({
          content: '🎧 Resultados de búsqueda:',
          components: [row]
        });
        break;
      }

      case 'queue': {
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

        await interaction.reply({ embeds: [embed] });
        break;
      }

      case 'panel': {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('pause').setLabel('⏸️ Pausar').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('resume').setLabel('▶️ Reanudar').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('skip').setLabel('⏭️ Saltar').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('stop').setLabel('⏹️ Detener').setStyle(ButtonStyle.Danger)
        );
        await interaction.reply({
          content: '🎛️ Controles de reproducción:',
          components: [row]
        });
        break;
      }

      case 'help': {
        await interaction.reply(`📚 **Comandos disponibles:**\n
/play [canción]\n
/pause | /resume | /stop | /skip\n
/volumen [1-100]\n
/buscar [nombre]\n
/queue\n
/panel\n
/help`);
        break;
      }

      default:
        await interaction.reply('❌ Comando no reconocido.');
    }
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Hubo un error al ejecutar el comando.', ephemeral: true });
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'search_select') {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
    }
    const url = interaction.values[0];
    await distube.play(voiceChannel, url, {
      textChannel: interaction.channel,
      member: interaction.member
    });
    await interaction.reply(`🎶 Reproduciendo: ${url}`);
  }

  if (interaction.isButton()) {
    const action = interaction.customId;
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
