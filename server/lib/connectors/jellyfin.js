import { createHmac, timingSafeEqual } from "node:crypto";

const timeoutMs = 8000;
const cache = new Map();
const pending = new Map();
const cacheGet = key => {
  const entry = cache.get(key);
  if (!entry || entry.expires <= Date.now()) { cache.delete(key); return null; }
  return entry.value;
};
const cacheSet = (key, value) => {
  if (cache.size >= 200) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expires: Date.now() + 60_000 });
};
const text = value => typeof value === "string" ? value.trim() : "";
const parseId = id => {
  const match = /^jellyfin:(movie|series|episode):([a-f0-9-]{8,64})$/i.exec(String(id || ""));
  return match ? { kind: match[1].toLowerCase(), itemId: match[2] } : null;
};
const configured = () => Boolean(text(process.env.JELLYFIN_URL) && text(process.env.JELLYFIN_API_KEY));
const baseUrl = () => {
  const raw = text(process.env.JELLYFIN_URL);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return null;
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch { return null; }
};
async function jellyfin(path, params = {}) {
  const base = baseUrl();
  const key = text(process.env.JELLYFIN_API_KEY);
  if (!base || !key) throw new Error("Jellyfin não configurado ou URL inseguro");
  const url = new URL(base + path);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
  }
  const response = await fetch(url, {
    headers: { "X-Emby-Token": key, Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`Jellyfin respondeu HTTP ${response.status}`);
  return response.json();
}
function publicBase(options = {}) {
  const configuredBase = text(process.env.VINOVIM_PUBLIC_URL);
  if (configuredBase) {
    try { const u = new URL(configuredBase); return u.protocol === "https:" ? u.toString().replace(/\/$/, "") : null; }
    catch { return null; }
  }
  const candidate = text(options.baseUrl);
  try { const u = new URL(candidate); return u.protocol === "https:" ? u.toString().replace(/\/$/, "") : null; }
  catch { return null; }
}
function signItem(itemId, secret, expires) {
  const payload = Buffer.from(JSON.stringify({ itemId, exp: expires })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
export function verifyJellyfinPlaybackToken(token, secret, now = Date.now()) {
  if (!token || !secret || typeof token !== "string" || token.length > 2048) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", secret).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!/^[a-f0-9-]{8,64}$/i.test(data.itemId) || !Number.isSafeInteger(data.exp) || data.exp < now || data.exp > now + 16 * 60_000) return null;
    return data.itemId;
  } catch { return null; }
}
const itemMeta = (item, kind) => ({
  id: `jellyfin:${kind}:${item.Id}`,
  type: kind === "movie" ? "movie" : "series",
  name: text(item.Name) || "Sem título",
  ...(text(item.Overview) ? { description: text(item.Overview) } : {}),
  ...(Number.isInteger(item.ProductionYear) ? { year: item.ProductionYear } : {}),
  ...(Array.isArray(item.Genres) ? { genres: item.Genres.filter(x => typeof x === "string").slice(0, 20) } : {}),
  ...(Number.isFinite(item.CommunityRating) ? { imdbRating: String(item.CommunityRating.toFixed(1)) } : {})
});

export function createJellyfinConnector() {
  return {
    id: "jellyfin",
    sourceType: "personal",
    enabled: configured(),
    catalogs: [
      { id: "movies", name: "A minha biblioteca — Filmes", types: ["movie"] },
      { id: "series", name: "A minha biblioteca — Séries", types: ["series"] },
      { id: "search", name: "Pesquisar na minha biblioteca", types: ["movie", "series"], extra: [{ name: "search", isRequired: true }] }
    ],
    async getCatalog({ type, catalog, extra = {} }) {
      if (!configured() || (catalog !== "search" && catalog !== (type === "movie" ? "movies" : "series"))) return [];
      const search = text(extra.search || extra.searchTerm).slice(0, 100);
      if (catalog === "search" && !search) return [];
      const kind = type === "movie" ? "Movie" : "Series";
      const params = {
        IncludeItemTypes: kind,
        Recursive: true,
        SortBy: "SortName",
        SortOrder: "Ascending",
        Limit: 100,
        Fields: "Overview,Genres,ProductionYear,CommunityRating,ProviderIds",
        ...(search ? { SearchTerm: search } : {})
      };
      const result = await jellyfin("/Items", params);
      return (Array.isArray(result.Items) ? result.Items : []).map(item => itemMeta(item, type));
    },
    async getMeta({ type, id }) {
      const parsed = parseId(id);
      if (!configured() || !parsed || (type === "movie" && parsed.kind !== "movie") || (type === "series" && !["series", "episode"].includes(parsed.kind))) return null;
      if (parsed.kind === "episode") {
        const item = await jellyfin(`/Items/${encodeURIComponent(parsed.itemId)}`, { Fields: "Overview,MediaSources,MediaStreams,ParentIndexNumber,IndexNumber,RunTimeTicks" });
        return {
          id: String(id), type: "series", name: text(item.Name) || "Episódio",
          ...(text(item.Overview) ? { description: text(item.Overview) } : {}),
          ...(Number.isInteger(item.ParentIndexNumber) ? { season: item.ParentIndexNumber } : {}),
          ...(Number.isInteger(item.IndexNumber) ? { episode: item.IndexNumber } : {})
        };
      }
      const item = await jellyfin(`/Items/${encodeURIComponent(parsed.itemId)}`, { Fields: "Overview,Genres,ProductionYear,CommunityRating,ProviderIds" });
      const meta = itemMeta(item, parsed.kind);
      if (parsed.kind === "series") {
        const result = await jellyfin(`/Shows/${encodeURIComponent(parsed.itemId)}/Episodes`, {
          UserId: text(process.env.JELLYFIN_USER_ID) || undefined,
          Fields: "Overview,ParentIndexNumber,IndexNumber,PremiereDate",
          IsMissing: false
        });
        meta.videos = (Array.isArray(result.Items) ? result.Items : []).slice(0, 500).map(ep => ({
          id: `jellyfin:episode:${ep.Id}`,
          title: text(ep.Name) || "Episódio",
          season: Number.isInteger(ep.ParentIndexNumber) ? ep.ParentIndexNumber : 0,
          episode: Number.isInteger(ep.IndexNumber) ? ep.IndexNumber : 0,
          ...(text(ep.Overview) ? { overview: text(ep.Overview) } : {}),
          ...(text(ep.PremiereDate) ? { released: text(ep.PremiereDate) } : {})
        }));
      }
      return meta;
    },
    async getStreams({ type, id, baseUrl: requestBase }) {
      const parsed = parseId(id);
      if (!configured() || !parsed || !["movie", "episode"].includes(parsed.kind)) return [];
      if ((type === "movie" && parsed.kind !== "movie") || (type === "series" && parsed.kind !== "episode")) return [];
      const secret = text(process.env.JELLYFIN_PROXY_SECRET);
      const origin = publicBase({ baseUrl: requestBase });
      if (!secret || secret.length < 32 || !origin) return [];
      const token = signItem(parsed.itemId, secret, Date.now() + 15 * 60_000);
      return [{
        name: "Jellyfin — Biblioteca pessoal",
        title: "Reprodução original",
        description: "Ficheiro da tua biblioteca Jellyfin",
        url: `${origin}/api/addon/jellyfin/${encodeURIComponent(parsed.itemId)}?token=${encodeURIComponent(token)}`,
        format: "mp4"
      }];
    },
    async health() {
      if (!configured()) return false;
      await jellyfin("/System/Info/Public");
      return true;
    }
  };
}
export const jellyfinConnector = createJellyfinConnector();
