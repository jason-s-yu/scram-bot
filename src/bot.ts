import { CommandoClient } from 'discord.js-commando';
import { logger } from './utils';
import dotenv from 'dotenv';
import path from 'path';
import { Guild } from 'discord.js';
import { onMemberJoinForAuthentication } from './services/authentication';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const { PREFIX, OWNER, BOT_TOKEN } = process.env;

export const prisma = new PrismaClient();

export const client: CommandoClient = new CommandoClient({
  commandPrefix: PREFIX,
  owner: OWNER
});

export const SCRAM_GUILD_ID = '762785723669151764';
export let scramGuild: Guild;

client.once('ready', () => {
  logger.info(`Client is listening as ${client.user.tag} (${client.user.id})`);
  client.user.setActivity('opening ceremonies', { type: 'STREAMING', url: '' });

  scramGuild = client.guilds.cache.get(SCRAM_GUILD_ID);

  // (client.channels.cache.get('762785723669151770') as TextChannel).send('Hello, <@390353095298777091>');
});

onMemberJoinForAuthentication(client);

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
