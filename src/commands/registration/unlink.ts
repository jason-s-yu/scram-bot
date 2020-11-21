import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { prisma, scramGuild } from '../../bot';

export default class UnlinkEmailCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'unlink',
      group: 'registration',
      memberName: 'unlink',
      description: 'Unlink discord account.',
      args: [
        {
          key: 'email',
          prompt: `User's email addres`,
          type: 'string'
        }
      ],
      ownerOnly: true
    });
  }

  run = async (message: CommandoMessage, { email }) => {
    const result = await prisma.user.update({
      where: { email },
      data: { joined: false }
    });

    if (result) return message.say('Success.');
    else return message.say('Could not find user.');
  }
}
