import { TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma, scramGuild } from '../../bot';
import dotenv from 'dotenv';
import { logger } from '../../utils';

dotenv.config();

const { EVENTS_CHANNEL } = process.env;

export default class DeleteEventCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'deleteevent',
      group: 'schedule',
      memberName: 'delete event',
      description: 'Delete an existing event listing.',
      args: [
        {
          key: 'id',
          prompt: 'ID?',
          type: 'string'
        }
      ],
      userPermissions: ['MANAGE_GUILD']
    });
  }

  run = async (message: CommandoMessage, { id }) => {
    const event = await prisma.event.findOne({
      where: {
        id
      }
    });

    if (!event) return message.say('Event does not exist.');

    const channel: TextChannel = scramGuild.channels.cache.get(EVENTS_CHANNEL) as TextChannel;

    const channelMessage = channel.messages.cache.get(event.messageId);

    const result = await prisma.event.delete({
      where: {
        id
      }
    });

    if (result) {
      logger.info(`${message.author.tag} deleted ${event.name}`);
      if (channelMessage) {
        channelMessage.delete();
      }
      return message.say(`Event ${event.name} successfully deleted`);
    }
    return message.say('Could not delete event.');
  }
  
  _formatTime = (date: Date) => {
    let hours = date.getHours();
    let minutes: any = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }
}
