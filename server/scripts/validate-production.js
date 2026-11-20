#!/usr/bin/env node
// Smoke test do deployment público do addon VINOVIM.
// Uso: VINOVIM_ADDON_URL=https://dominio.example/api/addon/manifest.json npm run validate:production
const manifestUrl = process.env.VINOVIM_ADDON_URL;
if (!manifestUrl) {
  console.error("Defina VINOVIM_ADDON_URL com o URL completo de manifest.json.");
  process.exit(2);
}

let base;
try {
  base = new URL(manifestUrl);
  if (base.protocol !== "https:") throw new Error("O endpoint tem de usar HTTPS.");
} catch (error) {
  console.error(`URL inválido: ${error.message}`);
  process.exit(2);
}

const fail = message => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};
const check = (condition, message) => {
  if (condition) console.log(`✓ ${message}`);
  else fail(message);
};
async function request(url) {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(12000)
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

try {
  const { response, body: manifest } = await request(base);
  check(response.ok, `Manifest responde HTTP ${response.status}`);
  if (!response.ok) throw new Error("Manifest indisponível.");
  check(manifest?.id === "pt.vinovim.aggregator", "Identificador do addon correcto");
  check(Array.isArray(manifest?.resources) && ["catalog", "meta", "stream"].every(x => manifest.resources.includes(x)), "Recursos catalog/meta/stream declarados");
  check(Array.isArray(manifest?.catalogs) && manifest.catalogs.length > 0, "Catálogos publicados");
  if (!Array.isArray(manifest?.catalogs) || !manifest.catalogs.length) throw new Error("Manifest sem catálogos.");

  const catalog = manifest.catalogs[0];
  const catalogUrl = new URL(`catalog/${encodeURIComponent(catalog.type)}/${encodeURIComponent(catalog.id)}.json`, base.href.endsWith("/") ? base : new URL(".", base));
  const catalogResult = await request(catalogUrl);
  check(catalogResult.response.ok, `Catálogo ${catalog.id} responde HTTP ${catalogResult.response.status}`);
  check(Array.isArray(catalogResult.body?.metas), "Resposta do catálogo contém metas[]");
  const first = catalogResult.body?.metas?.[0];
  if (first?.id && first?.type) {
    const metaUrl = new URL(`meta/${encodeURIComponent(first.type)}/${encodeURIComponent(first.id)}.json`, base.href.endsWith("/") ? base : new URL(".", base));
    const metaResult = await request(metaUrl);
    check(metaResult.response.ok && metaResult.body?.meta?.id === first.id, "Metadados do primeiro resultado correspondem ao ID pedido");
  } else {
    console.log("ℹ Catálogo sem resultados: teste de metadados ignorado.");
  }
} catch (error) {
  fail(`Smoke test interrompido: ${error.message}`);
}
if (process.exitCode) process.exit(process.exitCode);
console.log("Validação HTTP concluída. Isto não substitui testes com credenciais reais nem a validação das licenças dos fornecedores.");
