// ============================================================
// commands/tts.js
// BL@CKN1TE-NXS V16 — Text-to-Speech
// Usage:
//   .tts <text>              → default voice (English)
//   .tts <lang> <text>       → e.g. .tts en Hello world
//   .tts reply               → TTS the replied-to message
// ============================================================

const axios = require('axios');

const LANG_MAP = {
    en: 'en', english: 'en',
    sn: 'en', shona: 'en',
    nd: 'en', ndebele: 'en',
    fr: 'fr', french: 'fr',
    es: 'es', spanish: 'es',
    de: 'de', german: 'de',
    it: 'it', italian: 'it',
    pt: 'pt', portuguese: 'pt',
    ru: 'ru', russian: 'ru',
    ja: 'ja', japanese: 'ja',
    ko: 'ko', korean: 'ko',
    zh: 'zh-CN', chinese: 'zh-CN',
    ar: 'ar', arabic: 'ar',
    hi: 'hi', hindi: 'hi',
    sw: 'sw', swahili: 'sw',
    zu: 'zu', zulu: 'zu',
    af: 'af', afrikaans: 'af'
};

module.exports = async function tts(sock, from, msg, q) {
    try {
        // Get the text to speak
        let text = '';
        let lang = 'en';

        // Extract from quoted message if user replied
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation
            || quoted?.extendedTextMessage?.text
            || quoted?.imageMessage?.caption
            || quoted?.videoMessage?.caption
            || '';

        // Extract from command body
        const body = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || '';

        const args = body.trim().split(/\s+/).slice(1);

        // If user typed ".tts reply" → use quoted text
        if (args[0]?.toLowerCase() === 'reply' || args[0]?.toLowerCase() === 'quoted') {
            if (!quotedText) {
                return await sock.sendMessage(from, {
                    text: '⚠️ *Reply to a message* with `.tts reply` to convert it to speech.'
                }, { quoted: msg });
            }
            text = quotedText;
        } else {
            // Check for language code as first arg
            const maybeLang = args[0]?.toLowerCase();
            if (maybeLang && LANG_MAP[maybeLang]) {
                lang = LANG_MAP[maybeLang];
                text = args.slice(1).join(' ').trim();
            } else {
                text = args.join(' ').trim();
            }
        }

        if (!text) {
            return await sock.sendMessage(from, {
                text:
                    `🔊 *TTS — Text to Speech*\n\n` +
                    `*Usage:*\n` +
                    `  .tts <text>\n` +
                    `  .tts <lang> <text>\n` +
                    `  .tts reply   (reply to a message)\n\n` +
                    `*Examples:*\n` +
                    `  .tts Hello world\n` +
                    `  .tts fr Bonjour tout le monde\n` +
                    `  .tts es Hola amigo\n\n` +
                    `*Langs:* en, fr, es, de, it, pt, ru, ja, ko, zh, ar, hi, sw, zu, af`
            }, { quoted: msg });
        }

        // Cap length to prevent abuse
        if (text.length > 500) text = text.slice(0, 500);

        await sock.sendMessage(from, { react: { text: '🔊', key: msg.key } }).catch(() => {});

        // Use Google Translate TTS (free, no API key)
        const ttsUrl =
            `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}` +
            `&tl=${encodeURIComponent(lang)}&client=tw-ob`;

        const res = await axios.get(ttsUrl, {
            responseType: 'arraybuffer',
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/'
            }
        });

        if (!res.data || res.data.byteLength < 100) {
            throw new Error('Empty TTS response');
        }

        const audioBuffer = Buffer.from(res.data);

        await sock.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            ptt: true,
            fileName: `tts_${Date.now()}.mp3`
        }, { quoted: msg });

    } catch (err) {
        console.error('[TTS]', err.message);
        try {
            await sock.sendMessage(from, {
                text: `❌ *TTS failed:* ${err.message}`
            }, { quoted: msg });
        } catch (e) {}
    }
};
