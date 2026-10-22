const config = require('../lib/config');

module.exports = {
    name: 'menu',
    category: 'general',
    description: 'Show bot menu',
    
    async execute(sock, m, args, { prefix, commands }) {
        const from = m.key.remoteJid;
        
        // Build the menu text
        let menuText = `╭━━━〔 *${config.botName}* 〕━━━┈⊷\n`;
        menuText += `┃ 👤 *User:* ${m.pushName || 'User'}\n`;
        menuText += `┃ 🤖 *Status:* Online ✅\n`;
        menuText += `┃ ⚙️ *Mode:* Public 🌐\n`;
        menuText += `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n`;
        
        menuText += `╭━━━〔 *USER CMDS* 〕━━━┈⊷\n`;
        
        // Loop through all commands and add them to the menu
        if (commands && commands.length > 0) {
            for (let cmd of commands) {
                menuText += `┃ ◇ ${prefix}${cmd.name}\n`;
            }
        } else {
            // Fallback if no commands list is available
            menuText += `┃ ◇ ${prefix}autoreacts\n`;
            menuText += `┃ ◇ ${prefix}antilink\n`;
            menuText += `┃ ◇ ${prefix}antidelete\n`;
            menuText += `┃ ◇ ${prefix}ai\n`;
            menuText += `┃ ◇ ${prefix}vv\n`;
            menuText += `┃ ◇ ${prefix}owner\n`;
            menuText += `┃ ◇ ${prefix}dp\n`;
            menuText += `┃ ◇ ${prefix}ping\n`;
            menuText += `┃ ◇ ${prefix}translate\n`;
        }
        
        menuText += `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n`;
        menuText += `> ${config.footer}`;

        // Send the menu with the image from config.js
        await sock.sendMessage(from, {
            image: { url: config.menuImage },
            caption: menuText
        }, { quoted: m });
    }
};
