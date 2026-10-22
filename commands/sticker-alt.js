const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { sendStyled } = require('../../lib/menuLayout');

function convertToWebp(inputPath, outputPath, isVideo) {
    return new Promise((resolve, reject) => {
        const filter = "scale=w='min(320,iw)':h='min(320,ih)':force_original_aspect_ratio=decrease";
        const args = ['-y', '-i', inputPath, '-vf', filter, '-an', '-c:v', 'libwebp', '-q:v', '75'];
        if (isVideo) args.push('-loop', '0', '-vsync', '0', '-t', '6');
        else args.push('-frames:v', '1');
        args.push(outputPath);
        execFile('ffmpeg', args, { windowsHide: true }, (error) => error ? reject(error) : resolve());
    });
}

async function stickerAltCommand(sock, chatId, message) {
    let inputPath = '';
    let outputPath = '';
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const type = quoted && Object.keys(quoted).find((key) => ['imageMessage', 'videoMessage'].includes(key));
        if (!type) {
            await sendStyled(sock, chatId, message, { title: 'STICKER', lines: ['Reply to an image or video with .stickeralt.'] });
            return;
        }
        const stream = await downloadContentFromMessage(quoted[type], type === 'imageMessage' ? 'image' : 'video');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        if (!buffer.length) throw new Error('Quoted media was empty.');
        const tempDir = path.join(process.cwd(), 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        const id = `${process.pid}_${Date.now()}`;
        inputPath = path.join(tempDir, `sticker_alt_${id}.${type === 'imageMessage' ? 'jpg' : 'mp4'}`);
        outputPath = path.join(tempDir, `sticker_alt_${id}.webp`);
        fs.writeFileSync(inputPath, buffer);
        await convertToWebp(inputPath, outputPath, type === 'videoMessage');
        await sock.sendMessage(chatId, { sticker: fs.readFileSync(outputPath) }, { quoted: message });
    } catch (error) {
        console.error('Alternate sticker conversion failed:', error.message);
        await sendStyled(sock, chatId, message, { title: 'STICKER', lines: ['Could not create the sticker. Ensure FFmpeg is installed and try a shorter video.'] });
    } finally {
        for (const file of [inputPath, outputPath]) {
            if (file) { try { fs.unlinkSync(file); } catch {} }
        }
    }
}

module.exports = stickerAltCommand;
