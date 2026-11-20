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
          }, {
            id: 987655,
            title: "Conteúdo adulto",
            adult: true,
            genre_ids: [27]
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

test("TMDB limita pedidos simultâneos de temporadas e mantém todos os episódios", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.TMDB_API_KEY;
  process.env.TMDB_API_KEY = "test-key";
  let active = 0;
  let maxActive = 0;
  globalThis.fetch = async rawUrl => {
    const url = new URL(String(rawUrl));
    if (url.pathname === "/3/tv/987656") {
      return {
        ok: true,
        async json() {
          return {
            id: 987656,
            name: "Série de teste",
            seasons: Array.from({ length: 7 }, (_, index) => ({
              season_number: index + 1
            }))
          };
        }
      };
    }
    const parts = url.pathname.split("/");
    if (parts.length !== 6 || parts[1] !== "3" || parts[2] !== "tv" ||
        parts[3] !== "987656" || parts[4] !== "season") {
      return { ok: false, status: 404 };
    }
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active -= 1;
    const season = Number(parts[5]);
    return {
      ok: true,
      async json() {
        return {
          episodes: [{
            id: season * 100,
            season_number: season,
            episode_number: 1,
            name: `Episódio da temporada ${season}`
          }]
        };
      }
    };
  };
  try {
    const meta = await tmdbConnector.getMeta({
      type: "series",
      id: "tmdb:series:987656",
      language: "pt-PT"
    });
    assert.equal(meta.videos.length, 7);
    assert.ok(maxActive <= 4, `Concorrência máxima inesperada: ${maxActive}`);
    assert.deepEqual(meta.videos.map(video => video.season), [1, 2, 3, 4, 5, 6, 7]);
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
        { source_id: 3, name: "Outra região", type: "sub", region: "US", web_url: "https://provider.example/title/3" },
        { source_id: 4, name: "Serviço BR", type: "free", region: "BR", web_url: "https://provider.example/title/4" }
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

    const brazil = await watchmodeConnector.getStreams({
      type: "movie",
      id: "tmdb:movie:987654",
      region: "BR"
    });
    assert.equal(brazil.length, 1);
    assert.equal(brazil[0].name, "Serviço BR");
    assert.equal(brazil[0].region, "BR");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.WATCHMODE_API_KEY;
    else process.env.WATCHMODE_API_KEY = oldKey;
    if (oldRegions === undefined) delete process.env.WATCHMODE_REGIONS;
    else process.env.WATCHMODE_REGIONS = oldRegions;
  }
});
