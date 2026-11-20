// Conector Watchmode: disponibilidade e links oficiais, nunca streams de vídeo.
const API = "https://api.watchmode.com/v1";
const cache = new Map();
const pending = new Map();
const CACHE_TTL = 30 * 60 * 1000;
const MAX_CACHE_ENTRIES = 300;

const safeHttpsUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

function normalizeSource(source, region) {
  const webUrl = safeHttpsUrl(source?.web_url);
  if (!webUrl) return null;
  if (source.region && region && source.region.toUpperCase() !== region.toUpperCase()) return null;

  const kind = String(source.type || "").toLowerCase();
  const kindLabel = ({
    sub: "Subscrição",
    free: "Gratuito",
    rent: "Aluguer",
    buy: "Compra",
    tve: "Operador de TV"
  })[kind] || source.type || "Disponibilidade";
  const details = [
    kindLabel,
    source.format || "",
    source.price != null
      ? `${source.price} ${source.price_currency || ""}`.trim()
      : ""
  ].filter(Boolean);

  return {
    name: String(source.name || "Serviço de streaming"),
    title: kindLabel,
    description: details.join(" · "),
    externalUrl: webUrl,
    ...(source.source_id != null ? { sourceId: String(source.source_id) } : {}),
    ...(source.region ? { region: String(source.region).toUpperCase() } : {}),
    ...(source.format ? { format: String(source.format) } : {})
  };
}

async function getStreams({ type, id, region }) {
  // O formato movie-{tmdbId}/tv-{tmdbId} é aceite oficialmente pelo Watchmode.
  // Para episódios, o identificador base continua a ser o da série; a disponibilidade
  // devolvida é a do título/série, não uma garantia de disponibilidade episódio a episódio.
  const match = /^tmdb:(movie|series):(\d+)(?::\d+:\d+)?$/.exec(String(id || ""));
  if (!match || match[1] !== type) return [];
  const apiKey = process.env.WATCHMODE_API_KEY;
  if (!apiKey) return [];

  // A região escolhida na aplicação tem prioridade; a variável de ambiente
  // continua a servir de fallback e permite configurar uma região por instalação.
  const requestedRegion = String(region || "").trim().toUpperCase();
  const configuredRegions = String(process.env.WATCHMODE_REGIONS || "PT")
    .split(",")
    .map(value => value.trim().toUpperCase())
    .filter(value => /^[A-Z]{2}$/.test(value));
  const regions = /^[A-Z]{2}$/.test(requestedRegion)
    ? [requestedRegion]
    : configuredRegions;
  if (!regions.length) return [];

  // A disponibilidade Watchmode é por título/série, não por episódio individual.
  const cacheKey = `${type}:${match[2]}:${regions.join(",")}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.value;
  if (cached) cache.delete(cacheKey);
  if (pending.has(cacheKey)) return pending.get(cacheKey);

  const request = (async () => {
    const wmId = `${type === "movie" ? "movie" : "tv"}-${match[2]}`;
    const url = new URL(`${API}/title/${wmId}/sources/`);
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("regions", regions.join(","));
    const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Watchmode respondeu HTTP ${response.status}`);

    const sources = await response.json();
    const allowedRegions = new Set(regions);
    const normalized = (Array.isArray(sources) ? sources : [])
      .filter(source => !source.region || allowedRegions.has(String(source.region).toUpperCase()))
      .map(source => normalizeSource(source, regions.length === 1 ? regions[0] : null))
      .filter(Boolean);

    // Evita duplicados do mesmo serviço/link, mantendo ofertas diferentes quando o URL muda.
    const seen = new Set();
    const result = normalized.filter(source => {
      const key = `${source.sourceId || source.name}:${source.externalUrl}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    cache.set(cacheKey, { value: result, until: Date.now() + CACHE_TTL });
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    return result;
  })();
  pending.set(cacheKey, request);
  try {
    return await request;
  } finally {
    if (pending.get(cacheKey) === request) pending.delete(cacheKey);
  }
}

export const watchmodeConnector = {
  id: "watchmode",
  catalogs: [],
  getCatalog: async () => [],
  getStreams,
  health: async () => Boolean(process.env.WATCHMODE_API_KEY)
};
