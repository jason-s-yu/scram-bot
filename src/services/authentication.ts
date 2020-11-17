import { GuildMember, Message, Role } from 'discord.js';
import { logger } from '../utils';
import { scramGuild, prisma } from '../bot';
import { CommandoClient } from 'discord.js-commando';

export const onMemberJoinForAuthentication = (client: CommandoClient) => {
  client.on('guildMemberAdd', (member: GuildMember) => {
    member.send(`Welcome to the **SCRAM 2020** Discord server.`);
    member.send(`To authenticate yourself, please send me the five (5) digit code sent to you in the welcome email.`);
  });

  client.on('message', async (msg: Message) => {
    if (msg.author.bot) return;
    const user = await getUserByDiscordId(msg.author.id);
    if (user && user.joined) return;
    if (msg.channel.type !== 'dm') return;
  
    try {
      logger.info(`Beginning verification process for ${msg.author.tag}.`);
      const guildMember = scramGuild.members.cache.get(msg.author.id);
      const code = msg.content.toUpperCase();
      const dbUser = await prisma.users.findOne({
        where: { joinCode: code }
      });

      if (code === dbUser.joinCode) {
        if (dbUser.joined) {
          logger.info('Duplicate authentication attempt detected.');
          return;
        }
        const { firstName, lastName, school, relation } = dbUser;
        
        await guildMember.roles.add('771900750073823253');                                          // add "Amici" role
        await guildMember.setNickname(`${firstName} ${lastName}${relation === 'Sponsor' ? ' ' : ''}`);                                  // set nickname to first last
        const schoolRole: Role = scramGuild.roles.cache.find(role => role.name === school.trim());  // get school role
        await guildMember.roles.add(schoolRole.id);                                                 // assign school role
        await msg.reply(`You have been authenticated. Welcome, ${firstName}!`);                     // reply welcome message
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
    await prisma.users.update({
      where: { discordId: member.user.id },
      data: { joined: false }
    });
    logger.info(`${member.user.tag} (${member.user.id}) has left the server. Setting their join value to ${false}.`);
  });
}

const getUserByDiscordId = async (id: string) => {
  return await prisma.users.findOne({
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
