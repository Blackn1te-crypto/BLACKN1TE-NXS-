// ============================================================
// commands/read.js
// BL@CKN1TE-NXS V16 — Read Receipt Control
// Usage:
//   .read on       → enable blue ticks
//   .read off      → disable blue ticks (ghost)
//   .read default  → reset to ON (default)
//   .read          → show current state
// ============================================================

const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'bot_data.json');

function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) return fs.readJsonSync(DATA_FILE);
    } catch (e) {}
    return {};
}

function saveData(data) {
    try { fs.writeJsonSync(DATA_FILE, data); } catch (e) {}
}

function getStatus(readState) {
    return readState ? '📖 *ON*' : '💤 *OFF* (Ghost Mode)';
}

module.exports = async function readCommand(sock, from, msg, isAdmin, session, args) {
    try {
        const userId = session?.userId || 'default';

        // Load persistent data
        const botData = loadData();
        if (!botData.readSettings) botData.readSettings = {};

        const currentState = botData.readSettings[userId]?.enabled ?? true;
        const mode = (args[0] || '').toLowerCase().trim();

        // No argument → show current status
        if (!mode) {
            const stateNow = session?.readReceipts !== false;
            const persistentNow = botData.readSettings[userId]?.enabled ?? true;
            return await sock.sendMessage(from, {
                text:
                    `📖 *READ RECEIPT CONTROL*\n\n` +
                    `• Current session: ${getStatus(stateNow)}\n` +
                    `• Persistent default: ${getStatus(persistentNow)}\n\n` +
                    `*Usage:*\n` +
                    `  .read on       → enable blue ticks\n` +
                    `  .read off      → disable (ghost mode)\n` +
                    `  .read default  → reset to ON\n` +
                    `  .read          → show this help`
            }, { quoted: msg });
        }

        // Handle ON
        if (mode === 'on' || mode === 'enable' || mode === 'true') {
            if (session) session.readReceipts = true;

            botData.readSettings[userId] = {
                enabled: true,
                updatedAt: Date.now()
            };
            saveData(botData);

            try { await sock.sendPresenceUpdate('available'); } catch (e) {}

            return await sock.sendMessage(from, {
                text:
                    `📖 *READ RECEIPT: ON*\n\n` +
                    `✅ Blue ticks enabled.\n` +
                    `The bot will now mark incoming messages as read.`
            }, { quoted: msg });
        }

        // Handle OFF
        if (mode === 'off' || mode === 'disable' || mode === 'false' || mode === 'ghost') {
            if (session) session.readReceipts = false;

            botData.readSettings[userId] = {
                enabled: false,
                updatedAt: Date.now()
            };
            saveData(botData);

            try { await sock.sendPresenceUpdate('available'); } catch (e) {}

            return await sock.sendMessage(from, {
                text:
                    `💤 *READ RECEIPT: OFF*\n\n` +
                    `👻 Ghost mode activated.\n` +
                    `Incoming messages will NOT be marked as read.`
            }, { quoted: msg });
        }

        // Handle DEFAULT
        if (mode === 'default' || mode === 'reset' || mode === 'auto') {
            if (session) session.readReceipts = true;

            botData.readSettings[userId] = {
                enabled: true,
                updatedAt: Date.now(),
                isDefault: true
            };
            saveData(botData);

            try { await sock.sendPresenceUpdate('available'); } catch (e) {}

            return await sock.sendMessage(from, {
                text:
                    `🔄 *READ RECEIPT: DEFAULT*\n\n` +
                    `📖 Read receipts reset to *ON* (factory default).\n` +
                    `Blue ticks enabled.`
            }, { quoted: msg });
        }

        // Unknown argument
        return await sock.sendMessage(from, {
            text:
                `⚠️ *Unknown option:* \`${mode}\`\n\n` +
                `Valid options:\n` +
                `  .read on\n` +
                `  .read off\n` +
                `  .read default`
        }, { quoted: msg });

    } catch (err) {
        try {
            await sock.sendMessage(from, {
                text: `❌ *Read command error:* ${err.message}`
            }, { quoted: msg });
        } catch (e) {}
    }
};
