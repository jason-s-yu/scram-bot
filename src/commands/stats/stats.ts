import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { prisma } from '../../bot';
import { MessageEmbed } from 'discord.js';

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
          type: 'string'
        }
      ]
    });
  }

  run = async (message: CommandoMessage, { school }) => {
    const total = (await prisma.users.findMany({
      where: {
        school,
        relation: 'Student'
      }
    })).length;
    if (!(total > 0)) {
      return message.say(`School \`${school}\` does not exist in the database.`);
    }
    const joined = (await prisma.users.findMany({
      where: {
        school,
        joined: true,
        relation: 'Student'
      }
    })).length;

    const frac = Number(joined / total * 100).toFixed(2);

    const embed = new MessageEmbed()
      .setColor('#7851a9')
      .setTitle(`Statistics for ${school}`)
      .setURL('https://uhsjcl.com')
      .addFields(
        { name: 'Total Joined', value: `\`${joined}\``, inline: true },
        { name: 'Total Registered', value: `\`${total}\``, inline: true },
        { name: 'Percentage Joined', value: `\`${frac}\%\`` }
      )
      .setTimestamp();

    return message.channel.send(embed);
  }
}
