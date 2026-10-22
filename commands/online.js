// ============================================================
// commands/online.js
// Controls whether messages get blue-ticked (read) or not.
//
// OFF  → Bot appears ONLINE, but never blue-ticks messages.
//        Messages show double grey ticks (delivered only).
//        AI can still respond even while "offline".
//
// ON   → Normal behavior — reads messages, blue ticks show.
// ============================================================

module.exports = async function online(sock, from, msg, isAdmin, session, args) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || msg.message?.videoMessage?.caption
            || '';
        const mode = text.split(' ').slice(1).join(' ').trim().toLowerCase();

        // -------- Help --------
        if (!mode) {
            const currentState = session.readReceipts === false ? 'OFF 📴' : 'ON ✅';
            await sock.sendMessage(from, {
                text:
                    '👻 *ONLINE / GHOST MODE*\n\n' +
                    `*Current:* ${currentState}\n\n` +
                    '*Usage:*\n' +
                    '• `.online on` — show blue ticks (normal)\n' +
                    '• `.online off` — ghost mode (no blue ticks)\n\n' +
                    '*Effects:*\n' +
                    '• 📴 *Off:* double grey ticks only, bot stays online\n' +
                    '• ✅ *On:* reads messages, blue ticks visible\n\n' +
                    '💡 Ghost mode still lets `.ai on` reply while you stay hidden.\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        // -------- Turn OFF (ghost mode) --------
        if (mode === 'off' || mode === '0' || mode === 'false') {
            session.readReceipts = false;

            // Apply to active socket
            if (sock) {
                try {
                    // Ensure the bot still shows as "online" (available)
                    await sock.sendPresenceUpdate('available');
                } catch (e) {}
            }

            await sock.sendMessage(from, {
                text:
                    '👻 *Ghost Mode:* ON 📴\n\n' +
                    'The bot now:\n' +
                    '• ✅ Shows as ONLINE\n' +
                    '• ❌ Does NOT send blue ticks (read receipts)\n' +
                    '• ✅ Still delivers messages (double grey ticks)\n' +
                    '• ✅ Still allows `.ai on` to auto-reply\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });

            await sock.sendMessage(from, { react: { text: '👻', key: msg.key } }).catch(() => {});
            return;
        }

        // -------- Turn ON (normal) --------
        if (mode === 'on' || mode === '1' || mode === 'true') {
            session.readReceipts = true;

            if (sock) {
                try {
                    await sock.sendPresenceUpdate('available');
                } catch (e) {}
            }

            await sock.sendMessage(from, {
                text:
                    '✅ *Ghost Mode:* OFF\n\n' +
                    'The bot now:\n' +
                    '• ✅ Shows as ONLINE\n' +
                    '• ✅ Sends blue ticks (read receipts)\n' +
                    '• ✅ Responds normally\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
            return;
        }

        // -------- Unknown --------
        await sock.sendMessage(from, {
            text: '❌ *Invalid usage.* Use `.online on` or `.online off`.'
        }, { quoted: msg });

    } catch (e) {
        console.error('[ONLINE] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Online mode error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
