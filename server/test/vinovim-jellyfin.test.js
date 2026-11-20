import test from "node:test";
import assert from "node:assert/strict";
import { createJellyfinConnector, verifyJellyfinPlaybackToken } from "../lib/connectors/jellyfin.js";

const envKeys = ["JELLYFIN_URL", "JELLYFIN_API_KEY", "JELLYFIN_USER_ID", "JELLYFIN_PROXY_SECRET", "VINOVIM_PUBLIC_URL", "JELLYFIN_PRIVATE_DEPLOYMENT"];
function withEnv(values, fn) {
  const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  for (const key of envKeys) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  return Promise.resolve().then(fn).finally(() => {
    for (const key of envKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
}
const configured = {
  JELLYFIN_URL: "https://media.example/jellyfin",
  JELLYFIN_API_KEY: "server-secret-api-key",
  JELLYFIN_PRIVATE_DEPLOYMENT: "true",
  JELLYFIN_USER_ID: "user-guid",
  JELLYFIN_PROXY_SECRET: "a".repeat(48),
  VINOVIM_PUBLIC_URL: "https://vinovim.example"
};

test("Jellyfin fica desativado sem URL e chave de API", async () => {
  await withEnv({}, async () => {
    const connector = createJellyfinConnector();
    assert.equal(connector.enabled, false);
    assert.deepEqual(await connector.getCatalog({ type: "movie", catalog: "movies" }), []);
  });
});

test("Jellyfin pesquisa a biblioteca e converte filmes em IDs próprios", async () => {
  const oldFetch = globalThis.fetch;
  await withEnv(configured, async () => {
    let requested;
    globalThis.fetch = async url => {
      requested = new URL(String(url));
      return {
        ok: true,
        async json() {
          return { Items: [{
            Id: "11111111-1111-4111-8111-111111111111",
            Name: "Filme da biblioteca",
            ProductionYear: 2025,
            Overview: "Descrição",
            Genres: ["Drama"]
          }] };
        }
      };
    };
    try {
      const connector = createJellyfinConnector();
      const items = await connector.getCatalog({ type: "movie", catalog: "search", extra: { search: "Filme" } });
      assert.equal(items.length, 1);
      assert.equal(items[0].id, "jellyfin:movie:11111111-1111-4111-8111-111111111111");
      assert.equal(items[0].type, "movie");
      assert.equal(items[0].name, "Filme da biblioteca");
      assert.equal(requested.searchParams.get("SearchTerm"), "Filme");
      assert.equal(requested.searchParams.get("IncludeItemTypes"), "Movie");
      assert.equal(requested.searchParams.get("Recursive"), "true");
      assert.equal(requested.searchParams.has("api_key"), false);
    } finally { globalThis.fetch = oldFetch; }
  });
});

test("Jellyfin devolve episódios de séries com IDs reproduzíveis", async () => {
  const oldFetch = globalThis.fetch;
  await withEnv(configured, async () => {
    globalThis.fetch = async raw => {
      const url = new URL(String(raw));
      return {
        ok: true,
        async json() {
          if (url.pathname.endsWith("/Episodes")) return { Items: [{
            Id: "22222222-2222-4222-8222-222222222222",
            Name: "Episódio 1",
            ParentIndexNumber: 1,
            IndexNumber: 1
          }] };
          return { Id: "33333333-3333-4333-8333-333333333333", Name: "Série" };
        }
      };
    };
    try {
      const connector = createJellyfinConnector();
      const meta = await connector.getMeta({
        type: "series",
        id: "jellyfin:series:33333333-3333-4333-8333-333333333333"
      });
      assert.equal(meta.name, "Série");
      assert.equal(meta.videos.length, 1);
      assert.equal(meta.videos[0].id, "jellyfin:episode:22222222-2222-4222-8222-222222222222");
      assert.equal(meta.videos[0].season, 1);
      assert.equal(meta.videos[0].episode, 1);
    } finally { globalThis.fetch = oldFetch; }
  });
});

test("Jellyfin emite URL assinada sem expor a chave API", async () => {
  await withEnv(configured, async () => {
    const connector = createJellyfinConnector();
    const [stream] = await connector.getStreams({
      type: "movie",
      id: "jellyfin:movie:11111111-1111-4111-8111-111111111111"
    });
    assert.ok(stream.url.startsWith("https://vinovim.example/api/addon/jellyfin/"));
    assert.equal(stream.url.includes(configured.JELLYFIN_API_KEY), false);
    const token = new URL(stream.url).searchParams.get("token");
    assert.equal(verifyJellyfinPlaybackToken(token, configured.JELLYFIN_PROXY_SECRET), "11111111-1111-4111-8111-111111111111");
    assert.equal(verifyJellyfinPlaybackToken(token + "x", configured.JELLYFIN_PROXY_SECRET), null);
  });
});

test("Jellyfin não emite streams sem segredo de proxy ou URL pública HTTPS", async () => {
  await withEnv({ ...configured, JELLYFIN_PROXY_SECRET: "", VINOVIM_PUBLIC_URL: "http://vinovim.example" }, async () => {
    const connector = createJellyfinConnector();
    assert.deepEqual(await connector.getStreams({
      type: "movie",
      id: "jellyfin:movie:11111111-1111-4111-8111-111111111111"
    }), []);
  });
});

test("tokens Jellyfin expirados ou adulterados são rejeitados", () => {
  const token = Buffer.from(JSON.stringify({
    itemId: "11111111-1111-4111-8111-111111111111",
    exp: 1000
  })).toString("base64url");
  assert.equal(verifyJellyfinPlaybackToken(token + ".invalid", "a".repeat(48), 2000), null);
  assert.equal(verifyJellyfinPlaybackToken("", "a".repeat(48)), null);
});
