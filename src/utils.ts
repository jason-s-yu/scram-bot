import { createLogger, format, transports } from 'winston';
const { combine, printf } = format;

import dotenv from 'dotenv';

import { prisma, scramGuild } from './bot';
import mailjet from 'node-mailjet';
import sgMail from '@sendgrid/mail';
import { TextChannel } from 'discord.js';

dotenv.config();

const { SENDGRID_KEY, MAILJET_API_KEY, MAILJET_SECRET_KEY } = process.env;

export const emailTemplates = {
  'welcome': '1935835',
  'correction': '1943276',
  'reminder': '1948061'
};

sgMail.setApiKey(SENDGRID_KEY);

const formatDate = (date: Date) => {
  let month = '' + (date.getMonth() + 1);
  let day = '' + date.getDate();
  const year = date.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const loggerFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: 'info',
  format: combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    loggerFormat
  ),
  transports: [
    new transports.File({
      filename: `logs/${formatDate(new Date())}-error.log`,
      level: 'error'
    }),
    new transports.File({
      filename: `logs/${formatDate(new Date())}.log`,
      level: 'info'
    }),
    new transports.Console({
      format: loggerFormat,
      level: 'info'
    })
  ]
});

export const sendSendGrid = async (...emails: string[]) => {
  return;
  const success = [];
  const skipped = [];
  for (const email of emails) {
    const user = await prisma.user.findOne({ where: { email } });
    if (!user) {
      skipped.push(email);
      logger.info(`Skipping ${email} because it does not exist in the database.`);
      continue;
    }
    const msg = {
      to: email,
      toname: `${user.firstName} ${user.lastName}`,
      from: 'scramgrid@uhsjcl.com',
      fromname: 'UHS JCL SCRAM',
      templateId: 'd-888ab6d0ea114cb4bae084b9e623fbd2',
      dynamic_template_data: {
        firstName: user.firstName,
        code: user.joinCode
      },
      headers: {
        'X-Reply-To': 'scram@uhsjcl.com'
      }
    };
    const result = await sgMail.send(msg);
    if (result) {
      success.push(email);
    }
  }
  return `Sent ${success.length} email(s) successfully. Skipped: ${skipped.length > 0 ? skipped : 'none'}.`;
}

export const sendMailjet = async (templateName: ('welcome' | 'correction' | 'reminder'), from: ('scram@uhsjcl.com' | 'southernrep@cajcl.org'), ...emails: string[]) => {
  const invite = (await (scramGuild.channels.cache.get('778802682185777203') as TextChannel).createInvite({ temporary: true, maxAge: 0 })).url;
  const recipients = [];
  const skipped = [];
  for (const email of emails) {
    const user = await prisma.user.findOne({ where: { email } });
    if (user) {
      const { firstName, lastName, joinCode } = user;
      recipients.push({
        Email: email,
        Name: `${firstName} ${lastName}`,
        Vars: {
          firstName: firstName.trim(),
          code: joinCode,
          link: invite
        }
      });
    } else {
      skipped.push(email);
      logger.info(`Skipping ${email} because it does not exist in the database.`);
    }
  }

  const mailer = mailjet.connect(MAILJET_API_KEY, MAILJET_SECRET_KEY);
  let title = '';
  if (templateName === 'correction') {
    title += ' - Discord Invite';
  } else if (templateName === 'reminder') {
    title = 'Reminder to Join the SCRAM 2020 Discord Server';
  }
  return mailer.post('send')
    .request({
      FromEmail: from,
      FromName: `${from === 'scram@uhsjcl.com' ? 'UHS JCL SCRAM' : 'Meghana Krishnan'}`,
      Subject: title,
      'Mj-TemplateID': emailTemplates[templateName],
      'Mj-TemplateLanguage': 'true',
      Recipients: recipients,
      Headers: { 'Reply-To': 'scram@uhsjcl.com' }
    }).then(result => `Sent ${recipients.length} email(s) successfully. Skipped: ${skipped.length > 0 ? skipped : 'none'}.`).catch(() => `Internal error.`);
}

export const disambiguation = (items, label, property = 'name') => {
	const itemList = items.map(item => `"${(property ? item[property] : item).replace(/ /g, '\xa0')}"`).join(',   ');
	return `Multiple ${label} found, please be more specific: ${itemList}`;
}
