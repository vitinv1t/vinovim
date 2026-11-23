import { ADMIN, BASE, CHAVE, json, falha, mesmaOrigem, lerJson, esquema, limite, ip, sb, cookieSessao } from './_sb.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });
    if (!mesmaOrigem(req)) return json(res, 403, { erro: 'origem' });
    if (limite('login:' + ip(req), 6, 10 * 60 * 1000)) return json(res, 429, { erro: 'muitas-tentativas' });
    if (!BASE || !CHAVE) return json(res, 503, { erro: 'indisponivel' });
    const b = await lerJson(req);
    if (!esquema.email(b.email) || !esquema.texto(b.password, 8, 200)) return json(res, 400, { erro: 'dados' });
    // só o administrador entra, mesmo que existam outras contas
    if (b.email.toLowerCase() !== ADMIN) return json(res, 401, { erro: 'credenciais' });
    const r = await sb('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: b.email, password: b.password }) });
    if (!r.ok) return json(res, 401, { erro: 'credenciais' });
    const d = await r.json();
    if (!d.access_token || !d.refresh_token) return json(res, 401, { erro: 'credenciais' });
    res.setHeader('Set-Cookie', cookieSessao(d.access_token, d.refresh_token));
    json(res, 200, { ok: true });
  } catch (e) {
    falha(res, e);
  }
}
