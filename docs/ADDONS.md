# 🧩 Addons

O vinovim usa o **protocolo de addons do Stremio**. Qualquer addon que funcione no Stremio pode funcionar no vinovim.

> [!WARNING]
> Os addons são feitos por terceiros e não têm qualquer ligação ao vinovim. Instala apenas addons em que confias e que respeitam a lei do teu país.

## ➕ Instalar um addon

1. Abre **Mais → Addons**.
2. Cola o endereço do `manifest.json` do addon (também aceita links `stremio://`).
3. Carrega em **Instalar**.

No gestor de addons podes também **ligar ou desligar** cada addon, ver se está a responder e removê-lo.

## 📡 Como fala um addon

Um addon é um servidor HTTP que responde com JSON. Estes são os quatro pedidos que o vinovim faz:

| Pedido | Exemplo | Para quê |
|:--|:--|:--|
| Manifest | `/manifest.json` | Nome, tipos (`movie`, `series`), catálogos e recursos |
| Catálogo | `/catalog/movie/top.json` | Listas de títulos, com filtros como `genre` e `skip` |
| Meta | `/meta/series/tt0903747.json` | Detalhes, elenco, episódios e trailers |
| Stream | `/stream/movie/tt0111161.json` | Fontes de reprodução |

Exemplo mínimo de `manifest.json`:

```json
{
  "id": "org.exemplo.addon",
  "version": "1.0.0",
  "name": "Exemplo",
  "resources": ["catalog", "meta"],
  "types": ["movie"],
  "catalogs": [{ "type": "movie", "id": "favoritos", "name": "Os meus favoritos" }],
  "idPrefixes": ["tt"]
}
```

## 🛠️ Criar o teu addon

A forma mais simples é usar o SDK oficial: **[stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk)**. Um addon feito com ele funciona logo no vinovim.

## ⭐ Addon incluído

| Addon | Para quê |
|:--|:--|
| **Cinemeta** | Catálogos populares e informação de filmes e séries (capas, sinopses, elenco, episódios). Não fornece fontes de reprodução. |
