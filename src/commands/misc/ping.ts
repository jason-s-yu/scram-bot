import { Command, CommandoMessage } from 'discord.js-commando';
import hello from './hello.json';

export default class PingCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'ping',
      aliases: ['hi', 'greetings', ...hello.map(greeting => greeting.hello.toLocaleLowerCase())],
      group: 'misc',
      memberName: 'ping',
      description: 'Get a simple reply from SCRAMBot.',
      userPermissions: ['MANAGE_GUILD']
    });
  }

  run = (message: CommandoMessage) => {
    return message.reply(this.aliases[Math.floor(Math.random() * this.aliases.length)]);
  }
}
