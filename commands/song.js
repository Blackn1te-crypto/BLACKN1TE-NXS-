// ============================================================
// commands/song.js
// BL@CKN1TE-NXS V16 — YouTube Audio Downloader (real working)
// Strategy: try ytdl-core FIRST → fall back to public APIs
// ============================================================

const axios = require('axios');
const yts = require('yt-search');

let ytdl = null;
try { ytdl = require('@distube/ytdl-core'); } catch (e) {
    try { ytdl = require('ytdl-core'); } catch (e2) { ytdl = null; }
}

// ---------- Fallback API list (fresh + working endpoints) ----------
const FALLBACK_APIS = [
    // 1. Siputzx (very reliable for audio)
    (url) => `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`,
    // 2. Nexoracle
    (url) => `https://api.nexoracle.com/downloader/ytmp3?apikey=free_key@maher_apis&url=${encodeURIComponent(url)}`,
    // 3. Vreden
    (url) => `https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(url)}`,
    // 4. Betabotz
    (url) => `https://api.betabotz.eu.org/api/download/ytmp3?url=${encodeURIComponent(url)}&apikey=beta`,
    // 5. Itzpire
    (url) => `https://itzpire.com/download/youtube?url=${encodeURIComponent(url)}&type=audio`,
];

// ---------- Try direct ytdl-core download (fastest, most reliable) ----------
async function tryYtdl(url) {
    if (!ytdl) return null;
    try {
        const info = await ytdl.getInfo(url);
        const audioFormat = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });
        if (audioFormat && audioFormat.url) {
            return {
                url: audioFormat.url,
                title: info.videoDetails.title,
                duration: info.videoDetails.lengthSeconds,
                thumbnail: info.videoDetails.thumbnails?.slice(-1)?.[0]?.url
            };
        }
    } catch (e) {
        // silently fall through
    }
    return null;
}

// ---------- Try each fallback API ----------
async function tryApiDownload(url) {
    for (let i = 0; i < FALLBACK_APIS.length; i++) {
        try {
            const endpoint = FALLBACK_APIS[i](url);
            const res = await axios.get(endpoint, {
                timeout: 25000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                }
            });
            const d = res.data;

            // Dig through many possible response shapes
            const dl =
                d?.data?.url ||
                d?.data?.download ||
                d?.data?.dl ||
                d?.result?.url ||
                d?.result?.download ||
                d?.result?.dl ||
                d?.url ||
                d?.download ||
                d?.dl ||
                d?.link ||
                d?.audio ||
                d?.data?.audio ||
                d?.result?.audio;

            if (dl && typeof dl === 'string' && /^https?:\/\//.test(dl)) {
                return {
                    url: dl,
                    title: d?.data?.title || d?.result?.title || d?.title || null,
                    duration: d?.data?.duration || d?.result?.duration || d?.duration || null,
                    thumbnail: d?.data?.thumbnail || d?.result?.thumbnail || d?.thumbnail || null
                };
            }
        } catch (e) {
            // try next API
        }
    }
    return null;
}

module.exports = async function song(sock, from, msg, q) {
    try {
        let query = (q || '').trim();

        // Fall back to quoted message text
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        if (!query && quotedText) query = quotedText.trim();

        if (!query) {
            return await sock.sendMessage(from, {
                text:
                    `🎵 *SONG DOWNLOADER*\n\n` +
                    `*Usage:*\n` +
                    `  .song <song name>\n` +
                    `  .song <youtube url>\n` +
                    `  .song reply (to a URL)`
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } }).catch(() => {});

        // ---------- Resolve to a YouTube URL ----------
        let videoUrl = query;
        let title = 'Unknown';
        let duration = '';
        let thumbnail = '';

        const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(query);

        if (!isUrl) {
            await sock.sendMessage(from, {
                text: `🔍 *Searching:* ${query}...`
            }, { quoted: msg }).catch(() => {});

            const search = await yts(query);
            const video = search.videos?.[0];

            if (!video) {
                return await sock.sendMessage(from, {
                    text: `❌ *No results found for:* ${query}`
                }, { quoted: msg });
            }

            videoUrl = video.url;
            title = video.title;
            duration = video.timestamp || '';
            thumbnail = video.thumbnail || '';
        } else {
            // Extract videoId from URL
            try {
                const match = query.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
                const videoId = match ? match[1] : null;
                if (videoId) {
                    const info = await yts({ videoId });
                    if (info) {
                        title = info.title || title;
                        duration = info.timestamp || '';
                        thumbnail = info.thumbnail || '';
                    }
                }
            } catch (e) {}
        }

        await sock.sendMessage(from, {
            text: `⬇️ *Downloading:* ${title}\n_This may take 10–40 seconds..._`
        }, { quoted: msg }).catch(() => {});

        // ---------- Try ytdl-core FIRST ----------
        let downloadInfo = await tryYtdl(videoUrl);

        // ---------- Fall back to public APIs ----------
        if (!downloadInfo || !downloadInfo.url) {
            downloadInfo = await tryApiDownload(videoUrl);
        }

        if (!downloadInfo || !downloadInfo.url) {
            return await sock.sendMessage(from, {
                text:
                    `❌ *Download failed.*\n\n` +
                    `Possible reasons:\n` +
                    `• The video is age-restricted or region-locked\n` +
                    `• YouTube is rate-limiting the server\n` +
                    `• Temporary API outage\n\n` +
                    `_Try again in a moment, or use a different song._`
            }, { quoted: msg });
        }

        // Merge metadata
        const finalTitle = downloadInfo.title || title;
        const finalDuration = downloadInfo.duration || duration;
        const finalThumb = downloadInfo.thumbnail || thumbnail;

        const caption =
            `🎵 *${finalTitle}*\n` +
            (finalDuration ? `⏱️ ${finalDuration}\n` : '') +
            `\n📥 Downloaded by 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦`;

        // ---------- Send as audio (with graceful fallback to document) ----------
        try {
            await sock.sendMessage(from, {
                audio: { url: downloadInfo.url },
                mimetype: 'audio/mp4',
                fileName: `${finalTitle.replace(/[^\w\s]/g, '').slice(0, 60)}.mp3`,
                ptt: false
            }, { quoted: msg });
        } catch (e1) {
            // Fallback: send as downloadable document
            try {
                await sock.sendMessage(from, {
                    document: { url: downloadInfo.url },
                    mimetype: 'audio/mpeg',
                    fileName: `${finalTitle.replace(/[^\w\s]/g, '').slice(0, 60)}.mp3`,
                    caption
                }, { quoted: msg });
            } catch (e2) {
                // Last resort: send the raw URL as text
                await sock.sendMessage(from, {
                    text: `${caption}\n\n🔗 Direct link:\n${downloadInfo.url}`
                }, { quoted: msg });
            }
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (err) {
        console.error('[SONG]', err.message);
        try {
            await sock.sendMessage(from, {
                text: `❌ *Song error:* ${err.message}`
            }, { quoted: msg });
        } catch (e) {}
    }
};
