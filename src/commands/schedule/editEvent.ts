import { MessageEmbed, TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma, scramGuild } from '../../bot';
import dotenv from 'dotenv';

dotenv.config();

const { EVENTS_CHANNEL } = process.env;

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

    const data = {};
    data[property] = newValue;

    const result = await prisma.event.update({
      where: {
        id
      },
      data
    });

    if (!result) return message.say('Failed to edit event');

    let publishStatus = false;
    if (result.messageId) {
      const channel: TextChannel = scramGuild.channels.cache.get(EVENTS_CHANNEL) as TextChannel;

      if (!channel) publishStatus = false;
      else {
        const embed = new MessageEmbed()
          .setTitle(result.name)
          .setDescription(result.description)
          .addFields(
            { name: 'Start Time', value: this._formatTime(result.startTime), inline: true },
            { name: 'End Time', value: this._formatTime(result.endTime), inline: true }
          )
          .addField('Link', result.link)
          .addField('Subscribe', '🔔 to subscribe')
          .setFooter(result.id);

        if (this._validUrl(result.link)) {
          embed.setURL(result.link);
        }

        const toEdit = await channel.messages.fetch(({ around: result.messageId, limit: 1 }));
        if (toEdit) {
          await toEdit.first().edit(embed);
          publishStatus = true;
        }
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

  _validUrl = (str: string) => {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }
}
