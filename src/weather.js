// ── Venice Live Weather Sync ───────────────────────────────────────────────────
// Uses Open-Meteo (free, no API key). Fetches current Venice weather and maps
// WMO weather codes to the game's four weather states.

const VENICE_LAT = 45.4408;
const VENICE_LON = 12.3155;

function wmoToGame(code, windspeed) {
  if (code === 45 || code === 48) return 'fog';                       // Fog / rime fog
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'; // Drizzle / rain / showers
  if (code >= 71 && code <= 77) return 'fog';                        // Snow → treated as fog (rare Venice)
  if (code >= 95) return 'rain';                                      // Thunderstorm
  if (windspeed > 28) return 'wind';                                  // Strong wind
  return 'clear';
}

export async function fetchVeniceWeather() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${VENICE_LAT}&longitude=${VENICE_LON}` +
      `&current_weather=true&timezone=auto`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    const data = await res.json();
    const cw = data.current_weather || {};
    const code = cw.weathercode ?? 0;
    const wind = cw.windspeed ?? 0;
    const temp = cw.temperature ?? 18;
    return { gameWeather: wmoToGame(code, wind), temp, windspeed: wind, code, live: true };
  } catch {
    return { gameWeather: null, live: false };
  }
}
