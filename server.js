require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { exec } = require('child_process');

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
// CONFIG
// ============================================================
const PREFIXES = ['.', '/', '>'];
const OWNER_SECRET = process.env.OWNER_SECRET || 'blacknite_owner_2025';
const CMD_DIR = path.join(__dirname, 'commands');

// The EXACT Channel JID & URL for the bot
const MY_CHANNEL_JID = '120363414192571475@newsletter'; 
const MY_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f';
const MY_CHANNEL_NAME = 'BL@CKN1TE-NXS Official Channel';

// Owner Numbers
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
// SAFE COMMAND LOADER (Root of commands/ folder only)
// ============================================================
function safeRequire(filePath, name) {
    try {
        if (fs.existsSync(filePath) || fs.existsSync(filePath + '.js')) {
            console.log(`✅ [CMD] Loaded: ${name}`);
            return require(filePath);
        }
        console.log(`⚠️  [CMD] Skipped (missing): ${name}`);
        return async function stub(sock, from, msg) {
            try { await sock.sendMessage(from, { text: `⚠️ *Command ${PREFIXES[0]}${name} unavailable.*` }, { quoted: msg }); } catch (e) {}
        };
    } catch (e) {
        console.error(`❌ [CMD] Failed: ${name}: ${e.message}`);
        return async function stub(sock, from, msg) {
            try { await sock.sendMessage(from, { text: `⚠️ *Command ${PREFIXES[0]}${name} unavailable.*` }, { quoted: msg }); } catch (e) {}
        };
    }
}

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
const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling'],
    pingInterval: 20000,
    pingTimeout: 15000,
    connectTimeout: 8000
});

let openai = null;
if (process.env.OPENAI_API_KEY) {
    try { openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1" }); } catch (e) {}
}

// ============================================================
// MIDDLEWARE & ROUTES
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/login.html', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/index.html', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

app.get('/health', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({
        status: 'ok',
        bot: settings.botName,
        sessions: Object.keys(sessions).length,
        active: Object.values(sessions).filter(s => s.isConnected).length,
        uptime: process.uptime(),
        mode: INFINITE_MODE ? 'INFINITE' : 'STANDARD'
    });
});

// ============================================================
// STORAGE
// ============================================================
const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = {
    antilinkGroups: {}, totalBots: 0, registeredBots: [],
    statusSettings: {}, antiDelete: {}, userNames: {},
    antiCall: {}, antiStatusGroups: {}, readSettings: {}
};
if (fs.existsSync(DATA_FILE)) { try { botData = { ...botData, ...fs.readJsonSync(DATA_FILE) }; } catch (e) {} }
function saveBotData() { try { fs.writeJsonSync(DATA_FILE, botData); } catch (e) {} }

const sessions = {};
const userSockets = {};
const messageLogs = {};

// ============================================================
// 🅱️ BOLD UNICODE HELPER
// ============================================================
const toBold = (text) => {
    const boldChars = { 'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷','k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁','u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇', 'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝','K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧','U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭', '0':'𝟬','1':'𝟭','2':'𝟮','3':'𝟯','4':'𝟰','5':'𝟱','6':'𝟲','7':'𝟳','8':'𝟴','9':'𝟵' };
    return text.split('').map(c => boldChars[c] || c).join('');
};

// ============================================================
// 🎨 MASSIVE CYBERPUNK MENU (FIXED CHANNEL & ALIGNMENT)
// ============================================================
async function sendBeautifulMenu(sock, from, msg, session, botData, customName) {
    const aiStatus = session.aiEnabled ? '🟢' : '🔴';
    const ghostStatus = session.readReceipts === false ? '🟢' : '🔴';
    const reactStatus = session.autoReact ? '🟢' : '🔴';
    const readStatus = session.readReceipts !== false ? '🟢' : '🔴';
    const antiDelStatus = botData.antiDelete[session.userId] ? '🟢' : '🔴';
    const antiStatStatus = botData.statusSettings[session.userId]?.autoStatus ? '🟢' : '🔴';
    const antiLinkStatus = botData.antilinkGroups?.[session.userId] ? '🟢' : '🔴';
    const antiCallStatus = botData.antiCall?.[session.userId] ? '🟢' : '🔴';
    const modeIcon = session.isPublic ? '🌍' : '🔐';
    const modeText = session.isPublic ? toBold('PUBLIC') : toBold('PRIVATE');

    const menuText =
`╔═══════════════════════════════════════╗
║  ░▒▓█ ${toBold('BL@CKN1TE-NXS')} █▓▒░
║  ░▒▓█ ${toBold('V16')} • ${toBold('CYBERPUNK CORE')} █▓▒░
║  ═══════════════════════════════════
║  🎩 ${toBold('The Incisive Tri-Hat Hacker')}
║  ♾️  ${toBold('LIFETIME CONNECTION ACTIVE')}
╚═══════════════════════════════════════╝

┏━〔 ${toBold('👤 OPERATOR IDENTITY')} 〕━━━━━━━━━
┃  ├ ${toBold('Codename')}  : ${customName}
┃  ├ ${toBold('Session')}   : ${session.userId.slice(0, 18)}
┃  ├ ${toBold('Status')}    : 🟢 ${toBold('ONLINE')}
┃  └ ${toBold('Access')}    : ${modeIcon} ${modeText}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┏━〔 ${toBold('⚙️ CORE SYSTEMS')} 〕━━━━━━━━━━━━━
┃  ${aiStatus} ${toBold('AI Engine')}       ${session.aiEnabled ? 'ACTIVE' : 'IDLE'}
┃  ${ghostStatus} ${toBold('Ghost Mode')}      ${session.readReceipts === false ? 'ACTIVE' : 'IDLE'}
┃  ${readStatus} ${toBold('Auto-Read')}       ${session.readReceipts !== false ? 'ACTIVE' : 'IDLE'}
┃  ${reactStatus} ${toBold('Auto-React')}      ${session.autoReact ? 'ACTIVE' : 'IDLE'}
┃  ${antiDelStatus} ${toBold('Anti-Delete')}     ${botData.antiDelete[session.userId] ? 'ACTIVE' : 'IDLE'}
┃  ${antiStatStatus} ${toBold('Anti-Status')}     ${botData.statusSettings[session.userId]?.autoStatus ? 'ACTIVE' : 'IDLE'}
┃  ${antiLinkStatus} ${toBold('Anti-Link')}       ${botData.antilinkGroups?.[session.userId] ? 'ACTIVE' : 'IDLE'}
┃  ${antiCallStatus} ${toBold('Anti-Call')}       ${botData.antiCall?.[session.userId] ? 'ACTIVE' : 'IDLE'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔═══════════════════════════════════════╗
║  ░▒▓ ${toBold('COMMAND MATRIX')} ▓▒░
╚═══════════════════════════════════════╝

┏━〔 ${toBold('⚙️ 01 · USER CORE')} 〕━━━━━━━━━━
┃  ▸ ${toBold('.read')} <on|off|default>
┃  ▸ ${toBold('.ghost')} <on|off>
┃  ▸ ${toBold('.autoreacts')} <on|off>
┃  ▸ ${toBold('.ai')} <on|off|text>
┃  ▸ ${toBold('.vv')} — reveal view-once
┃  ▸ ${toBold('.dp')} — profile pic
┃  ▸ ${toBold('.ping')} — latency check
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┏━〔 ${toBold('🎬 02 · MEDIA VAULT')} 〕━━━━━━━━
┃  ▸ ${toBold('.song')} <name|url>
┃  ▸ ${toBold('.video')} <name|url>
┃  ▸ ${toBold('.tiktok')} <url>
┃  ▸ ${toBold('.insta')} <url>
┃  ▸ ${toBold('.facebook')} <url>
┃  ▸ ${toBold('.gdrive')} <url>
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┏━〔 ${toBold('🌐 07 · BL@CKN1TE HUB')} 〕━━━━━
┃  ▸ ${toBold('.websites')}
┃  ▸ ${toBold('.trihat')}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔═══════════════════════════════════════╗
║  🔗 ${toBold('JOIN CHANNEL')}
║  ▸ ${MY_CHANNEL_URL}
║  ⚡ ${toBold('Powered by Incisive AI')}
╚═══════════════════════════════════════╝

  ░▒▓█ ${toBold('END OF TRANSMISSION')} █▓▒░`;

    const menuImagePath = path.join(__dirname, 'assets', 'bot_image.jpg');
    
    if (fs.existsSync(menuImagePath)) {
        try {
            await sock.sendMessage(from, {
                text: menuText,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    // FIXED: HARDCODED YOUR CHANNEL JID HERE
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: MY_CHANNEL_JID,
                        newsletterName: MY_CHANNEL_NAME,
                        serverMessageId: -1
                    },
                    externalAdReply: {
                        title: "BL@CKN1TE-NXS",
                        body: "Tap to view Channel",
                        mediaType: 1,
                        thumbnail: fs.readFileSync(menuImagePath),
                        mediaUrl: MY_CHANNEL_URL,
                        sourceUrl: MY_CHANNEL_URL,
                        renderLargerThumbnail: false // Top right image
                    }
                }
            }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(from, { text: menuText }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(from, { text: menuText }, { quoted: msg });
    }
}

const LIGHTNING_EMOJIS = ['⚡', '🌩️', '⚡️', '✨', '🌟', '🔥', '💫', '🪄', '⚡'];
const RANDOM_REACTIONS = ['⚡', '🔥', '✨', '🌟', '💫', '🎯', '🚀', '💥', '⚡️', '👑', '💎', '🎉', '✅', '🤖', '😎', '🙌', '👏', '💯', '🌟', '🪄', '🧿', '🍀', '🌈', '❤️', '👍', '🎊', '⭐'];
function getRandomReaction() { return RANDOM_REACTIONS[Math.floor(Math.random() * RANDOM_REACTIONS.length)]; }

// ============================================================
// ♾️ INFINITE BOT SESSION
// ============================================================
class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.aiEnabled = false;

        const persistedRead = botData.readSettings?.[userId]?.enabled;
        this.readReceipts = (persistedRead === undefined) ? true : persistedRead;

        this.autoReact = botData.statusSettings[userId]?.autoReact || false;
        this.isPublic = botData.statusSettings[userId]?.isPublic || false;
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.keepAliveInterval = null;
        this.watchdogInterval = null;
        this.heartbeatInterval = null;
        this.isInitializing = false;
        this.lastConnectMessageTime = null;
        this.reconnectAttempts = 0;
        this.everConnected = false;
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type, user: this.userId };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        io.emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    sendConnectionStatus() {
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('connection-status', { connected: this.isConnected, user: this.userId });
        io.emit('total-active', {
            count: Object.values(sessions).filter(s => s.isConnected).length,
            sessions: Object.keys(sessions).length
        });
    }

    async reactRandom(msg) {
        try { await this.sock.sendMessage(msg.key.remoteJid, { react: { text: getRandomReaction(), key: msg.key } }); } catch (e) {}
    }

    async getAIResponse(userJid, userMessage) {
        if (!openai) return null;
        try {
            const completion = await openai.chat.completions.create({
                model: process.env.AI_MODEL || "gpt-3.5-turbo",
                messages: [{ role: "system", content: "Helpful assistant." }, { role: "user", content: userMessage }],
                max_tokens: 250
            });
            return completion.choices[0].message.content.trim();
        } catch (error) { return null; }
    }

    startKeepAlive() {
        if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try { await this.sock.sendPresenceUpdate('available'); } catch (e) {}
            }
        }, KEEPALIVE_PRESENCE_MS);
    }

    startWatchdog() {
        if (this.watchdogInterval) clearInterval(this.watchdogInterval);
        this.watchdogInterval = setInterval(async () => {
            if (this.isInitializing) return;
            if (!this.sock || !this.sock.user || !this.isConnected) {
                try { await this.initialize(); } catch (e) {}
            }
        }, SESSION_WATCHDOG_MS);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(async () => {
            if (!this.sock || !this.sock.user) return;
            try { await this.sock.sendPresenceUpdate('available'); }
            catch (e) { if (!this.isInitializing) { try { await this.initialize(); } catch (err) {} } }
        }, HEARTBEAT_INTERVAL_MS);
    }

    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try {
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await this.sock.sendMessage(botNumber, { text: "♾️ 𝗕𝗟@𝗖𝗞𝗡𝟭𝗧𝗘-𝗡𝗫𝗦 𝗜𝗦 𝗢𝗡𝗟𝗜𝗡𝗘 🚀\n\n_Lifetime Connection Active_" });
                } catch (e) {}
            }
        }, 60 * 60 * 1000);
    }

    async forceReconnect(delayMs = 3000) {
        if (this.isInitializing) return;
        this.reconnectAttempts++;
        this.sendLog(`🔄 Reconnect #${this.reconnectAttempts} in ${delayMs/1000}s`, "warning");
        setTimeout(async () => {
            try { await this.initialize(); }
            catch (e) {
                const next = Math.min(delayMs * 2, 30000);
                setTimeout(() => this.forceReconnect(next), next);
            }
        }, delayMs);
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
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                keepAliveIntervalMs: 15000,
                connectTimeoutMs: 30000,
                defaultQueryTimeoutMs: 30000,
                emitOwnEvents: true,
                retryRequestDelayMs: 1000,
                maxMsgRetryCount: 5,
                linkPreviewImageThumbnailWidth: 192,
                generateHighQualityLinkPreview: false,
                getMessage: async (key) => {
                    if (messageLogs[key.id]) return { conversation: messageLogs[key.id].text };
                    return { conversation: 'Bot is active' };
                }
            });

            if (pairingNumber && !state.creds.registered) {
                if (!this.sock.authState.creds.registered) {
                    await delay(1200);
                    try {
                        let code = await this.sock.requestPairingCode(pairingNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        this.sendLog(`🔑 Pairing Code: ${code}`, 'success');
                        const socketId = userSockets[this.userId];
                        if (socketId) io.to(socketId).emit('pairing-code', code);
                    } catch (err) { this.sendLog(`❌ Pairing error: ${err.message}`, 'error'); }
                }
            }

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;
                const msg = m.messages[0];
                if (!msg.message) return;

                const from = msg.key.remoteJid;
                const isMe = msg.key.fromMe;
                const isStatus = from === 'status@broadcast';
                
                if (!isMe && !isStatus && this.readReceipts !== false) {
                    try { await this.sock.readMessages([msg.key]); } catch (e) {}
                }

                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || '').trim();
                const cmd = text.toLowerCase();
                const args = text.split(' ').slice(1);
                const q = args.join(' ');

                if (this.autoReact && !isMe && !isStatus) {
                    try { await this.sock.sendMessage(from, { react: { text: getRandomReaction(), key: msg.key } }); } catch (e) {}
                }

                if (isStatus && !isMe) {
                    try { await this.sock.sendMessage('status@broadcast', { react: { text: getRandomReaction(), key: msg.key } }); } catch (e) {}
                    return;
                }

                if (!this.isPublic && !isMe) return;

                const matchedPrefix = PREFIXES.find(p => cmd.startsWith(p));
                if (matchedPrefix) {
                    const commandName = cmd.slice(matchedPrefix.length).split(' ')[0];
                    this.reactRandom(msg).catch(() => {});

                    if (commandName === 'menu' || commandName === 'start' || commandName === 'help') {
                        const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                        return await sendBeautifulMenu(this.sock, from, msg, this, botData, customName);
                    }
                    
                    // === OWNER COMMAND FIX ===
                    if (commandName === 'owner') {
                        const ownerText = `👑 *BL@CKN1TE-NXS OWNER*\n\n` +
                                          `📞 *Primary:* ${OWNER_NUMBERS[0]}\n` +
                                          `📞 *Secondary:* ${OWNER_NUMBERS[1]}\n\n` +
                                          `> 🌟 *Powered by Incisive AI* 🌟`;
                        return await this.sock.sendMessage(from, { text: ownerText }, { quoted: msg });
                    }

                    if (commandName === 'websites' && commands['websites']) return await commands['websites'](this.sock, from, msg);
                    if (commandName === 'trihat' && commands['trihat']) return await commands['trihat'](this.sock, from, msg);

                    if (commands[commandName]) {
                        try {
                            await commands[commandName](this.sock, from, msg, q, this, botData, saveBotData, args);
                        } catch (e) {
                            this.sendLog(`Command error (${commandName}): ${e.message}`, 'error');
                            await this.sock.sendMessage(from, { text: `⚠️ Failed to execute .${commandName}` }, { quoted: msg });
                        }
                    }
                }
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendLog(`⚠️ Link dropped. Auto-restoring...`, 'warning');
                    this.sendConnectionStatus();
                    setTimeout(() => this.forceReconnect(2000), 300);
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.everConnected = true;
                    this.isInitializing = false;
                    this.sendLog('🎉 SESSION LINKED — INFINITE MODE', 'success');
                    this.sendConnectionStatus();
                }
            });

        } catch (err) {
            this.isInitializing = false;
            this.sendLog(`Init hiccup: ${err.message}. Auto-retrying...`, 'error');
            setTimeout(() => this.forceReconnect(5000), 5000);
        }
    }
}

// ============================================================
// SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
    socket.emit('total-active', { count: Object.values(sessions).filter(s => s.isConnected).length, sessions: Object.keys(sessions).length });

    socket.on('set-user', (userId) => {
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        sessions[userId].sendConnectionStatus();
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
                io.emit('total-active', { count: Object.values(sessions).filter(s => s.isConnected).length, sessions: Object.keys(sessions).length });
                const socketId = userSockets[userId];
                if (socketId) io.to(socketId).emit('connection-status', { connected: false, user: userId });
                delete userSockets[userId];
            }
        } catch (e) {}
    });

    socket.on('disconnect', () => {
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) { delete userSockets[userId]; break; }
        }
    });
});

// ============================================================
// STARTUP & SUPERVISOR
// ============================================================
async function loadExistingSessions() {
    try {
        const authDirs = await fs.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.stat(authPath);
            if (stats.isDirectory() && fs.existsSync(path.join(authPath, 'creds.json'))) {
                if (!sessions[userId]) {
                    sessions[userId] = new BotSession(userId);
                    sessions[userId].initialize().catch(() => {});
                }
            }
        }
    } catch (err) {}
}

function startInfiniteSupervisor() {
    setInterval(async () => {
        try {
            const authDirs = await fs.readdir(AUTH_DIR);
            for (const userId of authDirs) {
                const authPath = path.join(AUTH_DIR, userId);
                const stats = await fs.stat(authPath);
                if (stats.isDirectory() && fs.existsSync(path.join(authPath, 'creds.json'))) {
                    if (!sessions[userId]) {
                        sessions[userId] = new BotSession(userId);
                        sessions[userId].initialize().catch(() => {});
                    } else if (!sessions[userId].isConnected && !sessions[userId].isInitializing) {
                        sessions[userId].forceReconnect(1500).catch(() => {});
                    }
                }
            }
        } catch (e) {}
    }, AUTO_RELOAD_INTERVAL_MS);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 BL@CKN1TE-NXS V16 on port ${PORT}`);
    console.log(`♾️  INFINITE MODE: ENABLED`);
    loadExistingSessions();
    startInfiniteSupervisor();

    const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
        try { await axios.get(APP_URL + '/health', { timeout: 5000 }); console.log("♾️ Anti-Sleep ping ✅"); } catch (e) {}
    }, 2 * 60 * 1000);
});

process.on('uncaughtException', (err) => console.error('♾️ [Uncaught Exception]', err.message));
process.on('unhandledRejection', (err) => console.error('♾️ [Unhandled Rejection]', err?.message || err));
process.on('SIGTERM', () => console.log('♾️ [SIGTERM] Ignored — staying alive'));
process.on('SIGINT', () => console.log('♾️ [SIGINT] Ignored — staying alive'));
