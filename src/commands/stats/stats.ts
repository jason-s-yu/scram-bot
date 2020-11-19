import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { prisma } from '../../bot';
import { MessageAttachment, MessageEmbed } from 'discord.js';

export default class StatsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'stats',
      aliases: ['statistics'],
      group: 'stats',
      memberName: 'get',
      description: 'Retrieve member statistics about this server.',
      args: [
        {
          key: 'school',
          prompt: 'What is the name of the school you would like to retrieve join stats for?',
          type: 'string',
          default: 'all'
        }
      ]
    });
  }

  run = async (message: CommandoMessage, { school }) => {
    const schoolCondition = {
      school
    };

    if (school === 'all') {
      delete schoolCondition.school;
    }

    const total = (await prisma.user.findMany({
      where: {
        ...schoolCondition,
        relation: 'Student'
      }
    })).length;
    if (!(total > 0)) {
      return message.say(`School \`${school}\` does not exist in the database.`);
    }
    const joined = (await prisma.user.findMany({
      where: {
        ...schoolCondition,
        joined: true,
        relation: 'Student'
      }
    })).length;

    const frac = Number(joined / total * 100).toFixed(2);

    const options = `{
      type: 'outlabeledPie',
      data: {
        labels: ['NOT JOINED', 'JOINED'],
        datasets: [{
            backgroundColor: ['#FF3784', '#4BC0C0'],
            data: [${total - joined}, ${joined}]
        }]
      },
      options: {
        plugins: {
          legend: false,
          outlabels: {
            text: '%v %l (%p)',
            color: 'white',
            stretch: 35,
            font: {
              resizable: true,
              minSize: 16,
              maxSize: 18
            }
          }
        }
      }
    }`;

    const embed = new MessageEmbed()
      .setColor('#7851a9')
      .setTitle(`Statistics for ${school}`)
      .setURL('https://uhsjcl.com')
      .addFields(
        { name: 'Total Joined', value: `\`${joined}\``, inline: true },
        { name: 'Total Registered', value: `\`${total}\``, inline: true },
        { name: 'Percentage Joined', value: `\`${frac}\%\`` }
      )
      .setImage(`https://quickchart.io/chart?w=300&h=300&c=${encodeURIComponent(options)}`)
      .setTimestamp();

    return message.channel.send(embed);
  }
}
