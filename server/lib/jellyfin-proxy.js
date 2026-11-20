import { Readable } from "node:stream";
import { verifyJellyfinPlaybackToken } from "./connectors/jellyfin.js";

const jsonError = (res, status, message) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ error: message }));
};

export async function proxyJellyfinPlayback(req, res, itemId) {
  const secret = process.env.JELLYFIN_PROXY_SECRET || "";
  const verifiedId = verifyJellyfinPlaybackToken(req.query?.token, secret);
  if (!verifiedId || verifiedId !== itemId) return jsonError(res, 401, "Token de reprodução inválido ou expirado");

  let base;
  try {
    base = new URL(process.env.JELLYFIN_URL || "");
    if (base.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(base.hostname))
      return jsonError(res, 503, "O servidor Jellyfin tem de usar HTTPS");
    if (!process.env.JELLYFIN_API_KEY) return jsonError(res, 503, "Jellyfin não configurado");
  } catch { return jsonError(res, 503, "URL do Jellyfin inválido"); }

  base.pathname = base.pathname.replace(/\/+$/, "");
  const upstreamUrl = new URL(`${base.toString().replace(/\/$/, "")}/Videos/${encodeURIComponent(itemId)}/stream`);
  upstreamUrl.searchParams.set("static", "true");
  const controller = new AbortController();
  res.on("close", () => controller.abort());
  try {
    const headers = { "X-Emby-Token": process.env.JELLYFIN_API_KEY };
    if (typeof req.headers.range === "string" && /^bytes=\d*-\d*(,\d*-\d*)*$/.test(req.headers.range))
      headers.Range = req.headers.range;
    const upstream = await fetch(upstreamUrl, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      headers,
      redirect: "manual",
      signal: controller.signal
    });
    if (upstream.status >= 300 && upstream.status < 400) return jsonError(res, 502, "O Jellyfin devolveu um redirecionamento inesperado");
    if (!upstream.ok && upstream.status !== 206) return jsonError(res, upstream.status === 404 ? 404 : 502, "Não foi possível obter o ficheiro do Jellyfin");

    res.statusCode = upstream.status;
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");
    for (const header of ["content-type", "content-length", "content-range", "last-modified", "etag"]) {
      const value = upstream.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    if (req.method === "HEAD" || !upstream.body) return res.end();
    Readable.fromWeb(upstream.body).on("error", () => {
      if (!res.writableEnded) res.destroy();
    }).pipe(res);
  } catch (error) {
    if (controller.signal.aborted) return;
    console.error("[VINOVIM Jellyfin proxy]", error?.message || error);
    if (!res.headersSent) jsonError(res, 502, "Falha de ligação ao servidor Jellyfin");
    else res.destroy();
  }
}
