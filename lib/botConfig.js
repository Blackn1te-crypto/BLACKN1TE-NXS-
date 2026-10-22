const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'bot.json');

const DEFAULTS = {
    botName: "Mr Alvin's🥷🇺🇸. Mini Bot",
    packname: "Mr Alvin's Mini Bot",
    author: 'ARNOLDT20',
    creator: 'Mr Alvin',
    developerName: 'ARNOLDT20',
    creatorNumber: '263780999801',
    ownerNumbers: ['263780999801'],
    devNumbers: ['263780999801'],
    commandPrefix: '.',
    commandMode: 'public',
    description: 'This is a bot for managing group commands and automating tasks.',
    version: '3.2.0',
    themeEmoji: '•',
    newsletterJid: '',
    newsletterName: 'Mr Alvin Official Channel',
    newsletterUrl: 'https://whatsapp.com/channel/0029VbDbiz85vKACq8aLaF0N',
    newsletterInviteCode: '0029VbDbiz85vKACq8aLaF0N',
    youtubeUrl: '',
    supportGroup: 'https://chat.whatsapp.com/ECAaCTE1F17KnBl8jkGTJl',
    menuStyle: 'normal',
    menuStyles: ['button', 'normal', 'newmenu', 'box', 'classic', 'compact'],
    menuImage: '',
    botImageUrl: '',
    giphyApiKey: '',
    weatherApiKey: '',
    updateZipUrl: '',
    githubRepo: '',
    pairAccess: 'public',
    maxSessions: 8,
    pairedSessionAutoActions: false,
    maxRamMb: 1024,
    maxStoreMessages: 20,
    storeWriteInterval: 10000,
    alwaysOnline: true,
    autoFollowChannels: [],
    autoReactChannels: [],
    groupInviteLinks: [],
    premiumDbPath: 'data/premium_users.db',
    mongoUri: '',
    mongoDbName: 'arnoldt20_mini_bot',
    mongoEncryptionKey: '',
    pairApiBase: ''
};

let cache = null;
let lastMtime = 0;

function fillEmptyFromEnv(cfg) {
    const next = { ...cfg };
    if (!next.creatorNumber && process.env.OWNER_NUMBER) next.creatorNumber = process.env.OWNER_NUMBER;
    if (!next.creator && process.env.OWNER_NAME) next.creator = process.env.OWNER_NAME;
    if (!next.botName && process.env.BOT_NAME) next.botName = process.env.BOT_NAME;
    if (!next.packname && process.env.PACKNAME) next.packname = process.env.PACKNAME;
    if (!next.author && process.env.AUTHOR) next.author = process.env.AUTHOR;
    if (!next.commandPrefix && process.env.PREFIX) next.commandPrefix = process.env.PREFIX;
    if (!next.commandMode && process.env.COMMAND_MODE) next.commandMode = process.env.COMMAND_MODE;
    if (!next.giphyApiKey && process.env.GIPHY_API_KEY) next.giphyApiKey = process.env.GIPHY_API_KEY;
    if (!next.weatherApiKey && process.env.OPENWEATHER_API_KEY) next.weatherApiKey = process.env.OPENWEATHER_API_KEY;
    if (!next.mongoUri && process.env.MONGO_URI) next.mongoUri = process.env.MONGO_URI;
    if (!next.mongoDbName && process.env.MONGO_DB_NAME) next.mongoDbName = process.env.MONGO_DB_NAME;
    if (!next.mongoEncryptionKey && process.env.MONGO_ENCRYPTION_KEY) next.mongoEncryptionKey = process.env.MONGO_ENCRYPTION_KEY;
    if (!next.pairApiBase && process.env.PAIR_API_BASE) next.pairApiBase = process.env.PAIR_API_BASE;
    return next;
}

function normalize(cfg) {
    const merged = { ...DEFAULTS, ...(cfg || {}) };
    if (!Array.isArray(merged.ownerNumbers) || !merged.ownerNumbers.length) {
        merged.ownerNumbers = [merged.creatorNumber].filter(Boolean);
    }
    if (!Array.isArray(merged.devNumbers)) merged.devNumbers = [];
    if (!Array.isArray(merged.autoFollowChannels)) merged.autoFollowChannels = [];
    if (!Array.isArray(merged.groupInviteLinks)) merged.groupInviteLinks = [];
    if (!Array.isArray(merged.menuStyles) || !merged.menuStyles.length) {
        merged.menuStyles = ['button', 'normal', 'newmenu', 'box', 'classic', 'compact'];
    }
    const aliases = { buttons: 'button', text: 'normal', default: 'button', kayzen: 'newmenu' };
    const style = aliases[String(merged.menuStyle || 'button').toLowerCase()] || String(merged.menuStyle || 'button').toLowerCase();
    merged.menuStyle = merged.menuStyles.includes(style) ? style : 'button';
    merged.commandPrefix = String(merged.commandPrefix || '.').trim() || '.';
    merged.botOwner = merged.creator;
    merged.ownerNumber = merged.creatorNumber;
    merged.channelUrl = merged.newsletterUrl;
    return fillEmptyFromEnv(merged);
}

function readDisk() {
    if (!fs.existsSync(CONFIG_PATH)) {
        const created = normalize(DEFAULTS);
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(created, null, 2));
        return created;
    }
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return normalize(parsed);
}

function getConfig() {
    try {
        const stats = fs.statSync(CONFIG_PATH);
        if (!cache || stats.mtimeMs !== lastMtime) {
            cache = readDisk();
            lastMtime = stats.mtimeMs;
        }
    } catch {
        cache = normalize(DEFAULTS);
    }
    return cache;
}

function saveConfig(next) {
    const merged = normalize({ ...getConfig(), ...next });
    const toWrite = { ...merged };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(toWrite, null, 2));
    cache = merged;
    try {
        lastMtime = fs.statSync(CONFIG_PATH).mtimeMs;
    } catch {
        lastMtime = Date.now();
    }
    return cache;
}

function updateConfig(partial) {
    return saveConfig(partial);
}

function getPrefix() {
    return String(getConfig().commandPrefix || '.').trim() || '.';
}

function getMenuStyle() {
    return String(getConfig().menuStyle || 'box').toLowerCase();
}

module.exports = {
    CONFIG_PATH,
    DEFAULTS,
    getConfig,
    saveConfig,
    updateConfig,
    getPrefix,
    getMenuStyle
};
