import { ClientUser, Message, MessageEmbed, MessageReaction, TextChannel, User } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { prisma, scramGuild } from '../../bot';

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
        },
        {
          key: 'publish',
          prompt: 'Publish?',
          type: 'string',
          default: 'no'
        }
      ]
    });
  }

  run = async (message: CommandoMessage, { name, link, start, end, description, publish }) => {
    const sender = message.author;

    const startTime = new Date(Date.parse(`November 21, 2020 ${start}`));
    const endTime = new Date(Date.parse(`November 21, 2020 ${end}`));

    const result = await prisma.event.create({
      data: {
        name,
        link,
        startTime,
        endTime,
        description
      }
    });

    if (!result) return message.say('Failed to create event');

    let publishStatus = false;
    if (publish) {
      const channel: TextChannel = scramGuild.channels.cache.get('762785966820950018') as TextChannel;

      if (!channel) publishStatus = false;
      else {
        const embed = new MessageEmbed()
          .setTitle(name)
          .setDescription(description)
          .setURL(link)
          .addFields(
            { name: 'Start Time', value: this._formatTime(result.startTime), inline: true },
            { name: 'End Time', value: this._formatTime(result.endTime), inline: true }
          )
          .addField('Link', link)

        channel.send(embed);
        publishStatus = true;
      }
    }

    return message.say(`Created ${publishStatus === true ? 'and published ' : '(and could not/did not publish) '}event ${name}!`);
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
