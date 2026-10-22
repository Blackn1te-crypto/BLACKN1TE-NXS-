// ============================================================
// commands/apk.js
// APK Downloader — sends the APK file directly in the chat
// Multi-API fallback + direct link in caption
// ============================================================

const axios = require('axios');

// ============================================================
// APK SEARCH / DOWNLOAD APIS (tried in order)
// ============================================================
const APK_APIS = [
    {
        name: 'aptoide-search',
        search: (query) =>
            `https://ws75.aptoide.com/api/7/apps/search?query=${encodeURIComponent(query)}&limit=1`,
        parseSearch: (d) => {
            const list = d?.datalist?.list;
            if (!list || !list.length) return null;
            const app = list[0];
            return {
                name: app.name,
                package: app.package,
                version: app.file?.vername || 'latest',
                icon: app.icon,
                size: app.size ? `${(app.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
                storeUrl: app.store?.meta?.data?.web?.url || `https://www.aptoide.com/app/${app.package}`,
                downloadUrl: app.file?.path || null,
                developer: app.store?.name || 'Unknown'
            };
        }
    },
    {
        name: 'apkpure-search',
        search: (query) =>
            `https://api.apkpure.com/v1/search?q=${encodeURIComponent(query)}&hl=en&limit=1`,
        parseSearch: (d) => {
            const app = d?.data?.[0] || d?.results?.[0];
            if (!app) return null;
            return {
                name: app.title || app.name,
                package: app.package_name || app.package,
                version: app.version || 'latest',
                icon: app.icon || app.icon_url,
                size: app.size || 'Unknown',
                storeUrl: `https://apkpure.com/x/${app.package_name || app.package}`,
                downloadUrl: app.download_url || null,
                developer: app.developer || 'Unknown'
            };
        }
    },
    {
        name: 'apkcombo-search',
        search: (query) =>
            `https://apkcombo.com/search/${encodeURIComponent(query)}`,
        parseSearch: () => null, // HTML scrape only — skip
        skip: true
    }
];

// ============================================================
// FALLBACK: Try download via Aptoide direct API
// ============================================================
async function getAptoideDownload(packageName) {
    try {
        const res = await axios.get(
            `https://ws75.aptoide.com/api/7/app/getMeta?package_name=${encodeURIComponent(packageName)}`,
            { timeout: 12000 }
        );
        const app = res.data?.nodes?.meta?.data;
        if (app?.file?.path) {
            return {
                url: app.file.path,
                size: app.file.filesize || app.size,
                version: app.file.vername
            };
        }
    } catch (e) {
        console.warn('[APK] Aptoide meta failed:', e.message);
    }
    return null;
}

// ============================================================
// SEARCH APK
// ============================================================
async function searchApk(query) {
    for (const api of APK_APIS) {
        if (api.skip) continue;
        try {
            const res = await axios.get(api.search(query), {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            const parsed = api.parseSearch(res.data);
            if (parsed && parsed.name) {
                return { ...parsed, apiName: api.name };
            }
        } catch (e) {
            console.warn(`[APK] ${api.name} failed: ${e.message}`);
        }
    }
    return null;
}

// ============================================================
// FETCH APK AS BUFFER
// ============================================================
async function fetchApkBuffer(url, timeout = 180000) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        maxContentLength: 150 * 1024 * 1024, // 150 MB max
        maxBodyLength: 150 * 1024 * 1024,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    return Buffer.from(res.data);
}

// ============================================================
// MAIN HANDLER
// ============================================================
module.exports = async function apk(sock, from, msg) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || msg.message?.videoMessage?.caption
            || '';
        const query = text.split(' ').slice(1).join(' ').trim();

        if (!query) {
            await sock.sendMessage(from, {
                text:
                    '📦 *APK DOWNLOADER*\n\n' +
                    '*Usage:*\n' +
                    '`.apk <app name>`\n\n' +
                    '*Examples:*\n' +
                    '• `.apk whatsapp`\n' +
                    '• `.apk instagram`\n' +
                    '• `.apk spotify`\n\n' +
                    '⚡ _Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER_'
            }, { quoted: msg });
            return;
        }

        // React
        await sock.sendMessage(from, { react: { text: '📦', key: msg.key } }).catch(() => {});

        // Feedback
        await sock.sendMessage(from, {
            text: `🔍 Searching for *${query}*...`
        }, { quoted: msg }).catch(() => {});

        // Search
        const app = await searchApk(query);

        if (!app) {
            await sock.sendMessage(from, {
                text:
                    `❌ *No APK found for:* ${query}\n\n` +
                    `Try a different app name or check spelling.\n\n` +
                    `⚡ _Powered by BL@CKN1TE_`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '😔', key: msg.key } }).catch(() => {});
            return;
        }

        // Try to get download URL if we don't have one
        let downloadUrl = app.downloadUrl;
        if (!downloadUrl && app.package) {
            const meta = await getAptoideDownload(app.package);
            if (meta) downloadUrl = meta.url;
        }

        // Build caption base
        const baseCaption =
            `╭━━━〔 📦 *APK FOUND* 〕━━━┈⊷\n` +
            `┃ 📱 *Name:* ${app.name}\n` +
            `┃ 📦 *Package:* ${app.package || 'N/A'}\n` +
            `┃ 🏷️ *Version:* ${app.version}\n` +
            `┃ 👤 *Dev:* ${app.developer}\n` +
            `┃ 💾 *Size:* ${app.size}\n` +
            `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n`;

        // Send app icon + info first
        if (app.icon) {
            try {
                await sock.sendMessage(from, {
                    image: { url: app.icon },
                    caption: baseCaption + `⏳ _Preparing download..._\n\n⚡ Powered by BL@CKN1TE`
                }, { quoted: msg });
            } catch (iconErr) {
                console.warn('[APK] icon send failed:', iconErr.message);
            }
        }

        // If no download URL, send link only
        if (!downloadUrl) {
            await sock.sendMessage(from, {
                text:
                    `📥 *Download page:*\n${app.storeUrl}\n\n` +
                    `⚠️ *Direct APK download not available for this app.*\n` +
                    `Open the link above to download manually.\n\n` +
                    `⚡ _Powered by BL@CKN1TE_`
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
            return;
        }

        // Download APK as buffer
        await sock.sendMessage(from, {
            text: `📥 Downloading APK (${app.size})...\n\n_This may take a minute._`
        }, { quoted: msg }).catch(() => {});

        let apkBuffer;
        try {
            apkBuffer = await fetchApkBuffer(downloadUrl);
        } catch (dlErr) {
            console.warn('[APK] download failed:', dlErr.message);
            await sock.sendMessage(from, {
                text:
                    `📱 *${app.name}*\n\n` +
                    `⚠️ *Could not download APK* (${dlErr.message})\n\n` +
                    `📥 *Direct link:*\n${downloadUrl}\n\n` +
                    `🌐 *Or use download page:*\n${app.storeUrl}\n\n` +
                    `⚡ _Powered by BL@CKN1TE_`
            }, { quoted: msg });
            return;
        }

        const sizeMB = apkBuffer.length / 1024 / 1024;
        const safeName = app.name.replace(/[^\w\s\-\.]/g, '').slice(0, 50) || 'app';

        const finalCaption =
            baseCaption +
            `📦 *Downloaded:* ${sizeMB.toFixed(2)} MB\n\n` +
            `📥 *Tap the APK above to install.*\n\n` +
            `🔗 *Direct download link:*\n${downloadUrl}\n\n` +
            `🌐 *Store page:*\n${app.storeUrl}\n\n` +
            `⚡ _Powered by BL@CKN1TE THE INCISIVE TRI-HAT HACKER_`;

        // Send as document
        try {
            await sock.sendMessage(from, {
                document: apkBuffer,
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${safeName}.apk`,
                caption: finalCaption
            }, { quoted: msg });

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
        } catch (sendErr) {
            console.warn('[APK] send failed:', sendErr.message);

            // Fallback: send link only
            await sock.sendMessage(from, {
                image: app.icon ? { url: app.icon } : undefined,
                caption:
                    `📱 *${app.name}*\n\n` +
                    `⚠️ *Could not send APK file* (${sendErr.message})\n\n` +
                    `📥 *Direct download:*\n${downloadUrl}\n\n` +
                    `🌐 *Or page:*\n${app.storeUrl}\n\n` +
                    `⚡ _Powered by BL@CKN1TE_`
            }, { quoted: msg });
        }

    } catch (e) {
        console.error('[APK] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *APK error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
