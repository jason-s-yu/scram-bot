import { Command, CommandoMessage } from 'discord.js-commando';
import { logger, sendMailjet, sendSendGrid } from '../../utils';
import { prisma } from '../../bot';

export default class SendGroupEmailCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'sendgroupemail',
      group: 'registration',
      memberName: 'sendgroupemail',
      aliases: ['sendgroupmail', 'groupemail', 'groupmail', 'groupsend'],
      description: 'Send welcome email to school group.',
      args: [
        {
          key: 'school',
          prompt: 'What school would you like to send to?',
          type: 'string'
        },
        {
          key: 'template',
          prompt: 'What template?',
          oneOf: ['welcome', 'correction'],
          type: 'string',
          default: 'welcome'
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

  run = async (message: CommandoMessage, { school, template, method }) => {
    logger.info(`Sending email to ${school} using ${method}.`);
    let schoolOptions = {
      school
    };
    if (school === 'all') {
      delete schoolOptions.school;
    } else if (school.startsWith('!')) {
      schoolOptions = {
        NOT: [
          {
            school: school.replace('!')
          }
        ]
      } as any;
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
        ]
      }
    });
    if (!user || user.length < 1) return message.say(`Group \`${school}\` not found.`);

    const emails = user.map(val => val.email);

    let result;
    if (method === 'mailjet') {
      result = await sendMailjet(template, ...emails);
    }
    else if (method === 'sendgrid') {
      result = await sendSendGrid(...emails);
    }
    return message.say(result ? `Sent ${user.length} emails successfully.` : `Email sending failed.`);
  }
}
