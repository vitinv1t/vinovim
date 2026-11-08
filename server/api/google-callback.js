// vinovim — o Google volta para aqui depois de a pessoa escolher a conta
import crypto from 'node:crypto';
import { readJSON, writeJSON, sha, sign, GOOGLE_REDIRECT, validCode } from './_lib.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const page = (ok, title, msg) => `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Vinovim</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(700px 400px at 50% 0,rgba(224,49,91,.25),transparent 60%),#09080d;color:#fff;font-family:Inter,Segoe UI,system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
.c{max-width:420px}.i{width:76px;height:76px;margin:0 auto 22px;border-radius:24px;display:grid;place-items:center;font-size:38px;background:${ok ? 'linear-gradient(135deg,#e0315b,#f5c26b)' : '#2a2433'}}
h1{font-size:26px;margin:0 0 10px}p{color:#b9b4c7;line-height:1.5;margin:0}</style></head>
<body><div class="c"><div class="i">${ok ? '✓' : '!'}</div><h1>${esc(title)}</h1><p>${esc(msg)}</p></div>
<script>setTimeout(function(){try{window.close()}catch(e){}},1500)</script></body></html>`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const fail = (title, msg, status = 400) => res.status(status).send(page(false, title, msg));
  try {
    const { code, state, error } = req.query;
    if (error) return fail('Login cancelado', 'Podes fechar esta janela e tentar outra vez no Vinovim.');
    if (!code || !validCode(state)) return fail('Pedido inválido', 'Volta ao Vinovim e carrega outra vez em “Continuar com Google”.');
    const id = process.env.GOOGLE_CLIENT_ID, secret = process.env.GOOGLE_CLIENT_SECRET;
    if (!id || !secret) return fail('Ainda não está ativo', 'O login com Google ainda não foi configurado.', 503);

    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code: String(code), client_id: id, client_secret: secret, redirect_uri: GOOGLE_REDIRECT, grant_type: 'authorization_code' })
    });
    const t = await r.json().catch(() => ({}));
    if (!t.id_token) return fail('Não foi possível entrar', 'O Google não confirmou o login. Tenta outra vez.');
    // o token veio diretamente do Google por HTTPS, por isso basta confirmar para quem é
    const c = JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString());
    if (c.aud !== id || !/accounts\.google\.com$/.test(c.iss || '') || !c.email || c.email_verified === false) return fail('Não foi possível entrar', 'Esta conta Google não tem um email confirmado.');

    const email = String(c.email).toLowerCase();
    const path = 'users/' + sha(email) + '.json';
    const ex = await readJSON(path);
    let uid;
    if (ex && ex.uid) {
      uid = ex.uid;
      if (!ex.google) await writeJSON(path, Object.assign({}, ex, { google: c.sub }));
    } else {
      uid = crypto.randomBytes(12).toString('hex');
      await writeJSON(path, { uid, google: c.sub, created: Date.now() });
    }
    const token = await sign(uid);
    await writeJSON('pending/' + sha(String(state)) + '.json', { token, email, name: c.name || '', exp: Date.now() + 10 * 60 * 1000 });
    return res.status(200).send(page(true, 'Sessão iniciada', 'Já podes voltar ao Vinovim. Esta janela pode ser fechada.'));
  } catch (e) {
    return fail('Erro no servidor', 'Tenta outra vez daqui a pouco.', 500);
  }
}
