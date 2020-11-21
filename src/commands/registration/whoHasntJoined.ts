import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma } from '../../bot';

export default class WhoHasntJoinedCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'whohasntjoined',
      group: 'registration',
      memberName: 'whohasntjoined',
      description: 'Retrieve who has not joined',
      args: [
        {
          key: 'school',
          prompt: 'What school?',
          type: 'string'
        }
      ],
      userPermissions: ['ADMINISTRATOR']
    });
  }

  run = async (message: CommandoMessage, { school }) => {
    interface SchoolOptions {
      [key: string]: any
    }
    let schoolOptions: SchoolOptions = {
      school
    };
    if (school === 'all') {
      delete schoolOptions.school;
    }

    const user = await prisma.user.findMany({
      where: {
        ...schoolOptions,
        OR: [
          {
            relation: 'Student'
          },
          {
            relation: 'Volunteer'
          }
        ],
        joined: false
      }
    });
    if (!user || user.length < 1) return message.say(`Group \`${school}\` not found.`);

    let build = '';

    user.map(person => {
      build += `\`${person.firstName.trim()}\` \`${person.lastName.trim()}\` | \`${person.email}\` | \`${person.joinCode}\`\n`;
    });

    return message.say(`__**Users not joined from \`${school}\`__\n\n${build}`);
  }
}
