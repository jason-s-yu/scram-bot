import { TextChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';

export default class CreateInviteCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'createinvite',
      group: 'misc',
      aliases: ['newinvite', 'invite'],
      memberName: 'createinvite',
      description: 'Create or retrieve permanent invite code',
      userPermissions: ['ADMINISTRATOR']
    });
  }

  run = async (message: CommandoMessage) => {
    const invite = (await (message.channel as TextChannel).createInvite({ temporary: true, maxAge: 0 })).url;
    return message.say(invite);
  }
}
