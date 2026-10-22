// ============================================================
// commands/image.js
// AI Image Generation — supports multiple free generators
// ============================================================

const axios = require('axios');

const IMAGE_APIS = [
    {
        name: 'pollinations',
        url: (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true&enhance=true`,
        direct: true
    },
    {
        name: 'pollinations-flux',
        url: (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?model=flux&width=1024&height=1024&nologo=true`,
        direct: true
    }
];

async function fetchImage(prompt) {
    for (const api of IMAGE_APIS) {
        try {
            const url = api.url(prompt);
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (res.data && res.data.byteLength > 5000) {
                return { buffer: Buffer.from(res.data), url, apiName: api.name };
            }
        } catch (e) {
            console.warn(`[IMAGE] ${api.name} failed:`, e.message);
        }
    }
    return null;
}

module.exports = async function image(sock, from, msg) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || '';
        const prompt = text.split(' ').slice(1).join(' ').trim();

        if (!prompt) {
            await sock.sendMessage(from, {
                text:
                    '🎨 *AI IMAGE GENERATOR*\n\n' +
                    '*Usage:*\n' +
                    '`.image <description>`\n\n' +
                    '*Examples:*\n' +
                    '• `.image a cyberpunk city at night`\n' +
                    '• `.image a lion wearing a suit`\n' +
                    '• `.image futuristic hacker logo`\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } }).catch(() => {});

        await sock.sendMessage(from, {
            text: `🎨 *Generating:* ${prompt.slice(0, 80)}\n\n⏳ Please wait...`
        }, { quoted: msg }).catch(() => {});

        const result = await fetchImage(prompt);

        if (!result) {
            await sock.sendMessage(from, {
                text: '❌ *Could not generate image*\n\nTry again with a different prompt.'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, {
            image: result.buffer,
            caption:
                `🎨 *AI Generated*\n\n` +
                `📝 *Prompt:* ${prompt.slice(0, 200)}\n\n` +
                `🔗 *Full size:*\n${result.url}\n\n` +
                `⚡ _Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER_`
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[IMAGE] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Image error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
