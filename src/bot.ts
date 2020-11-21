import { CommandoClient } from 'discord.js-commando';
import { logger } from './utils';
import dotenv from 'dotenv';
import path from 'path';
import { Guild } from 'discord.js';
import { onMemberJoinForAuthentication, onMemberLeave, onMemberSendGreeting } from './services/authentication';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

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

client.on('ready', () => {
  // 15 minutes before
  cron.schedule('0,15,30,45,57 * * * *', async () => {
    logger.info('Pulling for 15 minute warning.');
    const allEvents = await prisma.event.findMany();

    allEvents.map(async event => {
      const timeUntil = (+event.startTime - +new Date()) / 60000;
      if (Math.abs(timeUntil - 15) < 1) {
        const eventSubscriptions = await prisma.eventSubscription.findMany({
          where: {
            eventId: event.id,
            notify: true
          }
        });

        eventSubscriptions.map(async subscription => {
          const user = await prisma.user.findOne({
            where: {
              email: subscription.userEmail
            }
          });

          await scramGuild.members.cache.get(user.discordId).send(`${event.name} starts in 15 minutes! When it is time, go to: ${event.link}`);
        })
      }
    });
  });
});

client.on('ready', async () => {
  // now
  cron.schedule('0 * * * *', async () => {
    logger.info('Pulling for NOW warning.');
    const allEvents = await prisma.event.findMany();

    allEvents.map(async event => {
      const timeUntil = (+event.startTime - +new Date()) / 60000;
      if (Math.abs(timeUntil) < 1) {
        const eventSubscriptions = await prisma.eventSubscription.findMany({
          where: {
            eventId: event.id,
            notify: true
          }
        });

        eventSubscriptions.map(async subscription => {
          const user = await prisma.user.findOne({
            where: {
              email: subscription.userEmail
            }
          });

          await scramGuild.members.cache.get(user.discordId).send(`${event.name} is starting now! Go to: ${event.link}`);
        })
      }
    });
  });
});

onMemberJoinForAuthentication(client);
onMemberLeave(client);
// onMemberSendGreeting(client);

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
