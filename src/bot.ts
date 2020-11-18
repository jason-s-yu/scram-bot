import { CommandoClient } from 'discord.js-commando';
import { logger } from './utils';
import dotenv from 'dotenv';
import path, { join } from 'path';
import { Guild } from 'discord.js';
import { onMemberJoinForAuthentication } from './services/authentication';
import { PrismaClient } from '@prisma/client';
import mailjet from 'node-mailjet';

dotenv.config();

const { PREFIX, OWNER, BOT_TOKEN } = process.env;

export const prisma = new PrismaClient();

export const client: CommandoClient = new CommandoClient({
  commandPrefix: PREFIX,
  owner: OWNER
});

export const SCRAM_GUILD_ID = '762785723669151764';
export let scramGuild: Guild;

client.once('ready', async () => {
  logger.info(`Client is listening as ${client.user.tag} (${client.user.id})`);
  client.user.setActivity('opening ceremonies', { type: 'STREAMING', url: '' });

  scramGuild = client.guilds.cache.get(SCRAM_GUILD_ID);

  // await sendEmails();
  // (client.channels.cache.get('762785723669151770') as TextChannel).send('Hello, <@390353095298777091>');
});

const sendEmails = async () => {
  const emails = [];
  const recipients = [];
  for (const email of emails) {
    logger.info(email);
    const user = await prisma.users.findOne({ where: { email } });
    if (user) {
      const { firstName, lastName, joinCode } = user;
      recipients.push({
        Email: email,
        Name: `${firstName} ${lastName}`,
        Vars: {
          joincode: joinCode
        }
      });
    } else {
      recipients.push({
        Email: email,
        Name: `${email}`,
        Vars: {
          joincode: 'This email was not registered via the Google Form'
        }
      });
    }
  }

  const mailer = mailjet.connect('fd8711ff68b7aa105f07ed42c63b8194', '3ce4ae114ae7740a3efbe6b37ebf4afd');
  mailer.post('send')
    .request({
      FromEmail: 'scram@uhsjcl.com',
      FromName: 'UHS JCL SCRAM',
      Subject: 'Welcome to SCRAM',
      'Mj-TemplateID': '1901184',
      'Mj-TemplateLanguage': 'true',
      Recipients: recipients,
      Headers: { 'Reply-To': 'scram@uhsjcl.com' }
    }).then(result => {
      console.log(result.body);
    }).catch(err => {
      console.log(err.statusCode);
    });
}

onMemberJoinForAuthentication(client);

client.on('error', console.error);

client.registry
  .registerDefaultTypes()
  .registerGroups([
  ])
  .registerDefaultGroups()
  .registerCommandsIn({
    filter: /^([^.].*)\.(js|ts)$/,
    dirname: path.join(__dirname, 'commands')
  });

client.login(BOT_TOKEN);
