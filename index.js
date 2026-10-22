/**
 * BL@CKN1TE-NXS - A WhatsApp Bot
 * Copyright (c) 2026 BL@CKN1TE THE INCISIVE TRI-HAT HACKER 
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 */

require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { getConfig, updateConfig } = require('./lib/botConfig')
const sessionManager = require('./lib/sessionManager')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateWAMessageContent,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { rmSync, existsSync } = require('fs')
const { join } = require('path')
const { initializeMongoStore, storeAutoTargets } = require('./lib/mongoStore')
const http = require('http')

// --- GLOBAL WEB DASHBOARD STATE ---
let activeSocket = null;
let isPaired = false;
let codeRequested = false;

// ==========================================
// 1. CYBERPUNK DASHBOARD TEMPLATE
// ==========================================
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BL@CKN1TE-NXS | Cyber Dashboard</title>
    <style>
        :root { --neon: #00ffcc; --magenta: #ff00ff; --bg: #050505; --panel: #0d0d0d; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; }
        body { background-color: var(--bg); color: #fff; overflow-x: hidden; height: 100vh; display: flex; }
        
        body::before {
            content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            background: radial-gradient(circle at 15% 50%, rgba(0, 255, 204, 0.08), transparent 40%),
                        radial-gradient(circle at 85% 30%, rgba(255, 0, 255, 0.08), transparent 40%);
        }
        .grid-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; 
            background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 30px 30px; opacity: 0.5; }

        .sidebar { position: fixed; top: 0; left: -300px; width: 280px; height: 100%; background: var(--panel); border-right: 1px solid var(--neon); transition: 0.3s; z-index: 100; padding: 20px; box-shadow: 5px 0 20px rgba(0,255,204,0.1); }
        .sidebar.open { left: 0; }
        .sidebar h2 { color: var(--neon); text-align: center; margin-bottom: 30px; font-size: 20px; letter-spacing: 2px; }
        .nav-btn { display: block; width: 100%; padding: 15px; margin-bottom: 10px; background: transparent; border: 1px solid transparent; color: #888; text-align: left; cursor: pointer; transition: 0.2s; font-size: 16px; border-left: 3px solid transparent; }
        .nav-btn:hover, .nav-btn.active { color: var(--neon); border-left-color: var(--neon); background: rgba(0,255,204,0.05); }
        .nav-btn svg { margin-right: 10px; vertical-align: middle; width: 18px; fill: currentColor; }

        .main-content { flex: 1; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: 0.3s; width: 100%; }
        .top-bar { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, var(--bg), transparent); z-index: 50; }
        .menu-toggle { background: none; border: none; color: var(--neon); cursor: pointer; font-size: 24px; padding: 10px; }
        
        .status-monitor { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #888; background: #111; padding: 8px 15px; border-radius: 20px; border: 1px solid #222; }
        .dot { width: 10px; height: 10px; border-radius: 50%; background: #555; transition: 0.3s; }
        .dot.online { background: var(--neon); box-shadow: 0 0 10px var(--neon); animation: pulse 1.5s infinite; }
        .dot.offline { background: #ff3333; box-shadow: 0 0 10px #ff3333; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 204, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 255, 204, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 204, 0); } }

        .tab-content { display: none; width: 100%; max-width: 500px; animation: fadeIn 0.4s ease-in-out; }
        .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .cyber-card { background: rgba(13, 13, 13, 0.8); backdrop-filter: blur(10px); border: 1px solid rgba(0,255,204,0.3); border-radius: 15px; padding: 40px 30px; text-align: center; box-shadow: 0 0 30px rgba(0,255,204,0.1); position: relative; }
        
        .image-wrapper { position: relative; width: 160px; height: 160px; margin: 0 auto 30px; }
        .profile-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; position: relative; z-index: 2; border: 2px solid var(--neon); box-shadow: 0 0 20px var(--neon); }
        .ring-1, .ring-2 { position: absolute; top: -10px; left: -10px; right: -10px; bottom: -10px; border-radius: 50%; border: 2px solid transparent; z-index: 1; }
        .ring-1 { border-top-color: var(--neon); border-right-color: var(--neon); animation: spin 2s linear infinite; }
        .ring-2 { top: -20px; left: -20px; right: -20px; bottom: -20px; border-bottom-color: var(--magenta); border-left-color: var(--magenta); animation: spin-reverse 3s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }

        h1 { color: #fff; font-size: 24px; letter-spacing: 2px; margin-bottom: 10px; text-shadow: 0 0 10px var(--neon); }
        p { color: #888; font-size: 14px; margin-bottom: 25px; }
        input { width: 100%; padding: 15px; margin-bottom: 15px; background: #000; border: 1px solid #333; color: var(--neon); border-radius: 8px; font-size: 16px; text-align: center; transition: 0.3s; outline: none; }
        input:focus { border-color: var(--neon); box-shadow: 0 0 10px rgba(0,255,204,0.3); }
        button { width: 100%; padding: 15px; background: transparent; color: var(--neon); border: 1px solid var(--neon); border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; text-transform: uppercase; letter-spacing: 1px; }
        button:hover { background: var(--neon); color: #000; box-shadow: 0 0 20px var(--neon); }
        button:disabled { border-color: #333; color: #555; cursor: not-allowed; }

        #result-container { display: none; margin-top: 25px; padding: 20px; border: 1px solid var(--neon); border-radius: 10px; background: rgba(0,255,204,0.05); position: relative; overflow: hidden; }
        #scanner-text { font-size: 28px; font-weight: bold; color: var(--neon); letter-spacing: 4px; text-shadow: 0 0 10px var(--neon); min-height: 40px; }
        .scan-line { position: absolute; top: 0; left: -100%; width: 100%; height: 2px; background: var(--neon); box-shadow: 0 0 10px var(--neon); animation: scan 1s linear infinite; }
        @keyframes scan { 0% { top: 0; left: 0; } 100% { top: 100%; left: 0; } }
        
        .action-row { display: none; gap: 10px; margin-top: 15px; }
        .action-row button { flex: 1; padding: 10px; font-size: 14px; }
        .btn-copy { border-color: var(--magenta); color: var(--magenta); }
        .btn-copy:hover { background: var(--magenta); color: #000; box-shadow: 0 0 20px var(--magenta); }
        .btn-close { border-color: #ff3333; color: #ff3333; }
        .btn-close:hover { background: #ff3333; color: #000; box-shadow: 0 0 20px #ff3333; }

        #connected-ui { display: none; margin-top: 20px; padding: 20px; border: 1px solid var(--neon); border-radius: 10px; background: rgba(0,255,204,0.1); }
        .success-icon { font-size: 40px; color: var(--neon); text-shadow: 0 0 15px var(--neon); margin-bottom: 10px; }
        .success-text { color: var(--neon); font-size: 18px; font-weight: bold; letter-spacing: 2px; }
        .success-sub { color: #888; font-size: 13px; margin-top: 5px; }
        .btn-reset { border-color: #ff3333; color: #ff3333; margin-top: 20px; }
        .btn-reset:hover { background: #ff3333; color: #000; }

        .setting-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #222; }
        .setting-item span { color: #ccc; font-size: 14px; }
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--neon); }
        input:checked + .slider:before { transform: translateX(20px); }

        .footer { position: fixed; bottom: 15px; width: 100%; text-align: center; font-size: 12px; color: #555; letter-spacing: 1px; }
        .footer span { color: var(--neon); font-weight: bold; }
        .whatsapp-link { display: inline-flex; align-items: center; gap: 5px; color: var(--neon); text-decoration: none; margin-top: 10px; font-size: 14px; }
        .whatsapp-link:hover { text-shadow: 0 0 10px var(--neon); }
    </style>
</head>
<body>
    <div class="grid-overlay"></div>

    <div class="sidebar" id="sidebar">
        <h2>SYSTEM MENU</h2>
        <button class="nav-btn active" onclick="switchTab('dashboard', this)">
            <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> Dashboard
        </button>
        <button class="nav-btn" onclick="switchTab('settings', this)">
            <svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg> Settings
        </button>
        <button class="nav-btn" onclick="switchTab('about', this)">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> About / Owner
        </button>
    </div>

    <div class="top-bar">
        <button class="menu-toggle" onclick="toggleNav()">☰</button>
        <div class="status-monitor">
            <span>Node Status:</span>
            <div class="dot offline" id="live-dot"></div>
            <span id="status-text" style="color: #fff; font-weight: bold;">OFFLINE</span>
        </div>
    </div>

    <div class="main-content">
        <div id="dashboard" class="tab-content active">
            <div class="cyber-card">
                <div class="image-wrapper">
                    <div class="ring-1"></div>
                    <div class="ring-2"></div>
                    <img src="/assets/bot_image.jpg" class="profile-img" alt="BL@CKN1TE-NXS" onerror="this.src='https://i.ibb.co/6PZq6Q1/placeholder.png'">
                </div>
                <h1>BL@CKN1TE-NXS</h1>
                <p id="subtitle">Enter your WhatsApp number to generate a secure link.</p>
                
                <div id="pairing-ui">
                    <input type="text" id="phone" placeholder="e.g. 263780540231">
                    <button onclick="pairBot()" id="pairBtn">Initialize Pairing</button>
                    
                    <div id="result-container">
                        <div class="scan-line" id="scan-line"></div>
                        <div id="scanner-text">----</div>
                        <div class="action-row" id="action-row">
                            <button class="btn-copy" onclick="copyCode()">Copy Code</button>
                            <button class="btn-close" onclick="closeResult()">Close</button>
                        </div>
                    </div>
                    <div id="status" style="margin-top: 15px; color: #ffaa00; font-size: 14px;"></div>
                </div>

                <div id="connected-ui">
                    <div class="success-icon">✔</div>
                    <div class="success-text">SYSTEM SECURED</div>
                    <div class="success-sub">Bot is connected and actively monitoring.</div>
                    <button class="btn-reset" onclick="resetSession()">Disconnect / Reset</button>
                </div>
            </div>
        </div>

        <div id="settings" class="tab-content">
            <div class="cyber-card" style="text-align: left;">
                <h1 style="font-size: 20px; margin-bottom: 20px;">SYSTEM CONFIG</h1>
                <div class="setting-item"><span>Auto-Read Messages</span><label class="switch"><input type="checkbox" id="autoRead" checked><span class="slider"></span></label></div>
                <div class="setting-item"><span>Auto-React to Status</span><label class="switch"><input type="checkbox" id="autoStatus" checked><span class="slider"></span></label></div>
                <div class="setting-item"><span>Anti-Delete Protection</span><label class="switch"><input type="checkbox" id="antiDelete" checked><span class="slider"></span></label></div>
                <div class="setting-item"><span>Public Mode</span><label class="switch"><input type="checkbox" id="botMode" checked><span class="slider"></span></label></div>
                <button style="margin-top: 20px;" onclick="alert('Config applied to live bot!')">Save Config</button>
            </div>
        </div>

        <div id="about" class="tab-content">
            <div class="cyber-card">
                <h1 style="font-size: 20px;">DEVELOPER INFO</h1>
                <p style="margin-top: 15px; line-height: 1.6;">
                    <strong>Architect:</strong> BL@CKN1TE THE INCISIVE TRI-HAT<br>
                    <strong>Framework:</strong> Baileys Core<br>
                    <strong>Version:</strong> 3.2.0
                </p>
                <a href="https://wa.me/263780540231" target="_blank" class="whatsapp-link">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                    +263 780 540 231
                </a>
            </div>
        </div>
    </div>

    <div class="footer">Powered by <span>BL@CKN1TE THE INCISIVE TRI-HAT</span></div>

    <script>
        function toggleNav() { document.getElementById('sidebar').classList.toggle('open'); }
        function switchTab(tabId, btn) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            btn.classList.add('active');
            if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
        }

        async function checkStatus() {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                const dot = document.getElementById('live-dot');
                const text = document.getElementById('status-text');
                const pairingUI = document.getElementById('pairing-ui');
                const connectedUI = document.getElementById('connected-ui');
                const subtitle = document.getElementById('subtitle');
                
                if (data.connected) {
                    dot.className = 'dot online'; text.innerText = 'ONLINE'; text.style.color = 'var(--neon)';
                    pairingUI.style.display = 'none'; connectedUI.style.display = 'block';
                    subtitle.innerText = "System is fully operational.";
                } else {
                    dot.className = 'dot offline'; text.innerText = 'OFFLINE'; text.style.color = '#ff3333';
                    pairingUI.style.display = 'block'; connectedUI.style.display = 'none';
                    subtitle.innerText = "Enter your WhatsApp number to generate a secure link.";
                }
            } catch (e) {}
        }
        setInterval(checkStatus, 3000); checkStatus();

        async function resetSession() {
            if (!confirm("Are you sure? This will log the bot out of WhatsApp.")) return;
            try {
                const res = await fetch('/api/reset', { method: 'POST' });
                const data = await res.json();
                if (data.success) { alert("Session wiped. Server restarting..."); window.location.reload(); }
            } catch (e) { alert("Failed to reset."); }
        }

        let scanInterval; let finalCode = "";
        function generateRandomString() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let result = '';
            for (let i = 0; i < 8; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); if (i === 3) result += '-'; }
            return result;
        }
        function startScanner() {
            const scannerText = document.getElementById('scanner-text');
            const container = document.getElementById('result-container');
            const actionRow = document.getElementById('action-row');
            const scanLine = document.getElementById('scan-line');
            container.style.display = 'block'; actionRow.style.display = 'none';
            scanLine.style.display = 'block'; scannerText.style.color = 'var(--neon)';
            scanInterval = setInterval(() => { scannerText.innerText = generateRandomString(); }, 50);
        }
        function stopScanner(success, code = '', error = '') {
            clearInterval(scanInterval);
            const scannerText = document.getElementById('scanner-text');
            const actionRow = document.getElementById('action-row');
            const scanLine = document.getElementById('scan-line');
            const statusDiv = document.getElementById('status');
            const btn = document.getElementById('pairBtn');
            scanLine.style.display = 'none';
            if (success) {
                finalCode = code; scannerText.innerText = code;
                scannerText.style.color = '#fff'; scannerText.style.textShadow = '0 0 20px var(--neon)';
                actionRow.style.display = 'flex'; statusDiv.innerHTML = "✅ Code Decrypted! Enter in WhatsApp.";
                statusDiv.style.color = "var(--neon)";
            } else {
                scannerText.innerText = "ERROR"; scannerText.style.color = '#ff3333';
                scannerText.style.textShadow = '0 0 20px #ff3333'; statusDiv.innerHTML = "❌ " + error;
                statusDiv.style.color = "#ff3333"; btn.disabled = false; btn.innerText = "Initialize Pairing";
            }
        }
        function copyCode() {
            if (!finalCode) return;
            navigator.clipboard.writeText(finalCode).then(() => {
                const btn = document.querySelector('.btn-copy'); const original = btn.innerText;
                btn.innerText = 'Copied!'; btn.style.background = 'var(--magenta)'; btn.style.color = '#000';
                setTimeout(() => { btn.innerText = original; btn.style.background = 'transparent'; btn.style.color = 'var(--magenta)'; }, 2000);
            });
        }
        function closeResult() {
            document.getElementById('result-container').style.display = 'none';
            document.getElementById('status').innerHTML = '';
            const btn = document.getElementById('pairBtn'); btn.disabled = false; btn.innerText = "Initialize Pairing";
        }
        async function pairBot() {
            const phone = document.getElementById('phone').value;
            const statusDiv = document.getElementById('status');
            const btn = document.getElementById('pairBtn');
            if(!phone) return alert("Please enter a phone number");
            btn.disabled = true; btn.innerText = "Decrypting...";
            statusDiv.innerHTML = "⚡ Connecting to WhatsApp servers..."; statusDiv.style.color = "#ffaa00";
            startScanner();
            try {
                const response = await fetch('/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
                const data = await response.json();
                setTimeout(() => {
                    if(data.code) { stopScanner(true, data.code); setTimeout(checkStatus, 1000); }
                    else { stopScanner(false, '', data.error || "Failed to get code."); }
                }, 2000);
            } catch (err) { setTimeout(() => { stopScanner(false, '', "Network Error. Check server."); }, 2000); }
        }
    </script>
</body>
</html>
`;

// ==========================================
// 2. BOT CONFIGURATION & HELPERS
// ==========================================
function liveConfig() { return getConfig() }

function NEWSLETTER_CHANNELS() {
    const cfg = liveConfig()
    const followTargets = Array.isArray(cfg.autoFollowChannels) ? cfg.autoFollowChannels : []
    const reactTargets = Array.isArray(cfg.autoReactChannels) ? cfg.autoReactChannels : []
    return [...new Set([...followTargets, ...reactTargets, cfg.newsletterJid].filter(Boolean))]
}

function GROUP_INVITE_LINKS() {
    const cfg = liveConfig()
    return Array.isArray(cfg.groupInviteLinks) ? cfg.groupInviteLinks : []
}

const NEWSLETTER_REACTIONS = ['❤️', '🔥', '👍', '😎', '🙏', '😂']
const followedNewsletters = new Set()
let autoActionsCompleted = false

function getRandomReaction() { return NEWSLETTER_REACTIONS[Math.floor(Math.random() * NEWSLETTER_REACTIONS.length)] }

function extractInviteCode(inviteLink) {
    const cleaned = String(inviteLink || '').trim()
    const match = cleaned.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i)
    if (match?.[1]) return match[1]
    if (/^[A-Za-z0-9]+$/.test(cleaned)) return cleaned
    return null
}

function centerLine(text, width = 78) {
    const clean = String(text)
    if (clean.length >= width) return clean
    const pad = Math.floor((width - clean.length) / 2)
    return `${' '.repeat(pad)}${clean}`
}

function createBox(lines, colorize) {
    const width = Math.max(...lines.map((line) => String(line).length), 20)
    const top = `╔${'═'.repeat(width + 2)}╗`
    const body = lines.map((line) => `║ ${String(line).padEnd(width)} ║`)
    const bottom = `╚${'═'.repeat(width + 2)}╝`
    return [top, ...body, bottom].map((line) => colorize(line))
}

async function animateStartupBanner(sockUser) {
    const hero = [
        ' ██████╗  ██████╗ ██████╗ ███████╗███████╗███████╗ █████╗ ██╗     ',
        '██╔════╝ ██╔═══██╗██╔══██╗██╔════╝╚══███╔╝██╔════╝██╔══██╗██║     ',
        '██║  ███╗██║   ██║██║  ██║███████╗  ███╔╝ █████╗  ███████║██║     ',
        '██║   ██║██║   ██║██║  ██║╚════██║ ███╔╝  ██╔══╝  ██╔══██║██║     ',
        '╚██████╔╝╚██████╔╝██████╔╝███████║███████╗███████╗██║  ██║███████╗',
        ' ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝'
    ]

    const heroPalette = [
        chalk.bgHex('#12061a').hex('#ffcc70').bold,
        chalk.bgHex('#12061a').hex('#ffd166').bold,
        chalk.bgHex('#12061a').hex('#ff8fab').bold,
        chalk.bgHex('#12061a').hex('#f4a261').bold
    ]

    console.clear()
    for (let i = 0; i < hero.length; i++) {
        console.log(heroPalette[i % heroPalette.length](centerLine(hero[i])))
        await delay(45)
    }

    await delay(220)

    const cfg = liveConfig()
    const infoBox = createBox([
        `${cfg.botName} IS ACTIVE`,
        '',
        `Session : ${sockUser?.id || 'unknown'}`,
        `Version : ${cfg.version}`,
        `Owners  : ${(Array.isArray(owner) ? owner.join(', ') : String(owner || cfg.creator))}`,
        `Channel : ${cfg.newsletterName}`,
        'Status  : Connected and ready'
    ], chalk.bgHex('#08121f').hex('#7dd3fc').bold)

    for (const line of infoBox) {
        console.log(centerLine(line))
        await delay(80)
    }

    const pulseFrames = [
        chalk.bgGreen.black.bold("   BL@CKN1TE-NXS IS ACTIVE   "),
        chalk.bgYellow.black.bold("   BL@CKN1TE-NXS IS ACTIVE   "),
        chalk.bgMagenta.white.bold("   BL@CKN1TE-NXS IS ACTIVE   ")
    ]

    for (const frame of pulseFrames) {
        console.log(`\n${centerLine(frame)}`)
        await delay(130)
    }
}

async function resolveConfiguredNewsletter(sock) {
    const cfg = liveConfig()
    if (cfg.newsletterJid) return cfg.newsletterJid
    const inviteCode = cfg.newsletterInviteCode || String(cfg.newsletterUrl || '').match(/channel\/([A-Za-z0-9]+)/i)?.[1]
    if (!inviteCode) return ''
    try {
        const metadata = await sock.newsletterMetadata('invite', inviteCode)
        const jid = metadata?.id
        if (jid && jid.endsWith('@newsletter')) {
            const followTargets = Array.isArray(cfg.autoFollowChannels) ? cfg.autoFollowChannels : []
            const reactTargets = Array.isArray(cfg.autoReactChannels) ? cfg.autoReactChannels : []
            updateConfig({
                newsletterJid: jid,
                autoFollowChannels: [...new Set([...followTargets, jid])],
                autoReactChannels: [...new Set([...reactTargets, jid])],
                newsletterName: cfg.newsletterName || metadata.name || 'WhatsApp Channel'
            })
            console.log(chalk.green(`✓ Resolved configured channel invite to ${jid}`))
            return jid
        }
    } catch (error) {}
    return ''
}

async function runAutoActions(sock) {
    if (autoActionsCompleted) return
    const resolvedChannel = await resolveConfiguredNewsletter(sock)
    const channels = NEWSLETTER_CHANNELS()
    if (resolvedChannel && !channels.includes(resolvedChannel)) channels.push(resolvedChannel)
    const invites = GROUP_INVITE_LINKS()
    storeAutoTargets({ channels, groups: invites, updatedAt: new Date().toISOString() }).catch(() => {})

    for (const channel of channels) {
        try {
            if (followedNewsletters.has(channel)) continue
            await sleep(2500)
            const result = await sock.newsletterMsg(channel, { type: 'FOLLOW' })
            if (!result?.errors) followedNewsletters.add(channel)
        } catch (error) {}
    }

    for (const inviteLink of invites) {
        const inviteCode = extractInviteCode(inviteLink)
        if (!inviteCode) continue
        try {
            await sleep(3000)
            await sock.groupAcceptInvite(inviteCode)
        } catch (error) {}
    }
    autoActionsCompleted = true
}

const store = require('./lib/lightweight_store')
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)
initializeMongoStore().catch(() => {})

setInterval(() => { if (global.gc) global.gc() }, 60_000)
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    const maxRam = Number(liveConfig().maxRamMb || 1024)
    if (used > maxRam) process.exit(1)
}, 30_000)

let phoneNumber = process.env.WHATSAPP_NUMBER || ''
let owner = []
try { owner = JSON.parse(fs.readFileSync('./data/owner.json', 'utf8')) } catch (error) { owner = [] }

global.botname = liveConfig().botName
global.themeemoji = liveConfig().themeEmoji || "•"
const pairingCode = !process.argv.includes('--qr')
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) return new Promise((resolve) => rl.question(text, resolve))
    return Promise.resolve(process.env.WHATSAPP_NUMBER || phoneNumber)
}

// ==========================================
// 3. MAIN BOT ENGINE
// ==========================================
async function startBlackNiteNxs() {
    try {
        let { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(`./session`)
        const msgRetryCounterCache = new NodeCache()

        const BLACKN1TE_NXS = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })) },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 60000,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
        })

        activeSocket = BLACKN1TE_NXS;
        BLACKN1TE_NXS.ev.on('creds.update', saveCreds)
        store.bind(BLACKN1TE_NXS.ev)

        BLACKN1TE_NXS.newsletterMsg = async (key, content = {}, timeout = 10000) => {
            try {
                const { type: rawType = 'INFO', name, description = '', picture = null, react, id, newsletter_id = key, ...media } = content
                const type = rawType.toUpperCase()
                if (react) return BLACKN1TE_NXS.query({ tag: 'message', attrs: { to: newsletter_id, type: 'reaction', server_id: id, id: generateMessageTag() }, content: [{ tag: 'reaction', attrs: { code: react } }] })
                if (media && Object.keys(media).length > 0) {
                    const generated = await generateWAMessageContent(media, { upload: BLACKN1TE_NXS.waUploadToServer })
                    return BLACKN1TE_NXS.query({ tag: 'message', attrs: { to: newsletter_id, type: 'text' in media ? 'text' : 'media' }, content: [{ tag: 'plaintext', attrs: {}, content: proto.Message.encode(generated).finish() }] })
                }
                const response = await BLACKN1TE_NXS.query({ tag: 'iq', attrs: { to: 's.whatsapp.net', type: 'get', xmlns: 'w:mex' }, content: [{ tag: 'query', attrs: { query_id: type === 'FOLLOW' ? '9926858900719341' : type === 'UNFOLLOW' ? '7238632346214362' : type === 'CREATE' ? '6234210096708695' : type === 'DELETE' ? '8316537688363079' : '6563316087068696' }, content: new TextEncoder().encode(JSON.stringify({ variables: { newsletter_id } })) }] }, timeout)
                return JSON.parse(response.content[0].content)?.data?.xwa2_newsletter || JSON.parse(response.content[0].content)?.errors || {}
            } catch (error) { throw error }
        }

        BLACKN1TE_NXS.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
                if (mek.key && mek.key.remoteJid === 'status@broadcast') { await handleStatus(BLACKN1TE_NXS, chatUpdate); return; }
                if (!BLACKN1TE_NXS.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                    if (!isGroup) return
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
                if (BLACKN1TE_NXS?.msgRetryCounterCache) BLACKN1TE_NXS.msgRetryCounterCache.clear()

                try { 
                    await handleMessages(BLACKN1TE_NXS, chatUpdate, true) 
                } catch (err) {
                    if (mek.key && mek.key.remoteJid) {
                        const cfg = liveConfig()
                        await BLACKN1TE_NXS.sendMessage(mek.key.remoteJid, { 
                            text: 'An error occurred while processing your message.', 
                            contextInfo: { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: cfg.newsletterJid, newsletterName: cfg.newsletterName, serverMessageId: -1 } } 
                        }).catch(console.error);
                    }
                }
            } catch (err) {}
        })

        BLACKN1TE_NXS.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) { let decode = jidDecode(jid) || {}; return decode.user && decode.server && decode.user + '@' + decode.server || jid } else return jid
        }

        BLACKN1TE_NXS.ev.on('contacts.update', update => {
            for (let contact of update) {
                let id = BLACKN1TE_NXS.decodeJid(contact.id)
                if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
            }
        })

        BLACKN1TE_NXS.getName = (jid, withoutContact = false) => {
            let id = BLACKN1TE_NXS.decodeJid(jid)
            withoutContact = BLACKN1TE_NXS.withoutContact || withoutContact
            let v
            if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
                v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = BLACKN1TE_NXS.groupMetadata(id) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
            })
            else v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : id === BLACKN1TE_NXS.decodeJid(BLACKN1TE_NXS.user.id) ? BLACKN1TE_NXS.user : (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }

        BLACKN1TE_NXS.public = true
        BLACKN1TE_NXS.serializeM = (m) => smsg(BLACKN1TE_NXS, m, store)

        if (pairingCode && !BLACKN1TE_NXS.authState.creds.registered) {
            if (useMobile) throw new Error('Cannot use pairing code with mobile api')

            if (process.stdin.isTTY) {
                let phoneInput = global.phoneNumber || process.env.WHATSAPP_NUMBER || await question(chalk.bgBlack(chalk.greenBright(`Enter your WhatsApp number with country code (digits only): `)))
                phoneInput = phoneInput.replace(/[^0-9]/g, '')
                setTimeout(async () => {
                    try {
                        let code = await BLACKN1TE_NXS.requestPairingCode(phoneInput)
                        code = code?.match(/.{1,4}/g)?.join("-") || code
                        console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                    } catch (error) {}
                }, 3000)
            }
        }

        BLACKN1TE_NXS.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect } = s
            if (connection === 'connecting') console.log(chalk.yellow('🔄 Connecting to WhatsApp...'))
            
            if (connection == "open") {
                isPaired = true;
                console.log(chalk.yellow(`Connected to => ${JSON.stringify(BLACKN1TE_NXS.user, null, 2)}`))
                try {
                    const botNumber = BLACKN1TE_NXS.user.id.split(':')[0] + '@s.whatsapp.net';
                    const cfg = liveConfig()
                    await BLACKN1TE_NXS.sendMessage(botNumber, { text: `${cfg.botName} connected successfully.\n\nTime: ${new Date().toLocaleString()}`, contextInfo: { forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: cfg.newsletterJid, newsletterName: cfg.newsletterName, serverMessageId: -1 } } });
                } catch (error) {}
                await animateStartupBanner(BLACKN1TE_NXS.user)
                await sleep(1500)
                await runAutoActions(BLACKN1TE_NXS)
            }
            
            if (connection === 'close') {
                isPaired = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode
                const isRegistered = Boolean(BLACKN1TE_NXS.authState?.creds?.registered)
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut && isRegistered
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    try { rmSync('./session', { recursive: true, force: true }); } catch (error) {}
                }
                if (shouldReconnect) { await delay(5000); startBlackNiteNxs() }
            }
        })

        const antiCallNotified = new Set();
        BLACKN1TE_NXS.ev.on('call', async (calls) => {
            try {
                const { readState: readAnticallState } = require('./commands/owner/anticall');
                const state = readAnticallState();
                if (!state.enabled) return;
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId;
                    if (!callerJid) continue;
                    try {
                        if (typeof BLACKN1TE_NXS.rejectCall === 'function' && call.id) await BLACKN1TE_NXS.rejectCall(call.id, callerJid);
                        if (!antiCallNotified.has(callerJid)) {
                            antiCallNotified.add(callerJid);
                            setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                            await BLACKN1TE_NXS.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                        }
                    } catch {}
                    setTimeout(async () => { try { await BLACKN1TE_NXS.updateBlockStatus(callerJid, 'block'); } catch {} }, 800);
                }
            } catch (e) {}
        });

        BLACKN1TE_NXS.ev.on('group-participants.update', async (update) => { await handleGroupParticipantUpdate(BLACKN1TE_NXS, update); });
        BLACKN1TE_NXS.ev.on('status.update', async (status) => { await handleStatus(BLACKN1TE_NXS, status); });
        BLACKN1TE_NXS.ev.on('messages.reaction', async (status) => { await handleStatus(BLACKN1TE_NXS, status); });

        return BLACKN1TE_NXS 
    } catch (error) {
        console.error('Error in startBL@CKN1TE-NXS:', error)
        await delay(5000)
        startBlackNiteNxs()
    }
}

sessionManager.registerHandlers({
    handleMessages, handleGroupParticipantUpdate, handleStatus,
    bindStore: (sock) => { try { store.bind(sock.ev) } catch {} }
})

startBlackNiteNxs().then(async () => {
    try { await sessionManager.restoreSessions(); console.log(chalk.cyan('◇ Extra paired sessions restored')) } catch (error) {}
}).catch(error => { process.exit(1) })

process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err) })
process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err) })

// ==========================================
// 4. NATIVE WEB SERVER & JSON API (DASHBOARD)
// ==========================================
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboardHTML);
    } 
    else if (req.method === 'GET' && req.url === '/assets/bot_image.jpg') {
        const imgPath = path.join(__dirname, 'assets', 'bot_image.jpg');
        if (fs.existsSync(imgPath)) {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            fs.createReadStream(imgPath).pipe(res);
        } else {
            res.writeHead(404); res.end('Image not found');
        }
    }
    else if (req.method === 'GET' && req.url === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ connected: isPaired }));
    }
    else if (req.method === 'POST' && req.url === '/api/reset') {
        try {
            rmSync('./session', { recursive: true, force: true });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            setTimeout(() => process.exit(1), 1000); // Restart server
        } catch (e) {
            res.writeHead(500); res.end(JSON.stringify({ error: 'Failed to reset' }));
        }
    }
    else if (req.method === 'POST' && req.url === '/pair') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const phone = data.phone;

                if (!phone) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Phone number is required' })); }
                if (!activeSocket) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Socket initializing, wait 5s.' })); }
                if (activeSocket.authState.creds.registered) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Bot is already paired!' })); }
                if (codeRequested) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Code already requested. Check phone.' })); }

                const cleanPhone = phone.replace(/[^0-9]/g, '');
                const code = await activeSocket.requestPairingCode(cleanPhone);
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
                
                codeRequested = true;
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ code: formattedCode }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to generate code. Try again.' }));
            }
        });
    } 
    else {
        res.writeHead(404); res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(chalk.cyan(`🌐 CYBER DASHBOARD ACTIVE ON PORT ${PORT}`));
    console.log(chalk.yellow(`🔗 Open your Render URL to pair.`));
    console.log(`========================================\n`);
});

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})