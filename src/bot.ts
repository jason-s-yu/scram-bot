
import { CommandoClient } from 'discord.js-commando';
import { logger } from './utils';
import dotenv from 'dotenv';
import path from 'path';
import { GuildMember, Message } from 'discord.js';

dotenv.config();

const { PREFIX, OWNER, BOT_TOKEN } = process.env;

const guild = '762785723669151764';

const client: CommandoClient = new CommandoClient({
  commandPrefix: PREFIX,
  owner: OWNER
})

client.once('ready', () => {
  logger.info(`Client is listening as ${client.user.tag} (${client.user.id})`);
  client.user.setActivity('opening ceremonies', { type: 'STREAMING', url: '' });

  // (client.channels.cache.get('762785723669151770') as TextChannel).send('Hello, <@390353095298777091>');
});

client.on('guildMemberAdd', (member: GuildMember) => {
  member.send(`Welcome to the **SCRAM 2020** Discord server.`);
  member.send(`To authenticate yourself, please send me the fourteen (14) digit code sent to you in the welcome email.`);
});

const registered: string[] = [];

client.on('message', async (msg: Message) => {
  if (msg.author.bot) return;
  console.log('msg');

  if (msg.content.toUpperCase().startsWith('ZQ')) {
    if (registered.includes(msg.author.id)) {
      msg.reply('You have already been authenticated.');
    }

    try {
      console.log(`Beginning verification process for ${msg.author.tag}.`);
      registered.push(msg.author.id);
      if (msg.content.toUpperCase() === 'ZQADVUHS59A2BC') {
        await msg.reply('You have been authenticated. Welcome, Praneet!');
        await client.guilds.cache.get(guild).members.cache.get(msg.author.id).roles.add('771900750073823253');
      } else {
        await msg.reply('Your authentication code was invalid. Please enter again');
      }
    } catch(err) {
      console.error(err);
    }
  }
});

client.on('error', console.error);

client.registry
  .registerDefaultTypes()
  .registerGroups([
  ])
  .registerDefaultGroups()
  .registerCommandsIn({
    filter: /^([^.].*)\.(js|ts)$/,
    dirname: path.join(__dirname, 'commands')
  });

client.login(BOT_TOKEN);
