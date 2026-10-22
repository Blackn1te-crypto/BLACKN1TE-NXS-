// ============================================================
// commands/settings.js
// OWNER-ONLY menu manager
// Allows the owner to edit menu title, footer, categories,
// and add/remove/edit command entries — saved to disk.
// ============================================================

const fs = require('fs-extra');
const path = require('path');

// ============================================================
// STORAGE PATH
// ============================================================
const MENU_FILE = path.join(__dirname, '..', 'data', 'menu_config.json');
fs.ensureDirSync(path.join(__dirname, '..', 'data'));

// ============================================================
// DEFAULT MENU CONFIG
// ============================================================
const DEFAULT_MENU = {
    title: 'BL@CKN1TE-NXS',
    subtitle: 'The Incisive Tri-Hat Hacker',
    footer: 'Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER',
    channel: 'https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f',
    logoUrl: 'https://raw.githubusercontent.com/Blackn1te-crypto/BLACKN1TE-NXS/main/logo.png',
    categories: [
        {
            name: 'USER CMDS',
            commands: [
                { cmd: '.autoreacts [on/off]',  desc: 'Toggle auto reactions' },
                { cmd: '.antilink [on/off/kick]', desc: 'Link protection' },
                { cmd: '.antidelete [on/off]',  desc: 'Recover deleted messages' },
                { cmd: '.ai [on/off]',          desc: 'Toggle AI chat mode' },
                { cmd: '.vv',                   desc: 'Reveal view-once media' },
                { cmd: '.owner',                desc: 'Contact owner' },
                { cmd: '.dp',                   desc: 'Download profile picture' },
                { cmd: '.ping',                 desc: 'Latency check' },
                { cmd: '.translate (text)',     desc: 'Translate text' }
            ]
        },
        {
            name: 'MEDIA',
            commands: [
                { cmd: '.song (name/url)',      desc: 'Download song from YouTube' },
                { cmd: '.video (name/url)',     desc: 'Download video from YouTube' },
                { cmd: '.tiktok (url)',         desc: 'Download TikTok video' },
                { cmd: '.insta (url)',          desc: 'Download Instagram media' },
                { cmd: '.facebook (url)',       desc: 'Download Facebook video' },
                { cmd: '.gdrive (url)',         desc: 'Google Drive downloader' },
                { cmd: '.mf (url)',             desc: 'MediaFire downloader' },
                { cmd: '.apk (name)',           desc: 'APK downloader' }
            ]
        },
        {
            name: 'TOOLS',
            commands: [
                { cmd: '.joke',                 desc: 'Random joke' },
                { cmd: '.meme',                 desc: 'Random meme' },
                { cmd: '.emojimix (e1+e2)',     desc: 'Mix two emojis' },
                { cmd: '.character (mention)',  desc: 'Character profile' },
                { cmd: '.sticker',              desc: 'Convert to sticker' },
                { cmd: '.image (prompt)',       desc: 'AI image generator' },
                { cmd: '.tts (text)',           desc: 'Text to speech' },
                { cmd: '.weather (city)',       desc: 'Live weather' },
                { cmd: '.qr (text/url)',        desc: 'QR code generator' },
                { cmd: '.shorten (url)',        desc: 'URL shortener' },
                { cmd: '.calc (expr)',          desc: 'Calculator' }
            ]
        },
        {
            name: 'ADMIN',
            commands: [
                { cmd: '.private',              desc: 'Set bot to private mode' },
                { cmd: '.public',               desc: 'Set bot to public mode' },
                { cmd: '.autoread [on/off]',    desc: 'Toggle auto-read' },
                { cmd: '.online [on/off]',      desc: 'Ghost mode toggle' },
                { cmd: '.status [on/off]',      desc: 'Auto status management' },
                { cmd: '.hack',                 desc: 'Fun hack command' },
                { cmd: '.hidetag',              desc: 'Mention all silently' },
                { cmd: '.tagall',               desc: 'Mention all members' },
                { cmd: '.setname (name)',       desc: 'Set bot display name' },
                { cmd: '.anticall [on/off]',    desc: 'Reject incoming calls' },
                { cmd: '.kickoffline [on/off]', desc: 'Kick inactive members' },
                { cmd: '.antistatus [on/off]',  desc: 'Block status forwarding' },
                { cmd: '.groupinfo',            desc: 'Show group metadata' },
                { cmd: '.accept',               desc: 'Accept group join requests' }
            ]
        },
        {
            name: 'BL@CKN1TE WEB HUB',
            commands: [
                { cmd: '.websites',             desc: 'View all BL@CKN1TE sites' },
                { cmd: '.trihat',               desc: 'MediaFire tools vault' }
            ]
        }
    ]
};

// ============================================================
// LOAD / SAVE
// ============================================================
function loadMenu() {
    try {
        if (fs.existsSync(MENU_FILE)) {
            return fs.readJsonSync(MENU_FILE);
        }
    } catch (e) {
        console.warn('[SETTINGS] load failed:', e.message);
    }
    // Save default on first run
    fs.writeJsonSync(MENU_FILE, DEFAULT_MENU, { spaces: 2 });
    return JSON.parse(JSON.stringify(DEFAULT_MENU));
}

function saveMenu(menu) {
    try {
        fs.writeJsonSync(MENU_FILE, menu, { spaces: 2 });
        return true;
    } catch (e) {
        console.error('[SETTINGS] save failed:', e.message);
        return false;
    }
}

// ============================================================
// RESET TO DEFAULT
// ============================================================
function resetMenu() {
    fs.writeJsonSync(MENU_FILE, DEFAULT_MENU, { spaces: 2 });
    return JSON.parse(JSON.stringify(DEFAULT_MENU));
}

// ============================================================
// BUILD MENU TEXT FROM CONFIG
// (Used by the .menu command)
// ============================================================
function buildMenuText(menu, customName, isPublic, features = {}) {
    const toBold = (text) => {
        const boldChars = {
            'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇',
            'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭',
            '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵'
        };
        return text.split('').map(c => boldChars[c] || c).join('');
    };

    let text = '';

    // Header
    text += `╭━━━〔 ${toBold(menu.title)} 〕━━━┈⊷\n`;
    text += `┃ 👤 ${toBold("User:")} ${customName}\n`;
    text += `┃ 🤖 ${toBold("Status:")} ${toBold("Online ✅")}\n`;
    text += `┃ ⚙️ ${toBold("Mode:")} ${isPublic ? toBold('Public 🌍') : toBold('Private 🔐')}\n`;
    text += `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n`;

    // Categories
    for (const cat of menu.categories) {
        if (!cat.commands || cat.commands.length === 0) continue;
        text += `╭━━━〔 ${toBold(cat.name)} 〕━━━┈⊷\n`;
        for (const c of cat.commands) {
            text += `┃ ⋄ ${toBold(c.cmd)}\n`;
        }
        text += `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n`;
    }

    // Active features
    text += `🤖 ${toBold("Active Features:")}\n`;
    text += `• ${toBold("AI:")} ${features.ai ? 'ON ✅' : 'OFF'}\n`;
    text += `• ${toBold("Auto-React:")} ${features.react ? 'ON ✅' : 'OFF'}\n`;
    text += `• ${toBold("Anti-Delete:")} ${features.delete ? 'ON ✅' : 'OFF'}\n`;
    text += `• ${toBold("Auto-Status:")} ${features.status ? 'ON ✅' : 'OFF'}\n`;
    text += `• ${toBold("Auto-Read:")} ${features.read ? 'ON ✅' : 'OFF'}\n`;
    text += `• ${toBold("Ghost Mode:")} ${features.ghost ? 'ON 👻' : 'OFF'}\n\n`;

    // Footer
    text += `🔗 ${toBold("Channel:")}\n> *${menu.channel}*\n`;
    text += `⚡ ${toBold(menu.footer)}`;

    return text;
}

// ============================================================
// MAIN COMMAND HANDLER — OWNER ONLY
// ============================================================
module.exports = async function settings(sock, from, msg, isAdmin, session, args) {
    try {
        // ====================================================
        // OWNER CHECK — only the bot owner can run this
        // ====================================================
        const isMe = msg.key.fromMe;
        const botId = session.sock?.user?.id || '';
        const sender = msg.key.participant || from;
        const botNumber = botId.split(':')[0].split('@')[0];
        const senderNumber = sender.split('@')[0].split(':')[0];

        const isOwner = isMe || (botNumber && senderNumber.includes(botNumber));

        if (!isOwner) {
            await sock.sendMessage(from, {
                text:
                    '🔒 *OWNER-ONLY COMMAND*\n\n' +
                    'You do not have permission to use this command.\n' +
                    'This command can only be used by the bot owner.\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '🔒', key: msg.key } }).catch(() => {});
            return;
        }

        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || '';
        const fullQuery = text.split(' ').slice(1).join(' ').trim();
        const parts = fullQuery.split(' ');
        const action = (parts[0] || '').toLowerCase();
        const value = parts.slice(1).join(' ').trim();

        const menu = loadMenu();

        // ====================================================
        // NO ACTION → show help
        // ====================================================
        if (!action) {
            await sock.sendMessage(from, {
                text:
                    `╭━━━〔 ⚙️ *MENU SETTINGS* 〕━━━┈⊷\n` +
                    `┃ 🔐 *OWNER-ONLY PANEL*\n` +
                    `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +

                    `*Current Menu:*\n` +
                    `┃ 🏷️ Title: *${menu.title}*\n` +
                    `┃ 📝 Subtitle: *${menu.subtitle}*\n` +
                    `┃ 📂 Categories: *${menu.categories.length}*\n` +
                    `┃ 📋 Total commands: *${menu.categories.reduce((s,c) => s + (c.commands?.length||0), 0)}*\n\n` +

                    `*Available actions:*\n\n` +

                    `📝 *Basic*\n` +
                    `• \`.settings title <new title>\`\n` +
                    `• \`.settings subtitle <new subtitle>\`\n` +
                    `• \`.settings footer <new footer>\`\n` +
                    `• \`.settings channel <new url>\`\n` +
                    `• \`.settings logo <new image url>\`\n\n` +

                    `📂 *Categories*\n` +
                    `• \`.settings addcat <name>\`\n` +
                    `• \`.settings delcat <name>\`\n` +
                    `• \`.settings renamecat <old> | <new>\`\n\n` +

                    `📋 *Commands*\n` +
                    `• \`.settings addcmd <cat> | <command> | <desc>\`\n` +
                    `• \`.settings delcmd <command>\`\n` +
                    `• \`.settings editcmd <old> | <new> | <desc>\`\n\n` +

                    `🔄 *System*\n` +
                    `• \`.settings preview\` — preview current menu\n` +
                    `• \`.settings export\` — export config as JSON\n` +
                    `• \`.settings reset\` — reset to default\n\n` +

                    `⚡ _Powered by BL@CKN1TE_`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '⚙️', key: msg.key } }).catch(() => {});
            return;
        }

        // ====================================================
        // TITLE
        // ====================================================
        if (action === 'title') {
            if (!value) throw new Error('Provide a new title.');
            menu.title = value.slice(0, 60);
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Menu title updated:*\n\n🏷️ *${menu.title}*`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
            return;
        }

        // ====================================================
        // SUBTITLE
        // ====================================================
        if (action === 'subtitle') {
            if (!value) throw new Error('Provide a new subtitle.');
            menu.subtitle = value.slice(0, 80);
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Subtitle updated:*\n\n📝 *${menu.subtitle}*`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // FOOTER
        // ====================================================
        if (action === 'footer') {
            if (!value) throw new Error('Provide a new footer.');
            menu.footer = value.slice(0, 120);
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Footer updated:*\n\n⚡ *${menu.footer}*`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // CHANNEL
        // ====================================================
        if (action === 'channel') {
            if (!value || !/^https?:\/\//i.test(value)) throw new Error('Provide a valid URL.');
            menu.channel = value;
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Channel URL updated:*\n\n🔗 ${menu.channel}`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // LOGO
        // ====================================================
        if (action === 'logo') {
            if (!value || !/^https?:\/\//i.test(value)) throw new Error('Provide a valid image URL.');
            menu.logoUrl = value;
            saveMenu(menu);
            await sock.sendMessage(from, {
                image: { url: menu.logoUrl },
                caption: `✅ *Logo updated!*\n\n_This is now the menu image._`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // ADD CATEGORY
        // ====================================================
        if (action === 'addcat') {
            if (!value) throw new Error('Provide a category name.');
            const exists = menu.categories.some(c => c.name.toLowerCase() === value.toLowerCase());
            if (exists) throw new Error('Category already exists.');
            menu.categories.push({ name: value.slice(0, 40), commands: [] });
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Category added:*\n\n📂 *${value}*`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // DELETE CATEGORY
        // ====================================================
        if (action === 'delcat') {
            if (!value) throw new Error('Provide a category name.');
            const idx = menu.categories.findIndex(c => c.name.toLowerCase() === value.toLowerCase());
            if (idx === -1) throw new Error('Category not found.');
            const removed = menu.categories.splice(idx, 1)[0];
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Category removed:*\n\n🗑️ *${removed.name}* (${removed.commands?.length||0} commands)`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // RENAME CATEGORY
        // ====================================================
        if (action === 'renamecat') {
            if (!value.includes('|')) throw new Error('Use: renamecat <old> | <new>');
            const [oldName, newName] = value.split('|').map(s => s.trim());
            if (!oldName || !newName) throw new Error('Provide both old and new names.');
            const cat = menu.categories.find(c => c.name.toLowerCase() === oldName.toLowerCase());
            if (!cat) throw new Error('Category not found.');
            cat.name = newName.slice(0, 40);
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Category renamed:*\n\n📂 *${oldName}* → *${newName}*`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // ADD COMMAND
        // ====================================================
        if (action === 'addcmd') {
            if (!value.includes('|')) throw new Error('Use: addcmd <cat> | <cmd> | <desc>');
            const [catName, cmdName, cmdDesc] = value.split('|').map(s => s.trim());
            if (!catName || !cmdName) throw new Error('Provide at least category and command.');

            const cat = menu.categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
            if (!cat) throw new Error(`Category "${catName}" not found.`);

            if (!cat.commands) cat.commands = [];

            const existing = cat.commands.find(c => c.cmd.toLowerCase() === cmdName.toLowerCase());
            if (existing) throw new Error('Command already exists in that category.');

            cat.commands.push({ cmd: cmdName, desc: cmdDesc || '' });
            saveMenu(menu);

            await sock.sendMessage(from, {
                text:
                    `✅ *Command added:*\n\n` +
                    `📂 *${cat.name}*\n` +
                    `┃ ⋄ *${cmdName}*\n` +
                    `┃ 📝 ${cmdDesc || '(no description)'}`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // DELETE COMMAND
        // ====================================================
        if (action === 'delcmd') {
            if (!value) throw new Error('Provide a command name.');
            let found = false;
            let removedFrom = '';

            for (const cat of menu.categories) {
                if (!cat.commands) continue;
                const idx = cat.commands.findIndex(c => c.cmd.toLowerCase() === value.toLowerCase());
                if (idx !== -1) {
                    cat.commands.splice(idx, 1);
                    removedFrom = cat.name;
                    found = true;
                    break;
                }
            }

            if (!found) throw new Error('Command not found in any category.');
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Command removed:*\n\n🗑️ *${value}* (from *${removedFrom}*)`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // EDIT COMMAND
        // ====================================================
        if (action === 'editcmd') {
            if (!value.includes('|')) throw new Error('Use: editcmd <old> | <new> | <desc>');
            const [oldCmd, newCmd, newDesc] = value.split('|').map(s => s.trim());
            if (!oldCmd) throw new Error('Provide the old command.');

            let found = false;
            for (const cat of menu.categories) {
                if (!cat.commands) continue;
                const c = cat.commands.find(x => x.cmd.toLowerCase() === oldCmd.toLowerCase());
                if (c) {
                    c.cmd = newCmd || c.cmd;
                    if (newDesc !== undefined) c.desc = newDesc;
                    found = true;
                    break;
                }
            }

            if (!found) throw new Error('Command not found.');
            saveMenu(menu);
            await sock.sendMessage(from, {
                text: `✅ *Command updated:*\n\n📝 *${oldCmd}* → *${newCmd || oldCmd}*`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // PREVIEW MENU
        // ====================================================
        if (action === 'preview') {
            const customName = 'Preview';
            const isPublic = session.isPublic || false;
            const features = {
                ai: session.aiEnabled,
                react: session.autoReact,
                delete: false,
                status: false,
                read: session.readReceipts !== false,
                ghost: session.readReceipts === false
            };
            const previewText = buildMenuText(menu, customName, isPublic, features);
            await sock.sendMessage(from, {
                image: { url: menu.logoUrl },
                caption: previewText
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // EXPORT
        // ====================================================
        if (action === 'export') {
            const json = JSON.stringify(menu, null, 2);
            // Send as document
            await sock.sendMessage(from, {
                document: Buffer.from(json, 'utf-8'),
                mimetype: 'application/json',
                fileName: `menu_config_${Date.now()}.json`,
                caption:
                    `📤 *Menu Config Export*\n\n` +
                    `📦 Size: ${(json.length/1024).toFixed(2)} KB\n` +
                    `📂 Categories: ${menu.categories.length}\n\n` +
                    `_Import it back with:_ \n` +
                    `\`.settings import <json>\`\n\n` +
                    `⚡ _Powered by BL@CKN1TE_`
            }, { quoted: msg });
            return;
        }

        // ====================================================
        // IMPORT
        // ====================================================
        if (action === 'import') {
            if (!value) throw new Error('Provide JSON config.');
            try {
                const imported = JSON.parse(value);
                if (!imported.categories || !Array.isArray(imported.categories)) {
                    throw new Error('Invalid config: missing categories array');
                }
                saveMenu(imported);
                await sock.sendMessage(from, {
                    text: `✅ *Menu imported successfully!*\n\n📂 Categories: *${imported.categories.length}*`
                }, { quoted: msg });
            } catch (e) {
                throw new Error('Invalid JSON: ' + e.message);
            }
            return;
        }

        // ====================================================
        // RESET
        // ====================================================
        if (action === 'reset') {
            resetMenu();
            await sock.sendMessage(from, {
                text: `✅ *Menu reset to default.*`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '🔄', key: msg.key } }).catch(() => {});
            return;
        }

        // ====================================================
        // UNKNOWN
        // ====================================================
        throw new Error('Unknown action. Type `.settings` for help.');

    } catch (e) {
        await sock.sendMessage(from, {
            text:
                `❌ *Settings error*\n\n` +
                `_${e.message}_\n\n` +
                `Type \`.settings\` for usage.`
        }, { quoted: msg }).catch(() => {});
    }
};

// ============================================================
// EXPORT BUILD HELPER FOR USE IN server.js MENU
// ============================================================
module.exports.loadMenu = loadMenu;
module.exports.buildMenuText = buildMenuText;
module.exports.resetMenu = resetMenu;
