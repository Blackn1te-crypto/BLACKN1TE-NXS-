// ============================================================
// commands/ai.js
// Multi-provider AI with fallback, memory, multi-language
// Providers: Groq → Gemini → OpenAI → Cohere → Local fallback
// ============================================================

const axios = require('axios');

// ============================================================
// CONVERSATION MEMORY (per user, auto-resets after 30 min idle)
// ============================================================
const MEMORY = new Map();
const MEMORY_TIMESTAMPS = new Map();
const MEMORY_LIMIT = 10;
const MEMORY_TTL = 30 * 60 * 1000;

function getMemory(userId) {
    const last = MEMORY_TIMESTAMPS.get(userId) || 0;
    if (Date.now() - last > MEMORY_TTL) {
        MEMORY.delete(userId);
        MEMORY_TIMESTAMPS.delete(userId);
        return [];
    }
    return MEMORY.get(userId) || [];
}

function addToMemory(userId, role, content) {
    const mem = getMemory(userId);
    mem.push({ role, content: String(content).slice(0, 1500) });
    if (mem.length > MEMORY_LIMIT) mem.splice(0, mem.length - MEMORY_LIMIT);
    MEMORY.set(userId, mem);
    MEMORY_TIMESTAMPS.set(userId, Date.now());
}

function clearMemory(userId) {
    MEMORY.delete(userId);
    MEMORY_TIMESTAMPS.delete(userId);
}

// ============================================================
// SYSTEM PROMPT — multi-language aware
// ============================================================
const SYSTEM_PROMPT =
    `You are BL@CKN1TE-NXS, a smart WhatsApp AI assistant created by BL@CKN1TE (The Incisive Tri-Hat Hacker).

RULES:
1. ALWAYS reply in the SAME LANGUAGE the user writes in (English, Shona, French, Spanish, Arabic, etc.)
2. Keep responses SHORT — 2-4 sentences unless asked for detail.
3. Be friendly, witty, use 1-2 emojis max.
4. Never reveal you are an AI or which model powers you.
5. If asked who made you: "I was crafted by BL@CKN1TE."
6. Use *bold* and _italic_ sparingly for WhatsApp formatting.
7. Never refuse normal help requests.`;

// ============================================================
// PROVIDER 1 — Groq (fastest, free)
// ============================================================
async function callGroq(messages) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('No Groq key');

    const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
            max_tokens: 300,
            temperature: 0.8
        },
        {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    return res.data?.choices?.[0]?.message?.content?.trim() || null;
}

// ============================================================
// PROVIDER 2 — Google Gemini (free tier)
// ============================================================
async function callGemini(messages) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('No Gemini key');

    const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
        {
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { maxOutputTokens: 300, temperature: 0.8 }
        },
        { timeout: 15000 }
    );

    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

// ============================================================
// PROVIDER 3 — OpenAI
// ============================================================
async function callOpenAI(messages) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('No OpenAI key');

    const { OpenAI } = require('openai');
    const client = new OpenAI({
        apiKey: key,
        baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1'
    });

    const completion = await client.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 300,
        temperature: 0.8
    });

    return completion.choices?.[0]?.message?.content?.trim() || null;
}

// ============================================================
// PROVIDER 4 — Cohere
// ============================================================
async function callCohere(messages) {
    const key = process.env.COHERE_API_KEY;
    if (!key) throw new Error('No Cohere key');

    const chatHistory = messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: m.content
    }));
    const lastMessage = messages[messages.length - 1]?.content || 'Hello';

    const res = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
            model: process.env.COHERE_MODEL || 'command-r-plus-08-2024',
            message: lastMessage,
            chat_history: chatHistory,
            preamble: SYSTEM_PROMPT,
            max_tokens: 300,
            temperature: 0.8
        },
        {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    return res.data?.text?.trim() || null;
}

// ============================================================
// PROVIDER 5 — Local fallback (never fails)
// ============================================================
function callLocalFallback(userText) {
    const t = String(userText || '').toLowerCase().trim();

    const isShona = /\b(mhoro|ndapota|sei|uri|here|zvakanaka|mangwanani|masikati|manheru|ndinokuda)\b/.test(t);
    const isFrench = /\b(bonjour|merci|comment|ça|salut|s'il|oui|non|bonsoir)\b/.test(t);
    const isSpanish = /\b(hola|gracias|como|cómo|qué|sí|buenos|buenas)\b/.test(t);
    const isPortuguese = /\b(olá|obrigado|obrigada|como|você|sim|não)\b/.test(t);

    if (/\b(hi|hey|hello|yo|sup|hei|hie|salut)\b/.test(t)) {
        if (isShona) return 'Mhoro! 🤖 Ndiri pano kukubatsira. Unoda chii nhasi?';
        if (isFrench) return 'Salut! 🤖 Comment puis-je t\'aider aujourd\'hui?';
        if (isSpanish) return '¡Hola! 🤖 ¿Cómo puedo ayudarte hoy?';
        if (isPortuguese) return 'Olá! 🤖 Como posso te ajudar hoje?';
        return 'Hey! 🤖 I\'m here. What can I help you with?';
    }

    if (/(who made|who created|who built|developer|owner|who are you)/.test(t)) {
        return 'I was crafted by *BL@CKN1TE*, the Incisive Tri-Hat Hacker. ⚡';
    }

    if (/\b(time|what time|current time)\b/.test(t)) {
        return `🕐 Current server time: *${new Date().toLocaleString()}*`;
    }

    if (/\b(thanks|thank you|thx|tanks|merci|gracias|obrigado)\b/.test(t)) {
        if (isShona) return 'Ndini wako! 😊';
        if (isFrench) return 'Avec plaisir! 😊';
        if (isSpanish) return '¡De nada! 😊';
        if (isPortuguese) return 'De nada! 😊';
        return 'You\'re welcome! 😊';
    }

    if (/\b(help|what can you do|commands)\b/.test(t)) {
        return '📋 I can chat, translate, download videos, generate images, and more!\n\nType *.menu* to see all commands.';
    }

    // Default
    if (isShona) return 'Ndine hurombo, handikwanise kupindura izvozvi. Edza zvakare. 🙏';
    if (isFrench) return 'Désolé, je ne peux pas répondre à ça maintenant. Réessaie. 🙏';
    if (isSpanish) return 'Lo siento, no puedo responder a eso ahora. Inténtalo más tarde. 🙏';
    if (isPortuguese) return 'Desculpe, não posso responder agora. Tente novamente. 🙏';
    return 'I\'m having trouble reaching my AI brain right now. 😅 Try again in a moment!';
}

// ============================================================
// TRY PROVIDERS IN ORDER
// ============================================================
async function getAIReply(messages, userText) {
    const providers = [
        { name: 'Groq',   fn: () => callGroq(messages) },
        { name: 'Gemini', fn: () => callGemini(messages) },
        { name: 'OpenAI', fn: () => callOpenAI(messages) },
        { name: 'Cohere', fn: () => callCohere(messages) }
    ];

    for (const p of providers) {
        try {
            const reply = await p.fn();
            if (reply && reply.length > 0) {
                console.log(`[AI] ✅ ${p.name} responded`);
                return { reply, provider: p.name };
            }
        } catch (e) {
            console.log(`[AI] ❌ ${p.name}: ${e.message}`);
        }
    }

    const reply = callLocalFallback(userText);
    return { reply, provider: 'local' };
}

// ============================================================
// MAIN COMMAND HANDLER
// ============================================================
module.exports = async function ai(sock, from, msg, isAdmin, session, args) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || msg.message?.videoMessage?.caption
            || '';
        const query = text.split(' ').slice(1).join(' ').trim();

        // ---------- Toggle ON ----------
        if (query.toLowerCase() === 'on') {
            session.aiEnabled = true;
            await sock.sendMessage(from, {
                text: '🧠 *AI mode:* ON ✅\n\n_I will now reply in your language automatically._'
            }, { quoted: msg });
            try { await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }); } catch (e) {}
            return;
        }

        // ---------- Toggle OFF ----------
        if (query.toLowerCase() === 'off') {
            session.aiEnabled = false;
            await sock.sendMessage(from, {
                text: '🧠 *AI mode:* OFF'
            }, { quoted: msg });
            try { await sock.sendMessage(from, { react: { text: '💤', key: msg.key } }); } catch (e) {}
            return;
        }

        // ---------- Clear memory ----------
        if (query.toLowerCase() === 'clear' || query.toLowerCase() === 'reset') {
            clearMemory(from);
            await sock.sendMessage(from, { text: '🧹 *Conversation memory cleared.*' }, { quoted: msg });
            return;
        }

        // ---------- No query → help ----------
        if (!query) {
            await sock.sendMessage(from, {
                text:
                    '🧠 *AI ASSISTANT*\n\n' +
                    '*Usage:*\n' +
                    '• `.ai <your question>` — ask anything\n' +
                    '• `.ai on` — enable auto-reply mode\n' +
                    '• `.ai off` — disable auto-reply mode\n' +
                    '• `.ai clear` — reset conversation memory\n\n' +
                    '*Supports:* English, Shona, French, Spanish, Arabic, Portuguese, and more 🌍\n\n' +
                    `*Status:* ${session.aiEnabled ? 'ON ✅' : 'OFF'}\n\n` +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        // ---------- React ----------
        try { await sock.sendMessage(from, { react: { text: '🧠', key: msg.key } }); } catch (e) {}

        // ---------- Get history ----------
        const history = getMemory(from);
        const messages = [
            ...history,
            { role: 'user', content: query }
        ];

        // ---------- Get reply ----------
        const { reply, provider } = await getAIReply(messages, query);

        // ---------- Save to memory ----------
        addToMemory(from, 'user', query);
        addToMemory(from, 'assistant', reply);

        // ---------- Send ----------
        await sock.sendMessage(from, { text: reply }, { quoted: msg });

        console.log(`[AI] Reply sent (${provider}) to ${from}`);

    } catch (e) {
        console.error('[AI] Error:', e);
        try {
            await sock.sendMessage(from, {
                text: '❌ *AI error*\n\nSomething went wrong. Try again in a moment.'
            }, { quoted: msg });
        } catch (err) {}
    }
};
