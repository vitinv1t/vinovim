# 🛠️ Desenvolver e compilar

## ⚡ Correr só a interface

Não precisas de instalar nada além do Node.js:

```bash
git clone https://github.com/vitinv1t/vinovim.git
cd vinovim
npx serve app
```

Abre **http://localhost:3000/?web**. O `?web` diz ao vinovim para abrir a app em vez da página de downloads.

> [!NOTE]
> As funções que usam o servidor (conta, cópias de segurança, listas partilhadas) só funcionam no site publicado ou com o `vercel dev` dentro de `server/`.

## 🧰 O que precisas para compilar as apps

| Ferramenta | Para quê |
|:--|:--|
| [Node.js 20+](https://nodejs.org) | Tudo |
| [Python 3](https://www.python.org) + `pip install pillow` | Gerar os ícones |
| [JDK 17](https://adoptium.net) + Android SDK | Só para o `.apk` |

## 📦 Preparar os ficheiros

Os comandos abaixo correm a partir da raiz do projeto. Montam as pastas `www/` (interface) e `electron/` (Windows), que são temporárias e não vão para o Git.

```bash
mkdir -p www electron
cp -r app/. www/ && cp version.json www/
cp desktop/main.js desktop/preload.js config/remote.json electron/
python scripts/make_icons.py
npm install
```

## 🪟 Windows (.exe)

```bash
npx electron-builder --win
# o instalador fica em dist/
```

Para experimentar sem instalar: `npm start`.

## 🤖 Android (.apk)

```bash
npx cap add android
npx cap sync android
python mobile/android_widget.py
cd android && ./gradlew assembleDebug
# o apk fica em android/app/build/outputs/apk/debug/
```

## ⚙️ Compilação automática (GitHub Actions)

O ficheiro `.github/workflows/build.yml` corre a cada *push* na `main`:

| Trabalho | O que faz |
|:--|:--|
| 🪟 **windows** | Monta `www/` e `electron/` e cria o instalador `.exe` |
| 🤖 **android** | Gera o projeto Capacitor, junta o widget e o suporte de TV e cria o `.apk` |
| 🌐 **publish** | Junta a interface, o servidor e os downloads e envia tudo para a branch **`site`** |

O **Vercel** publica automaticamente a branch `site` em **vinovim.vercel.app**.

Se fizeres vários *pushes* seguidos, só o último é compilado: os anteriores são cancelados.

## 🔐 Configuração do Vercel

O site precisa de um **Vercel Blob** privado ligado ao projeto (cria a variável `BLOB_READ_WRITE_TOKEN`).

| Variável | Obrigatória | Para quê |
|:--|:--:|:--|
| `BLOB_READ_WRITE_TOKEN` | ✅ | Guardar contas, cópias de segurança e listas partilhadas |
| `SESSION_SECRET` | ➖ | Assinar as sessões das contas (se não existir, o servidor cria uma e guarda-a no Blob) |

> [!CAUTION]
> Nunca escrevas tokens ou senhas no código. Usa sempre as variáveis de ambiente do Vercel ou os *secrets* do GitHub.

## 🚀 Lançar uma versão nova

1. Muda `APP_VERSION` e `CHANGELOG` em `app/index.html`.
2. Atualiza `version.json` com a mesma versão e as notas.
3. Se mudaste `desktop/` ou `mobile/`, sobe `native.min` em `version.json` e a versão em `package.json`.
4. Acrescenta a versão ao `CHANGELOG.md`.
5. Faz *push* para a `main`. Em ~4 minutos está tudo publicado.
