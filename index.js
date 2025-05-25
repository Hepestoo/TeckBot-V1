// index.js
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const distube = new DisTube(client, {
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: true,
  emitAddListWhenCreatingQueue: true,
  plugins: [new YtDlpPlugin()]
});

let controlMessage = null;

distube.on('playSong', async (queue, song) => {
  const embed = new EmbedBuilder()
    .setTitle('🎶 Reproduciendo ahora')
    .setDescription(`**${song.name}**\n🎧 Solicitado por: ${song.user}\n⏱ Duración: \`${song.formattedDuration}\``)
    .setThumbnail(song.thumbnail || '')
    .setColor('#5865F2');

  const upcoming = queue.songs.slice(1);
  embed.addFields({
    name: '💼 Próximas canciones en la cola',
    value: upcoming.length > 0
      ? upcoming.map((s, i) => `${i + 1}. ${s.name} (\`${s.formattedDuration}\`)`).join('\n')
      : 'No hay más canciones en la cola'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pause').setLabel('⏸ Pausar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('resume').setLabel('▶ Reanudar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('skip').setLabel('⏭ Saltar').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stop').setLabel('⏹ Detener').setStyle(ButtonStyle.Danger)
  );

  try {
    if (controlMessage) {
      await controlMessage.edit({ embeds: [embed], components: [row] });
    } else {
      controlMessage = await queue.textChannel.send({ embeds: [embed], components: [row] });
    }
  } catch (e) {
    console.error('❌ Error actualizando mensaje principal:', e);
  }
});

distube.on('addSong', async (queue, song) => {
  if (!controlMessage) return;

  const nowPlaying = queue.songs[0];
  const upcoming = queue.songs.slice(1);

  const embed = new EmbedBuilder()
    .setTitle('🎶 Reproduciendo ahora')
    .setDescription(`**${nowPlaying.name}**\n🎧 Solicitado por: ${nowPlaying.user}\n⏱ Duración: \`${nowPlaying.formattedDuration}\``)
    .setThumbnail(nowPlaying.thumbnail || '')
    .setColor('#5865F2');

  embed.addFields({
    name: '💼 Próximas canciones en la cola',
    value: upcoming.length > 0
      ? upcoming.map((s, i) => `${i + 1}. ${s.name} (\`${s.formattedDuration}\`)`).join('\n')
      : 'No hay más canciones en la cola'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pause').setLabel('⏸ Pausar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('resume').setLabel('▶ Reanudar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('skip').setLabel('⏭ Saltar').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stop').setLabel('⏹ Detener').setStyle(ButtonStyle.Danger)
  );

  try {
    await controlMessage.edit({ embeds: [embed], components: [row] });
  } catch (error) {
    console.error('❌ Error actualizando cola:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    const voiceChannel = interaction.member.voice.channel;
    const queue = distube.getQueue(interaction);

    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', flags: 64 });
    }

    try {
      if (commandName === 'play') {
        const query = interaction.options.getString('cancion');
        await interaction.deferReply({ flags: 64 });
        await distube.play(voiceChannel, query, {
          textChannel: interaction.channel,
          member: interaction.member
        });
        await interaction.deleteReply();
      } else if (commandName === 'add') {
        const query = interaction.options.getString('cancion');
        if (!queue) {
          return interaction.reply({ content: '❌ No hay ninguna canción reproduciéndose. Usa /play primero.', flags: 64 });
        }
        await interaction.deferReply({ flags: 64 });
        await distube.play(queue.voiceChannel, query, {
          member: interaction.member,
          textChannel: interaction.channel,
          skip: false
        });
        await interaction.editReply({ content: '✅ Canción añadida a la cola.' });
      } else if (commandName === 'pause') {
        distube.pause(interaction);
        await interaction.reply('⏸ Música pausada.');
      } else if (commandName === 'resume') {
        distube.resume(interaction);
        await interaction.reply('▶ Música reanudada.');
      } else if (commandName === 'skip') {
        distube.skip(interaction);
        await interaction.reply('⏭ Canción saltada.');
      } else if (commandName === 'stop') {
        distube.stop(interaction);
        await interaction.reply('⏹ Música detenida.');
      } else if (commandName === 'queue') {
        if (!queue || !queue.songs.length) {
          return interaction.reply('❌ No hay canciones en la cola.');
        }

        const list = queue.songs
          .map((song, i) => `${i + 1}. ${song.name} (${song.formattedDuration})`)
          .join('\n');

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('📜 Cola de reproducción')
              .setDescription(list)
              .setColor('#5865F2')
          ]
        });
      } else if (commandName === 'volume') {
        const volume = interaction.options.getInteger('percent');
        distube.setVolume(interaction, volume);
        await interaction.reply(`🔊 Volumen ajustado al ${volume}%`);
      } else if (commandName === 'nowplaying') {
        if (!queue || !queue.songs.length) {
          return interaction.reply('❌ No hay canciones en reproducción.');
        }

        const current = queue.songs[0];
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('🎧 Sonando ahora')
              .setDescription(`${current.name}\nDuración: \`${current.formattedDuration}\`\nSolicitado por: ${current.user}`)
              .setThumbnail(current.thumbnail || '')
              .setColor('#5865F2')
          ]
        });
      }
    } catch (err) {
      console.error('❌ Error al manejar el comando:', err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ Hubo un error al ejecutar el comando.', flags: 64 });
        } else {
          await interaction.followUp({ content: '❌ Hubo un error al ejecutar el comando.', flags: 64 });
        }
      } catch (e) {
        console.error('❌ Error enviando mensaje de error:', e);
      }
    }
    return;
  }

  if (interaction.isButton()) {
    const queue = distube.getQueue(interaction);
    if (!queue) {
      return interaction.reply({ content: '❌ No hay música en reproducción.', flags: 64 });
    }

    try {
      switch (interaction.customId) {
        case 'pause':
          distube.pause(interaction);
          await interaction.reply({ content: '⏸ Música pausada.', flags: 64 });
          break;
        case 'resume':
          distube.resume(interaction);
          await interaction.reply({ content: '▶ Música reanudada.', flags: 64 });
          break;
        case 'skip':
          distube.skip(interaction);
          await interaction.reply({ content: '⏭ Canción saltada.', flags: 64 });
          break;
        case 'stop':
          distube.stop(interaction);
          await interaction.reply({ content: '⏹ Música detenida.', flags: 64 });
          break;
        default:
          await interaction.reply({ content: '❌ Acción no reconocida.', flags: 64 });
      }
    } catch (err) {
      console.error('❌ Error al manejar botón:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Error al ejecutar la acción.', flags: 64 });
      }
    }
  }
});

const { TOKEN } = process.env;

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.login(TOKEN);
