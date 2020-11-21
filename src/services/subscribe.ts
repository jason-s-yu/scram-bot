import { GuildMember, Message, Role } from 'discord.js';
import { logger } from '../utils';
import { scramGuild, prisma } from '../bot';
import { CommandoClient } from 'discord.js-commando';
import dotenv from 'dotenv';

dotenv.config();

const { PREFIX } = process.env;

export const onSubscribeToEvent = (client: CommandoClient) => {
  client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) return;
    // check if channel exists in database (i.e. we want to listen here)
    const dbChannel = await prisma.listenChannel.findOne({ where: { channelId: reaction.message.channel.id }});
    if (!dbChannel) return;
    if (reaction.emoji.name !== '🔔') return;

    const dbUser = await prisma.user.findOne({ where: { discordId: user.id } });
    if (!dbUser) {
      logger.error(`Could not find user from db when subscribing!`)
      return;
    }
    const dbEvent = await prisma.event.findOne({ where: { messageId: reaction.message.id }});
    if (!dbEvent) {
      logger.error(`Could not find EVENT from db when subscribing!`)
      return;
    }

    const subscriptionExists = await prisma.eventSubscription.findFirst({
      where: {
        userEmail: dbUser.email,
        eventId: dbEvent.id
      }
    });

    if (subscriptionExists) {
      if (subscriptionExists.notify) {
        logger.warn(`Subscription already exists for user ${dbUser.firstName.trim()} ${dbUser.lastName.trim()}`);
        return;
      }
      
      const subscription = await prisma.eventSubscription.updateMany({
        where: {
          userEmail: dbUser.email,
          eventId: dbEvent.id
        },
        data: {
          notify: true
        }
      });

      if (!subscription) {
        logger.error(`Error updating unsubscription!`)
        return;
      } else {
        logger.info(`${dbUser.email} successfully re-subscribed to ${dbEvent.id} (${dbEvent.name})`);
        return;
      }
    };

    const subscription = await prisma.eventSubscription.create({
      data: {
        userEmail: dbUser.email,
        eventId: dbEvent.id,
        notify: true
      }
    });

    if (!subscription) {
      logger.error(`Error updating unsubscription!`)
      return;
    }

    logger.info(`${dbUser.email} successfully subscribed to ${dbEvent.id} (${dbEvent.name})`);
  });
}

export const onUnsubscribeToEvent = (client: CommandoClient) => {
  client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) return;
    // check if channel exists in database (i.e. we want to listen here)
    const dbChannel = await prisma.listenChannel.findOne({ where: { channelId: reaction.message.channel.id }});
    if (!dbChannel) return;
    if (reaction.emoji.name !== '🔔') return;

    const dbUser = await prisma.user.findOne({ where: { discordId: user.id } });
    if (!dbUser) {
      logger.error(`Could not find user from db when unsubscribing!`)
      return;
    }
    const dbEvent = await prisma.event.findOne({ where: { messageId: reaction.message.id }});
    if (!dbEvent) {
      logger.error(`Could not find EVENT from db when unsubscribing!`)
      return;
    }

    const unsubscription = await prisma.eventSubscription.updateMany({
      where: {
        userEmail: dbUser.email,
        eventId: dbEvent.id
      },
      data: {
        notify: false
      }
    });

    if (!unsubscription) {
      logger.error(`Error updating unsubscription!`)
      return;
    }

    logger.info(`${dbUser.email} successfully unsubscribed to ${dbEvent.id} (${dbEvent.name})`);
  });
}
