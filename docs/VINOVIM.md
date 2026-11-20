# VINOVIM — motor agregador

O endpoint Stremio-compatible é publicado em `/api/addon/manifest.json` no projeto Vercel do servidor.

## Conectores integrados

- **TMDB** fornece catálogos de tendências, populares, pesquisa, animação, documentários, família, anime e conteúdo infantil, além de metadados, imagens, elenco, realizadores, trailers e episódios. Os catálogos e metadados seguem o idioma escolhido na app (PT-PT, PT-BR, inglês ou espanhol). A preferência é guardada localmente e enviada ao conector VINOVIM.
- **Watchmode** acrescenta fontes de disponibilidade por país e links web para abrir o título no serviço correspondente. Não fornece vídeo nem streams directos.
- A região predefinida na aplicação é `PT`; o utilizador pode escolher o país nas definições. A API aceita `region` por pedido, validado como código ISO de duas letras. `WATCHMODE_REGIONS` continua a definir a região de fallback do servidor.

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

Todos os conectores de reprodução passam por uma normalização central em `server/lib/vinovim-addon.js`. Cada resultado aceite recebe `providerId` e `sourceType`:

- `official`: apenas `externalUrl`; abre a página oficial do serviço e nunca é tratado como vídeo reproduzível. O Watchmode está nesta categoria.
- `authorized`: URL HTTPS de reprodução, YouTube, ou identificador compatível fornecido por um conector cuja integração esteja autorizada.
- `personal`: conteúdo de biblioteca pessoal, identificado pelo conector e sem pressupor upload para o Vinovim.

O contrato normalizado admite `url`, `externalUrl`, `ytId`, `infoHash`, `fileIdx`, `name`, `title`, `description`, `quality`, `language`, `region`, `format` e legendas HTTPS. Os campos desconhecidos são descartados; URLs HTTP, protocolos inseguros, hashes inválidos e duplicados são rejeitados. As legendas são limitadas e validadas individualmente.

Um conector deve declarar `sourceType` (`official`, `authorized` ou `personal`) e implementar `getStreams()` para fornecer resultados. O tipo `official` é inferido também quando o resultado contém apenas `externalUrl`. Não registar fontes desconhecidas ou endpoints enviados pelo cliente: os conectores são código auditável do servidor.

Este contrato não cria fontes de vídeo por si só. Streams só podem ser fornecidos por integrações autorizadas; a biblioteca pessoal exige uma integração local própria e não implica que os ficheiros sejam enviados para o servidor.

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

A interface usa agora os catálogos VINOVIM como fonte principal do início, com Cinemeta como fallback. A pesquisa consulta catálogos que declaram suporte a `search`. As definições permitem escolher idioma de conteúdo e país para disponibilidade; a preferência de país é encaminhada apenas para o conector VINOVIM.

Os conectores estão implementados no backend, o frontend carrega o agregador por omissão e o endpoint está exposto no deployment principal através de `api/addon/[...path].js`. O CI valida sintaxe, catálogo, metadados, pesquisa, CORS e conectores com mocks. Antes da produção real faltam configurar as chaves na Vercel, testar o endpoint publicado com credenciais reais, empacotar localmente o logótipo oficial do TMDB e confirmar as licenças adequadas. Sem chave TMDB, os catálogos ficam indisponíveis; sem Watchmode, os catálogos e metadados continuam a funcionar, mas não aparecem opções de disponibilidade.
