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
          key: 'discordId',
          prompt: 'Tag the user',
          type: 'string'
        }
      ],
      ownerOnly: true
    });
  }

  run = async (message: CommandoMessage, { discordId }) => {
    let tagged;
    try {
      tagged = scramGuild.members.cache.get(message.mentions.members.first().user.id);
    } catch (err) {
      return message.say('Tagged user not found.');
    }
    const result = await prisma.user.update({
      where: { discordId: tagged },
      data: { joined: false }
    });

    if (result) return message.say('Success.');
    else return message.say('Could not find user.');
  }
}
