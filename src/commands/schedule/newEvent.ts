import { MessageEmbed, TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma, scramGuild } from '../../bot';
import dotenv from 'dotenv';
import { url } from 'inspector';

dotenv.config();

const { EVENTS_CHANNEL } = process.env;

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
          default: 'yes'
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
      const channel: TextChannel = scramGuild.channels.cache.get(EVENTS_CHANNEL) as TextChannel;

      if (!channel) publishStatus = false;
      else {
        const embed = new MessageEmbed()
          .setTitle(name)
          .setDescription(description)
          .addFields(
            { name: 'Start Time', value: this._formatTime(result.startTime), inline: true },
            { name: 'End Time', value: this._formatTime(result.endTime), inline: true }
          )
          .addField('Link', link)
          .addField('Subscribe', '🔔 to subscribe')
          .setFooter(result.id);

        if (this._validUrl(link)) {
          embed.setURL(link);
        }

        const sentEmbed = await channel.send(embed);

        await sentEmbed.react('🔔');

        await prisma.event.update({
          where: {
            id: result.id
          },
          data: {
            messageId: sentEmbed.id
          }
        });
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
