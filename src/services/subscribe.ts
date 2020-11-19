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
    
  });
}