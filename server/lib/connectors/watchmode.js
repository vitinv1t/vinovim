// Conector Watchmode: disponibilidade e links oficiais, nunca streams de vídeo.
const API = "https://api.watchmode.com/v1";
const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000;
const URL_OK = value => {
  try { const url = new URL(value); return url.protocol === "https:"; }
  catch { return false; }
};

async function getStreams({ type, id }) {
  const match = /^tmdb:(movie|series):(\d+)(?::\d+:\d+)?$/.exec(String(id || ""));
  if (!match || match[1] !== type) return [];
  const apiKey = process.env.WATCHMODE_API_KEY;
  if (!apiKey) return [];
  const cacheKey = `${id}:${process.env.WATCHMODE_REGIONS || "PT"}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.value;
  const wmId = `${type === "movie" ? "movie" : "tv"}-${match[2]}`;
  const url = new URL(`${API}/title/${wmId}/sources/`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", process.env.WATCHMODE_REGIONS || "PT");
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Watchmode respondeu HTTP ${response.status}`);
  const sources = await response.json();
  const result = (Array.isArray(sources) ? sources : []).filter(s => URL_OK(s.web_url)).map(s => ({
    name: s.name || "Serviço de streaming",
    title: s.type || "Disponibilidade",
    description: [s.type, s.price ? `${s.price} ${s.price_currency || ""}`.trim() : ""].filter(Boolean).join(" · ") || "Abrir no serviço oficial",
    externalUrl: s.web_url
  }));
  cache.set(cacheKey, { value: result, until: Date.now() + CACHE_TTL });
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  return result;
}

export const watchmodeConnector = {
  id: "watchmode",
  catalogs: [],
  getCatalog: async () => [],
  getStreams,
  health: async () => Boolean(process.env.WATCHMODE_API_KEY)
};
