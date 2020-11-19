import { GuildMember, Message, Role } from 'discord.js';
import { logger } from '../utils';
import { scramGuild, prisma } from '../bot';
import { CommandoClient } from 'discord.js-commando';
import dotenv from 'dotenv';

dotenv.config();

const { PREFIX } = process.env;

const queue = {};

export const onMemberJoinForAuthentication = (client: CommandoClient) => {
  client.on('guildMemberAdd', async (member: GuildMember) => {
    if (member.user.bot) return;
    member.send(`Welcome to the **SCRAM 2020** Discord server.`);
    const userAlreadyAuthenticated = await getUserByDiscordId(member.id);
    if (!userAlreadyAuthenticated) {
      member.send(`To authenticate yourself, please send me the five (5) digit code sent to you in the welcome email.`);
    }
  });

  client.on('message', async (msg: Message) => {
    if (msg.author.bot) return;
    if (msg.content.startsWith(PREFIX)) return;
    const user = await getUserByDiscordId(msg.author.id);
    if (user && user.joined) return;
    if (msg.channel.type !== 'dm') return;
  
    try {
      queue[msg.author.id].attempts += 1;
      (msg.author.id in queue) || (queue[msg.author.id] = { attempts: 0, last: Date.now() });
      if (queue[msg.author.id].attempts > 5) {
        if (Date.now() - queue[msg.author.id].last > 300000) {
          delete queue[msg.author.id];
        } else {
          msg.reply('Too many incorrect requests. Please wait 5 minutes.')
          return;
        }
      }
      
      logger.info(`Beginning verification process for ${msg.author.tag}.`);
      const guildMember = scramGuild.members.cache.get(msg.author.id);
      const code = msg.content.toUpperCase();
      const dbUser = await prisma.user.findOne({
        where: { joinCode: code }
      });

      if (dbUser) {
        if (dbUser.joined) {
          logger.warn(`${msg.author.tag} tried to authenticate with an already-verified user (Code: ${code} is associated with ${dbUser.email}).`);
          msg.reply(`You have already joined and authenticated with your Discord account. If you believe this is an error, contact an administrator.`);
          return;
        }
        const { firstName, lastName, school } = dbUser;
        const relation = (dbUser.relation.trim() === 'Student' || dbUser.relation.trim() === 'Volunteer') ? 'Amici' : 'Sponsor';
        const relationRole: Role = scramGuild.roles.cache.find(role => role.name === relation.trim());
        await guildMember.roles.add(relationRole.id);                                               // add proper role (Amici or Sponsor)
        await guildMember.setNickname(`${firstName} ${lastName}`);                                  // set nickname to first last
        const schoolRole: Role = scramGuild.roles.cache.find(role => role.name === school.trim());  // get school role
        await guildMember.roles.add(schoolRole.id);                                                 // assign school role
        await msg.reply(`You have been authenticated. Welcome, ${firstName}!`);                     // reply welcome message
        await prisma.user.update({
          where: {
            joinCode: code
          },
          data: {
            joined: true
          }
        });
        logger.info(`Successfully authorized ${msg.author.tag}.`);
      } else {
        await msg.reply('Your authentication code was invalid. Please try again');
      }
    } catch(err) {
      console.error(err);
    }
  });
}

export const onMemberLeave = (client: CommandoClient) => {
  client.on('guildMemberRemove', async (member: GuildMember) => {
    await prisma.user.update({
      where: { discordId: member.user.id },
      data: { joined: false }
    });
    logger.info(`${member.user.tag} (${member.user.id}) has left the server. Setting their join value to ${false}.`);
  });
}

const getUserByDiscordId = async (id: string) => {
  return await prisma.user.findOne({
    where: { discordId: id }
  });
}

const sponsorNicknameAddon = (relation: 'Sponsor' | 'Student', school: string) => {
  if (relation === 'Sponsor') {
    let schoolAbbreviation = '';
    for (const c of school) {
      if (c >= 'A' && c <= 'Z') {
        schoolAbbreviation += c;
      }
    }
    return ` (${schoolAbbreviation} Sponsor)`;
  } else return '';
}
