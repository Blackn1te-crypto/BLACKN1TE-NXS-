const { getConfig } = require('./botConfig');

function getChannelInfo() {
    const cfg = getConfig();
    return {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: cfg.newsletterJid || '',
                newsletterName: cfg.newsletterName || cfg.botName,
                serverMessageId: -1
            }
        }
    };
}

module.exports = {
    get channelInfo() {
        return getChannelInfo();
    },
    getChannelInfo
};
