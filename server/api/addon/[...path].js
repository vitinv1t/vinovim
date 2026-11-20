// Endpoint Stremio-compatible do VINOVIM.
// URL pública: /api/addon/manifest.json
import "../../lib/vinovim-connectors.js";
import { manifest, getCatalog, getMeta, getStreams } from "../../lib/vinovim-addon.js";
import { proxyJellyfinPlayback } from "../../lib/jellyfin-proxy.js";

const json = (res, status, value, cache = "no-store") => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", cache);
  return res.status(status).json(value);
};

function catalogRequest(parts) {
  const segments = parts.slice(2);
  const last = segments[segments.length - 1] || "";
  const hasExtra = last.includes("=") && last.endsWith(".json");
  const catalogId = (hasExtra ? segments.slice(0, -1) : segments.slice(0, -1)).join("/") ||
    (hasExtra ? "" : last.replace(/\.json$/, ""));
  const extra = {};
  if (hasExtra) {
    for (const pair of last.slice(0, -5).split("&")) {
      const at = pair.indexOf("=");
      if (at < 1) continue;
      try {
        extra[decodeURIComponent(pair.slice(0, at))] = decodeURIComponent(pair.slice(at + 1));
      } catch {}
    }
  }
  return { catalogId, extra };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  try {
    const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
    if (parts[0] === "jellyfin" && parts.length === 2 && /^[a-f0-9-]{8,64}$/i.test(parts[1])) {
      if (!["GET", "HEAD"].includes(req.method)) return res.status(405).end();
      return proxyJellyfinPlayback(req, res, parts[1]);
    }
    if (req.method !== "GET") return res.status(405).end();
    if (parts.length === 1 && parts[0] === "manifest.json")
      return json(res, 200, manifest(`${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`), "public, max-age=3600, s-maxage=3600");

    if (parts[0] === "catalog" && parts.length >= 3) {
      const type = parts[1];
      const { catalogId, extra } = catalogRequest(parts);
      const requestedLanguage = typeof req.query.language === "string" ? req.query.language : "pt-PT";
      const language = ["pt-PT", "pt-BR", "en", "es"].includes(requestedLanguage) ? requestedLanguage : "pt-PT";
      const metas = await getCatalog(type, catalogId, { ...extra, language });
      return json(res, 200, { metas }, "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
    }

    if ((parts[0] === "meta" || parts[0] === "stream") && parts.length === 3) {
      if (!parts[2].endsWith(".json"))
        return json(res, 400, parts[0] === "meta" ? { meta: null } : { streams: [] });
      const type = parts[1];
      let id;
      try { id = decodeURIComponent(parts[2].slice(0, -5)); }
      catch { return json(res, 400, parts[0] === "meta" ? { meta: null } : { streams: [] }); }
      if (parts[0] === "meta") {
        const requestedLanguage = typeof req.query.language === "string" ? req.query.language : "pt-PT";
        const language = ["pt-PT", "pt-BR", "en", "es"].includes(requestedLanguage) ? requestedLanguage : "pt-PT";
        const meta = await getMeta(type, id, { language });
        return json(res, meta ? 200 : 404, { meta }, meta ? "public, max-age=300, s-maxage=300, stale-while-revalidate=60" : "no-store");
      }
      const requestedRegion = typeof req.query.region === "string" ? req.query.region.toUpperCase() : "";
      const region = /^[A-Z]{2}$/.test(requestedRegion) ? requestedRegion : undefined;
      const streams = await getStreams(type, id, { region });
      // Respostas vazias podem resultar de falhas temporárias ou ausência de credenciais;
      // mantê-las em cache por pouco tempo evita esconder fontes após recuperação do fornecedor.
      const cache = streams.length
        ? "public, max-age=120, s-maxage=300, stale-while-revalidate=60"
        : "public, max-age=15, s-maxage=30";
      return json(res, 200, { streams }, cache);
    }

    return json(res, 404, { error: "Rota VINOVIM não encontrada" });
  } catch (error) {
    console.error("[VINOVIM addon]", error);
    return json(res, 500, { error: "Erro interno do agregador" });
  }
}
