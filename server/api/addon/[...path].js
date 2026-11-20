// Endpoint Stremio-compatible do VINOVIM.
// URL pública: /api/addon/manifest.json
import { manifest, getCatalog, getMeta, getStreams } from "../../lib/vinovim-addon.js";

const json = (res, status, value) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(value);
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
    if (parts.length === 1 && parts[0] === "manifest.json")
      return json(res, 200, manifest(`${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`));

    if (parts[0] === "catalog" && parts.length >= 3) {
      const type = parts[1], file = parts[parts.length - 1];
      const catalogId = parts.slice(2, -1).join("/");
      if (!file.endsWith(".json")) return json(res, 400, { metas: [] });
      const id = file.slice(0, -5);
      const metas = await getCatalog(type, catalogId || id, req.query);
      return json(res, 200, { metas });
    }

    if ((parts[0] === "meta" || parts[0] === "stream") && parts.length === 3) {
      const type = parts[1], id = decodeURIComponent(parts[2].replace(/\.json$/, ""));
      if (!parts[2].endsWith(".json")) return json(res, 400, parts[0] === "meta" ? { meta: null } : { streams: [] });
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
