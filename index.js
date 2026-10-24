// ============================================================
// index.js
// BL@CKN1TE-NXS V16 — Entry Point
// Simply boots server.js (which contains the full bot logic)
// ============================================================

const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════╗');
console.log('║  ░▒▓█  BL@CKN1TE-NXS  •  V16  █▓▒░        ║');
console.log('║  ⚡ Booting via index.js → server.js       ║');
console.log('╚═══════════════════════════════════════════╝');

const serverPath = path.join(__dirname, 'server.js');

if (!fs.existsSync(serverPath)) {
    console.error('❌ CRITICAL ERROR: server.js not found in root directory!');
    console.error('   Please ensure server.js is uploaded to your GitHub repository.');
    process.exit(1);
}

try {
    console.log('⚡ [System] Loading server.js...');
    require('./server.js');
} catch (error) {
    console.error('❌ CRITICAL ERROR: Failed to load server.js');
    console.error(error.message);
    // We don't exit so Render shows the error in logs, but we also don't crash silently
}

// Keep process alive (server.js already listens, this is belt-and-suspenders)
process.stdin.resume();

// ♾️ Never let the process die from stray signals
process.on('SIGINT', () => console.log('♾️ [index.js] SIGINT ignored — staying online'));
process.on('SIGTERM', () => console.log('♾️ [index.js] SIGTERM ignored — staying online'));

// Handle uncaught errors at the entry level
process.on('uncaughtException', (err) => {
    console.error('♾️ [index.js] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (err) => {
    console.error('♾️ [index.js] Unhandled Rejection:', err?.message || err);
});