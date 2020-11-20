import { CommandoClient } from 'discord.js-commando';
import { logger } from './utils';
import dotenv from 'dotenv';
import path from 'path';
import { Guild } from 'discord.js';
import { onMemberJoinForAuthentication, onMemberLeave, onMemberSendGreeting } from './services/authentication';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const { PREFIX, OWNER, BOT_TOKEN, MAIN_GUILD_ID } = process.env;

export const prisma = new PrismaClient();

export const client: CommandoClient = new CommandoClient({
  commandPrefix: PREFIX,
  owner: OWNER
});

export let scramGuild: Guild;

client.once('ready', async () => {
  logger.info(`Client is listening as ${client.user.tag} (${client.user.id})`);
  client.user.setActivity('opening ceremonies', { type: 'STREAMING', url: '' });

  scramGuild = client.guilds.cache.get(MAIN_GUILD_ID);
});

onMemberJoinForAuthentication(client);
onMemberLeave(client);
onMemberSendGreeting(client);

client.on('error', console.error);

client.registry
  .registerDefaultTypes()
  .registerGroups([
    ['misc', 'Miscellaneous Commands'],
    ['stats', 'Join Statistics Commands'],
    ['registration', 'Registration-related Commands'],
    ['schedule', 'Scheduling Commands']
  ])
  .registerDefaultGroups()
  .registerCommandsIn({
    filter: /^([^.].*)\.(js|ts)$/,
    dirname: path.join(__dirname, 'commands')
  });

client.login(BOT_TOKEN);
