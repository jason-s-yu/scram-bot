import { ClientUser, Message, MessageReaction, User } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { prisma } from '../../bot';

export default class NewEventCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'newevent',
      group: 'schedule',
      memberName: 'new event',
      description: 'Create a new event listing.',
      args: [
        {
          key: 'name',
          prompt: 'Event name?',
          type: 'string'
        },
        {
          key: 'link',
          prompt: 'Event link?',
          type: 'string'
        },
        {
          key: 'start',
          prompt: 'Event start time?',
          type: 'string'
        },
        {
          key: 'end',
          prompt: 'Event end time?',
          type: 'string',
          default: ''
        },
        {
          key: 'description',
          prompt: 'Event description?',
          type: 'string',
          default: ''
        }
      ],
      userPermissions: ['ADMINISTRATOR']
    });
  }

  run = async (message: CommandoMessage, { name, start, end }) => {
    const msg: Message = await message.channel.send(`Event ${name} at ${start} to ${end}.`);

    await msg.react('🔔');

    const filter = (reaction: MessageReaction) => {
      return reaction.emoji.name === '🔔';
    };

    const res = msg.awaitReactions(filter)
      .then((collected) => {
        const reaction = collected.first();
        if (reaction.emoji.name === '🔔') {
          return msg.channel.send('🔔');
        }
      });

    return res;
  }
}
