/**
 * BL@CKN1TE-NXS - Settings Bridge
 * Copyright (c) 2026 BL@CKN1TE THE INCISIVE TRI-HAT HACKER
 *
 * Contact : +263780540231 | +263714799483
 * Channel : https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f
 *
 * This file exposes `lib/botConfig` values as a live Proxy so that
 * runtime edits to `lib/botConfig.js` / `botConfig.json` are always
 * reflected here without requiring a restart.
 */
const { getConfig } = require('./lib/botConfig');

const live = getConfig();

// Default fallback DB name for BL@CKN1TE-NXS (overridable via botConfig / .env)
const DEFAULT_MONGO_DB_NAME = 'blacknite_nxs';

const settings = {
  packname: live.packname,
  author: live.author,
  botName: live.botName,
  botOwner: live.creator,
  ownerNumber: live.creatorNumber,
  ownerNumbers: live.ownerNumbers,
  devNumbers: live.devNumbers,
  commandPrefix: live.commandPrefix,
  newsletterJid: live.newsletterJid,
  newsletterName: live.newsletterName,
  premiumDbPath: live.premiumDbPath,
  channelUrl: live.newsletterUrl,
  youtubeUrl: live.youtubeUrl,
  giphyApiKey: live.giphyApiKey,
  weatherApiKey: live.weatherApiKey,
  commandMode: live.commandMode,
  maxStoreMessages: live.maxStoreMessages,
  storeWriteInterval: live.storeWriteInterval,
  description: live.description,
  version: live.version,
  updateZipUrl: live.updateZipUrl,
  pairApiBase: live.pairApiBase || process.env.PAIR_API_BASE || '',
  mongoUri: live.mongoUri || process.env.MONGO_URI || '',
  mongoDbName: live.mongoDbName || process.env.MONGO_DB_NAME || DEFAULT_MONGO_DB_NAME,
  mongoEncryptionKey: live.mongoEncryptionKey || process.env.MONGO_ENCRYPTION_KEY || '',
};

const settingsProxy = new Proxy(settings, {
  get(_target, prop) {
    if (prop === '__esModule') return false;
    const current = getConfig();
    const mapped = {
      packname: current.packname,
      author: current.author,
      botName: current.botName,
      botOwner: current.creator,
      ownerNumber: current.creatorNumber,
      ownerNumbers: current.ownerNumbers,
      devNumbers: current.devNumbers,
      commandPrefix: current.commandPrefix,
      newsletterJid: current.newsletterJid,
      newsletterName: current.newsletterName,
      premiumDbPath: current.premiumDbPath,
      channelUrl: current.newsletterUrl,
      youtubeUrl: current.youtubeUrl,
      giphyApiKey: current.giphyApiKey,
      weatherApiKey: current.weatherApiKey,
      commandMode: current.commandMode,
      maxStoreMessages: current.maxStoreMessages,
      storeWriteInterval: current.storeWriteInterval,
      description: current.description,
      version: current.version,
      updateZipUrl: current.updateZipUrl,
      pairApiBase: current.pairApiBase || process.env.PAIR_API_BASE || '',
      mongoUri: current.mongoUri || process.env.MONGO_URI || '',
      mongoDbName: current.mongoDbName || process.env.MONGO_DB_NAME || DEFAULT_MONGO_DB_NAME,
      mongoEncryptionKey: current.mongoEncryptionKey || process.env.MONGO_ENCRYPTION_KEY || '',
    };
    if (prop in mapped) return mapped[prop];
    return current[prop];
  },
});

module.exports = settingsProxy;