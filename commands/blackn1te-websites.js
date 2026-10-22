// ============================================================
// commands/blackn1te-websites.js
// Sends the list of BL@CKN1TE-NXS official websites + access key
// ============================================================

// ============================================================
// WEBSITES LIST
// ============================================================
const WEBSITES = [
    {
        name: 'Incisive ImagePro Web',
        url: 'https://incisive-imageproweb.freepage.cc',
        desc: 'Image processing tools online',
        icon: '🖼️'
    },
    {
        name: 'Incisive Drop',
        url: 'https://incisive-drop.freehosting.dev',
        desc: 'File drop & sharing hub',
        icon: '📦'
    },
    {
        name: 'File Converter',
        url: 'https://file-converter.ifree.page',
        desc: 'Convert files between formats',
        icon: '🔄'
    },
    {
        name: 'Source Code Extractor',
        url: 'https://source-code-extractor.fast-page.org',
        desc: 'Extract source code from URLs',
        icon: '📜'
    },
    {
        name: 'B-WhatsApp Hub',
        url: 'https://b-whatsapp-hub.free.nf',
        desc: 'WhatsApp channel hub',
        icon: '💬'
    },
    {
        name: 'BL@CKN1TE-NXS Panel',
        url: 'https://blackn1te-nxs-v16.onrender.com',
        desc: 'WhatsApp Bot Control Panel',
        icon: '🤖'
    },
    {
        name: 'Tri-Hat Channel Hub',
        url: 'https://tri-hat-channel-hub.gt.tc',
        desc: 'All WhatsApp channels in one place',
        icon: '🔥'
    },
    {
        name: 'Free Web Deploy',
        url: 'https://blackn1te-freewebdeploy.freehosting.dev',
        desc: 'Deploy static sites for free',
        icon: '🌐'
    }
];

// ============================================================
// MAIN HANDLER
// ============================================================
module.exports = async function blackn1teWebsites(sock, from, msg) {
    try {
        await sock.sendMessage(from, { react: { text: '🌐', key: msg.key } }).catch(() => {});

        // ---------- HEADER ----------
        const header =
            `╭━━━〔 🌐 *BL@CKN1TE WEBSITES* 〕━━━┈⊷\n` +
            `┃ ⚡ *BY THE INCISIVE TRI-HAT HACKER*\n` +
            `┃ 🔗 *Total:* ${WEBSITES.length} sites\n` +
            `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
            `_All websites personally crafted by BL@CKN1TE._\n` +
            `_Free tools, file hubs, and utilities._\n\n` +
            `⚡ _Powered by BL@CKN1TE_`;

        await sock.sendMessage(from, { text: header }, { quoted: msg });

        // ---------- WEBSITE LIST ----------
        let listText = '';
        WEBSITES.forEach((site, i) => {
            listText +=
                `*${i + 1}. ${site.icon} ${site.name}*\n` +
                `┃ 📝 ${site.desc}\n` +
                `┃ 🔗 ${site.url}\n\n`;
        });

        await sock.sendMessage(from, { text: listText }, { quoted: msg });

        // ---------- ACCESS KEY ----------
        const accessKeyText =
            `╭━━━〔 🔐 *ACCESS KEY* 〕━━━┈⊷\n` +
            `┃ 👤 *Username:* Bl@ckn1te\n` +
            `┃ 🔑 *Password:* 0506\n` +
            `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
            `⚠️ _Keep this confidential. Do not share publicly._\n\n` +
            `⚡ _Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER_`;

        await sock.sendMessage(from, { text: accessKeyText }, { quoted: msg });

        // ---------- FOOTER TIP ----------
        await sock.sendMessage(from, {
            text:
                `💡 *Tip:* Long-press any link → *Open in browser*\n\n` +
                `📱 _All sites are mobile-friendly._\n` +
                `⚡ _Powered by BL@CKN1TE_`
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[WEBSITES] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Websites command error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
