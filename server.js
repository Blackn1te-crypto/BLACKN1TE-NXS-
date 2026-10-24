require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// ============================================================
// NODE ENGINE CHECK
// ============================================================
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
if (majorVersion > 20) {
    console.warn(`⚠️ WARNING: You are running Node.js ${nodeVersion}. This bot is designed for Node 20.x.`);
}

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    downloadContentFromMessage,
    jidNormalizedUser,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');

const settings = require('./settings');

// ============================================================
// CONFIG (YOUR DETAILS - HARDCODED)
// ============================================================
const PREFIXES = ['.', '/', '>'];
const CMD_DIR = path.join(__dirname, 'commands');

const MY_CHANNEL_JID = '120363414192571475@newsletter'; 
const MY_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f';
const MY_CHANNEL_NAME = 'BL@CKN1TE-NXS Official';

// YOUR NUMBERS
const OWNER_NUMBERS = [
    "263714799483",
    "263780540231"
];

const WATERMARK = "\n\n> 🌟 *Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER* 🌟";

// ============================================================
// RANDOM EMOJI REACTIONS
// ============================================================
const RANDOM_REACTIONS = ['⚡', '🔥', '✨', '🌟', '💫', '🎯', '🚀', '💥', '👑', '💎', '🎉', '✅', '🤖', '😎', '🙌', '👏', '💯', '🪄', '🧿', '🍀', '🌈', '❤️', '👍'];
function getRandomEmoji() { return RANDOM_REACTIONS[Math.floor(Math.random() * RANDOM_REACTIONS.length)]; }

// ============================================================
// DYNAMIC COMMAND LOADER
// ============================================================
const commands = {};
function loadCommands() {
    if (!fs.existsSync(CMD_DIR)) {
        fs.ensureDirSync(CMD_DIR);
        return;
    }
    const files = fs.readdirSync(CMD_DIR);
    for (const file of files) {
        if (file.endsWith('.js')) {
            const cmdName = file.replace('.js', '').toLowerCase();
            try {
                commands[cmdName] = require(path.join(CMD_DIR, file));
            } catch (e) {
                console.error(`❌ [CMD] Failed to load ${cmdName}: ${e.message}`);
            }
        }
    }
    console.log(`✅ [CMD] Loaded ${Object.keys(commands).length} commands.`);
}
loadCommands();

// ============================================================
// APP + SOCKET
// ============================================================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" }, transports: ['websocket', 'polling'] });

let openai = null;
if (process.env.OPENAI_API_KEY) {
    try { openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1" }); } catch (e) {}
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ============================================================
// STORAGE
// ============================================================
const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = { antilinkGroups: {}, statusSettings: {}, antiDelete: {}, userNames: {}, antiCall: {}, readSettings: {} };
if (fs.existsSync(DATA_FILE)) { try { botData = { ...botData, ...fs.readJsonSync(DATA_FILE) }; } catch (e) {} }
function saveBotData() { try { fs.writeJsonSync(DATA_FILE, botData); } catch (e) {} }

const sessions = {};
const userSockets = {};

// ============================================================
// 🎨 ULTIMATE MENU DESIGN (SINGLE COLUMN)
// ============================================================
async function sendUltimateMenu(sock, from, msg, session, pushName) {
    const menu = `
╭───────────────────────────⭓
│  ✦ *BL@CKN1TE-NXS* ✦
│  ───────────────────────────
│  👤 *User:* ${pushName}
│  ⚡ *Prefix:* [ . / > ]
│  🟢 *Status:* Online
│  ♾️ *Mode:* Infinite
╰───────────────────────────⭓

┏━━━━━━━━〔 𝗨𝗦𝗘𝗥 𝗖𝗢𝗥𝗘 〕━━━━━━━━
┃ ➤ .ai
┃ ➤ .img
┃ ➤ .read
┃ ➤ .ping
┃ ➤ .trt
┃ ➤ .tts
┃ ➤ .owner
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 𝗠𝗘𝗗𝗜𝗔 𝗩𝗔𝗨𝗟𝗧 〕━━━━━━━━
┃ ➤ .song
┃ ➤ .video
┃ ➤ .tiktok
┃ ➤ .insta
┃ ➤ .facebook
┃ ➤ .gdrive
┃ ➤ .apk
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 𝗚𝗥𝗢𝗨𝗣 𝗔𝗗𝗠𝗜𝗡 〕━━━━━━━━
┃ ➤ .kick
┃ ➤ .promote
┃ ➤ .demote
┃ ➤ .tagall
┃ ➤ .hidetag
┃ ➤ .setname
┃ ➤ .groupinfo
┃ ➤ .accept
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬 〕━━━━━━━━
┃ ➤ .antilink
┃ ➤ .anticall
┃ ➤ .antidelete
┃ ➤ .antistatus
┃ ➤ .mode
┃ ➤ .autoread
┃ ➤ .areact
┃ ➤ .settings
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 𝗙𝗨𝗡 & 𝗧𝗢𝗢𝗟𝗦 〕━━━━━━━━
┃ ➤ .meme
┃ ➤ .joke
┃ ➤ .quote
┃ ➤ .fact
┃ ➤ .weather
┃ ➤ .qr
┃ ➤ .shorten
┃ ➤ .calc
┃ ➤ .emojimix
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 𝗢𝗪𝗡𝗘𝗥 𝗭𝗢𝗡𝗘 〕━━━━━━━━
┃ ➤ .hack
┃ ➤ .trihat
┃ ➤ .websites
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

╭───────────────────────────⭓
│ 🔗 *Join Our Channel*
│ ${MY_CHANNEL_URL}
│ 🎩 *THE INCISIVE TRI-HAT HACKER*
╰───────────────────────────⭓
    `;

    const menuImagePath = path.join(__dirname, 'assets', 'bot_image.jpg');
    try {
        await sock.sendMessage(from, {
            text: menu,
            contextInfo: {
                forwardedNewsletterMessageInfo: {
                    newsletterJid: MY_CHANNEL_JID,
                    newsletterName: MY_CHANNEL_NAME,
                    serverMessageId: -1
                },
                externalAdReply: {
                    title: "BL@CKN1TE-NXS",
                    body: "Tap to view Channel",
                    mediaType: 1,
                    thumbnail: fs.existsSync(menuImagePath) ? fs.readFileSync(menuImagePath) : null,
                    mediaUrl: MY_CHANNEL_URL,
                    sourceUrl: MY_CHANNEL_URL,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: menu }, { quoted: msg });
    }
}

// ============================================================
// 🎨 CONNECTION BANNER
// ============================================================
async function sendConnectionBanner(sock, userId) {
    const banner = `
╔══════════════════════════════════════╗
║  🟢 *SYSTEM ONLINE* 🟢
║  ──────────────────────────────────
║  👤 Bot: ${userId.split('@')[0]}
║  ⚡ Engine: Baileys Node.js
║  ♾️  Mode: INFINITE
║  🔗 Channel: Connected
╚══════════════════════════════════════╝
${WATERMARK}
    `;

    try {
        await sock.sendMessage(userId, {
            text: banner,
            contextInfo: {
                forwardedNewsletterMessageInfo: {
                    newsletterJid: MY_CHANNEL_JID,
                    newsletterName: MY_CHANNEL_NAME,
                    serverMessageId: -1
                }
            }
        });
    } catch (e) {}
}

// ============================================================
// ♾️ BOT SESSION
// ============================================================
class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.authPath = path.join(AUTH_DIR, userId);
        this.isInitializing = false;
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type, user: this.userId };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    async initialize(pairingNumber = null) {
        if (this.isInitializing) return;
        this.isInitializing = true;

        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

            this.sock = makeWASocket({
                version,
                auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })) },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: Browsers.ubuntu('Chrome'),
                markOnlineOnConnect: true
            });

            if (pairingNumber && !state.creds.registered) {
                await delay(1200);
                try {
                    let code = await this.sock.requestPairingCode(pairingNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    this.sendLog(`🔑 Pairing Code: ${code}`, 'success');
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('pairing-code', code);
                } catch (err) { this.sendLog(`❌ Pairing error: ${err.message}`, 'error'); }
            }

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;
                const msg = m.messages[0];
                if (!msg.message) return;

                const from = msg.key.remoteJid;
                const isMe = msg.key.fromMe;
                const senderId = msg.key.participant || from;
                
                // STRICT OWNER CHECK
                const senderNumber = senderId.split('@')[0].replace(/[^0-9]/g, '');
                const isOwner = isMe || OWNER_NUMBERS.includes(senderNumber);

                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
                const cmd = text.toLowerCase();
                const args = text.split(' ').slice(1);
                const q = args.join(' ');

                const matchedPrefix = PREFIXES.find(p => cmd.startsWith(p));
                if (!matchedPrefix) return;

                const commandName = cmd.slice(matchedPrefix.length).split(' ')[0];

                // Send Random Emoji Reaction
                try { await this.sock.sendMessage(from, { react: { text: getRandomEmoji(), key: msg.key } }); } catch (e) {}

                // ==========================================
                // HARDCODED COMMANDS (BYPASS FOLDER LOGIC)
                // ==========================================
                
                if (commandName === 'menu' || commandName === 'help' || commandName === 'start') {
                    return await sendUltimateMenu(this.sock, from, msg, this, msg.pushName || 'User');
                }
                
                if (commandName === 'owner') {
                    return await this.sock.sendMessage(from, { text: `👑 *BL@CKN1TE-NXS OWNER*\n\n📞 ${OWNER_NUMBERS[0]}\n📞 ${OWNER_NUMBERS[1]}${WATERMARK}` }, { quoted: msg });
                }

                // --- PUBLIC / PRIVATE MODE ---
                if (commandName === 'public' || commandName === 'private') {
                    if (!isOwner) return await this.sock.sendMessage(from, { text: `❌ *Only owner can use this command.*` }, { quoted: msg });
                    
                    const isPublic = commandName === 'public';
                    const dataPath = './data/messageCount.json';
                    let data = { isPublic: true };
                    if (fs.existsSync(dataPath)) { try { data = JSON.parse(fs.readFileSync(dataPath)); } catch (e) {} }
                    data.isPublic = isPublic;
                    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
                    
                    return await this.sock.sendMessage(from, { text: `✅ *Bot mode changed to ${commandName.toUpperCase()}*${WATERMARK}` }, { quoted: msg });
                }

                // --- STATUS COMMAND ---
                if (commandName === 'status' || commandName === 'autostatus') {
                    if (!isOwner) return await this.sock.sendMessage(from, { text: `❌ *Only owner can use this command.*` }, { quoted: msg });
                    
                    const action = args[0]?.toLowerCase();
                    if (action === 'on' || action === 'off') {
                        if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
                        botData.statusSettings[this.userId].autoStatus = action === 'on';
                        saveBotData();
                        return await this.sock.sendMessage(from, { text: `✅ *Auto-Status is now ${action.toUpperCase()}*${WATERMARK}` }, { quoted: msg });
                    } else {
                        const current = botData.statusSettings[this.userId]?.autoStatus ? 'ON' : 'OFF';
                        return await this.sock.sendMessage(from, { 
                            text: `📊 *STATUS SETTINGS*\n\nCurrent: *${current}*\n\nUsage:\n.status on\n.status off${WATERMARK}` 
                        }, { quoted: msg });
                    }
                }

                // --- READ COMMAND ---
                if (commandName === 'read') {
                    const action = args[0]?.toLowerCase();
                    if (action === 'on' || action === 'off') {
                        if (!botData.readSettings[this.userId]) botData.readSettings[this.userId] = {};
                        botData.readSettings[this.userId].enabled = action === 'on';
                        saveBotData();
                        return await this.sock.sendMessage(from, { text: `✅ *Auto-Read is now ${action.toUpperCase()}*${WATERMARK}` }, { quoted: msg });
                    } else {
                        const current = botData.readSettings[this.userId]?.enabled !== false ? 'ON' : 'OFF';
                        return await this.sock.sendMessage(from, { text: `📖 *READ SETTINGS*\n\nCurrent: *${current}*\n\nUsage:\n.read on\n.read off${WATERMARK}` }, { quoted: msg });
                    }
                }

                // --- TRIHAT & WEBSITES ---
                if (commandName === 'trihat') {
                    return await this.sock.sendMessage(from, { text: `🎩 *INCISIVE TRI-HAT TOOLS*\n\nWelcome to the hacker suite.\nAll tools are fully operational.${WATERMARK}` }, { quoted: msg });
                }
                if (commandName === 'websites') {
                    return await this.sock.sendMessage(from, { text: `🌐 *OFFICIAL WEBSITES*\n\nPortfolio: https://blacknite.dev\nChannel: ${MY_CHANNEL_URL}${WATERMARK}` }, { quoted: msg });
                }

                // --- KICK (ADMIN) ---
                if (commandName === 'kick') {
                    const isGroup = from.endsWith('@g.us');
                    if (!isGroup) return await this.sock.sendMessage(from, { text: `❌ *This command is for groups only.*` }, { quoted: msg });
                    
                    // Check if sender is group admin or bot owner
                    const groupMetadata = await this.sock.groupMetadata(from);
                    const participant = groupMetadata.participants.find(p => p.id === senderId);
                    const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
                    
                    if (!isAdmin && !isOwner) return await this.sock.sendMessage(from, { text: `❌ *Only admin can use this command.*` }, { quoted: msg });
                    
                    const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    if (mentioned.length === 0) return await this.sock.sendMessage(from, { text: `⚠️ *Mention a user to kick.*` }, { quoted: msg });
                    
                    try {
                        await this.sock.groupParticipantsUpdate(from, [mentioned[0]], 'remove');
                        return await this.sock.sendMessage(from, { text: `✅ *User kicked successfully.*${WATERMARK}` });
                    } catch (e) {
                        return await this.sock.sendMessage(from, { text: `❌ *Failed to kick user. Make sure I am admin.*` });
                    }
                }

                // ==========================================
                // DYNAMIC COMMANDS (FROM FOLDER)
                // ==========================================
                const isPublic = (() => {
                    try {
                        const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                        return data.isPublic !== false;
                    } catch { return true; }
                })();

                if (!isPublic && !isOwner) return;

                if (commands[commandName]) {
                    try {
                        // Pass isOwner, isGroup, senderId for the command files
                        await commands[commandName](this.sock, from, msg, q, this, botData, saveBotData, args, isOwner);
                    } catch (e) { 
                        this.sendLog(`Error .${commandName}: ${e.message}`, 'error'); 
                        await this.sock.sendMessage(from, { text: `⚠️ *Command .${commandName} failed.*${WATERMARK}` }, { quoted: msg });
                    }
                } else {
                    // Fallback for unknown commands
                    await this.sock.sendMessage(from, { text: `⚠️ *Command .${commandName} not found.*${WATERMARK}` }, { quoted: msg });
                }
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendLog(`⚠️ Link dropped. Auto-restoring...`, 'warning');
                    setTimeout(() => this.initialize(), 3000);
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this.sendLog('🎉 SESSION LINKED — INFINITE MODE', 'success');
                    
                    const botNumber = this.sock.user.id.split(':')[0].split('@')[0];
                    const formattedJid = `${botNumber}@s.whatsapp.net`;
                    await sendConnectionBanner(this.sock, formattedJid);
                    
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('connection-status', { connected: true, user: this.userId });
                }
            });

        } catch (err) {
            this.isInitializing = false;
            this.sendLog(`Init hiccup: ${err.message}. Auto-retrying...`, 'error');
            setTimeout(() => this.initialize(), 5000);
        }
    }
}

// ============================================================
// SOCKET.IO & STARTUP
// ============================================================
io.on('connection', (socket) => {
    socket.on('set-user', (userId) => {
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
    });

    socket.on('pair-request', async ({ userId, number }) => {
        try {
            if (!sessions[userId]) sessions[userId] = new BotSession(userId);
            await sessions[userId].initialize(number);
        } catch (e) { console.error('[PAIR-REQUEST]', e); }
    });

    socket.on('logout', async (userId) => {
        try {
            if (sessions[userId]) {
                if (sessions[userId].sock) { try { await sessions[userId].sock.logout(); } catch (e) {} }
                const authPath = path.join(AUTH_DIR, userId);
                if (fs.existsSync(authPath)) fs.removeSync(authPath);
                delete sessions[userId];
                const socketId = userSockets[userId];
                if (socketId) io.to(socketId).emit('connection-status', { connected: false, user: userId });
                delete userSockets[userId];
            }
        } catch (e) {}
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 BL@CKN1TE-NXS V16 on port ${PORT}`);
    
    fs.readdir(AUTH_DIR).then(dirs => {
        dirs.forEach(userId => {
            if (fs.existsSync(path.join(AUTH_DIR, userId, 'creds.json'))) {
                if (!sessions[userId]) {
                    sessions[userId] = new BotSession(userId);
                    sessions[userId].initialize().catch(() => {});
                }
            }
        });
    }).catch(() => {});

    const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try { await axios.get(APP_URL + '/health', { timeout: 5000 }); } catch (e) {}
    }, 2 * 60 * 1000);
});

process.on('uncaughtException', (err) => console.error('♾️ [Uncaught Exception]', err.message));
process.on('unhandledRejection', (err) => console.error('♾️ [Unhandled Rejection]', err?.message || err));
