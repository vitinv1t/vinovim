# VINOVIM — motor agregador

O endpoint Stremio-compatible é publicado em `/api/addon/manifest.json` no projeto Vercel do servidor.

## Conectores integrados

- **TMDB** fornece catálogos de tendências, populares e pesquisa, metadados, imagens, elenco, realizadores, trailers e episódios.
- **Watchmode** acrescenta fontes de disponibilidade por país e links web para abrir o título no serviço correspondente. Não fornece vídeo nem streams directos.
- A região predefinida é `PT`. Pode ser alterada através de `WATCHMODE_REGIONS`.

Os conectores são registados em `server/lib/vinovim-connectors.js` e implementados em `server/lib/connectors/`. As chaves são lidas apenas no servidor.

## Variáveis de ambiente (Vercel)

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `TMDB_READ_ACCESS_TOKEN` | Sim, para catálogo e metadados | Token de leitura da API TMDB |
| `TMDB_API_KEY` | Alternativa | Chave v3 do TMDB, se não usar o token de leitura |
| `WATCHMODE_API_KEY` | Opcional | Ativa disponibilidade e links oficiais |
| `WATCHMODE_REGIONS` | Opcional | Países Watchmode separados por vírgulas; predefinição `PT` |

Não colocar estas chaves no frontend, no repositório ou em ficheiros públicos. Configurá-las nas Environment Variables do projecto Vercel e fazer novo deployment.

## Contrato de fontes

O Watchmode é apresentado ao Vinovim através de `externalUrl`, que abre o destino oficial no serviço. Não se converte disponibilidade em URLs de vídeo nem se simula reprodução. Streams de vídeo só podem ser fornecidos por conectores com autorização para os disponibilizar.

## Limites e atribuição

O plano Developer do Watchmode é gratuito para utilização não comercial, tem 2.500 créditos mensais e permite até três países. Exige atribuição e ligação a Watchmode.com junto dos dados apresentados. Uso comercial requer um plano comercial. Verificar os termos e o plano antes de publicar a integração para utilizadores finais.

O TMDB requer atribuição conforme as respectivas condições de utilização. A integração deve apresentar a atribuição TMDB na interface do produto.

## Estado

Os conectores estão implementados no backend. Ainda é necessário configurar as chaves na Vercel, adicionar as atribuições visíveis no frontend e executar testes de integração com credenciais reais. Sem chave TMDB, os catálogos ficam indisponíveis; sem Watchmode, os catálogos e metadados continuam a funcionar, mas não aparecem opções de disponibilidade.
