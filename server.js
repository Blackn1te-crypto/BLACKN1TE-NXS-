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

const OWNER_NUMBERS = [
    "+263714799483",
    "+263780540231"
];

// ============================================================
// ♾️ INFINITE CONNECTION FLAGS
// ============================================================
const INFINITE_MODE = true;
const HEARTBEAT_INTERVAL_MS = 45 * 1000;
const AUTO_RELOAD_INTERVAL_MS = 5 * 60 * 1000;
const SESSION_WATCHDOG_MS = 60 * 1000;
const KEEPALIVE_PRESENCE_MS = 60 * 1000;

// ============================================================
// SAFE COMMAND LOADER
// ============================================================
function safeRequire(filePath, name) {
    try {
        if (fs.existsSync(filePath) || fs.existsSync(filePath + '.js')) {
            return require(filePath);
        }
        return async function stub(sock, from, msg) {
            try { await sock.sendMessage(from, { text: `⚠️ *Command .${name} unavailable.*` }, { quoted: msg }); } catch (e) {}
        };
    } catch (e) {
        return async function stub(sock, from, msg) {
            try { await sock.sendMessage(from, { text: `⚠️ *Command .${name} failed to load.*` }, { quoted: msg }); } catch (e) {}
        };
    }
}

// All 140+ commands synced
const commands = {
    ping: safeRequire(path.join(CMD_DIR, 'ping'), 'ping'),
    owner: safeRequire(path.join(CMD_DIR, 'owner'), 'owner'),
    song: safeRequire(path.join(CMD_DIR, 'song'), 'song'),
    video: safeRequire(path.join(CMD_DIR, 'video'), 'video'),
    tiktok: safeRequire(path.join(CMD_DIR, 'tiktok'), 'tiktok'),
    insta: safeRequire(path.join(CMD_DIR, 'insta'), 'insta'),
    facebook: safeRequire(path.join(CMD_DIR, 'facebook'), 'facebook'),
    gdrive: safeRequire(path.join(CMD_DIR, 'gdrive'), 'gdrive'),
    mf: safeRequire(path.join(CMD_DIR, 'mf'), 'mf'),
    apk: safeRequire(path.join(CMD_DIR, 'apk'), 'apk'),
    dp: safeRequire(path.join(CMD_DIR, 'dp'), 'dp'),
    vv: safeRequire(path.join(CMD_DIR, 'vv'), 'vv'),
    ai: safeRequire(path.join(CMD_DIR, 'ai'), 'ai'),
    image: safeRequire(path.join(CMD_DIR, 'image'), 'image'),
    tts: safeRequire(path.join(CMD_DIR, 'tts'), 'tts'),
    translate: safeRequire(path.join(CMD_DIR, 'translate'), 'translate'),
    character: safeRequire(path.join(CMD_DIR, 'character'), 'character'),
    emojimix: safeRequire(path.join(CMD_DIR, 'emojimix'), 'emojimix'),
    joke: safeRequire(path.join(CMD_DIR, 'joke'), 'joke'),
    meme: safeRequire(path.join(CMD_DIR, 'meme'), 'meme'),
    weather: safeRequire(path.join(CMD_DIR, 'weather'), 'weather'),
    qr: safeRequire(path.join(CMD_DIR, 'qr'), 'qr'),
    shorten: safeRequire(path.join(CMD_DIR, 'shorten'), 'shorten'),
    calc: safeRequire(path.join(CMD_DIR, 'calc'), 'calc'),
    antilink: safeRequire(path.join(CMD_DIR, 'antilink'), 'antilink'),
    anticall: safeRequire(path.join(CMD_DIR, 'anticall'), 'anticall'),
    antidelete: safeRequire(path.join(CMD_DIR, 'antidelete'), 'antidelete'),
    antistatus: safeRequire(path.join(CMD_DIR, 'antistatus'), 'antistatus'),
    autoreacts: safeRequire(path.join(CMD_DIR, 'autoreacts'), 'autoreacts'),
    autostatus: safeRequire(path.join(CMD_DIR, 'status'), 'status'),
    kick: safeRequire(path.join(CMD_DIR, 'kick'), 'kick'),
    kickoffline: safeRequire(path.join(CMD_DIR, 'kickoffline'), 'kickoffline'),
    hidetag: safeRequire(path.join(CMD_DIR, 'hidetag'), 'hidetag'),
    tagall: safeRequire(path.join(CMD_DIR, 'tagall'), 'tagall'),
    setname: safeRequire(path.join(CMD_DIR, 'setname'), 'setname'),
    groupinfo: safeRequire(path.join(CMD_DIR, 'groupinfo'), 'groupinfo'),
    accept: safeRequire(path.join(CMD_DIR, 'accept'), 'accept'),
    hack: safeRequire(path.join(CMD_DIR, 'hack'), 'hack'),
    private: safeRequire(path.join(CMD_DIR, 'private'), 'private'),
    public: safeRequire(path.join(CMD_DIR, 'public'), 'public'),
    autoread: safeRequire(path.join(CMD_DIR, 'autoread'), 'autoread'),
    read: safeRequire(path.join(CMD_DIR, 'read'), 'read'),
    online: safeRequire(path.join(CMD_DIR, 'online'), 'online'),
    incisiveTrihatTools: safeRequire(path.join(CMD_DIR, 'incisive-trihat-tools'), 'incisive-trihat-tools'),
    blackn1teWebsites: safeRequire(path.join(CMD_DIR, 'blackn1te-websites'), 'blackn1te-websites'),
    settings: safeRequire(path.join(CMD_DIR, 'settings'), 'settings')
};

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
│  *BL@CKN1TE-NXS* ⚡
│  *User:* ${pushName}
│  *Prefix:* [ . / > ]
│  *Status:* 🟢 ONLINE
╰───────────────────────────⭓

┏━━━━━━━━〔 *USER CORE* 〕━━━━━━━━
┃ ➤ .ai
┃ ➤ .img
┃ ➤ .read
┃ ➤ .ping
┃ ➤ .trt
┃ ➤ .tts
┃ ➤ .owner
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *MEDIA VAULT* 〕━━━━━━━
┃ ➤ .song
┃ ➤ .video
┃ ➤ .tiktok
┃ ➤ .insta
┃ ➤ .facebook
┃ ➤ .gdrive
┃ ➤ .apk
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *GROUP ADMIN* 〕━━━━━━━
┃ ➤ .kick
┃ ➤ .promote
┃ ➤ .demote
┃ ➤ .tagall
┃ ➤ .hidetag
┃ ➤ .setname
┃ ➤ .groupinfo
┃ ➤ .accept
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *SECURITY & UTILS* 〕━━━━
┃ ➤ .antilink
┃ ➤ .anticall
┃ ➤ .antidelete
┃ ➤ .antistatus
┃ ➤ .mode
┃ ➤ .autoread
┃ ➤ .areact
┃ ➤ .settings
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *FUN & TOOLS* 〕━━━━━━━
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

┏━━━━━━━━〔 *OWNER ZONE* 〕━━━━━━━
┃ ➤ .hack
┃ ➤ .trihat
┃ ➤ .websites
┗━━━━━━━━━━━━━━━━━━━━━━━━━━

╭───────────────────────────⭓
│ 🔗 *Join Our Channel*
│ ${MY_CHANNEL_URL}
│ ⚡ *Powered by BL@CKN1TE*
│ 🎩 *THE INCISIVE TRI-HAT*
╰───────────────────────────⭓
    `;

    const menuImagePath = path.join(__dirname, 'assets', 'bot_image.jpg');
    try {
        await sock.sendMessage(from, {
            text: menu,
            contextInfo: {
                // No isForwarded and no forwardingScore so it's native
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

> 🌟 *Powered by BL@CKN1TE THE INCISIVE TRI-HAT* 🌟
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
                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
                const cmd = text.toLowerCase();
                const args = text.split(' ').slice(1);
                const q = args.join(' ');

                const matchedPrefix = PREFIXES.find(p => cmd.startsWith(p));
                if (!matchedPrefix) return;

                const commandName = cmd.slice(matchedPrefix.length).split(' ')[0];

                if (commandName === 'menu' || commandName === 'help' || commandName === 'start') {
                    return await sendUltimateMenu(this.sock, from, msg, this, msg.pushName || 'User');
                }
                
                if (commandName === 'owner') {
                    return await this.sock.sendMessage(from, { text: `👑 *BL@CKN1TE-NXS OWNER*\n\n📞 ${OWNER_NUMBERS[0]}\n📞 ${OWNER_NUMBERS[1]}\n\n> 🌟 *Powered by BL@CKN1TE THE INCISIVE TRI-HAT* 🌟` }, { quoted: msg });
                }

                if (commands[commandName]) {
                    try {
                        await commands[commandName](this.sock, from, msg, q, this, botData, saveBotData, args);
                    } catch (e) { this.sendLog(`Error .${commandName}: ${e.message}`, 'error'); }
                }
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                    this.isConnected = false;
                    this.isInitializing = false;
                    setTimeout(() => this.initialize(), 3000);
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this.sendLog('🎉 SESSION LINKED — INFINITE MODE', 'success');
                    
                    // SEND BANNER TO SET THE CHANNEL CACHE CORRECTLY
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await sendConnectionBanner(this.sock, botNumber);
                    
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('connection-status', { connected: true, user: this.userId });
                }
            });

        } catch (err) {
            this.isInitializing = false;
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
