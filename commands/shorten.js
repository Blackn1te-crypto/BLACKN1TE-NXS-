// ============================================================
// commands/shorten.js
// URL Shortener — multiple API fallback
// ============================================================

const axios = require('axios');

async function shorten(url) {
    // Try tinyurl first (no key needed)
    try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 10000 });
        if (res.data && res.data.startsWith('http')) return { url: res.data.trim(), api: 'TinyURL' };
    } catch (e) {}

    // Try is.gd
    try {
        const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 10000 });
        if (res.data && res.data.startsWith('http')) return { url: res.data.trim(), api: 'is.gd' };
    } catch (e) {}

    // Try v.gd
    try {
        const res = await axios.get(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 10000 });
        if (res.data && res.data.startsWith('http')) return { url: res.data.trim(), api: 'v.gd' };
    } catch (e) {}

    return null;
}

module.exports = async function shortenCmd(sock, from, msg) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || '';
        const url = text.split(' ').slice(1).join(' ').trim();

        if (!url || !/^https?:\/\//i.test(url)) {
            await sock.sendMessage(from, {
                text:
                    '🔗 *URL SHORTENER*\n\n' +
                    '*Usage:*\n' +
                    '`.shorten <url>`\n\n' +
                    '*Example:*\n' +
                    '• `.shorten https://github.com/Blackn1te-crypto/BLACKN1TE-NXS`\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, { react: { text: '🔗', key: msg.key } }).catch(() => {});

        const result = await shorten(url);

        if (!result) {
            await sock.sendMessage(from, { text: '❌ Could not shorten URL. Try again.' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, {
            text:
                `🔗 *Shortened URL*\n\n` +
                `*Original:*\n${url}\n\n` +
                `*Short:*\n${result.url}\n\n` +
                `_Service: ${result.api}_\n` +
                `⚡ _Powered by BL@CKN1TE_`
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[SHORTEN] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Shorten error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
