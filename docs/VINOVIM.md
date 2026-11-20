# VINOVIM — motor agregador

O endpoint Stremio-compatible é publicado em `/api/addon/manifest.json` no projeto Vercel do servidor.

## Conectores

Os conectores vivem no servidor e são registados através de `registerConnector()` em `server/lib/vinovim-addon.js`. Cada conector tem um identificador estável, declara os seus catálogos e implementa:

- `getCatalog({ type, catalog, extra })` — devolve uma lista de metadados;
- `getMeta({ type, id })` — opcional, devolve os detalhes de um título;
- `getStreams({ type, id })` — opcional, devolve fontes de reprodução autorizadas;
- `health()` — opcional, verifica o serviço.

Os conectores devem usar APIs documentadas, bibliotecas próprias ou serviços para os quais exista autorização. Não se aceitam URLs arbitrários fornecidos pelo utilizador como destinos de backend.

## Estado inicial

O motor e as rotas estão preparados, mas ainda não há conectores registados. Por isso, o manifesto apresenta catálogos vazios e não fornece streams até serem integradas fontes reais. Isto é intencional: não simulamos disponibilidade nem inventamos fornecedores.
