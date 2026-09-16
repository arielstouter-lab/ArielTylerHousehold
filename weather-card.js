// weather-card.js
// Requires: a <div class="weather-card" id="weatherCard"> in the page,
// and the .weather-card CSS rules (see weather-card.css / styles.css).
// No API key needed — uses Open-Meteo's free, keyless API.

// ---- config -----------------------------------------------------
// Fixed location — edit these three values to change the card's location.
const LOCATION = { lat: 35.691544, lon: -105.944183, label: "Santa Fe, NM" };
const STORAGE_KEY = "wc-unit"; // "c" or "f"

// ---- WMO weather code -> { label, icon, accent } -----------------
// Open-Meteo returns WMO codes: https://open-meteo.com/en/docs
function codeInfo(code, isDay){
    const map = {
        0:  { label:"Clear sky",        icon: isDay?"sun":"moon",        accent:"#3f7fb3" },
        1:  { label:"Mostly clear",     icon: isDay?"sun-cloud":"moon-cloud", accent:"#3f7fb3" },
        2:  { label:"Partly cloudy",    icon: isDay?"sun-cloud":"moon-cloud", accent:"#4a7a94" },
        3:  { label:"Overcast",         icon:"cloud",                    accent:"#5b6a78" },
        45: { label:"Fog",              icon:"fog",                      accent:"#6b7580" },
        48: { label:"Icy fog",          icon:"fog",                      accent:"#6b7580" },
        51: { label:"Light drizzle",    icon:"drizzle",                  accent:"#4b7089" },
        53: { label:"Drizzle",          icon:"drizzle",                  accent:"#456a86" },
        55: { label:"Dense drizzle",    icon:"drizzle",                  accent:"#3f6480" },
        61: { label:"Light rain",       icon:"rain",                     accent:"#3f6480" },
        63: { label:"Rain",             icon:"rain",                     accent:"#375c78" },
        65: { label:"Heavy rain",       icon:"rain",                     accent:"#2f4f68" },
        71: { label:"Light snow",       icon:"snow",                     accent:"#6a7c96" },
        73: { label:"Snow",             icon:"snow",                     accent:"#62748e" },
        75: { label:"Heavy snow",       icon:"snow",                     accent:"#586a84" },
        80: { label:"Rain showers",     icon:"rain",                     accent:"#3a6280" },
        81: { label:"Rain showers",     icon:"rain",                     accent:"#345c7a" },
        82: { label:"Violent showers",  icon:"rain",                     accent:"#2c4f6b" },
        95: { label:"Thunderstorm",     icon:"storm",                    accent:"#3a3f60" },
        96: { label:"Thunderstorm",     icon:"storm",                    accent:"#343957" },
        99: { label:"Severe storm",     icon:"storm",                    accent:"#2e3350" },
    };
    return map[code] || { label:"Unsettled", icon:"cloud", accent:"#4a5a6b" };
}

// ---- minimal line-icon set (no external icon library needed) ----
function weatherIcon(kind){
    const s = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
    const icons = {
        sun: `<svg viewBox="0 0 24 24" ${s}><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>`,
        moon: `<svg viewBox="0 0 24 24" ${s}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z"/></svg>`,
        "sun-cloud": `<svg viewBox="0 0 24 24" ${s}><circle cx="8.5" cy="8.5" r="3.3"/><path d="M8.5 2.6v1.6M8.5 12.8v1.4M3.2 8.5h1.4M12.4 8.5h1.3M4.7 4.7l1 1M11 11l1 1M12.3 4.7l-1 1M5.7 11l-1 1"/><path d="M9 20.5h8a3.5 3.5 0 0 0 .6-6.95A5 5 0 0 0 8 15.2a3 3 0 0 0 1 5.3Z"/></svg>`,
        "moon-cloud": `<svg viewBox="0 0 24 24" ${s}><path d="M16 9.3a4.5 4.5 0 1 1-4.9-4.5 3.6 3.6 0 0 0 4.9 4.5Z"/><path d="M9 20.5h8a3.5 3.5 0 0 0 .6-6.95A5 5 0 0 0 8 15.2a3 3 0 0 0 1 5.3Z"/></svg>`,
        cloud: `<svg viewBox="0 0 24 24" ${s}><path d="M7 18.5h9.5a3.8 3.8 0 0 0 .7-7.55A5.6 5.6 0 0 0 6.7 12.7a3.4 3.4 0 0 0 .3 5.8Z"/></svg>`,
        fog: `<svg viewBox="0 0 24 24" ${s}><path d="M4 9.5h13M4 13h16M4 16.5h11M7 20h9"/></svg>`,
        drizzle: `<svg viewBox="0 0 24 24" ${s}><path d="M7 13.5h9.5a3.8 3.8 0 0 0 .5-7.5A5.6 5.6 0 0 0 6.7 8a3.4 3.4 0 0 0 .3 5.5Z"/><path d="M9 18v2.4M13 18v2.4M17 18v2.4"/></svg>`,
        rain: `<svg viewBox="0 0 24 24" ${s}><path d="M7 12.5h9.5a3.8 3.8 0 0 0 .5-7.5A5.6 5.6 0 0 0 6.7 7a3.4 3.4 0 0 0 .3 5.5Z"/><path d="M8 17l-1.4 3M13 17l-1.4 3M18 17l-1.4 3"/></svg>`,
        snow: `<svg viewBox="0 0 24 24" ${s}><path d="M7 12.5h9.5a3.8 3.8 0 0 0 .5-7.5A5.6 5.6 0 0 0 6.7 7a3.4 3.4 0 0 0 .3 5.5Z"/><path d="M9 17v4M7 18.3l4 1.4M13 17v4M11 18.3l4 1.4M17 17v4M15 18.3l4 1.4"/></svg>`,
        storm: `<svg viewBox="0 0 24 24" ${s}><path d="M7 11.5h9.5a3.8 3.8 0 0 0 .5-7.5A5.6 5.6 0 0 0 6.7 6a3.4 3.4 0 0 0 .3 5.5Z"/><path d="M13 15l-2.6 4h2.4L11 22"/></svg>`,
    };
    return icons[kind] || icons.cloud;
}

// ---- state -------------------------------------------------------
let wcUnit = localStorage.getItem(STORAGE_KEY) || "f"; // change default to "c" if you prefer
let wcLastData = null;

function wcCtoF(c){ return c * 9/5 + 32; }
function wcFmtTemp(c){
    const v = wcUnit === "f" ? wcCtoF(c) : c;
    return Math.round(v);
}

function renderWeatherCard(data){
    const root = document.getElementById("weatherCard");
    wcLastData = data;
    const { place, current, daily, hourly } = data;
    const info = codeInfo(current.weather_code, current.is_day);

    root.style.setProperty("--accent", info.accent);

    root.innerHTML = `
    <div class="wc-top">
      <div class="wc-place">
        ${place}
        <span class="wc-updated">Updated ${new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</span>
      </div>
      <div class="wc-icon">${weatherIcon(info.icon)}</div>
    </div>

    <div class="wc-temp-row">
      <div class="wc-temp">${wcFmtTemp(current.temperature_2m)}°</div>
      <div class="wc-unit" id="wcUnitToggle" title="Toggle °C/°F">${wcUnit === "f" ? "F" : "C"}</div>
    </div>
    <div class="wc-condition">${info.label}</div>
    <div class="wc-hilo">H:${wcFmtTemp(daily.temperature_2m_max[0])}°  L:${wcFmtTemp(daily.temperature_2m_min[0])}°</div>

    <div class="wc-strip">
      ${hourly.map(h => {
        const hi = codeInfo(h.code, h.isDay);
        return `<div class="wc-hour">
          <span>${h.label}</span>
          ${weatherIcon(hi.icon)}
          <b>${wcFmtTemp(h.temp)}°</b>
        </div>`;
    }).join("")}
    </div>
  `;

    document.getElementById("wcUnitToggle").addEventListener("click", () => {
        wcUnit = wcUnit === "f" ? "c" : "f";
        localStorage.setItem(STORAGE_KEY, wcUnit);
        renderWeatherCard(wcLastData);
    });
}

function showWeatherCardState(msg, isError, showRetry){
    const root = document.getElementById("weatherCard");
    root.style.removeProperty("--accent");
    root.innerHTML = `<div class="wc-state${isError ? ' error':''}">${msg}${
        showRetry ? '<div><button class="wc-retry" id="wcRetry">Try again</button></div>' : ''
    }</div>`;
    if (showRetry) document.getElementById("wcRetry").addEventListener("click", initWeatherCard);
}

// ---- data fetching -------------------------------------------------
async function fetchWeather(lat, lon, label){
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code,is_day` +
        `&hourly=temperature_2m,weather_code,is_day` +
        `&daily=temperature_2m_max,temperature_2m_min` +
        `&temperature_unit=celsius&timezone=auto&forecast_days=1`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather request failed");
    const d = await res.json();

    // build a "next few hours" strip starting from the current hour
    const nowIdx = d.hourly.time.findIndex(t => t === d.current.time);
    const startIdx = nowIdx === -1 ? 0 : nowIdx;
    const hourly = [1,2,3,4].map(offset => {
        const idx = startIdx + offset;
        const dt = new Date(d.hourly.time[idx]);
        return {
            label: dt.toLocaleTimeString([], {hour:'numeric'}).replace(' ',''),
            temp: d.hourly.temperature_2m[idx],
            code: d.hourly.weather_code[idx],
            isDay: d.hourly.is_day[idx],
        };
    });

    return {
        place: label,
        current: d.current,
        daily: d.daily,
        hourly,
    };
}

async function initWeatherCard(){
    showWeatherCardState("Loading forecast…");
    try{
        const data = await fetchWeather(LOCATION.lat, LOCATION.lon, LOCATION.label);
        renderWeatherCard(data);
    } catch(err){
        showWeatherCardState("Couldn't load weather.", true, true);
    }
}

document.addEventListener("DOMContentLoaded", initWeatherCard);