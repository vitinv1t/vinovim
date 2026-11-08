# 🤝 Como contribuir

Obrigado por quereres ajudar o vinovim! 💜

## 🐞 Reportar um problema

1. Vê se já existe um [issue](../../issues) igual.
2. Se não existir, abre um com o modelo **🐞 Problema**.
3. Diz em que plataforma estás (Windows, Android, TV ou browser), a versão (**Mais → Definições**) e como repetir o problema. Uma imagem ajuda muito.

## 💡 Sugerir uma ideia

Abre um issue com o modelo **💡 Sugestão** e explica o que gostavas de fazer e porquê.

## 🔧 Enviar código

1. Faz *fork* do projeto e cria uma branch: `git checkout -b corrige-legendas`.
2. Corre a app com `npx serve app` e testa no browser ([guia](../docs/COMPILAR.md)).
3. Faz *commit* com uma mensagem clara, em português: `Corrige legendas a começar atrasadas`.
4. Abre um *pull request* para a `main`.

### ✅ Regras do código

- **Sem frameworks** e sem passo de compilação na interface: HTML, CSS e JavaScript simples.
- Funções novas vão para um **módulo** em `app/js/`, que embrulha as funções existentes em vez de as reescrever ([como funciona](../docs/ARQUITETURA.md)).
- Os textos que o utilizador vê são em **português de Portugal**.
- Nada de chaves, tokens ou senhas no código.
- Testa no **computador** e com o ecrã **estreito** (telemóvel).

## 🚫 O que não aceitamos

- Addons, links ou código que deem acesso a conteúdo pirateado.
- Código que recolha dados das pessoas sem que elas saibam.
