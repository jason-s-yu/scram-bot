import { MessageEmbed, TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma, scramGuild } from '../../bot';
import dotenv from 'dotenv';

dotenv.config();

const { EVENTS_CHANNEL } = process.env;

export default class PublishEventCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'publishevent',
      group: 'schedule',
      memberName: 'publish event',
      aliases: ['publish'],
      description: 'Publish an existing event listing.',
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

    if (event.messageId) return message.say('Event is already published. Use !unpublish <id> to unpublish.');

    const channel: TextChannel = scramGuild.channels.cache.get(EVENTS_CHANNEL) as TextChannel;

    const channelMessage = channel.messages.cache.get(event.messageId);

    const embed = new MessageEmbed()
      .setTitle(event.name)
      .setDescription(event.description)
      .setURL(event.link)
      .addFields(
        { name: 'Start Time', value: this._formatTime(event.startTime), inline: true },
        { name: 'End Time', value: this._formatTime(event.endTime), inline: true }
      )
      .addField('Link', event.link)
      .addField('Subscribe', '🔔 to subscribe')
      .setFooter(event.id);

    const sentEmbed = await channel.send(embed);

    const result = await prisma.event.update({
      where: {
        id
      },
      data: {
        messageId: sentEmbed.id
      }
    });

    if (result) return message.say('Published');
    return message.say('Could not publish event.');
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
