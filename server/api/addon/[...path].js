// Endpoint Stremio-compatible do VINOVIM.
// URL pública: /api/addon/manifest.json
import "../../lib/vinovim-connectors.js";
import { manifest, getCatalog, getMeta, getStreams } from "../../lib/vinovim-addon.js";

const json = (res, status, value) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
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
  if (req.method !== "GET") return res.status(405).end();
  try {
    const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
    if (parts.length === 1 && parts[0] === "manifest.json")
      return json(res, 200, manifest(`${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`));

    if (parts[0] === "catalog" && parts.length >= 3) {
      const type = parts[1];
      const { catalogId, extra } = catalogRequest(parts);
      const metas = await getCatalog(type, catalogId, extra);
      return json(res, 200, { metas });
    }

    if ((parts[0] === "meta" || parts[0] === "stream") && parts.length === 3) {
      if (!parts[2].endsWith(".json"))
        return json(res, 400, parts[0] === "meta" ? { meta: null } : { streams: [] });
      const type = parts[1], id = decodeURIComponent(parts[2].slice(0, -5));
      if (parts[0] === "meta") {
        const meta = await getMeta(type, id);
        return json(res, meta ? 200 : 404, { meta });
      }
      return json(res, 200, { streams: await getStreams(type, id) });
    }

    return json(res, 404, { error: "Rota VINOVIM não encontrada" });
  } catch (error) {
    console.error("[VINOVIM addon]", error);
    return json(res, 500, { error: "Erro interno do agregador" });
  }
}
