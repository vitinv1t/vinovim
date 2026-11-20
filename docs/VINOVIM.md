# VINOVIM — motor agregador

O endpoint Stremio-compatible é publicado em `/api/addon/manifest.json` no projeto Vercel do servidor.

## Conectores integrados

- **TMDB** fornece catálogos de tendências, populares, pesquisa, animação, documentários, família, anime e conteúdo infantil, além de metadados, imagens, elenco, realizadores, trailers e episódios. Os catálogos e metadados seguem o idioma escolhido na app (PT-PT, PT-BR, inglês ou espanhol).
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

## Integração na aplicação

O deployment principal do Vinovim expõe o endpoint através de `api/addon/[...path].js`, que encaminha para o handler em `server/api`. Por omissão, a aplicação carrega `/api/addon/manifest.json` no mesmo domínio. Se optares por alojar o servidor num projecto/domínio Vercel separado, definir antes dos scripts da aplicação:

```html
<script>window.VINOVIM_ADDON_URL = "https://TEU-DOMINIO-API.vercel.app/api/addon/manifest.json";</script>
```

O URL é público; as chaves TMDB e Watchmode permanecem exclusivamente nas variáveis de ambiente do servidor. O agregador aparece como addon base e os catálogos não exigem instalação manual.

## Requisitos antes de produção

- Confirmar que o deployment principal publica `/api/addon/manifest.json`; se for usado um projecto de servidor separado, configurar `window.VINOVIM_ADDON_URL` com o domínio real desse deployment.
- Configurar `TMDB_READ_ACCESS_TOKEN`; configurar `WATCHMODE_API_KEY` apenas se o plano e a utilização pretendida o permitirem.
- A utilização gratuita do TMDB é para fins não comerciais e exige atribuição. O TMDB exige o logótipo oficial aprovado, sem alterações, e o aviso: "This product uses the TMDB API but is not endorsed or certified by TMDB." O aviso e o logótipo oficial aprovado já aparecem na área de créditos; o SVG é actualmente carregado do domínio oficial e deve ser empacotado localmente para a versão final offline.
- O plano Developer gratuito do Watchmode é não comercial, requer atribuição e está limitado a 2.500 créditos mensais e até três países. A atribuição com ligação aparece junto das opções de disponibilidade. Para uso comercial é necessário um plano comercial adequado.
- Não anunciar a integração como comercial nem ativar monetização enquanto as licenças dos fornecedores não estiverem confirmadas.
- Executar os testes automatizados e testes reais com credenciais; verificar limites, respostas 429, timeouts, falhas de rede e deployment em preview/produção.

A utilização comercial do Vinovim, publicidade, subscrições ou qualquer outro modelo de receita deve ser avaliada com TMDB e Watchmode antes do lançamento. A licença de cada fonte de reprodução é independente das licenças de metadados e disponibilidade.

## Estado

Os conectores estão implementados no backend e o frontend carrega o agregador por omissão. Ainda é necessário confirmar o domínio público do endpoint, configurar as chaves na Vercel, empacotar localmente o logótipo oficial do TMDB e executar testes de integração com credenciais reais. Sem chave TMDB, os catálogos ficam indisponíveis; sem Watchmode, os catálogos e metadados continuam a funcionar, mas não aparecem opções de disponibilidade.
