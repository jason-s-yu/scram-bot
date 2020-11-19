import { Command, CommandoMessage } from 'discord.js-commando';
import { logger, sendMailjet, sendSendGrid } from '../../utils';
import { prisma } from '../../bot';

export default class SendEmailCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'sendemail',
      group: 'registration',
      memberName: 'sendemail',
      description: 'Send welcome email to address.',
      args: [
        {
          key: 'email',
          prompt: 'What email address would you like to send to?',
          type: 'string'
        },
        {
          key: 'method',
          prompt: 'What method?',
          type: 'string',
          default: 'mailjet'
        }
      ],
      ownerOnly: true
    });
  }

  run = async (message: CommandoMessage, { email, method }) => {
    logger.info(`Sending email to ${email} using ${method}.`);
    const user = await prisma.user.findOne({ where: { email } });
    if (!user) return message.say(`User with email \`${email}\` not registered.`);

    let result;
    if (method === 'mailjet') {
      result = await sendMailjet(email);
    }
    else if (method === 'sendgrid') {
      result = await sendSendGrid(email);
    }
    return message.say(result ? 'Success' : 'Failed');
  }
}
