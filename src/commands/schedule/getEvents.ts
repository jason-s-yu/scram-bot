import { MessageEmbed, TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma, scramGuild } from '../../bot';
import dotenv from 'dotenv';

dotenv.config();

const { EVENTS_CHANNEL } = process.env;

export default class GetEventsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'getevents',
      group: 'schedule',
      memberName: 'get events',
      description: 'Get all events.',
      userPermissions: ['MANAGE_GUILD']
    });
  }

  run = async (message: CommandoMessage) => {
    const events = await prisma.event.findMany();

    let returnString = '';

    events.map(event => {
      returnString += `${event.name}\n`;
    });

    return await message.say(`Events:\n\n${returnString}`);
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
