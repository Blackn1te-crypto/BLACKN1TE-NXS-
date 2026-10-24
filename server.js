require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');

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
// CORE IMPORTS (From main.js)
// ============================================================
const { isBanned } = require('./lib/isBanned');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, handleAutotypingForMessage, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, handleAutoread } = require('./commands/autoread');
const { getConfig, getPrefix } = require('./lib/botConfig');
const { sendStyled } = require('./lib/menuLayout');
const { touchUser } = require('./lib/database');
const { storeLinkedUser, storeChannelAction } = require('./lib/mongoStore');
const { handleEconomyCommand, handleEconomyAction, handleEconomyNumericReply, extractInteractiveAction } = require('./lib/economy');

const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const gifCommand = require('./commands/gif');
const stickerAltCommand = require('./commands/sticker-alt');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const gcstatusCommand = require('./commands/gcstatus');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const pairCommand = require('./commands/pair');
const { sessionsCommand } = require('./commands/pair');
const setPrefixCommand = require('./commands/setprefix');
const setMenuCommand = require('./commands/setmenu');
const soraCommand = require('./commands/sora');

// ============================================================
// CONFIG
// ============================================================
const PREFIXES = ['.', '/', '>'];
const OWNER_NUMBERS = ['263780540231', '263714799483'];
const MY_CHANNEL_JID = '120363414192571475@newsletter';
const MY_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f';
const MY_CHANNEL_NAME = 'BL@CKN1TE-NXS Official';

const INFINITE_MODE = true;
const HEARTBEAT_INTERVAL_MS = 45 * 1000;
const AUTO_RELOAD_INTERVAL_MS = 5 * 60 * 1000;
const SESSION_WATCHDOG_MS = 60 * 1000;
const KEEPALIVE_PRESENCE_MS = 60 * 1000;

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
const messageLogs = {};

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
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ============================================================
// MENU GENERATOR
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

const RANDOM_REACTIONS = ['⚡', '🔥', '✨', '🌟', '💫', '🎯', '🚀', '💥', '👑', '💎', '🎉', '✅', '🤖', '😎', '🙌', '👏', '💯', '🪄', '🧿', '🍀', '🌈', '❤️', '👍'];
function getRandomEmoji() { return RANDOM_REACTIONS[Math.floor(Math.random() * RANDOM_REACTIONS.length)]; }

// ============================================================
// BOT SESSION & MAIN.JS SWITCH LOGIC
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
                const isGroup = from.endsWith('@g.us');
                const senderId = msg.key.participant || from;
                
                if (from === 'status@broadcast') {
                    await handleStatusUpdate(this.sock, m);
                    return;
                }

                await handleAutoread(this.sock, msg);
                storeMessage(this.sock, msg);
                if (msg.message?.protocolMessage?.type === 0) return handleMessageRevocation(this.sock, msg);

                // == HARDCODED OWNER CHECK ==
                const senderNumber = senderId.split('@')[0].replace(/[^0-9]/g, '');
                const isHardcodedOwner = OWNER_NUMBERS.includes(senderNumber);
                const senderIsSudo = await isSudo(senderId);
                const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, this.sock, from) || isHardcodedOwner;

                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || '').trim();
                const cmd = text.toLowerCase();
                const args = text.split(' ').slice(1);
                const q = args.join(' ');
                
                // Send random emoji reaction
                if (cmd.startsWith('.')) {
                    try { await this.sock.sendMessage(from, { react: { text: getRandomEmoji(), key: msg.key } }); } catch (e) {}
                }

                const matchedPrefix = PREFIXES.find(p => cmd.startsWith(p));
                if (!matchedPrefix) return;
                
                const commandName = cmd.slice(matchedPrefix.length).split(' ')[0];
                const rawText = text; // Preserves case

                if (commandName === 'menu' || commandName === 'help' || commandName === 'start') {
                    return await sendUltimateMenu(this.sock, from, msg, this, msg.pushName || 'User');
                }

                let isPublic = true;
                try { const data = JSON.parse(fs.readFileSync('./data/messageCount.json')); if (typeof data.isPublic === 'boolean') isPublic = data.isPublic; } catch (error) {}
                const isOwnerOrSudoCheck = isMe || senderIsOwnerOrSudo;
                if (!isPublic && !isOwnerOrSudoCheck) return;

                if (isBanned(senderId) && !cmd.startsWith('.unban')) return;
                if (!isMe) incrementMessageCount(from, senderId);

                if (isGroup) {
                    if (cmd) await handleBadwordDetection(this.sock, from, msg, cmd, senderId);
                    await Antilink(msg, this.sock);
                }

                if (!cmd.startsWith('.')) {
                    await handleAutotypingForMessage(this.sock, from, cmd);
                    if (isGroup) {
                        await handleTagDetection(this.sock, from, msg, senderId);
                        await handleMentionDetection(this.sock, from, msg);
                        if (isPublic || isOwnerOrSudoCheck) await handleChatbotResponse(this.sock, from, msg, cmd, senderId);
                    }
                    return;
                }

                const handledEconomyCommand = await handleEconomyCommand(this.sock, from, msg, rawText, cmd);
                if (handledEconomyCommand) return;

                // Admin and Owner Checks
                const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
                const isAdminCommand = adminCommands.some(c => cmd.startsWith(c));
                const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker', '.setprefix', '.prefix', '.setmenu', '.sessions'];
                const isOwnerCommand = ownerCommands.some(c => cmd.startsWith(c));

                let isSenderAdmin = false;
                let isBotAdmin = false;

                if (isGroup && isAdminCommand) {
                    const adminStatus = await isAdmin(this.sock, from, senderId);
                    isSenderAdmin = adminStatus.isSenderAdmin;
                    isBotAdmin = adminStatus.isBotAdmin;
                    if (!isBotAdmin) return await sendStyled(this.sock, from, msg, { title: 'ADMIN', lines: ['Make bot admin.'] });
                }

                if (isOwnerCommand && !isOwnerOrSudoCheck) {
                    return await sendStyled(this.sock, from, msg, { title: 'OWNER', lines: ['Owner/Sudo only.'] });
                }

                let commandExecuted = false;

                switch (true) {
                    case cmd === '.simage': {
                        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                        if (quotedMessage?.stickerMessage) await simageCommand(this.sock, quotedMessage, from, msg);
                        else await sendStyled(this.sock, from, msg, { title: 'SIMAGE', lines: [`Reply to a sticker.`] });
                        commandExecuted = true;
                        break;
                    }
                    case cmd.startsWith('.kick'):
                        await kickCommand(this.sock, from, senderId, msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [], msg); break;
                    case cmd.startsWith('.mute'):
                        await muteCommand(this.sock, from, senderId, msg, parseInt(args[0], 10)); break;
                    case cmd === '.unmute': await unmuteCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.ban'): await banCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.unban'): await unbanCommand(this.sock, from, msg); break;
                    case cmd === '.sticker' || cmd === '.s': await stickerCommand(this.sock, from, msg); commandExecuted = true; break;
                    case cmd.startsWith('.warn'): await warnCommand(this.sock, from, senderId, msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [], msg); break;
                    case cmd.startsWith('.tts'): await ttsCommand(this.sock, from, q, msg); break;
                    case cmd.startsWith('.delete'): await deleteCommand(this.sock, from, msg, senderId); break;
                    case cmd === '.settings': await settingsCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.setprefix'): await setPrefixCommand(this.sock, from, msg, rawText); break;
                    case cmd.startsWith('.mode'):
                        let data; try { data = JSON.parse(fs.readFileSync('./data/messageCount.json')); } catch (e) { break; }
                        if (args[0] === 'public' || args[0] === 'private') {
                            data.isPublic = args[0] === 'public'; fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
                            await sendStyled(this.sock, from, msg, { title: 'MODE', lines: [`Bot is now in ${args[0]} mode.`] });
                        } else { await sendStyled(this.sock, from, msg, { title: 'MODE', lines: [`Usage ☇ ${getPrefix()}mode public/private`] }); }
                        break;
                    case cmd.startsWith('.anticall'): await anticallCommand(this.sock, from, msg, q); break;
                    case cmd === '.tagall': await tagAllCommand(this.sock, from, senderId, msg); break;
                    case cmd.startsWith('.hidetag'): await hideTagCommand(this.sock, from, senderId, rawText.slice(8).trim(), msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null, msg); break;
                    case cmd.startsWith('.tag'): await tagCommand(this.sock, from, senderId, rawText.slice(4).trim(), msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null, msg); break;
                    case cmd.startsWith('.antilink'): await handleAntilinkCommand(this.sock, from, cmd, senderId, isSenderAdmin, msg); break;
                    case cmd === '.meme': await memeCommand(this.sock, from, msg); break;
                    case cmd === '.joke': await jokeCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.weather'): await weatherCommand(this.sock, from, msg, q); break;
                    case cmd.startsWith('.ttt'): await tictactoeCommand(this.sock, from, senderId, q); break;
                    case cmd.startsWith('.lyrics'): await lyricsCommand(this.sock, from, q, msg); break;
                    case cmd.startsWith('.promote'): await promoteCommand(this.sock, from, msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [], msg); break;
                    case cmd.startsWith('.demote'): await demoteCommand(this.sock, from, msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [], msg); break;
                    case cmd.startsWith('.instagram'): await instagramCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.facebook'): await facebookCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.tiktok'): await tiktokCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.gpt'): await aiCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.translate') || cmd.startsWith('.trt'): await handleTranslateCommand(this.sock, from, msg, q); break;
                    case cmd.startsWith('.ss'): await handleSsCommand(this.sock, from, msg, q); break;
                    case cmd.startsWith('.imagine') || cmd.startsWith('.img'): await imagineCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.autotyping'): await autotypingCommand(this.sock, from, msg); commandExecuted = true; break;
                    case cmd.startsWith('.autoread'): await autoreadCommand(this.sock, from, msg); commandExecuted = true; break;
                    case cmd.startsWith('.sora'): await soraCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.removebg'): await removebgCommand(this.sock, from, msg); break;
                    case cmd.startsWith('.remini'): await reminiCommand(this.sock, from, msg, args); break;
                    case cmd === '.owner':
                        await this.sock.sendMessage(from, { text: `👑 *BL@CKN1TE-NXS OWNER*\n\n📞 +263714799483\n📞 +263780540231\n\n> 🌟 *Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER* 🌟` }, { quoted: msg });
                        break;
                    case cmd === '.ping': await pingCommand(this.sock, from, msg); break;
                    case cmd === '.alive': await aliveCommand(this.sock, from, msg); break;
                    default:
                        if (isGroup) { if (cmd) await handleChatbotResponse(this.sock, from, msg, cmd, senderId); }
                        commandExecuted = false;
                        break;
                }

                if (commandExecuted !== false) {
                    await showTypingAfterCommand(this.sock, from);
                    await addCommandReaction(this.sock, msg);
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
