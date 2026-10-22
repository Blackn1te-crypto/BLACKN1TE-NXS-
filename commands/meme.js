// ============================================================
// commands/meme.js
// Random meme fetcher with multi-API fallback
// Sends as image + caption + source link
// ============================================================

const axios = require('axios');

// ============================================================
// MEME APIs (tried in order until one works)
// ============================================================
const MEME_APIS = [
    {
        name: 'meme-api',
        url: 'https://meme-api.com/gimme',
        parse: (d) => ({
            url: d.url || d.preview?.[d.preview.length - 1] || null,
            title: d.title || 'Random Meme',
            subreddit: d.subreddit ? `r/${d.subreddit}` : 'Reddit',
            author: d.author || null,
            postLink: d.postLink || null
        })
    },
    {
        name: 'reddit-meme',
        url: 'https://www.reddit.com/r/memes/random.json?limit=1',
        parse: (d) => {
            const post = d?.[0]?.data?.children?.[0]?.data;
            if (!post) return null;
            return {
                url: post.url_overridden_by_dest || post.url || null,
                title: post.title || 'Random Meme',
                subreddit: `r/${post.subreddit}`,
                author: post.author || null,
                postLink: `https://reddit.com${post.permalink || ''}`
            };
        },
        headers: { 'User-Agent': 'Mozilla/5.0 MemeBot/1.0' }
    },
    {
        name: 'dankmemer',
        url: 'https://api.dankmemer.co/api/v1/meme',
        parse: (d) => {
            const url = d?.url || d?.image || d?.data?.url || null;
            if (!url) return null;
            return {
                url,
                title: d?.title || d?.data?.title || 'Random Meme',
                subreddit: d?.subreddit ? `r/${d.subreddit}` : 'Reddit',
                author: d?.author || null,
                postLink: d?.postLink || null
            };
        }
    },
    {
        name: 'imgflip',
        url: 'https://api.imgflip.com/get_memes',
        parse: (d) => {
            const memes = d?.data?.memes;
            if (!memes || !memes.length) return null;
            const pick = memes[Math.floor(Math.random() * memes.length)];
            return {
                url: pick.url,
                title: pick.name || 'Random Meme',
                subreddit: 'Imgflip',
                author: null,
                postLink: null
            };
        }
    }
];

// ============================================================
// FETCH RANDOM MEME
// ============================================================
async function getRandomMeme() {
    for (const api of MEME_APIS) {
        try {
            const res = await axios.get(api.url, {
                timeout: 12000,
                headers: api.headers || {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MemeBot/1.0'
                }
            });
            const parsed = api.parse(res.data);
            if (parsed && parsed.url && parsed.url.startsWith('http')) {
                return { ...parsed, apiName: api.name };
            }
        } catch (e) {
            console.warn(`[MEME] ${api.name} failed: ${e.message}`);
        }
    }
    return null;
}

// ============================================================
// MAIN HANDLER
// ============================================================
module.exports = async function meme(sock, from, msg) {
    try {
        // React to acknowledge
        await sock.sendMessage(from, { react: { text: '😂', key: msg.key } }).catch(() => {});

        // Show "fetching" feedback
        await sock.sendMessage(from, {
            text: '⏳ Fetching a fresh meme...'
        }, { quoted: msg }).catch(() => {});

        // Get meme
        const meme = await getRandomMeme();

        if (!meme) {
            await sock.sendMessage(from, {
                text:
                    '❌ *Could not fetch a meme right now.*\n\n' +
                    'The APIs may be temporarily down. Try again in a moment.\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '😔', key: msg.key } }).catch(() => {});
            return;
        }

        // Build caption
        const caption =
            `╭━━━〔 😂 *RANDOM MEME* 〕━━━┈⊷\n` +
            `┃ 📝 *${(meme.title || 'Random Meme').slice(0, 100)}*\n` +
            `┃ 📌 *From:* ${meme.subreddit || 'Reddit'}\n` +
            (meme.author ? `┃ 👤 *By:* u/${meme.author}\n` : '') +
            `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
            (meme.postLink
                ? `🔗 *Source:*\n${meme.postLink}\n\n`
                : `🔗 *Image:*\n${meme.url}\n\n`) +
            `⚡ _Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER_`;

        // Send as image
        try {
            await sock.sendMessage(from, {
                image: { url: meme.url },
                caption
            }, { quoted: msg });

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
        } catch (imgErr) {
            console.warn('[MEME] Image send failed:', imgErr.message);

            // Fallback: download buffer and send
            try {
                const imgRes = await axios.get(meme.url, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                await sock.sendMessage(from, {
                    image: Buffer.from(imgRes.data),
                    caption
                }, { quoted: msg });
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
            } catch (bufErr) {
                // Last resort: text with link
                await sock.sendMessage(from, {
                    text:
                        `😂 *Random Meme*\n\n` +
                        `📝 ${meme.title}\n` +
                        `📌 ${meme.subreddit}\n\n` +
                        `🔗 *View:*\n${meme.url}\n\n` +
                        `⚡ _Powered by BL@CKN1TE_`
                }, { quoted: msg });
            }
        }

    } catch (e) {
        console.error('[MEME] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Meme error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
