# BL@CKN1TE-NXS — Katabump package

This Node.js ZIP is arranged for Katabump's file uploader: `package.json` and `index.js` are at the archive root. It includes the bot source, plugins, and landscape menu image. It intentionally does **not** include a WhatsApp login session, `.env` secrets, installed `node_modules`, or local user databases, so you must pair the WhatsApp account again after uploading.

## Deploy and pair

1. In Katabump, create a **Node.js** server. In **Startup**, choose Node.js **22** (22.5 or newer is required for the `node:sqlite` module) and set the JavaScript entry file to `index.js`.
2. In **Files**, upload this ZIP and choose **Unarchive**. Confirm that `package.json`, `index.js`, `settings.js`, `lib/`, `commands/`, and `assets/` are directly in the server root, not one folder below it. Katabump installs dependencies from `package.json` on first start.
3. Before starting, create a `.env` file beside `package.json` (use `.env.example` as a template) and set `WHATSAPP_NUMBER` to the account you control, in international digits only, including the country calling code but with no `+`, spaces, or punctuation. Example format: `263780540231`. This is the WhatsApp account to link; it is separate from the owner numbers in `lib/botConfig.js` / `data/owner.json`. Keep `.env` private.
4. Start the server and watch the Katabump **Console**. The one-time pairing code is printed there. In WhatsApp on that same number, open **Settings → Linked devices → Link a device → Link with phone number instead**, then enter the code. Approve linking only if you initiated it.
5. After it connects, keep the generated `session/` directory on the server. Do not share it or include it in public backups. When updating the bot, stop the server first and avoid deleting `session/` if you want to keep the link.

The code is shown in the Katabump console; this ZIP does **not** include a separate public web pairing page. Stop any other copy of this bot using the same WhatsApp account before pairing here, to avoid duplicate message handling.

## Configuration

Settings are split across three locations for security and flexibility:
*   **`.env`** — Server port, AI API keys (Groq/OpenAI), Giphy keys, and the primary WhatsApp number to pair.
*   **`lib/botConfig.js`** — Core bot identity: Bot Name, Owner Numbers, Channel URL, Prefix, and UI preferences.
*   **`data/owner.json`** — A fast-access array of owner numbers used for permission checks (auto-generated from `lib/botConfig.js` on first run).

You can edit `lib/botConfig.js` to change the bot's display name, owner details, and channel links. To update your owner numbers, edit the `ownerNumbers` array in `lib/botConfig.js` or manually update `data/owner.json`.

## Free-plan notes

Katabump's FAQ lists its free server at 308 MB RAM, 716 MB storage, and 25% CPU, and says free servers need renewal every 4 days. This bot has many media plugins, so unusually heavy use may exceed free-tier memory. If it restarts with an out-of-memory error, reduce heavy media use or check Katabump's higher-resource plans. Renew the server before its deadline to avoid suspension or data loss.

## Checks and troubleshooting

Run `npm test` to check JavaScript syntax, local imports, configuration JSON, and plugin routing. 

Optional external features (like `.weather`, `.imagine`, and `.gpt`) require API keys; enter those privately in `.env` rather than committing them. The code uses the unofficial Baileys WhatsApp Web client; use it only with accounts you control and avoid unsolicited messages or spam.

---
**BL@CKN1TE-NXS**  
Copyright (c) 2026 BL@CKN1TE THE INCISIVE TRI-HAT HACKER  
Contact: +263780540231 | +263714799483  
Channel: https://whatsapp.com/channel/0029VbDubJNHbFV50Y6oiO3f  
Upstream copyright and license notices in the source are retained.