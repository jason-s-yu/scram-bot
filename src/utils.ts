import { createLogger, format, transports } from 'winston';
const { combine, printf } = format;

import dotenv from 'dotenv';

import { prisma } from './bot';
import mailjet from 'node-mailjet';
import sgMail from '@sendgrid/mail';

dotenv.config();

const { SENDGRID_KEY, MAILJET_API_KEY, MAILJET_SECRET_KEY } = process.env;

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
  for (const email of emails) {
    const user = await prisma.user.findOne({ where: { email } });
    if (!user) {
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
    console.log(result);
    logger.info(`Mail sent to ${email}.`);
  }
}

export const sendMailjet = async (...emails: string[]) => {
  const recipients = [];
  for (const email of emails) {
    const user = await prisma.user.findOne({ where: { email } });
    if (user) {
      const { firstName, lastName, joinCode } = user;
      recipients.push({
        Email: email,
        Name: `${firstName} ${lastName}`,
        Vars: {
          firstName: firstName,
          code: joinCode
        }
      });
    } else {
      logger.info(`Skipping ${email} because it does not exist in the database.`);
    }
  }

  const mailer = mailjet.connect(MAILJET_API_KEY, MAILJET_SECRET_KEY);
  return mailer.post('send')
    .request({
      FromEmail: 'scram@uhsjcl.com',
      FromName: 'UHS JCL SCRAM',
      Subject: 'Welcome to SCRAM',
      'Mj-TemplateID': '1935835',
      'Mj-TemplateLanguage': 'true',
      Recipients: recipients,
      Headers: { 'Reply-To': 'scram@uhsjcl.com' }
    }).then(result => result).catch(() => false);
}
