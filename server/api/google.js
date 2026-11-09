// Vinovim — login com Google
// ?a=config      → diz à app se o login com Google está ativo
// ?a=poll&code=… → a app pergunta se o login feito no browser já terminou
import { readJSON, writeJSON, sha, GOOGLE_REDIRECT, validCode } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const a = req.query.a;
    if (a === 'config') {
      return res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null, redirect: GOOGLE_REDIRECT });
    }
    if (a === 'poll') {
      const code = String(req.query.code || '');
      if (!validCode(code)) return res.status(400).json({ error: 'Código inválido' });
      const path = 'pending/' + sha(code) + '.json';
      const p = await readJSON(path);
      if (!p || p.used || !p.token) return res.json({ pending: true });
      if (p.exp < Date.now()) return res.status(410).json({ error: 'O login expirou. Tenta outra vez.' });
      await writeJSON(path, { used: true, at: Date.now() });
      return res.json({ token: p.token, email: p.email, name: p.name || '' });
    }
    return res.status(404).json({ error: 'Pedido desconhecido' });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}
