require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { DisTube } = require('distube');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const distube = new DisTube(client, {
  emitNewSongOnly: true
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const args = message.content.trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (['!panel', '!controles'].includes(command)) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('play').setLabel('▶️ Reproducir').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('pause').setLabel('⏸️ Pausar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('resume').setLabel('▶️ Reanudar').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('skip').setLabel('⏭️ Saltar').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('stop').setLabel('⏹️ Detener').setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({
      content: '🎶 **Controles de música**',
      components: [row]
    });
  }
});

// 🎛️ Manejo de los botones
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const { member, channel, customId } = interaction;
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    return interaction.reply({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });
  }

  const queue = distube.getQueue(interaction);

  switch (customId) {
    case 'play':
      return interaction.reply({ content: 'Usa `!play [link o nombre]` para reproducir música.', ephemeral: true });

    case 'pause':
      distube.pause(interaction);
      return interaction.reply({ content: '⏸️ Música pausada.' });

    case 'resume':
      distube.resume(interaction);
      return interaction.reply({ content: '▶️ Música reanudada.' });

    case 'skip':
      distube.skip(interaction);
      return interaction.reply({ content: '⏭️ Canción saltada.' });

    case 'stop':
      distube.stop(interaction);
      return interaction.reply({ content: '⏹️ Reproducción detenida.' });

    default:
      return interaction.reply({ content: '❌ Botón no reconocido.', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
