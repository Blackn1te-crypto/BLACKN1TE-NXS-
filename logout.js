// ============================================================
// logout.js — OWNER SESSION TERMINATOR
// Allows owner to:
//   - Terminate own session
//   - Terminate ALL sessions
//   - Terminate any specific user session
//   - List all active sessions
// ============================================================

(function () {
    'use strict';

    // ============================================================
    // 1. GET THE ACTIVE BOT NAME (userId)
    // ============================================================
    function getActiveUserId() {
        const candidates = [
            localStorage.getItem('botName'),
            localStorage.getItem('activeBot'),
            localStorage.getItem('userId'),
            localStorage.getItem('nexusBotName'),
            document.getElementById('currentBotNameDisplay')?.innerText,
            document.getElementById('activeBotName')?.innerText,
            document.getElementById('userIdInput')?.value
        ];

        for (const c of candidates) {
            if (c && c.trim() && c.trim().toLowerCase() !== 'no bot selected') {
                return c.trim();
            }
        }
        return null;
    }

    // ============================================================
    // 2. TERMINATOR MENU (shown to owner)
    // ============================================================
    window.nexusLogout = function () {
        const userId = getActiveUserId();

        const bodyHTML = `
            <div class="nexus-term-content">
                <div class="nexus-term-icon">
                    <i class="fas fa-power-off"></i>
                </div>

                <p class="nexus-term-text">Choose what to terminate:</p>

                ${userId ? `
                    <div class="nexus-term-active">
                        <span class="nexus-term-label">Active bot:</span>
                        <span class="nexus-term-botname">${userId}</span>
                    </div>
                ` : `
                    <p class="nexus-term-warn">⚠️ No bot selected yet</p>
                `}

                <div class="nexus-term-actions">
                    ${userId ? `
                        <button class="nexus-term-btn self" onclick="terminateSession('${userId}')">
                            <i class="fas fa-user-slash"></i>
                            <div>
                                <strong>Terminate Current</strong>
                                <span>${userId}</span>
                            </div>
                        </button>
                    ` : ''}

                    <button class="nexus-term-btn list" onclick="listSessions()">
                        <i class="fas fa-list"></i>
                        <div>
                            <strong>List All Sessions</strong>
                            <span>See every linked device</span>
                        </div>
                    </button>

                    <button class="nexus-term-btn all" onclick="terminateAllSessions()">
                        <i class="fas fa-fire"></i>
                        <div>
                            <strong>Terminate ALL Sessions</strong>
                            <span>Wipe every linked device</span>
                        </div>
                    </button>
                </div>

                <p class="nexus-term-hint">
                    <i class="fas fa-shield-alt"></i>
                    These actions require the <b>OWNER_SECRET</b> you set on Render.
                </p>
            </div>
        `;

        openTerminalModal('POWER CENTER', bodyHTML);
    };

    // ============================================================
    // 3. MODAL SYSTEM
    // ============================================================
    window.closeNexusTerminal = function () {
        const modal = document.getElementById('nexusTerminalModal');
        if (modal) modal.classList.remove('open');
    };

    function openTerminalModal(title, bodyHTML) {
        const existing = document.getElementById('nexusTerminalModal');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="nexusTerminalModal" class="nexus-term-overlay">
                <div class="nexus-term-box">
                    <div class="nexus-term-header">
                        <span><i class="fas fa-power-off"></i> &nbsp;${title}</span>
                        <span class="nexus-term-close" onclick="closeNexusTerminal()">
                            <i class="fas fa-times"></i>
                        </span>
                    </div>
                    <div class="nexus-term-body" id="nexusTermBody">
                        ${bodyHTML}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        requestAnimationFrame(() => {
            const m = document.getElementById('nexusTerminalModal');
            if (m) m.classList.add('open');
        });
    }

    function replaceTermBody(html) {
        const body = document.getElementById('nexusTermBody');
        if (body) body.innerHTML = html;
    }

    // ============================================================
    // 4. LIST ALL SESSIONS
    // ============================================================
    window.listSessions = async function () {
        replaceTermBody(`<div class="nexus-term-loading"><i class="fas fa-spinner fa-spin"></i> Loading sessions...</div>`);

        try {
            const res = await fetch('/api/sessions', { cache: 'no-store' });
            const data = await res.json();

            if (!data.sessions || data.sessions.length === 0) {
                replaceTermBody(`
                    <div class="nexus-term-empty">
                        <i class="fas fa-inbox"></i>
                        <p>No active sessions</p>
                    </div>
                `);
                return;
            }

            const list = data.sessions.map(s => `
                <div class="nexus-term-row">
                    <div class="nexus-term-row-info">
                        <div class="nexus-term-row-name">
                            <i class="fas fa-robot"></i> ${s.userId}
                        </div>
                        <div class="nexus-term-row-status ${s.connected ? 'online' : 'offline'}">
                            <span class="dot"></span>
                            ${s.connected ? 'ONLINE' : 'OFFLINE'}
                        </div>
                    </div>
                    <button class="nexus-term-row-kill" onclick="terminateSession('${s.userId}')" title="Terminate this session">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

            replaceTermBody(`
                <p class="nexus-term-text">📋 <b>${data.sessions.length}</b> total session(s)</p>
                <div class="nexus-term-list">${list}</div>
                <button class="nexus-term-btn all" onclick="terminateAllSessions()">
                    <i class="fas fa-fire"></i>
                    <div>
                        <strong>Terminate ALL</strong>
                        <span>Wipe every session</span>
                    </div>
                </button>
                <button class="nexus-term-btn back" onclick="nexusLogout()">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            `);
        } catch (e) {
            replaceTermBody(`
                <div class="nexus-term-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not load sessions</p>
                    <p style="font-size:0.7rem; color:#666;">${e.message}</p>
                </div>
            `);
        }
    };

    // ============================================================
    // 5. TERMINATE ONE SESSION
    // ============================================================
    window.terminateSession = async function (userId) {
        if (!userId) return;

        const confirmed = confirm(
            `⚠️ TERMINATE SESSION\n\n` +
            `Bot: ${userId}\n\n` +
            `This will disconnect this device from WhatsApp.\n` +
            `The user will need to re-pair.\n\n` +
            `Continue?`
        );
        if (!confirmed) return;

        const secret = prompt('🔐 Enter OWNER_SECRET:');
        if (!secret) return;

        replaceTermBody(`<div class="nexus-term-loading"><i class="fas fa-spinner fa-spin"></i> Terminating ${userId}...</div>`);

        try {
            const res = await fetch('/api/terminate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, secret })
            });
            const data = await res.json();

            if (data.success) {
                replaceTermBody(`
                    <div class="nexus-term-success">
                        <i class="fas fa-check-circle"></i>
                        <h3>Session Terminated</h3>
                        <p><b>${userId}</b> has been disconnected.</p>
                        <p style="font-size:0.75rem; color:#888;">
                            The auth folder has been removed. User must re-pair.
                        </p>
                        <button class="nexus-term-btn back" onclick="nexusLogout()">
                            <i class="fas fa-arrow-left"></i> Back to Menu
                        </button>
                    </div>
                `);

                // If it was our own session, clear local storage
                if (userId === getActiveUserId()) {
                    localStorage.removeItem('botName');
                    localStorage.removeItem('activeBot');
                    setTimeout(() => window.location.reload(), 2000);
                }
            } else {
                replaceTermBody(`
                    <div class="nexus-term-error">
                        <i class="fas fa-times-circle"></i>
                        <h3>Failed</h3>
                        <p>${data.error || 'Unknown error'}</p>
                        <button class="nexus-term-btn back" onclick="nexusLogout()">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    </div>
                `);
            }
        } catch (e) {
            replaceTermBody(`
                <div class="nexus-term-error">
                    <i class="fas fa-times-circle"></i>
                    <h3>Network Error</h3>
                    <p>${e.message}</p>
                    <button class="nexus-term-btn back" onclick="nexusLogout()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            `);
        }
    };

    // ============================================================
    // 6. TERMINATE ALL SESSIONS
    // ============================================================
    window.terminateAllSessions = async function () {
        const confirmed = confirm(
            `🔥 TERMINATE ALL SESSIONS\n\n` +
            `This will disconnect EVERY linked device from WhatsApp.\n` +
            `ALL users will need to re-pair.\n\n` +
            `This cannot be undone.\n\n` +
            `Continue?`
        );
        if (!confirmed) return;

        const confirmed2 = confirm(
            `⚠️ FINAL WARNING\n\n` +
            `Are you ABSOLUTELY sure?\n\n` +
            `All sessions will be permanently wiped.`
        );
        if (!confirmed2) return;

        const secret = prompt('🔐 Enter OWNER_SECRET:');
        if (!secret) return;

        replaceTermBody(`<div class="nexus-term-loading"><i class="fas fa-spinner fa-spin"></i> Terminating ALL sessions...</div>`);

        try {
            const res = await fetch('/api/terminate-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret })
            });
            const data = await res.json();

            if (data.success) {
                replaceTermBody(`
                    <div class="nexus-term-success">
                        <i class="fas fa-check-circle"></i>
                        <h3>All Sessions Terminated</h3>
                        <p><b>${data.count}</b> session(s) wiped.</p>
                        <p style="font-size:0.75rem; color:#888;">
                            Every linked device must re-pair.
                        </p>
                        <button class="nexus-term-btn back" onclick="closeNexusTerminal(); location.reload();">
                            <i class="fas fa-sync"></i> Reload Panel
                        </button>
                    </div>
                `);

                // Clear local
                localStorage.removeItem('botName');
                localStorage.removeItem('activeBot');

                setTimeout(() => window.location.reload(), 3000);
            } else {
                replaceTermBody(`
                    <div class="nexus-term-error">
                        <i class="fas fa-times-circle"></i>
                        <h3>Failed</h3>
                        <p>${data.error || 'Unknown error'}</p>
                        <button class="nexus-term-btn back" onclick="nexusLogout()">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    </div>
                `);
            }
        } catch (e) {
            replaceTermBody(`
                <div class="nexus-term-error">
                    <i class="fas fa-times-circle"></i>
                    <h3>Network Error</h3>
                    <p>${e.message}</p>
                    <button class="nexus-term-btn back" onclick="nexusLogout()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            `);
        }
    };

    // ============================================================
    // 7. INJECT ALL STYLES
    // ============================================================
    const style = document.createElement('style');
    style.innerHTML = `
        .nexus-term-overlay {
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(6px);
            display: flex; justify-content: center; align-items: center;
            z-index: 3000; padding: 20px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .nexus-term-overlay.open { opacity: 1; }

        .nexus-term-box {
            width: 100%; max-width: 460px;
            background: #05070d;
            border: 1px solid #00ff80;
            border-radius: 16px;
            box-shadow: 0 0 40px rgba(0, 255, 128, 0.35);
            overflow: hidden;
            animation: nexusFadeIn 0.3s ease;
            max-height: 90vh;
            overflow-y: auto;
        }
        @keyframes nexusFadeIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .nexus-term-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(0, 255, 128, 0.2);
            color: #00ff80;
            font-family: 'Orbitron', sans-serif;
            font-weight: 700; letter-spacing: 1.5px;
            font-size: 1rem;
        }
        .nexus-term-close {
            cursor: pointer; font-size: 1.2rem;
            transition: 0.2s;
        }
        .nexus-term-close:hover { color: #fff; transform: rotate(90deg); }

        .nexus-term-body {
            padding: 20px;
            font-family: 'JetBrains Mono', monospace;
            color: #ccc;
        }

        .nexus-term-icon {
            font-size: 2rem;
            color: #ff3c3c;
            text-align: center;
            margin-bottom: 15px;
            filter: drop-shadow(0 0 10px rgba(255, 60, 60, 0.6));
        }
        .nexus-term-text {
            text-align: center;
            font-size: 0.85rem;
            color: #aaa;
            margin-bottom: 15px;
        }
        .nexus-term-warn {
            text-align: center;
            color: #ffbe3c;
            font-size: 0.8rem;
            margin-bottom: 15px;
        }

        .nexus-term-active {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 18px;
            padding: 10px 14px;
            background: rgba(0, 255, 128, 0.05);
            border: 1px solid rgba(0, 255, 128, 0.25);
            border-radius: 10px;
        }
        .nexus-term-label {
            color: #666;
            font-size: 0.75rem;
        }
        .nexus-term-botname {
            color: #00ff80;
            font-weight: 700;
            font-size: 0.9rem;
        }

        .nexus-term-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .nexus-term-btn {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 16px;
            background: rgba(0, 255, 128, 0.04);
            border: 1px solid rgba(0, 255, 128, 0.25);
            border-radius: 12px;
            color: #fff;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            text-align: left;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .nexus-term-btn:hover {
            transform: translateY(-2px);
            border-color: #00ff80;
            background: rgba(0, 255, 128, 0.1);
            box-shadow: 0 0 20px rgba(0, 255, 128, 0.3);
        }
        .nexus-term-btn i {
            font-size: 1.2rem;
            width: 24px;
            text-align: center;
            flex-shrink: 0;
        }
        .nexus-term-btn strong { display: block; margin-bottom: 2px; font-weight: 700; color: #fff; }
        .nexus-term-btn span { display: block; font-size: 0.7rem; color: #888; }

        .nexus-term-btn.self { border-color: rgba(255, 190, 60, 0.4); }
        .nexus-term-btn.self i { color: #ffbe3c; }
        .nexus-term-btn.self:hover { border-color: #ffbe3c; background: rgba(255, 190, 60, 0.1); box-shadow: 0 0 20px rgba(255, 190, 60, 0.3); }

        .nexus-term-btn.list { border-color: rgba(6, 182, 212, 0.4); }
        .nexus-term-btn.list i { color: #06b6d4; }
        .nexus-term-btn.list:hover { border-color: #06b6d4; background: rgba(6, 182, 212, 0.1); box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }

        .nexus-term-btn.all { border-color: rgba(255, 60, 60, 0.5); background: rgba(255, 60, 60, 0.08); }
        .nexus-term-btn.all i { color: #ff3c3c; }
        .nexus-term-btn.all:hover { border-color: #ff3c3c; background: rgba(255, 60, 60, 0.15); box-shadow: 0 0 25px rgba(255, 60, 60, 0.4); }

        .nexus-term-btn.back {
            margin-top: 15px;
            justify-content: center;
            border-color: rgba(255, 255, 255, 0.15);
            background: transparent;
        }
        .nexus-term-btn.back:hover { border-color: #00ff80; }

        .nexus-term-hint {
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid rgba(0, 255, 128, 0.1);
            font-size: 0.68rem;
            color: #666;
            text-align: center;
        }
        .nexus-term-hint i { color: #00ff80; }

        .nexus-term-loading {
            text-align: center;
            padding: 40px 20px;
            color: #00ff80;
            font-size: 0.85rem;
        }
        .nexus-term-loading i { font-size: 1.5rem; margin-bottom: 10px; display: block; }

        .nexus-term-empty, .nexus-term-success, .nexus-term-error {
            text-align: center;
            padding: 25px 15px;
        }
        .nexus-term-empty i { font-size: 2rem; color: #666; display: block; margin-bottom: 10px; }
        .nexus-term-success i { font-size: 2.5rem; color: #00ff80; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 15px rgba(0, 255, 128, 0.6)); }
        .nexus-term-error i { font-size: 2.5rem; color: #ff3c3c; display: block; margin-bottom: 12px; filter: drop-shadow(0 0 15px rgba(255, 60, 60, 0.6)); }
        .nexus-term-success h3, .nexus-term-error h3 {
            font-family: 'Orbitron', sans-serif;
            font-size: 1rem;
            letter-spacing: 1.5px;
            margin-bottom: 10px;
        }
        .nexus-term-success h3 { color: #00ff80; }
        .nexus-term-error h3 { color: #ff3c3c; }

        .nexus-term-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin: 15px 0;
            max-height: 280px;
            overflow-y: auto;
        }
        .nexus-term-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: rgba(0, 255, 128, 0.03);
            border: 1px solid rgba(0, 255, 128, 0.2);
            border-radius: 10px;
            transition: 0.2s;
        }
        .nexus-term-row:hover {
            background: rgba(0, 255, 128, 0.08);
            border-color: #00ff80;
        }
        .nexus-term-row-info { flex: 1; min-width: 0; }
        .nexus-term-row-name {
            color: #fff;
            font-size: 0.82rem;
            font-weight: 700;
            word-break: break-all;
            margin-bottom: 4px;
        }
        .nexus-term-row-name i { color: #00ff80; margin-right: 6px; }
        .nexus-term-row-status {
            font-size: 0.68rem;
            color: #888;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .nexus-term-row-status .dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #666;
        }
        .nexus-term-row-status.online .dot { background: #00ff80; box-shadow: 0 0 8px #00ff80; }
        .nexus-term-row-status.offline .dot { background: #ff3c3c; }

        .nexus-term-row-kill {
            background: rgba(255, 60, 60, 0.1);
            border: 1px solid rgba(255, 60, 60, 0.4);
            color: #ff3c3c;
            width: 34px;
            height: 34px;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.2s;
            flex-shrink: 0;
            margin-left: 10px;
        }
        .nexus-term-row-kill:hover {
            background: rgba(255, 60, 60, 0.3);
            border-color: #ff3c3c;
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);

})();
