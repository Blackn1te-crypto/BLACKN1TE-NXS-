// ============================================================
// commands/weather.js
// Real-time weather with multi-API fallback
// Fixes 429 rate-limit issues
// ============================================================

const axios = require('axios');

const WEATHER_CODES = {
    0: '☀️ Clear sky', 1: '🌤️ Mainly clear', 2: '⛅ Partly cloudy', 3: '☁️ Overcast',
    45: '🌫️ Fog', 48: '🌫️ Rime fog',
    51: '🌦️ Light drizzle', 53: '🌦️ Moderate drizzle', 55: '🌧️ Dense drizzle',
    56: '🌧️ Freezing drizzle', 57: '🌧️ Heavy freezing drizzle',
    61: '🌧️ Light rain', 63: '🌧️ Moderate rain', 65: '🌧️ Heavy rain',
    66: '🌧️ Freezing rain', 67: '🌧️ Heavy freezing rain',
    71: '🌨️ Light snow', 73: '🌨️ Moderate snow', 75: '❄️ Heavy snow',
    77: '🌨️ Snow grains',
    80: '🌦️ Light showers', 81: '🌦️ Moderate showers', 82: '⛈️ Violent showers',
    85: '🌨️ Snow showers', 86: '❄️ Heavy snow showers',
    95: '⛈️ Thunderstorm', 96: '⛈️ Thunderstorm with hail', 99: '⛈️ Heavy thunderstorm with hail'
};

// ============================================================
// API 1 — Open-Meteo (with retry + user-agent)
// ============================================================
async function viaOpenMeteo(city) {
    const ua = 'Mozilla/5.0 (compatible; BL@CKN1TE-Bot/1.0)';

    // Geocode
    const geoRes = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
        { timeout: 10000, headers: { 'User-Agent': ua } }
    );
    const place = geoRes.data?.results?.[0];
    if (!place) throw new Error('City not found');

    // Weather
    const wRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`,
        { timeout: 10000, headers: { 'User-Agent': ua } }
    );
    const w = wRes.data?.current;
    if (!w) throw new Error('No weather data');

    return {
        place: `${place.name}, ${place.country}`,
        temp: w.temperature_2m,
        feels: w.apparent_temperature,
        desc: WEATHER_CODES[w.weather_code] || '🌡️ Unknown',
        humidity: w.relative_humidity_2m,
        wind: w.wind_speed_10m,
        precip: w.precipitation
    };
}

// ============================================================
// API 2 — wttr.in (backup, no rate limits)
// ============================================================
async function viaWttr(city) {
    const res = await axios.get(
        `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
        {
            timeout: 12000,
            headers: { 'User-Agent': 'curl/8.0' }
        }
    );
    const data = res.data;
    const current = data.current_condition?.[0];
    const area = data.nearest_area?.[0];

    if (!current) throw new Error('No weather data from wttr.in');

    return {
        place: `${area?.areaName?.[0]?.value || city}, ${area?.country?.[0]?.value || ''}`.trim(),
        temp: current.temp_C,
        feels: current.FeelsLikeC,
        desc: current.weatherDesc?.[0]?.value || '🌡️ Unknown',
        humidity: current.humidity,
        wind: current.windspeedKmph,
        precip: current.precipMM
    };
}

// ============================================================
// MAIN HANDLER
// ============================================================
module.exports = async function weather(sock, from, msg) {
    try {
        const text = msg.message?.conversation
            || msg.message?.extendedTextMessage?.text
            || msg.message?.imageMessage?.caption
            || '';
        const city = text.split(' ').slice(1).join(' ').trim();

        if (!city) {
            await sock.sendMessage(from, {
                text:
                    '🌤️ *WEATHER*\n\n' +
                    '*Usage:*\n' +
                    '`.weather <city>`\n\n' +
                    '*Examples:*\n' +
                    '• `.weather Harare`\n' +
                    '• `.weather London`\n' +
                    '• `.weather New York`\n\n' +
                    '⚡ _Powered by BL@CKN1TE_'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, { react: { text: '🌤️', key: msg.key } }).catch(() => {});

        // Try APIs in order
        let w = null;
        let apiUsed = '';

        try {
            w = await viaOpenMeteo(city);
            apiUsed = 'Open-Meteo';
        } catch (e1) {
            console.warn('[WEATHER] Open-Meteo failed:', e1.message);
            try {
                w = await viaWttr(city);
                apiUsed = 'wttr.in';
            } catch (e2) {
                console.warn('[WEATHER] wttr.in failed:', e2.message);
            }
        }

        if (!w) {
            await sock.sendMessage(from, {
                text:
                    `❌ *Weather unavailable for:* ${city}\n\n` +
                    `_All APIs are temporarily rate-limited. Try again in a minute._\n\n` +
                    `⚡ _Powered by BL@CKN1TE_`
            }, { quoted: msg });
            return;
        }

        const reply =
            `╭━━━〔 🌤️ *WEATHER* 〕━━━┈⊷\n` +
            `┃ 📍 *Location:* ${w.place}\n` +
            `┃ 🌡️ *Temp:* ${w.temp}°C (feels ${w.feels}°C)\n` +
            `┃ ${w.desc}\n` +
            `┃ 💧 *Humidity:* ${w.humidity}%\n` +
            `┃ 💨 *Wind:* ${w.wind} km/h\n` +
            `┃ ☔ *Precip:* ${w.precip} mm\n` +
            `╰━━━━━━━━━━━━━━━━━━┈⊷\n\n` +
            `_Source: ${apiUsed}_\n` +
            `⚡ _Powered by BL@CKN1TE_`;

        await sock.sendMessage(from, { text: reply }, { quoted: msg });
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});

    } catch (e) {
        console.error('[WEATHER] Error:', e);
        await sock.sendMessage(from, {
            text: '❌ *Weather error*\n\n' + e.message
        }, { quoted: msg }).catch(() => {});
    }
};
