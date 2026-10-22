/**
 * BL@CKN1TE-NXS - The Ultimate Single-File Bot
 * Copyright (c) 2026 BL@CKN1TE THE INCISIVE TRI-HAT HACKER
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pino = require('pino');
const NodeCache = require("node-cache");
const readline = require('readline');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

// Import all command files
const settings = require('./settings');
const { isBanned } = require('./lib/isBanned');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { handleAutotypingForMessage, showTypingAfterCommand, autotypingCommand } = require('./commands/owner/autotyping');
const { handleAutoread, autoreadCommand } = require('./commands/owner/autoread');
const { getConfig, getPrefix } = require('./lib/botConfig');
const { sendStyled } = require('./lib/menuLayout');
const { touchUser } = require('./lib/premium/database');
const { storeLinkedUser, storeChannelAction } = require('./lib/mongoStore');

// Massive Command Imports (As requested)
const tagAllCommand = require('./commands/admin/tagall');
const helpCommand = require('./commands/general/help');
const banCommand = require('./commands/admin/ban');
const { promoteCommand } = require('./commands/admin/promote');
const { demoteCommand } = require('./commands/admin/demote');
const muteCommand = require('./commands/admin/mute');
const unmuteCommand = require('./commands/admin/unmute');
const stickerCommand = require('./commands/media/sticker');
const gifCommand = require('./commands/media/gif');
const stickerAltCommand = require('./commands/media/sticker-alt');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/admin/warn');
const warningsCommand = require('./commands/admin/warnings');
const ttsCommand = require('./commands/general/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/games/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/games/topmembers');
const ownerCommand = require('./commands/general/owner');
const deleteCommand = require('./commands/admin/delete');
const { handleAntilinkCommand } = require('./commands/admin/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/admin/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/admin/mention');
const memeCommand = require('./commands/fun/meme');
const tagCommand = require('./commands/admin/tag');
const tagNotAdminCommand = require('./commands/admin/tagnotadmin');
const hideTagCommand = require('./commands/admin/hidetag');
const jokeCommand = require('./commands/fun/joke');
const quoteCommand = require('./commands/fun/quote');
const factCommand = require('./commands/fun/fact');
const weatherCommand = require('./commands/general/weather');
const newsCommand = require('./commands/general/news');
const kickCommand = require('./commands/admin/kick');
const simageCommand = require('./commands/media/simage');
const attpCommand = require('./commands/fun/attp');
const { startHangman, guessLetter } = require('./commands/games/hangman');
const { startTrivia, answerTrivia } = require('./commands/games/trivia');
const { complimentCommand } = require('./commands/fun/compliment');
const { insultCommand } = require('./commands/fun/insult');
const { eightBallCommand } = require('./commands/fun/eightball');
const { lyricsCommand } = require('./commands/general/lyrics');
const { dareCommand } = require('./commands/fun/dare');
const { truthCommand } = require('./commands/fun/truth');
const { clearCommand } = require('./commands/admin/clear');
const pingCommand = require('./commands/general/ping');
const aliveCommand = require('./commands/general/alive');
const blurCommand = require('./commands/media/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/admin/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/admin/goodbye');
const githubCommand = require('./commands/github/github');
const { handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/admin/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/admin/chatbot');
const takeCommand = require('./commands/media/take');
const { flirtCommand } = require('./commands/fun/flirt');
const characterCommand = require('./commands/fun/character');
const wastedCommand = require('./commands/fun/wasted');
const shipCommand = require('./commands/fun/ship');
const groupInfoCommand = require('./commands/admin/groupinfo');
const gcstatusCommand = require('./commands/admin/gcstatus');
const resetlinkCommand = require('./commands/admin/resetlink');
const staffCommand = require('./commands/admin/staff');
const unbanCommand = require('./commands/admin/unban');
const emojimixCommand = require('./commands/media/emojimix');
const { handlePromotionEvent } = require('./commands/admin/promote');
const { handleDemotionEvent } = require('./commands/admin/demote');
const viewOnceCommand = require('./commands/general/viewonce');
const clearSessionCommand = require('./commands/owner/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/owner/autostatus');
const { simpCommand } = require('./commands/fun/simp');
const { stupidCommand } = require('./commands/fun/stupid');
const textmakerCommand = require('./commands/textmaker/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/owner/antidelete');
const clearTmpCommand = require('./commands/owner/cleartmp');
const setProfilePicture = require('./commands/owner/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/admin/groupmanage');
const instagramCommand = require('./commands/media/instagram');
const facebookCommand = require('./commands/media/facebook');
const spotifyCommand = require('./commands/media/spotify');
const playCommand = require('./commands/media/play');
const tiktokCommand = require('./commands/media/tiktok');
const songCommand = require('./commands/media/song');
const aiCommand = require('./commands/ai/ai');
const urlCommand = require('./commands/general/url');
const { handleTranslateCommand } = require('./commands/general/translate');
const { handleSsCommand } = require('./commands/general/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/fun/goodnight');
const { shayariCommand } = require('./commands/fun/shayari');
const { rosedayCommand } = require('./commands/fun/roseday');
const imagineCommand = require('./commands/ai/imagine');
const videoCommand = require('./commands/media/video');
const sudoCommand = require('./commands/owner/sudo');
const { miscCommand, handleHeart } = require('./commands/misc/misc');
const { animeCommand } = require('./commands/anime/anime');
const { piesCommand, piesAlias } = require('./commands/anime/pies');
const stickercropCommand = require('./commands/media/stickercrop');
const updateCommand = require('./commands/owner/update');
const removebgCommand = require('./commands/media/removebg');
const { reminiCommand } = require('./commands/media/remini');
const { igsCommand } = require('./commands/media/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/owner/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/owner/pmblocker');
const settingsCommand = require('./commands/general/settings');
const pairCommand = require('./commands/general/pair');
const { sessionsCommand } = require('./commands/general/pair');
const setPrefixCommand = require('./commands/owner/setprefix');
const setMenuCommand = require('./commands/owner/setmenu');
const soraCommand = require('./commands/ai/sora');
const { handleEconomyCommand, handleEconomyAction, handleEconomyNumericReply, extractInteractiveAction } = require('./commands/economy/economy');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
    delay,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

// ==========================================
// 1. CONFIG & CONSTANTS
// ==========================================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" }, transports: ['websocket', 'polling'] });

const PREFIXES = ['.', '/', '>'];
const AUTH_DIR = './session';
const DATA_FILE = './data/bot_data.json';
const INCISIVE_WATERMARK = "\n\n> 🌟 *Powered by Incisive AI* 🌟";
const RANDOM_EMOJIS = ['⚡', '🔥', '✨', '🌟', '💫', '🎯', '🚀', '💥', '👑', '💎', '🎉', '✅', '🤖', '😎', '🙌', '👏', '💯', '🪄', '🧿', '🍀', '🌈', '❤️', '👍'];

const getRandomEmoji = () => RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)];

fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = { antilinkGroups: {}, statusSettings: {}, antiDelete: {}, userNames: {}, antiCall: {}, readSettings: {} };
if (fs.existsSync(DATA_FILE)) { try { botData = { ...botData, ...fs.readJsonSync(DATA_FILE) }; } catch (e) {} }
const saveBotData = () => { try { fs.writeJsonSync(DATA_FILE, botData); } catch (e) {} };

const sessions = {};
const userSockets = {};

// ==========================================
// 2. DASHBOARD & WEB SERVER
// ==========================================
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/health', (req, res) => res.json({ status: 'ok', sessions: Object.keys(sessions).length }));

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
});

// ==========================================
// 3. DYNAMIC COMMAND LOADER
// ==========================================
const dynamicCommands = new Map();
function loadDynamicCommands(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            loadDynamicCommands(fullPath);
        } else if (file.endsWith('.js')) {
            const cmdName = file.replace('.js', '').toLowerCase();
            try {
                const cmdModule = require(fullPath);
                if (typeof cmdModule === 'function') dynamicCommands.set(cmdName, cmdModule);
                else if (typeof cmdModule.default === 'function') dynamicCommands.set(cmdName, cmdModule.default);
                else if (typeof cmdModule.run === 'function') dynamicCommands.set(cmdName, cmdModule.run);
            } catch (error) { }
        }
    }
}
['admin', 'ai', 'anime', 'Bl@ckn1te'].forEach(folder => {
    loadDynamicCommands(path.join(__dirname, 'commands', folder));
});
console.log(`⚡ DYNAMIC LOADER: Registered ${dynamicCommands.size} commands from folders.`);

// ==========================================
// 4. MENU GENERATOR
// ==========================================
function generateMenu(botName, prefix, pushName) {
    const em = getRandomEmoji();
    return `
╭───────────────────────────────⭓
│  *${botName.toUpperCase()}* ${em}
│  *User:* ${pushName || 'Operator'}
│  *Prefix:* [ ${prefix} | / | > ]
│  *Mode:* Public
╰───────────────────────────────⭓

┏━━━━━━━━〔 *CORE* 〕━━━━━━━━
┃ ➤ ${prefix}menu | ${prefix}help
┃ ➤ ${prefix}ping | ${prefix}alive
┃ ➤ ${prefix}owner | ${prefix}settings
┃ ➤ ${prefix}trihat | ${prefix}websites
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *DOWNLOADER* 〕━━━━━━━
┃ ➤ ${prefix}play <song>
┃ ➤ ${prefix}song <song>
┃ ➤ ${prefix}download <song>
┃ ➤ ${prefix}video <query>
┃ ➤ ${prefix}tiktok <url>
┃ ➤ ${prefix}instagram <url>
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *AI & TOOLS* 〕━━━━━━━
┃ ➤ ${prefix}gpt <prompt>
┃ ➤ ${prefix}imagine <prompt>
┃ ➤ ${prefix}tts <text>
┃ ➤ ${prefix}translate <text>
┃ ➤ ${prefix}weather <city>
┃ ➤ ${prefix}ss <url>
┃ ➤ ${prefix}removebg <reply>
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *GROUP ADMIN* 〕━━━━━━━
┃ ➤ ${prefix}kick @user
┃ ➤ ${prefix}promote @user
┃ ➤ ${prefix}demote @user
┃ ➤ ${prefix}tagall <msg>
┃ ➤ ${prefix}hidetag <msg>
┃ ➤ ${prefix}antilink <on/off>
┃ ➤ ${prefix}antibadword <on/off>
┃ ➤ ${prefix}groupinfo
┗━━━━━━━━━━━━━━━━━━━━━━━━━

┏━━━━━━━━〔 *OWNER ONLY* 〕━━━━━━━
┃ ➤ ${prefix}mode <public/private>
┃ ➤ ${prefix}anticall <on/off>
┃ ➤ ${prefix}antidelete <on/off>
┃ ➤ ${prefix}autostatus <on/off>
┃ ➤ ${prefix}setpp <reply>
┗━━━━━━━━━━━━━━━━━━━━━━━━━

╭───────────────────────────────⭓
│ 🔗 *Channel:* 
│ https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f
│ 🛡️ *Incisive AI* | 24/7/365 ♾️
╰───────────────────────────────⭓
${INCISIVE_WATERMARK}
`;
}

// ==========================================
// 5. BOT SESSION ENGINE
// ==========================================
class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.authPath = path.join(AUTH_DIR, userId);
        this.isInitializing = false;
        this.readReceipts = botData.readSettings?.[userId]?.enabled !== false;
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type, user: this.userId };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    sendConnectionStatus() {
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('connection-status', { connected: this.isConnected, user: this.userId });
        io.emit('total-active', { count: Object.values(sessions).filter(s => s.isConnected).length, sessions: Object.keys(sessions).length });
    }

    async initialize(pairingNumber = null) {
        if (this.isInitializing) return;
        this.isInitializing = true;

        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);
            const msgRetryCounterCache = new NodeCache();

            this.sock = makeWASocket({
                version,
                auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })) },
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }),
                browser: Browsers.ubuntu('Chrome'),
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                msgRetryCounterCache,
                getMessage: async (key) => {
                    let jid = jidNormalizedUser(key.remoteJid);
                    return (await require('./lib/lightweight_store').loadMessage(jid, key.id))?.message || "";
                }
            });

            const sock = this.sock;

            sock.decodeJid = (jid) => {
                if (!jid) return jid;
                if (/:\d+@/gi.test(jid)) { let decode = require('@whiskeysockets/baileys').jidDecode(jid) || {}; return decode.user && decode.server && decode.user + '@' + decode.server || jid; } 
                return jid;
            };

            sock.getName = (jid, withoutContact = false) => {
                let id = sock.decodeJid(jid);
                let v = require('./lib/lightweight_store').contacts[id] || {};
                return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || id.split('@')[0];
            };

            sock.public = true;
            sock.serializeM = (m) => require('./lib/myfunc').smsg(sock, m, require('./lib/lightweight_store'));

            sock.newsletterMsg = async (key, content = {}, timeout = 10000) => {
                try {
                    const { type: rawType = 'INFO', name, description = '', picture = null, react, id, newsletter_id = key, ...media } = content
                    const type = rawType.toUpperCase()
                    if (react) return sock.query({ tag: 'message', attrs: { to: newsletter_id, type: 'reaction', server_id: id, id: require('./lib/myfunc').generateMessageTag() }, content: [{ tag: 'reaction', attrs: { code: react } }] })
                    const response = await sock.query({ tag: 'iq', attrs: { to: 's.whatsapp.net', type: 'get', xmlns: 'w:mex' }, content: [{ tag: 'query', attrs: { query_id: type === 'FOLLOW' ? '9926858900719341' : '7238632346214362' }, content: new TextEncoder().encode(JSON.stringify({ variables: { newsletter_id } })) }] }, timeout)
                    return JSON.parse(response.content[0].content)?.data?.xwa2_newsletter || JSON.parse(response.content[0].content)?.errors || {}
                } catch (error) { throw error }
            };

            if (pairingNumber && !state.creds.registered) {
                await delay(1200);
                try {
                    let code = await sock.requestPairingCode(pairingNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    this.sendLog(`🔑 Pairing Code: ${code}`, 'success');
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('pairing-code', code);
                } catch (err) { this.sendLog(`❌ Pairing error: ${err.message}`, 'error'); }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on('messages.upsert', async (chatUpdate) => {
                try {
                    const mek = chatUpdate.messages[0];
                    if (!mek.message) return;
                    mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
                    
                    if (mek.key && mek.key.remoteJid === 'status@broadcast') { 
                        await handleStatus(sock, chatUpdate); 
                        return; 
                    }
                    
                    if (sock?.msgRetryCounterCache) sock.msgRetryCounterCache.clear();

                    // PASS TO MASSIVE ENGINE
                    await handleMessages(sock, chatUpdate, true);
                } catch (err) { console.error("Error in message pipeline:", err); }
            });

            sock.ev.on('group-participants.update', async (update) => { await handleGroupParticipantUpdate(sock, update); });

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendLog(`⚠️ Link dropped (code ${statusCode}). Auto-restoring...`, 'warning');
                    this.sendConnectionStatus();

                    if (statusCode === DisconnectReason.loggedOut) {
                        try { fs.rmSync(this.authPath, { recursive: true, force: true }); } catch(e){}
                    }
                    setTimeout(() => this.initialize(), 2000);
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this.sendLog(`🎉 SESSION LINKED — INFINITE MODE`, 'success');
                    this.sendLog(`📱 Number: +${sock.user.id.split(':')[0]}`, 'success');
                    this.sendConnectionStatus();
                }
            });

        } catch (err) {
            this.isInitializing = false;
            this.sendLog(`Init hiccup: ${err.message}. Retrying...`, 'error');
            setTimeout(() => this.initialize(), 5000);
        }
    }
}

// ==========================================
// 6. THE MASSIVE COMMAND ENGINE (handleMessages)
// ==========================================
async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        await handleAutoread(sock, message);
        if (message.message) storeMessage(sock, message);

        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const pushName = message.pushName || 'User';
        
        storeLinkedUser({ jid: senderId, phone: String(senderId || '').replace(/[^0-9]/g, ''), source: 'message_activity', chatId, lastSeenAt: new Date().toISOString() }).catch(() => {});
        try { touchUser(senderId, pushName); } catch {}

        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);
        const interactiveActionId = extractInteractiveAction(message.message);

        let incomingText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // MULTI-PREFIX LOGIC
        if (incomingText.startsWith('/') || incomingText.startsWith('>')) {
            incomingText = '.' + incomingText.slice(1);
        }

        const rawText = incomingText.startsWith(getPrefix()) ? `.${incomingText.slice(getPrefix().length)}` : incomingText;
        const userMessage = rawText.toLowerCase().replace(/\.\s+/g, '.').trim();
        const args = rawText.slice(1).trim().split(/\s+/);
        const cmdName = args[0] ? args[0].toLowerCase() : '';
        const cmdArgs = args.slice(1);
        const query = cmdArgs.join(' ');

        if (isBanned(senderId) && !userMessage.startsWith('.unban')) return;

        // Status Auto-Like (Random Emojis)
        if (chatId === 'status@broadcast' && !message.key.fromMe) {
            try { await sock.sendMessage(chatId, { react: { text: getRandomEmoji(), key: message.key } }); } catch {}
            return;
        }

        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (isGroup) {
            if (userMessage) await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            await Antilink(message, sock);
        }

        if (!userMessage.startsWith('.')) {
            await handleAutotypingForMessage(sock, chatId, userMessage);
            if (isGroup) {
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
            }
            return;
        }

        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {}
        
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        if (!isPublic && !isOwnerOrSudoCheck) return;

        const handledEconomyCommand = await handleEconomyCommand(sock, chatId, message, rawText, userMessage);
        if (handledEconomyCommand) return;

        // React to all commands
        try { await sock.sendMessage(chatId, { react: { text: getRandomEmoji(), key: message.key } }); } catch {}

        let commandExecuted = false;

        switch (true) {
            case userMessage === '.help' || userMessage === '.menu' || userMessage === '.bot' || userMessage === '.list':
                const menuImagePath = path.join(__dirname, 'assets', 'bot_image.jpg');
                const menuText = generateMenu(global.botname, getPrefix(), pushName);
                
                if (fs.existsSync(menuImagePath)) {
                    try {
                        // EXTERNAL AD REPLY (Thumbnail on top right)
                        await sock.sendMessage(chatId, { 
                            text: menuText,
                            contextInfo: {
                                forwardingScore: 999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: settings.newsletterJid || '120363414192571475@newsletter',
                                    newsletterName: global.botname,
                                    serverMessageId: -1
                                },
                                externalAdReply: {
                                    title: "BL@CKN1TE-NXS",
                                    body: "Tap to view Channel",
                                    mediaType: 1,
                                    thumbnail: fs.readFileSync(menuImagePath),
                                    mediaUrl: global.channelLink,
                                    sourceUrl: global.channelLink,
                                    renderLargerThumbnail: false // Top right square image
                                }
                            }
                        }, { quoted: message });
                    } catch (e) { 
                        await sock.sendMessage(chatId, { text: menuText }, { quoted: message }); 
                    }
                } else {
                    await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
                }
                commandExecuted = true;
                break;

            case userMessage === '.trihat':
                await sock.sendMessage(chatId, { text: `🎩 *Incisive Tri-Hat Tools*\n\nUltimate hacker suite loaded.${INCISIVE_WATERMARK}` }, { quoted: message });
                commandExecuted = true;
                break;

            case userMessage === '.websites':
                await sock.sendMessage(chatId, { text: `🌐 *BL@CKN1TE Websites*\n\nPortfolio: https://blacknite.dev\nChannel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f${INCISIVE_WATERMARK}` }, { quoted: message });
                commandExecuted = true;
                break;

            case userMessage.startsWith('.play') || userMessage.startsWith('.song') || userMessage.startsWith('.download'):
                if (!query) { await sendStyled(sock, chatId, message, { title: 'MUSIC', lines: [`Usage: ${getPrefix()}play <song>`] }); break; }
                await sock.sendMessage(chatId, { text: `🔍 *Searching:* ${query}...` }, { quoted: message });
                try {
                    const search = await yts(query);
                    if (!search.videos.length) throw new Error("No results");
                    const video = search.videos[0];
                    await sock.sendMessage(chatId, {
                        audio: { url: video.url }, mimetype: 'audio/mp4', fileName: `${video.title}.mp3`,
                        caption: `🎵 *${video.title}*\n⏱ ${video.timestamp}\n👀 ${video.views}${INCISIVE_WATERMARK}`
                    }, { quoted: message });
                } catch (error) { await sendStyled(sock, chatId, message, { title: 'ERROR', lines: ['Failed to download audio.'] }); }
                commandExecuted = true;
                break;

            case userMessage.startsWith('.video') || userMessage.startsWith('.ytmp4'):
                if (!query) { await sendStyled(sock, chatId, message, { title: 'VIDEO', lines: [`Usage: ${getPrefix()}video <query>`] }); break; }
                await sock.sendMessage(chatId, { text: `🔍 *Searching:* ${query}...` }, { quoted: message });
                try {
                    const search = await yts(query);
                    if (!search.videos.length) throw new Error("No results");
                    const video = search.videos[0];
                    await sock.sendMessage(chatId, {
                        video: { url: video.url }, mimetype: 'video/mp4', fileName: `${video.title}.mp4`,
                        caption: `🎬 *${video.title}*\n⏱ ${video.timestamp}${INCISIVE_WATERMARK}`
                    }, { quoted: message });
                } catch (error) { await sendStyled(sock, chatId, message, { title: 'ERROR', lines: ['Failed to download video.'] }); }
                commandExecuted = true;
                break;

            case userMessage === '.ping': await pingCommand(sock, chatId, message); break;
            case userMessage === '.alive': await aliveCommand(sock, chatId, message); break;
            case userMessage === '.owner': await ownerCommand(sock, chatId); break;
            case userMessage.startsWith('.kick'): await kickCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message); break;
            case userMessage.startsWith('.mute'): await muteCommand(sock, chatId, senderId, message, parseInt(cmdArgs[0], 10)); break;
            case userMessage === '.unmute': await unmuteCommand(sock, chatId, message); break;
            case userMessage.startsWith('.ban'): await banCommand(sock, chatId, message); break;
            case userMessage.startsWith('.unban'): await unbanCommand(sock, chatId, message); break;
            case userMessage === '.sticker' || userMessage === '.s': await stickerCommand(sock, chatId, message); commandExecuted = true; break;
            case userMessage.startsWith('.warn'): await warnCommand(sock, chatId, senderId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message); break;
            case userMessage.startsWith('.tts'): await ttsCommand(sock, chatId, query, message); break;
            case userMessage.startsWith('.delete'): await deleteCommand(sock, chatId, message, senderId); break;
            case userMessage === '.settings': await settingsCommand(sock, chatId, message); break;
            case userMessage.startsWith('.setprefix'): await setPrefixCommand(sock, chatId, message, rawText); break;
            case userMessage.startsWith('.mode'): 
                let data; try { data = JSON.parse(fs.readFileSync('./data/messageCount.json')); } catch (e) { break; }
                if (cmdArgs[0] === 'public' || cmdArgs[0] === 'private') {
                    data.isPublic = cmdArgs[0] === 'public'; fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
                    await sendStyled(sock, chatId, message, { title: 'MODE', lines: [`Bot is now in ${cmdArgs[0]} mode.`] });
                } else { await sendStyled(sock, chatId, message, { title: 'MODE', lines: [`Usage ☇ ${getPrefix()}mode public/private`] }); }
                break;
            case userMessage.startsWith('.anticall'): await anticallCommand(sock, chatId, message, query); break;
            case userMessage === '.tagall': await tagAllCommand(sock, chatId, senderId, message); break;
            case userMessage.startsWith('.hidetag'): await hideTagCommand(sock, chatId, senderId, rawText.slice(8).trim(), message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null, message); break;
            case userMessage.startsWith('.antilink'): await handleAntilinkCommand(sock, chatId, userMessage, senderId, false, message); break;
            case userMessage === '.meme': await memeCommand(sock, chatId, message); break;
            case userMessage === '.joke': await jokeCommand(sock, chatId, message); break;
            case userMessage.startsWith('.weather'): await weatherCommand(sock, chatId, message, query); break;
            case userMessage.startsWith('.ttt'): await tictactoeCommand(sock, chatId, senderId, query); break;
            case userMessage.startsWith('.lyrics'): await lyricsCommand(sock, chatId, query, message); break;
            case userMessage.startsWith('.promote'): await promoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message); break;
            case userMessage.startsWith('.demote'): await demoteCommand(sock, chatId, message.message.extendedTextMessage?.contextInfo?.mentionedJid || [], message); break;
            case userMessage.startsWith('.instagram'): await instagramCommand(sock, chatId, message); break;
            case userMessage.startsWith('.facebook'): await facebookCommand(sock, chatId, message); break;
            case userMessage.startsWith('.tiktok'): await tiktokCommand(sock, chatId, message); break;
            case userMessage.startsWith('.gpt'): await aiCommand(sock, chatId, message); break;
            case userMessage.startsWith('.translate'): await handleTranslateCommand(sock, chatId, message, query); break;
            case userMessage.startsWith('.ss'): await handleSsCommand(sock, chatId, message, query); break;
            case userMessage.startsWith('.imagine'): await imagineCommand(sock, chatId, message); break;
            case userMessage.startsWith('.autotyping'): await autotypingCommand(sock, chatId, message); commandExecuted = true; break;
            case userMessage.startsWith('.autoread'): await autoreadCommand(sock, chatId, message); commandExecuted = true; break;
            case userMessage.startsWith('.sora'): await soraCommand(sock, chatId, message); break;
            case userMessage.startsWith('.removebg'): await removebgCommand(sock, chatId, message); break;
            case userMessage.startsWith('.remini'): await reminiCommand(sock, chatId, message, cmdArgs); break;

            // ==========================================
            // DYNAMIC COMMAND FALLBACK (150+ Engine)
            // ==========================================
            default:
                if (dynamicCommands.has(cmdName)) {
                    try {
                        await dynamicCommands.get(cmdName)(sock, chatId, message, cmdArgs, senderId, isGroup);
                        commandExecuted = true;
                    } catch (err) {
                        await sendStyled(sock, chatId, message, { title: 'ERROR', lines: [`Failed to execute .${cmdName}`] });
                        commandExecuted = true;
                    }
                } else {
                    if (isGroup) { if (userMessage) await handleChatbotResponse(sock, chatId, message, userMessage, senderId); }
                    commandExecuted = false;
                }
                break;
        }

        if (commandExecuted !== false) {
            await showTypingAfterCommand(sock, chatId);
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('Error in message handler:', error.message);
        if (message.key.remoteJid) {
            await sendStyled(sock, message.key.remoteJid, message, { title: 'ERROR', lines: ['Failed to process command.'] });
        }
    }
}

// ==========================================
// 7. EVENT HANDLERS & STARTUP
// ==========================================
async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;
        if (!id.endsWith('@g.us')) return;
        let isPublic = true;
        try { const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json')); if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic; } catch (e) {}
        if (action === 'promote' && isPublic) await handlePromotionEvent(sock, id, participants, author);
        if (action === 'demote' && isPublic) await handleDemotionEvent(sock, id, participants, author);
        if (action === 'add') await handleJoinEvent(sock, id, participants);
        if (action === 'remove') await handleLeaveEvent(sock, id, participants);
    } catch (error) { console.error('Error in handleGroupParticipantUpdate:', error); }
}

async function handleStatus(sock, status) {
    try {
        const msg = status.messages[0];
        if (!msg.key.fromMe && msg.key.remoteJid === 'status@broadcast') {
            await sock.readMessages([msg.key]);
            await sock.sendMessage('status@broadcast', { react: { text: getRandomEmoji(), key: msg.key } });
            await handleStatusUpdate(sock, status);
        }
    } catch (e) {}
}

// Start Express & WebSocket Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 BL@CKN1TE-NXS V16 on port ${PORT}`);
    console.log(`🌐 Panel: http://localhost:${PORT}`);
    console.log(`♾️ INFINITE MODE: ENABLED`);
});

// Auto-load existing sessions
async function loadExistingSessions() {
    try {
        const authDirs = await fs.promises.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.promises.stat(authPath);
            if (stats.isDirectory() && fs.existsSync(path.join(authPath, 'creds.json'))) {
                console.log(`[System] Auto-loading: ${userId}`);
                if (!sessions[userId]) {
                    sessions[userId] = new BotSession(userId);
                    sessions[userId].initialize().catch(() => {});
                }
            }
        }
    } catch (err) {}
}
loadExistingSessions();

// Infinite Supervisor (Keeps reconnecting dead sessions)
setInterval(async () => {
    try {
        const authDirs = await fs.promises.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            if (fs.existsSync(path.join(AUTH_DIR, userId, 'creds.json'))) {
                if (!sessions[userId]) {
                    sessions[userId] = new BotSession(userId);
                    sessions[userId].initialize().catch(() => {});
                } else if (!sessions[userId].isConnected && !sessions[userId].isInitializing) {
                    sessions[userId].initialize().catch(() => {});
                }
            }
        }
    } catch (e) {}
}, 5 * 60 * 1000); // Every 5 minutes

// Render Anti-Sleep
const APP_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(async () => {
    try { await axios.get(APP_URL + '/health', { timeout: 5000 }); } catch (e) {}
}, 2 * 60 * 1000);