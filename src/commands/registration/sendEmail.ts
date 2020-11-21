import { Command, CommandoMessage } from 'discord.js-commando';
import { logger, sendMailjet, sendSendGrid } from '../../utils';

export default class SendEmailsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'sendemail',
      group: 'registration',
      memberName: 'sendemail',
      aliases: ['sendemails', 'sendmail', 'sendmails', 'email', 'emails', 'sendmultiplemails'],
      args: [
        {
          key: 'template',
          type: 'string',
          oneOf: ['welcome', 'correction', 'reminder'],
          prompt: 'Enter template'
        },
        {
          key: 'fromEmail',
          type: 'string',
          oneOf: ['scram@uhsjcl.com', 'southernrep@cajcl.org'],
          prompt: 'From who?'
        },
        {
          key: 'emails',
          type: 'string',
          infinite: true,
          prompt: 'Enter emails'
        }
      ],
      description: 'Send welcome email to multiple addresses.',
      ownerOnly: true
    });
  }

  run = async (message: CommandoMessage, { template, fromEmail, emails }) => {
    const method = 'mailjet';
    logger.info(`Sending ${template} emails to ${emails} using ${method}.`);

    let result;
    if (method === 'mailjet') {
      result = await sendMailjet(template, fromEmail, ...emails);
    }
    else if (method === 'sendgrid') {
      result = await sendSendGrid(...emails);
    }

    return message.say(result);
  }
}
