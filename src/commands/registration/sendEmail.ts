import { Command, CommandoMessage } from 'discord.js-commando';
import { logger, sendMailjet, sendSendGrid } from '../../utils';

export default class SendEmailsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'sendemail',
      group: 'registration',
      memberName: 'sendemail',
      aliases: ['sendemails', 'sendmail', 'sendmails', 'email', 'emails', 'sendmultiplemails'],
      description: 'Send welcome email to multiple addresses, comma separated.',
      ownerOnly: true
    });
  }

  run = async (message: CommandoMessage, emails) => {
    if (emails.includes(',')) return message.say('Use space as delimiter');
    const processedEmails = emails.split(' ');
    const method = 'mailjet';
    logger.info(`Sending emails to ${emails} using ${method}.`);

    let result;
    if (method === 'mailjet') {
      result = await sendMailjet('welcome', ...processedEmails);
    }
    else if (method === 'sendgrid') {
      result = await sendSendGrid(...processedEmails);
    }

    return message.say(result);
  }
}
