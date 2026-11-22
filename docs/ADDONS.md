# 🧩 Addons

O Vinovim usa um **protocolo aberto de addons**. Qualquer addon que cumpra o protocolo funciona no Vinovim.

> [!WARNING]
> Os addons são feitos por terceiros e não têm qualquer ligação ao Vinovim. Instala apenas addons em que confias e que respeitam a lei do teu país.

## ➕ Instalar um addon

1. Abre **Mais → Addons**.
2. Cola o endereço do `manifest.json` do addon.
3. Carrega em **Instalar**.

No gestor de addons podes também **ligar ou desligar** cada addon, ver se está a responder e removê-lo.

## 📡 Como fala um addon

Um addon é um servidor HTTP que responde com JSON. Estes são os quatro pedidos que o Vinovim faz:

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

Um addon é um servidor simples que devolve JSON: basta publicar um `manifest.json` e responder aos recursos que declaras.

## ⭐ Addon incluído

| Addon | Para quê |
|:--|:--|
| **Cinemeta** | Catálogos populares e informação de filmes e séries (capas, sinopses, elenco, episódios). Não fornece fontes de reprodução. |
