const Config = require('../../config.json');
const Guild = require('../guild');
const Heat = require('../heat');
const CommandCategory = require('../command-category');
const CommandPermission = require('../command-permission');

class Redirect extends Heat
{
    static instance = null;

    constructor() {
        if (Redirect.instance !== null) {
            return Redirect.instance;
        }

        super(10 * SECOND);
        this.aliases = ['redir'];
        this.category = CommandCategory.RESOURCE;
        this.isAllowedForContext = CommandPermission.notInWelcome;
    }

    /**
     * @param {Message} message
     */
    async process(message, args) {
        if (this.canCall()) {
            this.registerCall();
            if (args.length != 1) {
                message.channel.send(trans('model.command.redirect.toClassrooms', [Guild.mainClassroomChannel.toString()]));

                return;
            }
            if (!['chat', 'class'].includes(args[0])) {
                message.reply(
                    trans('model.command.redirect.unknownDest', [Config.prefix, Config.prefix])
                );

                return;
            }

            if (args[0] === 'chat') {
                message.channel.send(trans('model.command.redirect.toChatRooms', [Guild.learntLanguageChannel.toString(), Guild.otherLanguageChannel.toString()]));
            } else {
                message.channel.send(trans('model.command.redirect.toClassrooms', [Guild.mainClassroomChannel.toString()]));
            }
        } else {
            message.react('⌛');
        }
    }
}

module.exports = new Redirect();
