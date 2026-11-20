import test from "node:test";
import assert from "node:assert/strict";
import { registerConnector, getCatalog, getMeta, getStreams, connectorHealth } from "../lib/vinovim-addon.js";

test("agregador normaliza catálogos e remove IDs duplicados", async () => {
  registerConnector({
    id: "test-catalog",
    catalogs: [{ id: "top", types: ["movie"] }],
    async getCatalog() {
      return [
        { id: "tt001", name: "Filme", type: "movie" },
        { id: "tt001", name: "Duplicado", type: "movie" },
        { id: "", name: "Inválido" }
      ];
    }
  });
  const items = await getCatalog("movie", "test-catalog.top");
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Filme");
});

test("agregador obtém metadados e streams válidos", async () => {
  registerConnector({
    id: "test-playback",
    sourceType: "authorized",
    catalogs: [],
    async getCatalog() { return []; },
    async getMeta() { return { id: "tt002", name: "Série", type: "series" }; },
    async getStreams() {
      return [
        { title: "HTTPS", url: "https://media.example/video.m3u8", quality: "1080p", language: "pt-PT", secret: "must-not-leak" },
        { title: "HTTP", url: "http://media.example/video.m3u8" },
        { title: "Duplicado", url: "https://media.example/video.m3u8" },
        { title: "Destino externo inválido", externalUrl: "javascript:alert(1)" },
        { title: "Destino externo válido", externalUrl: "https://provider.example/title/2" },
        { title: "Sem destino" }
      ];
    },
    async health() { return true; }
  });
  const meta = await getMeta("series", "tt002");
  assert.equal(meta.name, "Série");
  const streams = await getStreams("series", "tt002");
  assert.equal(streams.length, 2);
  assert.equal(streams[0].title, "HTTPS");
  assert.equal(streams[0].providerId, "test-playback");
  assert.equal(streams[0].sourceType, "authorized");
  assert.equal(streams[0].quality, "1080p");
  assert.equal(streams[0].secret, undefined);
  assert.ok(!streams.some(stream => stream.title === "HTTP"));
  assert.ok(streams.some(stream => stream.title === "Destino externo válido" && stream.sourceType === "official" && stream.providerId === "test-playback"));
  assert.ok(!streams.some(stream => stream.title === "Destino externo inválido"));
  const health = await connectorHealth();
  assert.ok(health.some(item => item.id === "test-playback" && item.status === "ok"));
});

test("agregador rejeita IDs de conectores repetidos", () => {
  assert.throws(() => registerConnector({ id: "test-catalog", catalogs: [], getCatalog() {} }));
});
test("metadados rejeitam imagens HTTP e preservam apenas URLs HTTPS", async () => {
  registerConnector({
    id: "test-metadata-urls",
    catalogs: [],
    async getCatalog() { return []; },
    async getMeta() {
      return {
        id: "tt003",
        name: "Imagem segura",
        type: "movie",
        poster: "http://unsafe.example/poster.jpg",
        background: "https://cdn.example/background.jpg"
      };
    }
  });
  const meta = await getMeta("movie", "tt003");
  assert.equal(meta.id, "tt003");
  assert.equal(meta.poster, undefined);
  assert.equal(meta.background, "https://cdn.example/background.jpg");
});

test("contrato de fontes valida hash, legendas e classifica biblioteca pessoal", async () => {
  registerConnector({
    id: "test-personal-library",
    sourceType: "personal",
    catalogs: [],
    async getCatalog() { return []; },
    async getStreams() {
      return [{
        name: "Biblioteca local",
        infoHash: "a".repeat(40),
        fileIdx: 0,
        subtitles: [
          { url: "https://subtitles.example/pt.srt", lang: "pt" },
          { url: "http://unsafe.example/en.srt", lang: "en" }
        ],
        behaviorHints: { notAllowed: true }
      }];
    }
  });
  const [stream] = await getStreams("movie", "local:123");
  assert.equal(stream.sourceType, "personal");
  assert.equal(stream.providerId, "test-personal-library");
  assert.equal(stream.infoHash, "a".repeat(40));
  assert.equal(stream.fileIdx, 0);
  assert.deepEqual(stream.subtitles, [{ url: "https://subtitles.example/pt.srt", lang: "pt" }]);
  assert.equal(stream.behaviorHints, undefined);
});

test("contrato rejeita hashes inválidos e URLs de reprodução inseguras", async () => {
  registerConnector({
    id: "test-invalid-source",
    catalogs: [],
    async getCatalog() { return []; },
    async getStreams() {
      return [
        { infoHash: "not-a-hash" },
        { url: "javascript:alert(1)" },
        { externalUrl: "http://provider.example/title" }
      ];
    }
  });
  assert.deepEqual(await getStreams("movie", "invalid:1"), []);
});
