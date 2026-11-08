# 🏗️ Arquitetura do vinovim

Este documento explica como as peças do vinovim encaixam umas nas outras.

## 🧱 Visão geral

```mermaid
flowchart TB
    subgraph Apps["📲 Apps"]
        W[🪟 Windows<br>Electron]
        A[🤖 Android / TV<br>Capacitor]
        B[🌐 Browser<br>PWA]
    end
    subgraph Site["▲ vinovim.vercel.app"]
        UI[app/ — interface]
        API[server/api — contas e listas]
        BLOB[(Vercel Blob<br>privado)]
    end
    ADD[🧩 Addons Stremio<br>de terceiros]

    W --> UI
    A --> UI
    B --> UI
    UI --> API --> BLOB
    UI --> ADD
```

- A **interface** é a mesma em todas as plataformas: HTML, CSS e JavaScript simples, sem frameworks e sem passo de compilação.
- As apps de **Windows** e **Android** são “cascas” nativas que carregam a interface a partir do site (`config/remote.json`). Se não houver rede, usam a cópia que vem dentro da app.
- Os **addons** são chamados diretamente pela app. O site do vinovim nunca vê nem guarda conteúdo.

## 🧩 A interface (`app/`)

O `index.html` é o núcleo: ecrãs, navegação, leitor, perfis, gestão de addons e atualizações.

As funções novas de cada versão vivem em **módulos** dentro de `app/js/`, carregados por ordem no fim do `index.html`. Cada módulo:

1. corre dentro de uma função própria (não suja o espaço global);
2. acrescenta comportamento “embrulhando” as funções que já existem, por exemplo:

```js
const _afterBoot = window.afterBoot;
window.afterBoot = function () {
  _afterBoot();        // faz o que já fazia
  minhaNovaFuncao();   // e acrescenta o novo
};
```

Assim cada versão pode ser lida, testada e desligada sozinha.

| Módulo | O que traz |
|:--|:--|
| `modulo-1.3.js` | Conta e sincronização, calendário, saltar introdução, estatísticas, ver em conjunto, listas, Chromecast, idiomas |
| `modulo-1.4.js` | Capas que faltavam, perfil infantil com PIN, transferências, comando no telemóvel, voz, temas, mini-player, conquistas, importar Trakt e Letterboxd, gestor de addons |
| `modulo-1.5.js` | Avatares e fotos, próximo episódio automático, listas partilhadas, “Avisa-me”, início por perfil, “Não sei o que ver”, atalhos e comandos de jogos, cópia de segurança, página de ator, notas |
| `modulo-1.6.js` | Integração com o Windows (menu Iniciar, barra de tarefas) e o teu ano em formato Wrapped |
| `modulo-1.7-netflix.js` | Abertura animada, trailer no destaque, pré-visualizações, “% para ti”, Top 10, “Porque viste…”, Novidades |
| `modulo-1.7-visual.js` | Menu no topo, menu “Mais”, menu inferior no telemóvel, definições e biblioteca por separadores |

## 💾 Onde ficam os dados

| O quê | Onde |
|:--|:--|
| Perfis, lista, progresso, preferências | `localStorage` → chave `vinovim.v1` (no próprio dispositivo) |
| Capas encontradas, cenas do “Continuar a ver” | `localStorage` → `vinovim.posters`, `vinovim.frames` |
| Transferências | `IndexedDB` |
| Conta sincronizada e cópias de segurança | `server/api/account.js` → Vercel Blob **privado** |
| Listas partilhadas | `server/api/lists.js` → Vercel Blob **privado**, protegidas por chave |

Os **PINs** dos perfis nunca são guardados em texto: só um *hash*.

## 🪟 Windows (`desktop/`)

- `main.js` cria a janela, carrega o site (ou a cópia local) e trata da integração com o sistema:
  - **Lista de atalhos** (“Continuar a ver”, Pesquisar, Biblioteca, Calendário);
  - **Botões na miniatura** da barra de tarefas e **progresso** no ícone;
  - **Discord Rich Presence** (opcional);
  - uma só instância da app.
- `preload.js` expõe à interface um objeto seguro, `window.vinovimNative`.

## 🤖 Android (`mobile/`)

O projeto Android é gerado pelo **Capacitor** durante a compilação. Depois, `mobile/android_widget.py` acrescenta:

- o widget **“Continuar a ver”** no ecrã inicial;
- a atualização do widget ao sair da app;
- a permissão do microfone (pesquisa por voz);
- o suporte para **Android TV** (o passo está no workflow).

## 🔄 Atualizações

1. `version.json` diz qual é a versão atual e o que mudou.
2. A app compara-o com a sua versão (`APP_VERSION`) e mostra as **novidades**.
3. Se `native.min` for maior do que a versão da app instalada, pede para instalar a app nova (só acontece quando muda `desktop/` ou `mobile/`).
