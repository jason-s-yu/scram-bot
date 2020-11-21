import { CategoryChannel, MessageEmbed, Role, TextChannel, VoiceChannel } from 'discord.js';
import { Command, CommandoMessage } from 'discord.js-commando';
import { scramGuild } from '../../bot';

export default class AnnounceCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'announce',
      group: 'misc',
      memberName: 'announce',
      description: 'Send announcement.',
      args: [
        {
          key: 'text',
          prompt: 'What announcement to send?',
          type: 'string'
        },
        {
          key: 'channelId',
          prompt: 'What is the id of the channel want to send to?',
          type: 'string',
          default: 'here'
        },
        {
          key: 'groups',
          prompt: 'Enter roles to send it to, comma-separated:',
          type: 'string',
          default: ''
        },
        {
          key: 'deleteMessage',
          prompt: 'Do you want to delete your message?',
          type: 'string',
          oneOf: ['yes', 'no', 'true', 'false', 'y', 'n'],
          default: 'no'
        }
      ],
      userPermissions: ['ADMINISTRATOR']
    });
  }

  run = async (message: CommandoMessage, { text, channelId, groups, deleteMessage }) => {
    if (message.author)
    if (channelId === 'here') {
      channelId = message.channel.id;
    }
    if (this.client.channels.cache.get(channelId) instanceof VoiceChannel || this.client.channels.cache.get(channelId) instanceof CategoryChannel) {
      return message.reply('Invalid channel. Must be a text channel.');
    }
    const channel: TextChannel = this.client.channels.cache.get(channelId) as TextChannel;
    
    if (text === '.welcome') {
      if (deleteMessage.toLowerCase() === 'yes' || deleteMessage.toLowerCase() === 'y' || deleteMessage.toLowerCase() === 'true') {
        message.delete();
      }
      return await channel.send(`**Hello!** We're so excited to welcome you to SCRAM 2020. It's going to be a Saturday full of activities, events, and workshops with JCLers from all around Southern California, and we've worked really hard for the past few months to bring you an experience as close to traditional as possible.\n\nIf you just joined, I sent you a direct message with a request for the five-digit code sent to you via email. Copy and paste that code to gain access to the rest of the server. If your code fails multiple times and you believe that is an error, send a message to ${scramGuild.owner.toString()}.\n\nOnce we get close enough to Saturday, more channels will be available for you to chat, register for and subscribe to event notifications, and find out where you need to go to join the Opening Ceremonies.\n\nLooking forward to a fun-filled Saturday with you!\nCheers, *The SCRAM Planning Team*`);
    } else if (text === '.rules') {
      if (deleteMessage.toLowerCase() === 'yes' || deleteMessage.toLowerCase() === 'y' || deleteMessage.toLowerCase() === 'true') {
        message.delete();
      }
      return message.say(new MessageEmbed()
        .setColor('#7851a9')
        .setThumbnail('http://uhsjcl.com/cdn/scramlogo.jpg')
        .setTitle('SCRAM 2020')
        .setDescription(`_****1. No spamming\n2. No hate speech of any kind\n3. No excessive cursing or profanity\n4. No obscene or NSFW images, links, videos\n5. Keep conversation topics school appropriate\n6. Avoid heated/aggressive arguments\n7. Be respectful of other participants\n8. Use each channel for its respective purpose\n9. Type in English only\nMessage any member with the Planning role if there are any issues.`)
      );
    } else {
      let tagMessage = ``;
      for (let roleString of groups.split(',')) {
        roleString = roleString.trim();
        if (roleString === 'everyone') {
          tagMessage += '@everyone ';
        } else if (roleString === 'here') {
          tagMessage += '@here ';
        }
        const findRole: Role = scramGuild.roles.cache.find(role => role.name === roleString);
        if (!findRole) continue;
        tagMessage += `${findRole.toString()} `;
      }
      if (deleteMessage.toLowerCase() === 'yes' || deleteMessage.toLowerCase() === 'y' || deleteMessage.toLowerCase() === 'true') {
        message.delete();
      }
      return await channel.send(`${tagMessage}${text}`);
    }
  }
}
