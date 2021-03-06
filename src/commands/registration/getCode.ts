import { Command, CommandoMessage } from 'discord.js-commando';
import { prisma } from '../../bot';

export default class GetCodeCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'getcode',
      group: 'registration',
      memberName: 'getcode',
      description: 'Retrieve join code for user with email.',
      args: [
        {
          key: 'email',
          prompt: 'What email would you like to retrieve the join code for?',
          type: 'string'
        }
      ],
      userPermissions: ['ADMINISTRATOR']
    });
  }

  run = async (message: CommandoMessage, { email }) => {
    if (email) {
      const account = await prisma.user.findOne({ where: { email }});
      if (account) {
        return message.say(`Join code for \`${email}\` is \`${account.joinCode}\`.`);
      }
    }
    return message.say(`User with email \`${email}\` not registered.`);
  }
}
