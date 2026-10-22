// ============================================================
// commands/calc.js
// Calculator — safe math expression evaluator
// ============================================================

module.exports = async function calc(sock, from, msg) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || '';
        const expr = text.split(' ').slice(1).join(' ').trim();

        if (!expr) {
            await sock.sendMessage(from, {
                text:
                    '🧮 *CALCULATOR*\n\n' +
                    '*Usage:*\n' +
                    '`.calc <expression>`\n\n' +
                    '*Examples:*\n' +
                    '• `.calc 2 + 3 * 5`\n' +
                    '• `.calc (10 + 5) / 3`\n' +
                    '• `.calc sqrt(144)`\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        // Sanitize — only allow numbers and math ops
        const cleaned = expr.replace(/[^0-9+\-*/().%\s^sqrtinslogcostanabs]/gi, '');
        if (cleaned.length === 0) {
            await sock.sendMessage(from, { text: '❌ Invalid expression.' }, { quoted: msg });
            return;
        }

        // Build a safe evaluator
        const mathFn = {
            sqrt: Math.sqrt,
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            log: Math.log,
            abs: Math.abs,
            pi: Math.PI,
            e: Math.E
        };

        // Replace ^ with **
        let prepared = cleaned.replace(/\^/g, '**');

        // Wrap in function to safely use math functions
        const fnBody = `"use strict";
            const sqrt=Math.sqrt,sin=Math.sin,cos=Math.cos,tan=Math.tan,log=Math.log,abs=Math.abs;
            const pi=Math.PI,e=Math.E;
            return (${prepared});`;

        let result;
        try {
            result = new Function(fnBody)();
        } catch (err) {
            await sock.sendMessage(from, { text: '❌ Could not compute: ' + err.message }, { quoted: msg });
            return;
        }

        if (typeof result !== 'number' || !isFinite(result)) {
            await sock.sendMessage(from, { text: '❌ Result is not a valid number.' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, {
            text:
                `🧮 *CALCULATOR*\n\n` +
                `📝 *Expression:*\n\`${expr}\`\n\n` +
                `✅ *Result:*\n*${result}*\n\n` +
                `⚡ _Powered by BL@CKN1TE_`
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[CALC] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Calc error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
