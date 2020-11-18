import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { prisma } from '../../bot';

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
    logger.info(total);
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

    return message.say(`\`${joined}\` of the total \`${total}\` students from \`${school}\` have joined **(${frac}\%)**.`);
  }
}
