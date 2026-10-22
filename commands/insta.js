// ============================================================
// commands/insta.js
// BL@CKN1TE-NXS V16 — Instagram Downloader
// Usage:
//   .insta <url>
// ============================================================

const axios = require('axios');

async function fetchInsta(url) {
    const apis = [
        `https://api.zenkey.my.id/download/ig?url=${encodeURIComponent(url)}`,
        `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`,
        `https://api.akuari.my.id/downloader/ig?link=${encodeURIComponent(url)}`
    ];

    for (const api of apis) {
        try {
            const res = await axios.get(api, { timeout: 20000 });
            const d = res.data;

            let media = [];
            const arr =
                d?.result ||
                d?.data ||
                d?.url ||
                d?.download;
            if (Array.isArray(arr)) {
                media = arr.map(x => x?.url || x?.download_url || x).filter(Boolean);
            } else if (typeof arr === 'string' && arr.startsWith('http')) {
                media = [arr];
            }
            if (media.length) return media;
        } catch (e) { continue; }
    }
    return null;
}

module.exports = async function insta(sock, from, msg, q) {
    try {
        let url = (q || '').trim();
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        if (!url && quotedText) url = quotedText.trim();

        if (!url || !/instagram\.com|instagr\.am/i.test(url)) {
            return await sock.sendMessage(from, {
                text: `📸 *INSTAGRAM DOWNLOADER*\n\n*Usage:* .insta <instagram url>`
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }).catch(() => {});

        const media = await fetchInsta(url);

        if (!media || !media.length) {
            return await sock.sendMessage(from, {
                text: `❌ *Could not fetch Instagram media.*`
            }, { quoted: msg });
        }

        for (const m of media.slice(0, 5)) {
            const isVideo = /\.mp4|video/i.test(m);
            try {
                if (isVideo) {
                    await sock.sendMessage(from, {
                        video: { url: m },
                        mimetype: 'video/mp4',
                        caption: `📸 Instagram | 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        image: { url: m },
                        caption: `📸 Instagram | 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦`
                    }, { quoted: msg });
                }
            } catch (e) {
                await sock.sendMessage(from, {
                    document: { url: m },
                    mimetype: isVideo ? 'video/mp4' : 'image/jpeg',
                    fileName: isVideo ? 'insta.mp4' : 'insta.jpg',
                    caption: `📸 Instagram`
                }, { quoted: msg }).catch(() => {});
            }
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
        await sock.sendMessage(from, {
            text: `❌ *Instagram error:* ${err.message}`
        }, { quoted: msg }).catch(() => {});
    }
};
