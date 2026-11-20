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
  let logo;
  try { if (baseUrl) logo = new URL("/icon.svg", baseUrl).toString(); } catch {}
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
    ...(logo ? { logo } : {}),
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
      const result = await connector.getMeta({ ...options, type: normalizedType, id });
      const meta = normalizeMeta(result?.meta || result, normalizedType);
      // Nunca devolver metadados de outro título por engano ou por um conector
      // que não reconheça o identificador solicitado.
      if (meta && meta.id === String(id) && meta.type === normalizedType) return meta;
    } catch (error) {
      console.warn(`[VINOVIM] ${connector.id} meta:`, error?.message || error);
    }
  }
  return null;
}

const cleanText = (value, max = 300) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

function normalizeStream(raw, connector) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const url = validWebUrl(raw.url) ? new URL(raw.url).toString() : null;
  const externalUrl = validWebUrl(raw.externalUrl) ? new URL(raw.externalUrl).toString() : null;
  const ytId = typeof raw.ytId === "string" && /^[a-zA-Z0-9_-]{6,20}$/.test(raw.ytId)
    ? raw.ytId : null;
  const infoHash = typeof raw.infoHash === "string" && /^[a-f0-9]{40}$/i.test(raw.infoHash)
    ? raw.infoHash.toLowerCase() : null;
  // Um link externo é uma página oficial, não um ficheiro de vídeo reproduzível.
  if (!url && !externalUrl && !ytId && !infoHash) return null;
  const sourceType = externalUrl && !url && !ytId && !infoHash
    ? "official"
    : ["authorized", "personal"].includes(connector.sourceType) ? connector.sourceType : null;
  // Não assumir que um conector desconhecido tem autorização para servir vídeo.
  if (!sourceType) return null;
  const stream = {
    providerId: connector.id,
    sourceType,
    ...(cleanText(raw.name, 100) ? { name: cleanText(raw.name, 100) } : {}),
    ...(cleanText(raw.title, 160) ? { title: cleanText(raw.title, 160) } : {}),
    ...(cleanText(raw.description, 500) ? { description: cleanText(raw.description, 500) } : {}),
    ...(url ? { url } : {}),
    ...(externalUrl ? { externalUrl } : {}),
    ...(ytId ? { ytId } : {}),
    ...(infoHash ? { infoHash } : {}),
    ...(Number.isInteger(raw.fileIdx) && raw.fileIdx >= 0 ? { fileIdx: raw.fileIdx } : {}),
    ...(cleanText(raw.quality, 32) ? { quality: cleanText(raw.quality, 32) } : {}),
    ...(cleanText(raw.language, 32) ? { language: cleanText(raw.language, 32) } : {}),
    ...(cleanText(raw.region, 2) ? { region: cleanText(raw.region, 2).toUpperCase() } : {}),
    ...(cleanText(raw.format, 32) ? { format: cleanText(raw.format, 32) } : {})
  };
  if (Array.isArray(raw.subtitles)) {
    stream.subtitles = raw.subtitles.slice(0, 20).flatMap(sub => {
      if (!sub || typeof sub !== "object" || !validWebUrl(sub.url)) return [];
      const lang = cleanText(sub.lang || sub.language, 12);
      return [{ url: new URL(sub.url).toString(), ...(lang ? { lang } : {}) }];
    });
  }
  return stream;
}

export async function getStreams(type, id, options = {}) {
  const normalizedType = safeType(type);
  if (!normalizedType) return [];
  const sources = enabled().filter(c => typeof c.getStreams === "function");
  const batches = await Promise.allSettled(sources.map(c =>
    Promise.resolve().then(() => c.getStreams({ ...options, type: normalizedType, id }))
  ));
  const streams = [];
  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index];
    if (batch.status !== "fulfilled") continue;
    const connector = sources[index];
    for (const raw of Array.isArray(batch.value) ? batch.value : batch.value?.streams || []) {
      const stream = normalizeStream(raw, connector);
      if (stream) streams.push(stream);
    }
  }
  const seen = new Set();
  return streams.filter(stream => {
    const key = stream.url || stream.ytId || stream.infoHash || stream.externalUrl;
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
