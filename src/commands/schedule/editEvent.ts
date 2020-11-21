import { ClientUser, Message, MessageEmbed, TextChannel, User } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { prisma, scramGuild } from '../../bot';

export default class EditEventCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'editevent',
      group: 'schedule',
      memberName: 'edit event',
      description: 'Edit an existing event listing.',
      args: [
        {
          key: 'id',
          prompt: 'ID?',
          type: 'string'
        },
        {
          key: 'property',
          prompt: 'What property to update?',
          type: 'string',
          oneOf: ['name', 'link', 'start', 'end', 'description']
        },
        {
          key: 'newValue',
          prompt: 'What value?',
          type: 'string'
        }
      ]
    });
  }

  run = async (message: CommandoMessage, { id, property, newValue }) => {
    const sender = message.author;

    let thingToUpdate;
    if (property === 'start' || property === 'end') {
      thingToUpdate = new Date(Date.parse(`November 21, 2020 ${newValue}`));
    }

    const data = {
      [property]: newValue
    }

    const result = await prisma.event.update({
      where: {
        id
      },
      data: {
        [property]: newValue
      }
    });

    if (!result) return message.say('Failed to edit event');

    let publishStatus = false;
    if (result.messageId) {
      const channel: TextChannel = scramGuild.channels.cache.get('762785966820950018') as TextChannel;

      if (!channel) publishStatus = false;
      else {
        const embed = new MessageEmbed()
          .setTitle(result.name)
          .setDescription(result.description)
          .setURL(result.link)
          .addFields(
            { name: 'Start Time', value: this._formatTime(result.startTime), inline: true },
            { name: 'End Time', value: this._formatTime(result.endTime), inline: true }
          )
          .addField('Link', result.link)
          .setFooter(result.id);

        await channel.messages.cache.get(result.messageId).edit(embed);
        publishStatus = true;
      }
    }

    return message.say(`Edited ${publishStatus === true ? 'and modified post ' : '(and could not/did not modify post) '}event ${name}!`);
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
