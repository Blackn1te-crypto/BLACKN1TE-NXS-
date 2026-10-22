// ============================================================
// commands/facebook.js
// BL@CKN1TE-NXS V16 — Facebook Downloader
// ============================================================

const axios = require('axios');

async function fetchFB(url) {
    const apis = [
        `https://api.zenkey.my.id/download/fb?url=${encodeURIComponent(url)}`,
        `https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`,
        `https://api.akuari.my.id/downloader/fb?link=${encodeURIComponent(url)}`
    ];
    for (const api of apis) {
        try {
            const res = await axios.get(api, { timeout: 20000 });
            const d = res.data;
            const list =
                d?.result?.media ||
                d?.result?.download ||
                d?.result ||
                d?.data ||
                d?.urls ||
                d?.download;
            let media = [];
            if (Array.isArray(list)) media = list.map(x => x?.url || x?.download_url || x).filter(Boolean);
            else if (typeof list === 'string' && list.startsWith('http')) media = [list];
            else if (list && list.hd) media = [list.hd];
            else if (list && list.sd) media = [list.sd];
            if (media.length) return media;
        } catch (e) { continue; }
    }
    return null;
}

module.exports = async function facebook(sock, from, msg, q) {
    try {
        let url = (q || '').trim();
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        if (!url && quotedText) url = quotedText.trim();

        if (!url || !/facebook\.com|fb\.watch|fb\.com/i.test(url)) {
            return await sock.sendMessage(from, {
                text: `📘 *FACEBOOK DOWNLOADER*\n\n*Usage:* .facebook <facebook url>`
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }).catch(() => {});

        const media = await fetchFB(url);

        if (!media || !media.length) {
            return await sock.sendMessage(from, {
                text: `❌ *Could not fetch Facebook video.*`
            }, { quoted: msg });
        }

        for (const m of media.slice(0, 3)) {
            try {
                await sock.sendMessage(from, {
                    video: { url: m },
                    mimetype: 'video/mp4',
                    caption: `📘 Facebook | 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦`
                }, { quoted: msg });
            } catch (e) {
                await sock.sendMessage(from, {
                    document: { url: m },
                    mimetype: 'video/mp4',
                    fileName: 'facebook.mp4',
                    caption: `📘 Facebook`
                }, { quoted: msg }).catch(() => {});
            }
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
        await sock.sendMessage(from, {
            text: `❌ *Facebook error:* ${err.message}`
        }, { quoted: msg }).catch(() => {});
    }
};
