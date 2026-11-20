import test from "node:test";
import assert from "node:assert/strict";
import { tmdbConnector } from "../lib/connectors/tmdb.js";
import { watchmodeConnector } from "../lib/connectors/watchmode.js";

test("TMDB devolve metadados normalizados e aplica filtros de descoberta", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.TMDB_API_KEY;
  process.env.TMDB_API_KEY = "test-key";
  let requestedUrl = "";
  globalThis.fetch = async url => {
    requestedUrl = String(url);
    return {
      ok: true,
      async json() {
        return {
          results: [{
            id: 987654,
            title: "Filme de teste",
            release_date: "2026-01-02",
            poster_path: "/poster.jpg",
            backdrop_path: "/backdrop.jpg",
            overview: "Sinopse de teste",
            vote_average: 7.8,
            genre_ids: [16, 10751, 10762]
          }]
        };
      }
    };
  };
  try {
    const items = await tmdbConnector.getCatalog({
      type: "movie",
      catalog: "movie-trending",
      extra: { language: "pt-BR" }
    });
    assert.equal(items.length, 1);
    assert.equal(items[0].id, "tmdb:movie:987654");
    assert.equal(items[0].name, "Filme de teste");
    assert.equal(items[0].imdbRating, "7.8");
    assert.ok(items[0].genres.includes("Animation"));
    assert.ok(items[0].genres.includes("Family"));
    assert.match(items[0].poster, /^https:\/\/image\.tmdb\.org\//);

    assert.equal(new URL(requestedUrl).searchParams.get("language"), "pt-BR");
    await tmdbConnector.getCatalog({ type: "movie", catalog: "movie-animation", extra: { language: "en" } });
    assert.match(requestedUrl, /with_genres=16/);
    assert.match(requestedUrl, /discover\/movie/);
    assert.equal(new URL(requestedUrl).searchParams.get("language"), "en-US");
    const kids = await tmdbConnector.getCatalog({ type: "series", catalog: "series-kids", extra: {} });
    assert.ok(kids[0].genres.includes("Kids"));
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.TMDB_API_KEY;
    else process.env.TMDB_API_KEY = oldKey;
  }
});

test("Watchmode só devolve links HTTPS da região configurada", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.WATCHMODE_API_KEY;
  const oldRegions = process.env.WATCHMODE_REGIONS;
  process.env.WATCHMODE_API_KEY = "test-key";
  process.env.WATCHMODE_REGIONS = "PT";
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return [
        { source_id: 1, name: "Serviço PT", type: "sub", region: "PT", web_url: "https://provider.example/title/1" },
        { source_id: 2, name: "Link inseguro", type: "free", region: "PT", web_url: "javascript:alert(1)" },
        { source_id: 3, name: "Outra região", type: "sub", region: "US", web_url: "https://provider.example/title/3" }
      ];
    }
  });
  try {
    const streams = await watchmodeConnector.getStreams({
      type: "movie",
      id: "tmdb:movie:987654"
    });
    assert.equal(streams.length, 1);
    assert.equal(streams[0].name, "Serviço PT");
    assert.equal(streams[0].region, "PT");
    assert.equal(streams[0].externalUrl, "https://provider.example/title/1");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.WATCHMODE_API_KEY;
    else process.env.WATCHMODE_API_KEY = oldKey;
    if (oldRegions === undefined) delete process.env.WATCHMODE_REGIONS;
    else process.env.WATCHMODE_REGIONS = oldRegions;
  }
});
