// ============================================================
// commands/qr.js
// QR code generator
// ============================================================

const axios = require('axios');

module.exports = async function qr(sock, from, msg) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || '';
        const data = text.split(' ').slice(1).join(' ').trim();

        if (!data) {
            await sock.sendMessage(from, {
                text:
                    '📱 *QR CODE GENERATOR*\n\n' +
                    '*Usage:*\n' +
                    '`.qr <text or url>`\n\n' +
                    '*Examples:*\n' +
                    '• `.qr https://github.com/Blackn1te-crypto`\n' +
                    '• `.qr Hello World`\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, { react: { text: '📱', key: msg.key } }).catch(() => {});

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=20&data=${encodeURIComponent(data)}`;

        const res = await axios.get(qrUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        await sock.sendMessage(from, {
            image: Buffer.from(res.data),
            caption:
                `📱 *QR Code*\n\n` +
                `📝 *Data:* ${data.slice(0, 200)}\n\n` +
                `⚡ _Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER_`
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[QR] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *QR error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
