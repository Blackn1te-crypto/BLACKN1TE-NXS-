# BL@CKN1TE-NXS — V16 Cyberpunk Edition

Welcome to the ultimate WhatsApp automation tool. Built for speed, stability, and infinite uptime. 

**Powered by Incisive AI** | **24/7/365 Connection**

---

## 🚀 Features

*   **♾️ Infinite Connection:** Auto-reconnect and watchdog loops keep the bot online 24/7. Never drop a session again.
*   **🖥️ Web Dashboard:** A fully integrated Express + Socket.io panel to pair your bot, view live logs, and manage settings.
*   **⚡ 150+ Commands:** Massive command library loaded dynamically from the `commands/` folder.
*   **🧠 AI Integration:** Built-in support for OpenAI/Groq for chat and image generation.
*   **🎨 Cyberpunk Menu:** Beautifully crafted ASCII menus with random emojis and channel forwarding metadata.
*   **⚙️ Multi-Prefix:** Works seamlessly with `.`, `/`, and `>`.
*   **🛡️ Anti-Delete, Anti-Link, Anti-Call:** Built-in group protection systems.
*   **📥 Media Downloaders:** High-speed audio and video downloading via `yt-search`.

---

## 📂 Project Structure

This bot uses a **flat folder structure** for maximum simplicity and performance.

```text
/
├── assets/             # Your bot_image.jpg for the menu
├── commands/           # ALL 150+ command files go here directly (.js)
├── data/               # Auto-generated JSON settings and databases
├── lib/                # All helper files (database.js, economy.js, etc.)
├── .env                # Secrets (NEVER push to GitHub)
├── .gitignore
├── bot.json            # Bot identity configuration
├── config.js
├── index.js            # Entry point (boots server.js)
├── package.json
└── server.js           # Core engine, dashboard, and Baileys connection
