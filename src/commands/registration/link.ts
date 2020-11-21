import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma } from '../../bot';

export default class LinkEmailCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'update',
      group: 'registration',
      memberName: 'update',
      aliases: ['adjustemail', 'fixemail', 'updateemail'],
      description: 'Update email address of user.',
      args: [
        {
          key: 'oldEmail',
          prompt: 'What is the old email address?',
          type: 'string'
        },
        {
          key: 'newEmail',
          prompt: 'What is the new email address?',
          type: 'string'
        }
      ],
      ownerOnly: true
    });
  }

  run = async (message: CommandoMessage, { oldEmail, newEmail }) => {
    const result = await prisma.user.update({
      where: { email: oldEmail },
      data: { email: newEmail }
    });

    if (result) return message.say('Success.');
    else return message.say('Could not find user.');
  }
}
