// ============================================================
// commands/tiktok.js
// BL@CKN1TE-NXS V16 — TikTok Downloader
// Usage:
//   .tiktok <url>
// ============================================================

const axios = require('axios');

async function fetchTikTok(url) {
    const apis = [
        `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
        `https://api.zenkey.my.id/download/tiktok?url=${encodeURIComponent(url)}`,
        `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`
    ];

    for (const api of apis) {
        try {
            const res = await axios.get(api, { timeout: 20000 });
            const d = res.data;
            const video =
                d?.video?.noWatermark ||
                d?.video?.playAddr ||
                d?.video?.downloadAddr ||
                d?.result?.video ||
                d?.result?.no_watermark ||
                d?.data?.play ||
                d?.data?.hdplay ||
                d?.nowm ||
                d?.play;
            if (video) return {
                video,
                title: d?.title || d?.desc || 'TikTok Video',
                author: d?.author?.name || d?.author || '',
                music: d?.music?.title || d?.music || ''
            };
        } catch (e) { continue; }
    }
    return null;
}

module.exports = async function tiktok(sock, from, msg, q) {
    try {
        let url = (q || '').trim();

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        if (!url && quotedText) url = quotedText.trim();

        if (!url || !/tiktok\.com|vt\.tiktok|vm\.tiktok/i.test(url)) {
            return await sock.sendMessage(from, {
                text:
                    `🎵 *TIKTOK DOWNLOADER*\n\n` +
                    `*Usage:* .tiktok <tiktok url>\n` +
                    `*Example:* .tiktok https://vt.tiktok.com/xxxxx/`
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }).catch(() => {});

        const data = await fetchTikTok(url);

        if (!data || !data.video) {
            return await sock.sendMessage(from, {
                text: `❌ *Could not fetch TikTok video.* Check the URL and try again.`
            }, { quoted: msg });
        }

        const caption =
            `🎵 *TikTok*\n\n` +
            (data.author ? `👤 ${data.author}\n` : '') +
            (data.title ? `📝 ${data.title}\n` : '') +
            (data.music ? `🎧 ${data.music}\n` : '') +
            `\n📥 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦`;

        try {
            await sock.sendMessage(from, {
                video: { url: data.video },
                mimetype: 'video/mp4',
                caption
            }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(from, {
                document: { url: data.video },
                mimetype: 'video/mp4',
                fileName: 'tiktok.mp4',
                caption
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
        await sock.sendMessage(from, {
            text: `❌ *TikTok error:* ${err.message}`
        }, { quoted: msg }).catch(() => {});
    }
};
