import { TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma, scramGuild } from '../../bot';
import dotenv from 'dotenv';

dotenv.config();

const { EVENTS_CHANNEL } = process.env;

export default class UnpublishEventCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'unpublishevent',
      group: 'schedule',
      memberName: 'unpublish event',
      aliases: ['unpublish'],
      description: 'Unpublish an existing event listing.',
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

    if (event.messageId) return message.say('Event is not published. Use !publish <id> to publish.');

    const channel: TextChannel = scramGuild.channels.cache.get(EVENTS_CHANNEL) as TextChannel;

    const channelMessage = channel.messages.cache.get(event.messageId);

    if (!channelMessage) return message.say('Could not unpublish event');
    
    await channelMessage.delete();

    const result = await prisma.event.update({
      where: {
        id
      },
      data: {
        messageId: null
      }
    });

    if (!result) await message.say('Could not update status in db');
    else await message.say('Updated database entry');

    return message.say(`Removed ${event.name}`);
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
