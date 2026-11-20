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
    catalogs: [],
    async getCatalog() { return []; },
    async getMeta() { return { id: "tt002", name: "Série", type: "series" }; },
    async getStreams() {
      return [
        { title: "HTTPS", url: "https://media.example/video.m3u8" },
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
  assert.equal(streams.length, 3);
  assert.equal(streams[0].title, "HTTPS");
  assert.ok(!streams.some(stream => stream.title === "HTTP"));
  assert.ok(streams.some(stream => stream.title === "Destino externo válido"));
  assert.ok(!streams.some(stream => stream.title === "Destino externo inválido"));
  const health = await connectorHealth();
  assert.ok(health.some(item => item.id === "test-playback" && item.status === "ok"));
});

test("agregador rejeita IDs de conectores repetidos", () => {
  assert.throws(() => registerConnector({ id: "test-catalog", catalogs: [], getCatalog() {} }));
});
