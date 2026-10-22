// ============================================================
// commands/autoread.js
// BL@CKN1TE-NXS V16 — Auto-Read Handler
// Reads incoming messages based on session.readReceipts
// ============================================================

const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'bot_data.json');

function loadReadSetting(userId) {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readJsonSync(DATA_FILE);
            return data?.readSettings?.[userId]?.enabled ?? true;
        }
    } catch (e) {}
    return true;
}

async function handleAutoread(sock, msg, session) {
    try {
        if (!sock || !msg || !msg.key) return;

        // Respect session flag first (fastest)
        let enabled = session?.readReceipts !== false;

        // Fall back to persistent setting
        if (session?.userId) {
            const persistent = loadReadSetting(session.userId);
            if (persistent === false) enabled = false;
        }

        if (!enabled) {
            // Ghost mode — do NOT send read receipt
            try { await sock.sendPresenceUpdate('available'); } catch (e) {}
            return;
        }

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;

        // Read the message
        await sock.readMessages([msg.key]);
    } catch (e) {
        // silent
    }
}

module.exports = { handleAutoread };
