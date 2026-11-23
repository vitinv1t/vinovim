// Vinovim — contas e sincronização
//   ?a=register | ?a=login  → conta com email e palavra-passe
//   ?a=data                 → estado sincronizado (perfis, listas, progresso…)
//   ?a=backup               → cópia de segurança das definições
//   ?a=now                  → o que estás a ver agora, para continuar noutro dispositivo
import crypto from 'node:crypto';
import { STORE, OLD_BACK, OldStoreError, readJSON, writeJSON, sign, verify, body as readBody, fail } from './_lib.js';
import { findUser, createUser, setOwner, oldData, absorbed } from './_contas.js';

const hashPw = (pw, salt) => crypto.pbkdf2Sync(pw, salt, 120000, 32, 'sha256').toString('hex');
const bearer = req => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
const EXPIRED = { error: 'A sessão expirou. Entra outra vez.' };

/* guarda e devolve um registo do utilizador (data, backup) */
async function userDoc(req, res, path, key, max, uid) {
  if (req.method === 'GET') {
    const doc = (await readJSON(path)) || { [key]: null, updatedAt: 0 };
    if (key !== 'data') return res.json(doc);
    // dados de uma conta antiga com o mesmo email, que a app ainda tem de juntar (nunca impede a sincronização)
    const old = await oldData(uid).catch(e => (console.error('[vinovim] conta antiga', e.message), []));
    return res.json(old.length ? Object.assign({}, doc, { old }) : doc);
  }
  if (req.method !== 'PUT' && req.method !== 'POST') return res.status(405).end();
  const b = readBody(req);
  if (JSON.stringify(b[key] || null).length > max) return res.status(413).json({ error: 'Dados demasiado grandes' });
  const updatedAt = Date.now();
  await writeJSON(path, { [key]: b[key], updatedAt });
  if (key === 'data') await absorbed(uid, b.absorbed);
  return res.json({ updatedAt });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const a = req.query.a;
    if (a === 'register' || a === 'login') {
      if (req.method !== 'POST') return res.status(405).end();
      const b = readBody(req);
      const email = String(b.email || '')
          .trim()
          .toLowerCase(),
        pw = String(b.password || '');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120)
        return res.status(400).json({ error: 'Email inválido' });
      if (pw.length < 6 || pw.length > 200)
        return res.status(400).json({ error: 'A palavra-passe precisa de pelo menos 6 caracteres' });
      const { s, rec, oldOk } = await findUser(email);
      if (a === 'register') {
        if (rec) return res.status(409).json({ error: 'Já existe uma conta com este email' });
        const salt = crypto.randomBytes(16).toString('hex');
        const n = await createUser(s, { salt, hash: hashPw(pw, salt) }, oldOk);
        return res.json({ token: await sign(n.uid), email });
      }
      await new Promise(r => setTimeout(r, 300));
      if (!rec) {
        if (!oldOk) throw new OldStoreError('login');
        return res.status(401).json({ error: 'Email ou palavra-passe errados' });
      }
      if (!rec.hash) {
        if (STORE === 'redis' && !rec.checked)
          return res.status(503).json({
            error:
              'A palavra-passe desta conta está no armazenamento antigo, em pausa até ' +
              OLD_BACK +
              '. Até lá, entra com “Continuar com Google”.'
          });
        return res.status(401).json({ error: 'Esta conta usa o login com Google. Carrega em “Continuar com Google”.' });
      }
      if (hashPw(pw, rec.salt) !== rec.hash) return res.status(401).json({ error: 'Email ou palavra-passe errados' });
      await setOwner(rec.uid, s);
      return res.json({ token: await sign(rec.uid), email });
    }

    if (a === 'data' || a === 'backup' || a === 'now') {
      const uid = await verify(bearer(req));
      if (!uid) return res.status(401).json(EXPIRED);
      if (a === 'data') return userDoc(req, res, 'data/' + uid + '.json', 'data', 3000000, uid);
      if (a === 'backup') return userDoc(req, res, 'backup/' + uid + '.json', 'backup', 2000000, uid);
      // "now" guarda o próprio pedido (dispositivo, título, posição…) e apaga-se sozinho ao fim de 3 dias
      const path = 'now/' + uid + '.json';
      if (req.method === 'GET') return res.json((await readJSON(path)) || {});
      if (req.method !== 'PUT' && req.method !== 'POST') return res.status(405).end();
      const b = readBody(req);
      if (JSON.stringify(b).length > 20000) return res.status(413).json({ error: 'Demasiado grande' });
      await writeJSON(path, Object.assign({}, b, { at: Date.now() }), 3 * 86400);
      return res.json({ ok: true });
    }
    return res.status(404).json({ error: 'Pedido desconhecido' });
  } catch (e) {
    return fail(res, e);
  }
}
