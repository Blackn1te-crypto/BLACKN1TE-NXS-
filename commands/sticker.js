// ============================================================
// commands/sticker.js
// Convert image or video to WhatsApp sticker
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Safe require — if wa-sticker-formatter is missing, we tell the user
let Sticker, StickerTypes;
try {
    const sf = require('wa-sticker-formatter');
    Sticker = sf.Sticker;
    StickerTypes = sf.StickerTypes;
} catch (e) {
    console.warn('[STICKER] wa-sticker-formatter not installed:', e.message);
}

module.exports = async function sticker(sock, from, msg) {
    try {
        // ---------- Check library ----------
        if (!Sticker) {
            await sock.sendMessage(from, {
                text: '❌ *Sticker library missing*\n\nRun `npm install wa-sticker-formatter` and redeploy.'
            }, { quoted: msg });
            return;
        }

        // React to acknowledge
        await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } }).catch(() => {});

        // ---------- Find source media ----------
        // Priority 1: replied message
        // Priority 2: current message
        const quotedContext = msg.message?.extendedTextMessage?.contextInfo;
        const quoted = quotedContext?.quotedMessage;
        const target = quoted || msg.message;

        let mediaType = null;
        let mediaMessage = null;

        if (target?.imageMessage) {
            mediaType = 'image';
            mediaMessage = target.imageMessage;
        } else if (target?.videoMessage) {
            mediaType = 'video';
            mediaMessage = target.videoMessage;

            // Check duration (WhatsApp animated stickers max 10s)
            const duration = mediaMessage.seconds || 0;
            if (duration > 10) {
                await sock.sendMessage(from, {
                    text: `❌ *Video too long* (${duration}s)\n\nAnimated stickers must be under 10 seconds.`
                }, { quoted: msg });
                return;
            }
        } else if (target?.stickerMessage) {
            await sock.sendMessage(from, {
                text: '❌ That is already a sticker!'
            }, { quoted: msg });
            return;
        } else if (target?.documentWithCaptionMessage?.message?.imageMessage) {
            // Some media arrives wrapped
            mediaType = 'image';
            mediaMessage = target.documentWithCaptionMessage.message.imageMessage;
        } else if (target?.viewOnceMessage?.message?.imageMessage) {
            mediaType = 'image';
            mediaMessage = target.viewOnceMessage.message.imageMessage;
        } else if (target?.viewOnceMessage?.message?.videoMessage) {
            mediaType = 'video';
            mediaMessage = target.viewOnceMessage.message.videoMessage;
        }

        // If no media found → show help
        if (!mediaMessage || !mediaType) {
            await sock.sendMessage(from, {
                text:
                    '🎨 *STICKER MAKER*\n\n' +
                    '*Usage:*\n' +
                    '• Send or reply to an image with `.sticker`\n' +
                    '• Send or reply to a short video (<10s) with `.sticker`\n\n' +
                    '*Examples:*\n' +
                    '• Reply to a photo → `.sticker`\n' +
                    '• Reply to a short clip → `.sticker`\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        // ---------- Download media ----------
        let mediaBuffer;
        try {
            const stream = await downloadContentFromMessage(mediaMessage, mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            mediaBuffer = buffer;
        } catch (dlErr) {
            console.error('[STICKER] Download failed:', dlErr);
            await sock.sendMessage(from, {
                text: '❌ *Could not download the media*\n\n' + dlErr.message
            }, { quoted: msg });
            return;
        }

        // Size sanity check
        if (mediaBuffer.length > 15 * 1024 * 1024) {
            await sock.sendMessage(from, {
                text: '❌ *File too large* (max 15 MB for stickers)'
            }, { quoted: msg });
            return;
        }

        // ---------- Convert to sticker ----------
        let stickerBuffer;
        try {
            const sticker = new Sticker(mediaBuffer, {
                pack: 'BL@CKN1TE-NXS',
                author: 'BL@CKN1TE',
                type: mediaType === 'video' ? StickerTypes.FULL : StickerTypes.DEFAULT,
                categories: ['🤖'],
                id: 'bl@ckn1te_' + Date.now(),
                quality: 70
            });

            stickerBuffer = await sticker.toBuffer();
        } catch (convertErr) {
            console.error('[STICKER] Convert failed:', convertErr);
            await sock.sendMessage(from, {
                text: '❌ *Could not create sticker*\n\n' + convertErr.message
            }, { quoted: msg });
            return;
        }

        // ---------- Send sticker ----------
        await sock.sendMessage(from, {
            sticker: stickerBuffer
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[STICKER] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Sticker error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
