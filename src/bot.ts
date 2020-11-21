import { CommandoClient } from 'discord.js-commando';
import { logger } from './utils';
import dotenv from 'dotenv';
import path from 'path';
import { Guild, TextChannel } from 'discord.js';
import { onMemberJoinForAuthentication, onMemberLeave, onMemberSendGreeting } from './services/authentication';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { onSubscribeToEvent, onUnsubscribeToEvent } from './services/subscribe';

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

client.on('raw', packet => {
  // We don't want this to run on unrelated packets
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
  // Grab the channel to check the message from
  const channel = client.channels.cache.get(packet.d.channel_id) as TextChannel;
  // There's no need to emit if the message is cached, because the event will fire anyway for that
  if (channel.messages.cache.has(packet.d.message_id)) return;
  // Since we have confirmed the message is not cached, let's fetch it
  channel.messages.fetch(packet.d.message_id).then(message => {
      // Emojis can have identifiers of name:id format, so we have to account for that case as well
      const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
      // This gives us the reaction we need to emit the event properly, in top of the message object
      const reaction = message.reactions.cache.get(emoji);
      // Adds the currently reacting user to the reaction's users collection.
      if (reaction) reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id));
      // Check which type of event it is before emitting
      if (packet.t === 'MESSAGE_REACTION_ADD') {
          client.emit('messageReactionAdd', reaction, client.users.cache.get(packet.d.user_id));
      }
      if (packet.t === 'MESSAGE_REACTION_REMOVE') {
          client.emit('messageReactionRemove', reaction, client.users.cache.get(packet.d.user_id));
      }
  });
});

onMemberJoinForAuthentication(client);
onMemberLeave(client);
// onMemberSendGreeting(client);
onSubscribeToEvent(client);
onUnsubscribeToEvent(client);

client.on('ready', () => {
  // 15 minutes before
  cron.schedule('0,3,15,30,45,57 * * * *', async () => {
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
