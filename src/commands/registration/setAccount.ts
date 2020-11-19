import { Command, CommandoMessage } from 'discord.js-commando';
import { logger } from '../../utils';
import { scramGuild, prisma } from '../../bot';
import { GuildMember, Role, User } from 'discord.js';

export default class SetDiscordAccount extends Command {
  constructor(client) {
    super(client, {
      name: 'setaccount',
      group: 'registration',
      aliases: ['link', 'linkaccount'],
      memberName: 'setaccount',
      description: 'Link registered email to discord account.',
      args: [
        {
          key: 'email',
          prompt: 'What email would you like to link?',
          type: 'string'
        },
        {
          key: 'member',
          prompt: 'Tag the user you want to link or specify their ID',
          type: 'string'
        }
      ],
      userPermissions: ['ADMINISTRATOR']
    });
  }

  run = async (message: CommandoMessage, { email, member }) => {
    const { members } = message.mentions;
    let guildMember;
    if (members) {
      guildMember = scramGuild.members.cache.get(message.mentions.members.first().user.id);
    }
    if (!guildMember) {
      guildMember = scramGuild.members.cache.get(member);
    }
    if (!guildMember) return message.say('That user does not exist in the SCRAM server.');
    const user = await prisma.user.findOne({ where: { email }});
    if (!user) return message.say(`User with email \`${email}\` not registered.`);

    const result = await prisma.user.update({
      where: { email },
      data: {
        discordId: guildMember.id,
        joined: true
      }
    });
    if (result) {
      if (guildMember.id !== scramGuild.owner.id) {
        await guildMember.setNickname(`${user.firstName} ${user.lastName}`);                              // set nickname to first last
      }
      const relation = (user.relation.trim() === 'Student' || user.relation.trim() === 'Volunteer') ? 'Amici' : 'Sponsor';
      const relationRole: Role = scramGuild.roles.cache.find(role => role.name === relation.trim());
      await guildMember.roles.add(relationRole.id);                                                     // add proper role (Amici or Sponsor)
      const schoolRole: Role = scramGuild.roles.cache.find(role => role.name === user.school.trim());   // get school role
      await guildMember.roles.add(schoolRole.id);                                                       // assign school role
      return message.say(`Successfully linked \`${email}\`.`);
    }
    return message.say(`Internal error occurred.`);
  }
}
