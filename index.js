require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
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
  leaveOnEmpty: true,
  emitNewSongOnly: true
});

client.on('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  if (command === '!play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('❌ Entra a un canal de voz primero');
    const query = args.join(' ');
    if (!query) return message.reply('❌ Escribe un link o nombre de canción');

    try {
      await distube.play(voiceChannel, query, {
        textChannel: message.channel,
        member: message.member
      });
    } catch (err) {
      console.error(err);
      message.reply('❌ No se pudo reproducir');
    }
  }
});

client.login(process.env.TOKEN);
