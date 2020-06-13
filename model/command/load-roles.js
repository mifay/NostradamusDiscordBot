const Logger = require('@lilywonhalf/pretty-logger');
const Guild = require('../guild');
const Language = require('../language');
const Country = require('../country');
const CommandCategory = require('../command-category');
const CommandPermission = require('../command-permission');

/**
 * @param {Message} message
 * @param {Array} args
 */
module.exports = {
    aliases: ['loadroles'],
    category: CommandCategory.ADMINISTRATION,
    isAllowedForContext: CommandPermission.isMemberMod,
    process: async (message, args) => {
        const dryRun = args[0] === 'dry';
        const foundLanguageRoles = Language.getRoleNameList();
        const foundCountryRoles = Country.getRoleNameList();
        let amountRolesCreated = 0;

        for (let i = 0; i < foundLanguageRoles.length; i++) {
            if (!message.guild.roles.cache.find(role => role.name === foundLanguageRoles[i])) {
                amountRolesCreated++;

                if (dryRun) {
                    message.reply(trans('model.command.loadRoles.dryRoleCreation', [foundLanguageRoles[i]], 'en'));
                } else {
                    Guild.createRole(foundLanguageRoles[i])
                        .then(role => message.reply(trans('model.command.loadRoles.roleCreation', [role], 'en')))
                        .catch(Logger.exception)
                }
            }
        }

        for (let i = 0; i < foundCountryRoles.length; i++) {
            if (!message.guild.roles.cache.find(role => role.name === foundCountryRoles[i])) {
                amountRolesCreated++;

                if (dryRun) {
                    message.reply(trans('model.command.loadRoles.dryRoleCreation', [foundCountryRoles[i]], 'en'));
                } else {
                    Guild.createRole(foundCountryRoles[i])
                    .then(role => message.reply(trans('model.command.loadRoles.dryRoleCreation', [role], 'en')))
                    .catch(Logger.exception)
                }
            }
        }

        message.reply(trans('model.command.loadRoles.count', [amountRolesCreated], 'en'));
    }
};
