const Discord = require('discord.js');
const Config = require('../config.json');
const Guild = require('./guild');

const GuildAuditLogs = Discord.GuildAuditLogs;

const ModerationLog = {
    memberLeftDate: null,
    auditLogFetchInterval: 5 * 60 * 1000, // 5 minutes
    searchAuditLogTimeout: null,
    language: Config.botLanguage.split(',')[0],

    /**
     * @param {User} user
     * @returns {Promise.<void>}
     */
    processUnban: async (user) => {
        let reason = '';
        const commandRegex = new RegExp(
            regexEscape(Config.unbanCommand)
                .replace('%id', user.id)
                .replace('%reason', '(.+)'),
            'u'
        );

        const messages = await Guild.modLogChannel.messages.fetch({ limit: 100 });
        const message = messages.find(message => {
            return message.content.match(commandRegex) !== null;
        });

        if (message !== undefined) {
            reason = message.content.match(commandRegex)[1];
        }

        const member = trans('model.moderationLog.member', [user.toString()], ModerationLog.language);
        const action = trans('model.moderationLog.unbanned', [], ModerationLog.language);

        reason = reason.replace(/https?:\/\/[^\s.]+\.[^\s]+/g, '[CENSORED LINK]');
        reason = trans('model.moderationLog.reason', [reason], ModerationLog.language);

        const embed = new Discord.MessageEmbed().setAuthor(
            `${user.username}#${user.discriminator}`,
            user.displayAvatarURL({ dynamic: true })
        ).setDescription(`${member} ${action} ${reason}`).setColor(0x00FF00);

        Guild.publicModLogChannel.send(embed);
    },

    /**
     * @param {User} user
     * @param {boolean} banned
     * @returns {Promise.<void>}
     */
    processMemberRemove: async (user, banned) => {
        banned = banned || false;

        debug(`Detected member leaving: ${user.username}`);

        const auditLogs = await Guild.discordGuild.fetchAuditLogs({
            type: banned ? GuildAuditLogs.Actions.MEMBER_BAN_ADD : GuildAuditLogs.Actions.MEMBER_KICK,
            limit: 1
        });

        if (auditLogs.entries.size > 0) {
            ModerationLog.lastFetchedAuditLogId = auditLogs.entries.first().id;
            debug(`${auditLogs.entries.size} entr${auditLogs.entries.size > 1 ? 'ies' : 'y'} in the audit log before filtering`);

            const entries = auditLogs.entries.filter(entry => {
                const userTarget = entry.targetType === 'USER';
                const isTarget = entry.target !== undefined && user.id === entry.target.id;
                const notAuto = entry.reason === null || entry.reason.indexOf('[AUTO]') < 0;

                if (isTarget && (!userTarget || !notAuto)) {
                    debug(`Removed entry corresponding to user`);

                    debug(`userTarget: ${userTarget ? 'true' : 'false'}`);
                    debug(`entry.targetType: ${entry.targetType}`);

                    debug(`notAuto: ${notAuto ? 'true' : 'false'}`);
                    debug(`entry.reason: ${entry.reason}`);

                    if (entry.reason !== null) {
                        debug(`entry.reason.indexOf('[AUTO]'): ${entry.reason.indexOf('[AUTO]')}`);
                    }
                }

                return userTarget && isTarget && notAuto;
            });

            debug(`${entries.size} entr${auditLogs.entries.size > 1 ? 'ies' : 'y'} in the audit log after filtering`);

            entries.forEach(async entry => {
                const member = trans(
                    'model.moderationLog.member',
                    [`<@${entry.target.id}>`],
                    ModerationLog.language
                );

                const embed = new Discord.MessageEmbed().setAuthor(
                    `${entry.target.username}#${entry.target.discriminator}`,
                    entry.target.displayAvatarURL({ dynamic: true })
                );

                let action = '';
                let reason = '';

                switch (entry.action) {
                    case 'MEMBER_KICK':
                        action = trans('model.moderationLog.kicked', [], ModerationLog.language);
                        embed.setColor(0xFC8403); // orange
                        break;

                    case 'MEMBER_BAN_ADD':
                        action = trans('model.moderationLog.banned', [], ModerationLog.language);
                        embed.setColor(0xFF0000); // red
                        break;
                }

                if (entry.reason !== null) {
                    reason = entry.reason.replace(/https?:\/\/[^\s.]+\.[^\s]+/g, '[CENSORED LINK]');
                    reason = trans('model.moderationLog.reason', [reason], ModerationLog.language);
                } else {
                    await Guild.modLogChannel.send(trans('model.moderationLog.missingReason'));
                }

                embed.setDescription(`${member} ${action} ${reason}`);
                await Guild.publicModLogChannel.send(embed);
            });
        }
    }
};

module.exports = ModerationLog;