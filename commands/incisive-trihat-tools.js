// ============================================================
// commands/incisive-trihat-tools.js
// Sends the full list of BL@CKN1TE-NXS MediaFire tools/APKs
// Auto-deduplicates + paginates for WhatsApp
// ============================================================

// ============================================================
// TOOLS LIST (raw)
// ============================================================
const RAW_TOOLS = [
    { name: 'AccountSpace',                version: '1.1.6.1002', url: 'https://www.mediafire.com/file/9ug9fveoj72fawa/AccountSpace-38-1.1.6.1002.apk/file' },
    { name: 'AIDE',                        version: '3.2.210316', url: 'https://www.mediafire.com/file/kvo9td7apeuacl9/AIDE-2008210017-3.2.210316.apk/file' },
    { name: 'AK47Sports',                  version: '1.6',        url: 'https://www.mediafire.com/file/ow94m6uinz5yn2c/AK47Sports-7-1.6.apk/file' },
    { name: 'Auto Cursor',                 version: '1.12.1',     url: 'https://www.mediafire.com/file/es0azupgsatxrru/Auto_Cursor-25999-1.12.1.zip/file' },
    { name: 'Base 64 Encoder Decoder',     version: '1.0.13',     url: 'https://www.mediafire.com/file/itc4lx4h8h87uuc/Base_64_Encoder_Decoder-86-1.0.13.aspk/file' },
    { name: 'BLACKN1TE NEXUSCHEST',        version: '9.8',        url: 'https://www.mediafire.com/file/qa8jxojp8abtzh4/BLACKN1TE-NEXUSCHEST-10-9.8.apk/file' },
    { name: 'Blackn1teSource',             version: '1.0',        url: 'https://www.mediafire.com/file/14fdn1wtuti3gak/Blackn1teSource-1-1.0.apk/file' },
    { name: 'Blackn1teSpamApk',            version: '1.0',        url: 'https://www.mediafire.com/file/jdzr04i0lixkxpo/Blackn1teSpamApk-1-1.0.apk/file' },
    { name: 'BotX Dialog',                 version: '1.1',        url: 'https://www.mediafire.com/file/fhduc2i8utrtbzs/BotX_Dialog-1-1.1.apk/file' },
    { name: 'Clone App Pro',               version: '3.6.4',      url: 'https://www.mediafire.com/file/d70r7za4d767b5e/Clone_App_Pro-364-3.6.4.zip/file' },
    { name: 'Clipper+',                    version: '3.0.12',     url: 'https://www.mediafire.com/file/73un2op6km3x7hc/Clipper%252B-116-3.0.12.apk/file' },
    { name: 'ColorNote',                   version: '4.8.8',      url: 'https://www.mediafire.com/file/6hrtwgej8qkgmld/ColorNote-2104880-4.8.8.apk/file' },
    { name: 'DATA CAPTURE',                version: '3.3.6',      url: 'https://www.mediafire.com/file/d48d8rwdyons97i/DATA_CAPTURE-58-3.3.6.apk/file' },
    { name: 'CRICFy TV',                   version: '7.1',        url: 'https://www.mediafire.com/file/hrqrgam4vs22htz/CRICFy_TV-50-7.1.apk/file' },
    { name: 'DuckDuckGo',                  version: '5.274.0',    url: 'https://www.mediafire.com/file/a9pdfnilagf7bck/DuckDuckGo-52740000-5.274.0.apk/file' },
    { name: 'Kiwi Browser',                version: '139.0.7339.0', url: 'https://www.mediafire.com/file/0x689guk1xfspf7/Kiwi_Browser-733900004-139.0.7339.0.apk/file' },
    { name: 'Liteapks',                    version: '1.0.18',     url: 'https://www.mediafire.com/file/nbdzxrvzx65vqq3/Liteapks-18-1.0.18.apk/file' },
    { name: 'NoBlueTick',                  version: '4.33',       url: 'https://www.mediafire.com/file/6x4q8lrn7vv62g1/NoBlueTick-103-4.33.apk/file' },
    { name: 'Netone',                      version: '3.0.1',      url: 'https://www.mediafire.com/file/f5w4egnz1mh7x6l/Netone-10-3.0.1.apk/file' },
    { name: 'Netflix Pro',                 version: '9.69.0',     url: 'https://www.mediafire.com/file/uelcxdiiefg8n2t/Netflix_Pro-75-9.69.0.apk/file' },
    { name: 'Notch Touch',                 version: '84.0',       url: 'https://www.mediafire.com/file/bohxe6ud17rsbgb/Notch-Touch-84-84.0.apk/file' },
    { name: 'Opus Sci-Fi Launcher',        version: '3.7',        url: 'https://www.mediafire.com/file/juv9r132c7dyqwb/Opus_Sci-Fi_Launcher-30-3.7.apk/file' },
    { name: 'PlayZ TV',                    version: '2.2',        url: 'https://www.mediafire.com/file/6n3jwqfglp4amkb/PlayZ_TV-5-2.2.apk/file' },
    { name: 'TrebEdit',                    version: '3.5.20',     url: 'https://www.mediafire.com/file/4ard6ez9l7su7te/TrebEdit-129-3.5.20.apk/file' },
    { name: 'XRecorder',                   version: '2.5.5',      url: 'https://www.mediafire.com/file/r78wg2uydi4xqql/XRecorder-2550001-2.5.5.apk/file' },
    { name: 'Universal File Opener',       version: '2.6.1',      url: 'https://www.mediafire.com/file/79fzii8gsta08jx/Universal_File_Opener-64-2.6.1.apk/file' },
    { name: 'Snaptube',                    version: '7.66.1',     url: 'https://www.mediafire.com/file/t8kdxq8vllj7alu/Snaptube-76673901-7.66.1.76673901.apk/file' },
    { name: 'My APK',                      version: '3.2.1',      url: 'https://www.mediafire.com/file/qm6uzv44v4vfpfr/My_APK-3210-3.2.1.apk/file' },
    { name: 'Messenger 2',                 version: '1.0 Stable', url: 'https://www.mediafire.com/file/093oisissmizia2/Messenger-2-1.0_Stable.apk/file' },
    { name: 'MediaFire',                   version: '5.9.18',     url: 'https://www.mediafire.com/file/7rcc5o73x3q521j/MediaFire-200009-5.9.18.aspk/file' },
    { name: 'Dev Tools Pro',               version: '9.3.0',      url: 'https://www.mediafire.com/file/fce2p5d7v14t8os/Dev_Tools_Pro-9300-9.3.0-gp.apk/file' },
    { name: 'DeepSeek',                    version: '2.5.1',      url: 'https://www.mediafire.com/file/sh8dopifg0cd9f2/DeepSeek-272-2.5.1.aspk/file' },
    { name: 'Blackn1te Decrypt',           version: '1.0',        url: 'https://www.mediafire.com/file/8ysvihw7syrpo9x/Blackn1te_Decrypt-1-1.0.apk/file' },
    { name: 'Blackn1te SpyLog',            version: '1.0',        url: 'https://www.mediafire.com/file/cpxm6xmcnr4ljuy/Blackn1te_spyLog-1-1.0.apk/file' },
    { name: 'BLN1TE UnbanRequestGenerator',version: '1.0',        url: 'https://www.mediafire.com/file/nhlez462sdt70di/BLN1TE_UnbanRequestGenerator-1-1.0.apk/file' },
    { name: 'txtpad+',                     version: '3.2.7 Plus', url: 'https://www.mediafire.com/file/n1d2o3yc7oki1bk/txtpad%252B-3207-3.2.7_plus.apk/file' },
    { name: 'Telegram Beta',               version: '11.8.2',     url: 'https://www.mediafire.com/file/45hljw5pxc7i8j9/Telegram_Beta-999999999-11.8.2.apk/file' },
    { name: 'UNBAN-PRO',                   version: '1.0',        url: 'https://www.mediafire.com/file/ipl19rytwiyrm5c/UNBAN-PRO-1-1.0.apk/file' },
    { name: 'Unseen',                      version: '3.1.11',     url: 'https://www.mediafire.com/file/91wn8rvmzqtly0w/Unseen-270-3.1.11.apk/file' },
    { name: 'Via',                         version: '7.3.3',      url: 'https://www.mediafire.com/file/zkcamwdhdnr3lhx/Via-20260823-7.3.3.apk/file' },
    { name: 'ML Manager Pro',              version: '5.0',        url: 'https://www.mediafire.com/file/bce42flc9l3ojso/ML_Manager_Pro-120-5.0.apk/file' },
    { name: 'ImageSearchMan',              version: '3.73',       url: 'https://www.mediafire.com/file/pz01tva6vektfqo/ImageSearchMan-273-3.73.aspk/file' },
    { name: 'Code Studio',                 version: '4.2.4',      url: 'https://www.mediafire.com/file/fu1mlikxbj1592n/Code_Studio-30-4.2.4.apk/file' },
    { name: 'Code Editor',                 version: '0.11.10',    url: 'https://www.mediafire.com/file/eaws75m4327qil1/Code_Editor-119-0.11.10.apk/file' },
    { name: 'Apktool M',                   version: '2.4.0',      url: 'https://www.mediafire.com/file/xt26jphbxe79e5m/Apktool_M-2026081801-2.4.0-260818.apk/file' },
    { name: 'Alight Motion',               version: '5.0.279',    url: 'https://www.mediafire.com/file/9ed1ckij5qy9y15/Alight_Motion-1028518-5.0.279.apk/file' }
];

// ============================================================
// DEDUPLICATE (safety net in case of future duplicates)
// ============================================================
function dedupe(list) {
    const seen = new Set();
    const out = [];
    for (const item of list) {
        const key = item.url.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    return out;
}

const TOOLS = dedupe(RAW_TOOLS);

// ============================================================
// CATEGORIZE
// ============================================================
const CATEGORIES = {
    '🛠️ Development': [
        'AIDE', 'Apktool M', 'Code Editor', 'Code Studio', 'Dev Tools Pro',
        'TrebEdit', 'txtpad+', 'My APK', 'ML Manager Pro', 'Blackn1teSource',
        'Blackn1te Decrypt'
    ],
    '🧰 Tools & Utilities': [
        'AccountSpace', 'Base 64 Encoder Decoder', 'Auto Cursor', 'Clone App Pro',
        'Clipper+', 'ColorNote', 'DATA CAPTURE', 'DuckDuckGo', 'Kiwi Browser',
        'Notch Touch', 'Universal File Opener', 'Via', 'XRecorder',
        'ImageSearchMan', 'Auto Cursor'
    ],
    '🌐 Media & Entertainment': [
        'CRICFy TV', 'Netflix Pro', 'PlayZ TV', 'Snaptube', 'VLC', 'Alight Motion',
        'Opus Sci-Fi Launcher'
    ],
    '💬 Communication': [
        'Messenger 2', 'Telegram Beta'
    ],
    '🧠 AI': [
        'DeepSeek'
    ],
    '🕵️ Stealth & Security': [
        'NoBlueTick', 'Unseen', 'Blackn1te SpyLog', 'BLN1TE UnbanRequestGenerator',
        'UNBAN-PRO'
    ],
    '🔷 BL@CKN1TE Originals': [
        'BLACKN1TE NEXUSCHEST', 'Blackn1teSource', 'Blackn1teSpamApk',
        'Blackn1te Decrypt', 'Blackn1te SpyLog', 'BLN1TE UnbanRequestGenerator',
        'BotX Dialog', 'MediaFire'
    ]
};

function getCategory(toolName) {
    for (const [cat, names] of Object.entries(CATEGORIES)) {
        if (names.includes(toolName)) return cat;
    }
    return '📦 Other';
}

// ============================================================
// PAGINATE (3 tools per message to avoid spam blocks)
// ============================================================
const PER_PAGE = 3;

function buildPages(items) {
    const pages = [];
    for (let i = 0; i < items.length; i += PER_PAGE) {
        pages.push(items.slice(i, i + PER_PAGE));
    }
    return pages;
}

// ============================================================
// MAIN HANDLER
// ============================================================
module.exports = async function incisiveTrihatTools(sock, from, msg) {
    try {
        await sock.sendMessage(from, { react: { text: '📦', key: msg.key } }).catch(() => {});

        // ---------- HEADER ----------
        const header =
            `╭━━━〔 ⚡ *BL@CKN1TE-NXS* 〕━━━┈⊷\n` +
            `┃ 🔥 *THE INCISIVE TRI-HAT HACKER*\n` +
            `┃ 🎯 *TOOLS & APK VAULT*\n` +
            `┃ 📦 *Total:* ${TOOLS.length} items\n` +
            `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
            `_Curated MediaFire collection of APKs,_\n` +
            `_tools, mods, and utilities._\n\n` +
            `⚡ _Powered by BL@CKN1TE_`;

        await sock.sendMessage(from, { text: header }, { quoted: msg });

        // ---------- SEND TOOLS (paginated) ----------
        const pages = buildPages(TOOLS);

        for (let p = 0; p < pages.length; p++) {
            const page = pages[p];
            let text = `📄 *Page ${p + 1}/${pages.length}*\n\n`;

            for (const tool of page) {
                const idx = TOOLS.indexOf(tool) + 1;
                const cat = getCategory(tool.name);
                text +=
                    `*${idx}. ${tool.name}*\n` +
                    `┃ 📌 ${cat}\n` +
                    `┃ 🏷️ v${tool.version}\n` +
                    `┃ 📥 ${tool.url}\n\n`;
            }

            await sock.sendMessage(from, { text }, { quoted: msg });

            // Small delay to avoid spam detection
            if (p < pages.length - 1) {
                await new Promise(r => setTimeout(r, 800));
            }
        }

        // ---------- FOOTER ----------
        const footer =
            `╭━━━〔 ✅ *END OF LIST* 〕━━━┈⊷\n` +
            `┃ 📦 *Total tools:* ${TOOLS.length}\n` +
            `┃ 🔗 *All links:* MediaFire\n` +
            `┃ 💡 *Tip:* Long-press any link → Open\n` +
            `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
            `⚠️ _Use at your own risk._\n` +
            `_Some APKs may require unknown sources enabled._\n\n` +
            `⚡ _Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER_`;

        await sock.sendMessage(from, { text: footer }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[TRIHAT-TOOLS] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Tools command error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
