// vinovim — contas e sincronização (Vercel Function + Vercel Blob privado)
import { put, get } from '@vercel/blob';
import crypto from 'node:crypto';

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
async function readJSON(path) {
  try {
    const r = await get(path, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) { return null; }
}
const writeJSON = (path, obj) => put(path, JSON.stringify(obj), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });

let SECRET = process.env.SESSION_SECRET || null;
async function secret() {
  if (SECRET) return SECRET;
  const c = await readJSON('config/secret.json');
  if (c && c.s) return (SECRET = c.s);
  const s = crypto.randomBytes(32).toString('hex');
  await writeJSON('config/secret.json', { s });
  return (SECRET = s);
}
const hmac = (k, p) => crypto.createHmac('sha256', k).update(p).digest('base64url');
async function sign(uid) {
  const p = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 180 * 864e5 })).toString('base64url');
  return p + '.' + hmac(await secret(), p);
}
async function verify(tok) {
  const [p, sig] = String(tok || '').split('.');
  if (!p || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(hmac(await secret(), p));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const d = JSON.parse(Buffer.from(p, 'base64url').toString()); return d.exp > Date.now() ? d.uid : null; } catch (e) { return null; }
}
const hashPw = (pw, salt) => crypto.pbkdf2Sync(pw, salt, 120000, 32, 'sha256').toString('hex');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    let body = req.body || {};
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const a = req.query.a;
    if (a === 'register' || a === 'login') {
      if (req.method !== 'POST') return res.status(405).end();
      const email = String(body.email || '').trim().toLowerCase(), pw = String(body.password || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return res.status(400).json({ error: 'Email inválido' });
      if (pw.length < 6 || pw.length > 200) return res.status(400).json({ error: 'A palavra-passe precisa de pelo menos 6 caracteres' });
      const path = 'users/' + sha(email) + '.json';
      const ex = await readJSON(path);
      if (a === 'register') {
        if (ex) return res.status(409).json({ error: 'Já existe uma conta com este email' });
        const salt = crypto.randomBytes(16).toString('hex'), uid = crypto.randomBytes(12).toString('hex');
        await writeJSON(path, { uid, salt, hash: hashPw(pw, salt), created: Date.now() });
        return res.json({ token: await sign(uid), email });
      }
      await new Promise(r => setTimeout(r, 300));
      if (!ex || hashPw(pw, ex.salt) !== ex.hash) return res.status(401).json({ error: 'Email ou palavra-passe errados' });
      return res.json({ token: await sign(ex.uid), email });
    }
    if (a === 'data') {
      const uid = await verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
      if (!uid) return res.status(401).json({ error: 'A sessão expirou. Entra outra vez.' });
      const path = 'data/' + uid + '.json';
      if (req.method === 'GET') return res.json((await readJSON(path)) || { data: null, updatedAt: 0 });
      if (req.method === 'PUT' || req.method === 'POST') {
        const raw = JSON.stringify(body.data || null);
        if (raw.length > 3000000) return res.status(413).json({ error: 'Dados demasiado grandes' });
        const updatedAt = Date.now();
        await writeJSON(path, { data: body.data, updatedAt });
        return res.json({ updatedAt });
      }
      return res.status(405).end();
    }
    return res.status(404).json({ error: 'Pedido desconhecido' });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor' });
  }
}
