import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/addon/[...path].js";

function response() {
  const headers = {};
  return {
    headers,
    statusCode: 200,
    body: undefined,
    ended: false,
    setHeader(name, value) { headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    end() { this.ended = true; return this; }
  };
}

test("endpoint publica manifest Stremio e os catálogos VINOVIM", async () => {
  const res = response();
  await handler({
    method: "GET",
    headers: { host: "vinovim.test", "x-forwarded-proto": "https" },
    query: { path: ["manifest.json"] }
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, "pt.vinovim.aggregator");
  assert.ok(res.body.catalogs.some(c => c.id === "tmdb.movie-animation"));
  assert.equal(res.headers["access-control-allow-origin"], "*");
  assert.match(res.headers["cache-control"], /s-maxage=3600/);
});

test("endpoint responde ao preflight CORS", async () => {
  const res = response();
  await handler({ method: "OPTIONS", headers: {}, query: {} }, res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
  assert.equal(res.headers["access-control-allow-methods"], "GET, OPTIONS");
});

test("endpoint descodifica parâmetros de pesquisa do catálogo", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.TMDB_API_KEY;
  process.env.TMDB_API_KEY = "route-test-key";
  let requestedUrl = "";
  globalThis.fetch = async url => {
    requestedUrl = String(url);
    return {
      ok: true,
      async json() {
        return { results: [{ id: 321, title: "Resultado de teste" }] };
      }
    };
  };
  try {
    const res = response();
    await handler({
      method: "GET",
      headers: { host: "vinovim.test", "x-forwarded-proto": "https" },
      query: { path: ["catalog", "movie", "tmdb.movie-search", "search=Matrix%20Reloaded.json"] }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.metas[0].id, "tmdb:movie:321");
    const url = new URL(requestedUrl);
    assert.equal(url.pathname, "/3/search/movie");
    assert.equal(url.searchParams.get("query"), "Matrix Reloaded");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.TMDB_API_KEY;
    else process.env.TMDB_API_KEY = oldKey;
  }
});
