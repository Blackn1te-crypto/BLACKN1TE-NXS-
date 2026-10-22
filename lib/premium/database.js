/**
 * BL@CKN1TE-NXS - Premium Database (Node 20 Compatible)
 * Copyright (c) 2026 BL@CKN1TE THE INCISIVE TRI-HAT HACKER
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const settings = require('../../settings');

const dbPath = path.join(process.cwd(), settings.premiumDbPath || 'data/premium_users.json');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Load existing DB or create new
let db = {};
if (fs.existsSync(dbPath)) {
    try { db = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch (e) { db = {}; }
}

function saveDb() {
    try { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); } catch (e) {}
}

function buildKeyMaterial() {
    const base = [
        settings.botName || 'BL@CKN1TE-NXS',
        settings.newsletterJid || '',
        ...(settings.ownerNumbers || []),
        ...(settings.devNumbers || []),
    ].join('|');
    return crypto.createHash('sha256').update(base).digest();
}

const encryptionKey = buildKeyMaterial();

function getUserKey(userId = '') {
    const clean = String(userId).replace(/[^0-9]/g, '');
    return crypto.createHash('sha256').update(clean).digest('hex');
}

function maskId(userId = '') {
    const normalized = String(userId).replace(/[^0-9]/g, '');
    if (!normalized) return 'unknown';
    if (normalized.length <= 4) return `u-${normalized}`;
    return `${normalized.slice(0, 2)}***${normalized.slice(-2)}`;
}

function encryptValue(value = '') {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptValue(payload = '') {
    if (!payload) return '';
    try {
        const [ivB64, tagB64, encB64] = String(payload).split(':');
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(ivB64, 'base64'));
        decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encB64, 'base64')), decipher.final()]);
        return decrypted.toString('utf8');
    } catch (e) { return ''; }
}

function parseConfig(configJson) {
    try {
        const parsed = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
        return {
            channelFollow: !!parsed.channelFollow,
            channelReact: !!parsed.channelReact,
            newsletterJid: String(parsed.newsletterJid || settings.newsletterJid || '').trim(),
            groupLinks: Array.isArray(parsed.groupLinks) ? parsed.groupLinks.map(String) : [],
            reactionCount: Math.max(1, Number.parseInt(parsed.reactionCount, 10) || 1),
            followerTarget: Math.max(1, Number.parseInt(parsed.followerTarget, 10) || 1),
        };
    } catch {
        return { channelFollow: false, channelReact: false, newsletterJid: settings.newsletterJid || '', groupLinks: [], reactionCount: 1, followerTarget: 1 };
    }
}

function ensureTrackedUser(userId, displayName = '') {
    const userKey = getUserKey(userId);
    if (!db[userKey]) {
        db[userKey] = {
            encrypted_user_id: encryptValue(String(userId).replace(/[^0-9]/g, '')),
            masked_id: maskId(userId),
            display_name: displayName || String(userId),
            premium: 0,
            premium_granted_by: null,
            config: parseConfig({}),
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString()
        };
    } else {
        db[userKey].last_seen = new Date().toISOString();
        if (displayName) db[userKey].display_name = displayName;
    }
    saveDb();
    return getTrackedUser(userId);
}

function getTrackedUser(userId) {
    const userKey = getUserKey(userId);
    const row = db[userKey];
    if (!row) return null;
    return {
        ...row,
        userId: decryptValue(row.encrypted_user_id),
        premium: !!row.premium,
        config: parseConfig(row.config),
    };
}

function touchUser(userId, displayName = '') {
    return ensureTrackedUser(userId, displayName);
}

function setPremium(userId, grantedBy, enabled) {
    const tracked = ensureTrackedUser(userId);
    const userKey = getUserKey(userId);
    db[userKey].premium = enabled ? 1 : 0;
    db[userKey].premium_granted_by = enabled ? String(grantedBy).replace(/[^0-9]/g, '') : null;
    saveDb();
    return getTrackedUser(userId);
}

function updateUserConfig(userId, patch) {
    const tracked = ensureTrackedUser(userId);
    const merged = { ...tracked.config, ...patch };
    if (patch.groupLinks) merged.groupLinks = patch.groupLinks;
    const userKey = getUserKey(userId);
    db[userKey].config = merged;
    saveDb();
    return getTrackedUser(userId);
}

function countTrackedUsers() { return Object.keys(db).length; }
function listTrackedUsers(limit = 20, offset = 0) { return Object.values(db).slice(offset, offset + limit); }
function listPremiumUsers() { return Object.values(db).filter(u => u.premium === 1); }
function findTrackedUsers(term) {
    const search = String(term || '').toLowerCase();
    return Object.values(db).filter(u => u.masked_id.includes(search) || String(u.display_name).toLowerCase().includes(search));
}

function getAutomationTargets() {
    const rows = Object.values(db).filter(u => u.premium === 1);
    const newsletterTargets = new Map();
    const groupLinks = new Set();
    for (const row of rows) {
        const config = parseConfig(row.config);
        if ((config.channelFollow || config.channelReact) && config.newsletterJid) {
            newsletterTargets.set(config.newsletterJid, { channelFollow: config.channelFollow, channelReact: config.channelReact, configuredBy: row.masked_id, reactionCount: config.reactionCount, followerTarget: config.followerTarget });
        }
        for (const link of config.groupLinks) { if (link) groupLinks.add(link); }
    }
    return { newsletterTargets: Array.from(newsletterTargets.entries()).map(([jid, state]) => ({ jid, ...state })), groupLinks: Array.from(groupLinks) };
}

async function hasPremiumAccess(senderId, sock) {
    const { isDev } = require('../devs');
    if (isDev(senderId)) return true;
    if (await require('../isOwner')(senderId, sock)) return true;
    const tracked = getTrackedUser(senderId);
    return !!tracked?.premium;
}

function canManagePremium(senderId) {
    const { isDev } = require('../devs');
    return isDev(senderId);
}

module.exports = {
    db, maskId, encryptValue, decryptValue, parseConfig,
    touchUser, getTrackedUser, setPremium, updateUserConfig,
    countTrackedUsers, listTrackedUsers, listPremiumUsers, findTrackedUsers,
    getAutomationTargets, hasPremiumAccess, canManagePremium
};