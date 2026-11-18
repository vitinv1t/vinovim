<div align="center">

<img src="docs/banner.svg" alt="Vinovim" width="100%">

<br>

[![Compilação](https://github.com/vitinv1t/vinovim/actions/workflows/build.yml/badge.svg)](https://github.com/vitinv1t/vinovim/actions/workflows/build.yml)
![Versão](https://img.shields.io/badge/versão-1.0.2-ff4d94?style=flat-square)
![Plataformas](https://img.shields.io/badge/plataformas-Windows%20·%20Android%20·%20TV%20·%20Web-7c5cff?style=flat-square)
![Addons](https://img.shields.io/badge/addons-protocolo%20Stremio-f5c26b?style=flat-square)
![Idiomas](https://img.shields.io/badge/idiomas-PT%20·%20EN%20·%20ES-2ea043?style=flat-square)

**Um hub de filmes e séries bonito, rápido e pessoal — ao estilo Netflix — que funciona com addons do Stremio.**

[🌐 Abrir no browser](https://vinovim.vercel.app/?web) ·
[📥 Descarregar](https://vinovim.vercel.app/download) ·
[📝 Novidades](CHANGELOG.md) ·
[📚 Documentação](docs/)

</div>

---

> [!IMPORTANT]
> O **Vinovim não aloja, não vende e não distribui filmes nem séries.** É apenas um leitor e organizador: mostra catálogos e reproduz conteúdo vindo dos **addons que tu instalas**. Cada pessoa é responsável pelos addons que usa e por respeitar as leis do seu país. Lê o [aviso legal](#️-aviso-legal).

## 📖 Índice

- [✨ Funcionalidades](#-funcionalidades)
- [📥 Instalar](#-instalar)
- [🧩 Como funcionam os addons](#-como-funcionam-os-addons)
- [🗂️ Estrutura do projeto](#️-estrutura-do-projeto)
- [🛠️ Desenvolver e compilar](#️-desenvolver-e-compilar)
- [🔄 Como chegam as atualizações](#-como-chegam-as-atualizações)
- [🤝 Contribuir](#-contribuir)
- [⚖️ Aviso legal](#️-aviso-legal)

---

## ✨ Funcionalidades

<table>
<tr>
<td width="50%" valign="top">

### 🎬 Ver
- ▶️ Leitor próprio com legendas e retomar onde paraste
- ⏩ Saltar introdução e enviar para o Chromecast
- ⏭️ Próximo episódio automático com contagem decrescente
- 🖼️ Mini-player e imagem-em-imagem (PiP)
- 🎞️ Trailer a tocar no destaque e pré-visualização ao passar o rato
- ⏸️ Ecrã de pausa com o título, o episódio, a sinopse e o elenco
- 🧠 “Da última vez…”: um resumo de onde ficaste quando voltas a uma série
- 🍿 No fim de um filme, 3 sugestões parecidas
- ⬇️ Transferências para ver sem internet

</td>
<td width="50%" valign="top">

### 🧭 Descobrir
- 🏆 Top 10 de filmes e séries do dia
- 💡 Filas “Porque viste…” e para o teu momento do dia
- 🎯 “% para ti”: quanto cada título combina contigo
- 🆕 Separador **Novidades** com estreias e botão “Avisa-me”
- ⏳ Contagem decrescente para as estreias que estás à espera
- 🎄 Início que muda com a época: Natal, Halloween, São Martinho e verão
- ⭐ Filtros por género, ano e “Mais bem avaliados”
- 🎲 “Não sei o que ver” e “Surpreende-me”
- 🎭 Página de cada ator com a filmografia

</td>
</tr>
<tr>
<td valign="top">

### 👤 Pessoal
- 🔐 Entrar com **Google** ou com email
- 👨‍👩‍👧 Até 6 perfis com foto, cor e **PIN**
- 🧒 Perfil infantil (só animação e família)
- 📌 “A minha lista”, notas e listas partilhadas
- 📊 Estatísticas e o teu ano em formato **Wrapped**
- 🏅 Conquistas
- 🔁 Importar do Trakt e do Letterboxd

</td>
<td valign="top">

### 💻 Em todo o lado
- 🪟 **Windows**: “Continuar a ver” no menu Iniciar e controlos na barra de tarefas
- 🤖 **Android**: widget “Continuar a ver” e pesquisa por voz
- 📺 **Android TV**: navegação com o comando
- 🎮 Comando de jogos e atalhos de teclado
- 📱 Usa o telemóvel como comando
- ☁️ Cópia de segurança e sincronização da conta
- 📲 Continua no telemóvel ou na TV o que estavas a ver no PC
- 🖼️ Protetor de ecrã com imagens do título que estás a ver
- 🎮 Estado no **Discord** (opcional)
- 🌍 Em português, inglês e espanhol

</td>
</tr>
</table>

---

## 📥 Instalar

| Plataforma | Como instalar |
|:--|:--|
| 🪟 **Windows** | Descarrega o `vinovim-setup.exe` em **[vinovim.vercel.app/download](https://vinovim.vercel.app/download)** e segue o instalador. |
| 🤖 **Android / Android TV** | Descarrega o `vinovim.apk` na mesma página. Pode ser preciso permitir “instalar apps de fontes desconhecidas”. |
| 🌐 **Browser** | Abre **[vinovim.vercel.app/?web](https://vinovim.vercel.app/?web)**. Também dá para instalar como app (PWA). |

> [!TIP]
> Só precisas de instalar uma vez. As novidades chegam sozinhas, e quando a própria app muda basta carregar em **Atualizar agora**: o Vinovim descarrega e instala a versão nova sem ires ao site.

---

## 🧩 Como funcionam os addons

O Vinovim fala o **protocolo de addons do Stremio**. Um addon é só um endereço que responde com JSON:

```text
https://exemplo-de-addon.com/manifest.json          → quem é o addon e o que oferece
https://exemplo-de-addon.com/catalog/movie/top.json → listas de filmes ou séries
https://exemplo-de-addon.com/meta/movie/tt0111161.json → detalhes de um título
https://exemplo-de-addon.com/stream/movie/tt0111161.json → onde reproduzir
```

1. Vai a **Mais → Addons**.
2. Cola o endereço do `manifest.json` do addon e carrega em **Instalar**.
3. Os catálogos aparecem no início e as fontes aparecem quando abres um título.

O **Cinemeta** (catálogos e informação dos títulos) vem instalado por defeito. Mais detalhes em [docs/ADDONS.md](docs/ADDONS.md).

---

## 🗂️ Estrutura do projeto

```text
vinovim/
├── 📁 app/                     → a app (igual em todas as plataformas)
│   ├── index.html              → estrutura da página (e o que tem de correr antes de tudo)
│   ├── download.html           → página de downloads do site
│   ├── privacidade.html        → política de privacidade
│   ├── termos.html             → termos de utilização
│   ├── sw.js                   → service worker (abre mesmo sem rede)
│   ├── manifest.webmanifest    → dados da app instalável (PWA)
│   ├── 📁 css/                 → estilos: base.css + um ficheiro por funcionalidade
│   └── 📁 js/
│       ├── 📁 core/            → o núcleo, carregado por esta ordem
│       │   ├── base.js         → pontos de extensão (hooks), ícones, estado, addons, ajudantes
│       │   ├── vistas.js       → início, filmes, séries, pesquisa, biblioteca, addons, definições
│       │   ├── detalhe.js      → página de cada título e escolha da fonte
│       │   ├── leitor.js       → leitor de vídeo, legendas e progresso
│       │   ├── eventos.js      → cliques, teclado e botão “voltar”
│       │   ├── sistema.js      → Discord e atualizações
│       │   ├── perfis.js       → “Quem está a ver?”, foto, perfil infantil e PIN
│       │   ├── tv.js           → modo TV e navegação com o comando
│       │   └── arranque.js     → navegação entre vistas e arranque
│       └── 📁 features/        → funcionalidades que se ligam ao núcleo pelos hooks
│           ├── conta.js        → conta, sincronização, calendário, estatísticas, ver em conjunto, idiomas
│           ├── temas-e-extras.js → temas, transferências, comando no telemóvel, conquistas, gestor de addons
│           ├── listas-e-descoberta.js → listas partilhadas, próximo episódio, “Não sei o que ver”, atalhos
│           ├── windows-e-resumo-anual.js → menu Iniciar, barra de tarefas e o teu ano no Vinovim
│           ├── estilo-netflix.js → abertura, trailers, Top 10, Novidades, “% para ti”
│           ├── navegacao.js    → menu no topo, menu “Mais”, definições por separadores
│           ├── entrada.js      → ecrã de entrada (Google, email ou sem conta)
│           └── cinema-em-casa.js → pausa, “Da última vez…”, continuar noutro dispositivo, época, protetor de ecrã
├── 📁 desktop/                 → app de Windows (Electron)
│   ├── main.js
│   └── preload.js
├── 📁 mobile/                  → extras do Android (widget, microfone)
│   ├── android_widget.py       → widget “Continuar a ver” e microfone
│   └── android_update.py       → atualização dentro da app, versão e assinatura
├── 📁 server/                  → funções do site no Vercel
│   ├── 📁 api/
│   │   ├── account.js          → contas, sincronização, cópias de segurança e “a ver agora”
│   │   ├── google.js           → login com Google (configuração e espera)
│   │   ├── google-callback.js  → volta do Google depois de escolheres a conta
│   │   └── lists.js            → listas partilhadas
│   ├── package.json
│   └── vercel.json
├── 📁 scripts/
│   └── make_icons.py           → gera todos os ícones a partir do logótipo
├── 📁 config/
│   └── remote.json             → endereço do site que as apps carregam
├── 📁 docs/                    → documentação
├── 📁 .github/                 → compilação automática e modelos de issues
├── capacitor.config.json       → configuração do Android
├── package.json                → dependências e configuração do .exe
├── version.json                → versão atual e notas (a app lê isto)
└── CHANGELOG.md                → histórico de versões
```

Como as peças encaixam: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

---

## 🛠️ Desenvolver e compilar

**Correr no browser**, sem instalar nada:

```bash
npx serve app
# abre http://localhost:3000/?web
```

**Compilar tudo** acontece sozinho: cada alteração na branch `main` põe a correr o GitHub Actions, que:

1. 🪟 compila o **.exe** de Windows;
2. 🤖 compila o **.apk** de Android;
3. 🌐 publica o site e os downloads em **Vinovim.vercel.app**.

Passo a passo para compilar no teu computador: [docs/COMPILAR.md](docs/COMPILAR.md).

---

## 🔄 Como chegam as atualizações

```mermaid
flowchart LR
    A[✏️ Alteração na main] --> B[⚙️ GitHub Actions]
    B --> C[🪟 .exe]
    B --> D[🤖 .apk]
    C --> E[🌐 Branch site]
    D --> E
    E --> F[▲ Vercel publica]
    F --> G[📲 A app vê o version.json<br>e mostra as novidades]
```

As apps de Windows e Android carregam a interface a partir do site. Por isso, quase todas as novidades chegam **sem reinstalar**. Só quando muda a parte nativa (`desktop/`, `mobile/`) é que a app pede para instalar a versão nova.

---

## 🤝 Contribuir

Sugestões e correções são bem-vindas! 💜

- 🐞 Encontraste um problema? [Abre um issue de bug](../../issues/new?template=bug_report.md).
- 💡 Tens uma ideia? [Sugere uma funcionalidade](../../issues/new?template=feature_request.md).
- 🔧 Queres programar? Lê o [guia para contribuir](.github/CONTRIBUTING.md).

---

## ⚖️ Aviso legal

O Vinovim é um **leitor e organizador de conteúdo**. Não aloja, não indexa, não carrega e não distribui filmes, séries ou outros conteúdos protegidos. Toda a informação e todas as fontes vêm de **addons de terceiros** que o utilizador escolhe instalar e que **não têm ligação** a este projeto.

O projeto não apoia a pirataria. Usa o Vinovim apenas com conteúdo a que tenhas direito de aceder.

---

<div align="center">

Feito com 💜 por **vitinv1t**

</div>
