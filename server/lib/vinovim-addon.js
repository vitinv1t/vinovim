// VINOVIM — núcleo agregador de addons autorizados.
// Os conectores são registados pelo próprio código do servidor; não aceitamos URLs
// arbitrários enviados pelo cliente (evita SSRF e mantém as fontes auditáveis).

const connectors = new Map();
const ID = /^[a-z0-9][a-z0-9._-]{1,63}$/i;

export function registerConnector(connector) {
  if (!connector || !ID.test(String(connector.id || "")) || connectors.has(connector.id))
    throw new Error("Identificador de conector inválido ou repetido");
  if (typeof connector.getCatalog !== "function") throw new Error("Conector sem getCatalog()");
  connectors.set(connector.id, connector);
}

const enabled = () => [...connectors.values()].filter(c => c.enabled !== false);
const safeType = type => type === "series" ? "series" : type === "movie" ? "movie" : null;
const validWebUrl = value => {
  try { const u = new URL(value); return u.protocol === "https:"; }
  catch { return false; }
};

export function manifest(baseUrl) {
  const catalogs = enabled().flatMap(c =>
    (c.catalogs || []).flatMap(cat =>
      (cat.types || ["movie", "series"]).map(type => ({
        type, id: `${c.id}.${cat.id}`, name: cat.name || cat.id,
        ...(cat.extra ? { extra: cat.extra } : {})
      }))
    )
  );
  return {
    id: "pt.vinovim.aggregator",
    version: "0.1.0",
    name: "VINOVIM",
    description: "Agregador de catálogos e fontes configuradas no Vinovim.",
    logo: "",
    resources: ["catalog", "meta", "stream"],
    types: ["movie", "series"],
    catalogs,
    idPrefixes: []
  };
}

function normalizeMeta(item, fallbackType) {
  if (!item || !item.id || !item.name) return null;
  return {
    ...item,
    id: String(item.id),
    type: safeType(item.type) || fallbackType,
    name: String(item.name),
    poster: item.poster && validWebUrl(item.poster) ? new URL(item.poster).toString() : undefined,
    background: item.background && validWebUrl(item.background) ? new URL(item.background).toString() : undefined
  };
}

export async function getCatalog(type, catalogId, extra = {}) {
  const normalizedType = safeType(type);
  if (!normalizedType) return [];
  const dot = catalogId.indexOf(".");
  if (dot < 1) return [];
  const connectorId = catalogId.slice(0, dot);
  const localId = catalogId.slice(dot + 1);
  const connector = enabled().find(c => c.id === connectorId);
  const definition = connector?.catalogs?.find(c => c.id === localId);
  if (!connector || !definition || !(definition.types || ["movie", "series"]).includes(normalizedType)) return [];

  const results = await connector.getCatalog({ type: normalizedType, catalog: localId, extra });
  const unique = new Map();
  for (const raw of Array.isArray(results) ? results : results?.metas || []) {
    const item = normalizeMeta(raw, normalizedType);
    if (item && !unique.has(item.id)) unique.set(item.id, item);
  }
  return [...unique.values()];
}

export async function getMeta(type, id, options = {}) {
  const normalizedType = safeType(type);
  if (!normalizedType) return null;
  for (const connector of enabled()) {
    if (typeof connector.getMeta !== "function") continue;
    try {
      const result = await connector.getMeta({ type: normalizedType, id, ...options });
      const meta = normalizeMeta(result?.meta || result, normalizedType);
      if (meta) return meta;
    } catch (error) {
      console.warn(`[VINOVIM] ${connector.id} meta:`, error?.message || error);
    }
  }
  return null;
}

export async function getStreams(type, id, options = {}) {
  const normalizedType = safeType(type);
  if (!normalizedType) return [];
  const batches = await Promise.allSettled(enabled().filter(c => typeof c.getStreams === "function")
    .map(c => c.getStreams({ type: normalizedType, id, ...options })));
  const streams = [];
  for (const batch of batches) {
    if (batch.status !== "fulfilled") continue;
    for (const stream of Array.isArray(batch.value) ? batch.value : batch.value?.streams || []) {
      if (!stream || typeof stream !== "object") continue;
      const url = validWebUrl(stream.url) ? new URL(stream.url).toString() : null;
      const externalUrl = validWebUrl(stream.externalUrl) ? new URL(stream.externalUrl).toString() : null;
      const ytId = typeof stream.ytId === "string" && /^[a-zA-Z0-9_-]{6,20}$/.test(stream.ytId)
        ? stream.ytId
        : null;
      if (!url && !externalUrl && !ytId) continue;
      streams.push({
        ...stream,
        ...(url ? { url } : { url: undefined }),
        ...(externalUrl ? { externalUrl } : { externalUrl: undefined }),
        ...(ytId ? { ytId } : { ytId: undefined })
      });
    }
  }
  const seen = new Set();
  return streams.filter(stream => {
    const key = stream.url || stream.ytId || stream.externalUrl;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function connectorHealth() {
  return Promise.all(enabled().map(async connector => {
    const started = Date.now();
    try {
      const result = typeof connector.health === "function" ? await connector.health() : true;
      return { id: connector.id, status: result === false ? "unavailable" : "ok", latencyMs: Date.now() - started };
    } catch (error) {
      return { id: connector.id, status: "error", latencyMs: Date.now() - started, error: String(error?.message || error).slice(0, 160) };
    }
  }));
}
