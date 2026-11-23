// Vinovim — listas partilhadas (qualquer pessoa com o link de convite pode ver e editar)
import crypto from 'node:crypto';
import { readJSON, writeJSON, sha, body as readBody, fail } from './_lib.js';

const clean = (s, n) =>
  String(s || '')
    .replace(/[\u0000-\u001f]/g, '')
    .trim()
    .slice(0, n);
const pub = l => ({ id: l.id, name: l.name, items: l.items, updated: l.updated, by: l.by });

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const body = readBody(req);
    const a = req.query.a || '';
    if (a === 'create') {
      if (req.method !== 'POST') return res.status(405).end();
      const name = clean(body.name, 60) || 'Lista partilhada';
      const id = crypto.randomBytes(6).toString('hex'),
        key = crypto.randomBytes(16).toString('base64url');
      const l = { id, name, keyHash: sha(key), items: {}, updated: Date.now(), by: clean(body.by, 30) };
      await writeJSON('shared/' + id + '.json', l);
      return res.json({ id, key, list: pub(l) });
    }
    const id = String(req.query.id || '').replace(/[^a-f0-9]/g, ''),
      key = String(req.query.k || '');
    if (!id || !key) return res.status(400).json({ error: 'Link de lista inválido' });
    const path = 'shared/' + id + '.json';
    const l = await readJSON(path);
    if (!l || l.keyHash !== sha(key))
      return res.status(404).json({ error: 'Esta lista já não existe ou o link está errado' });
    if (req.method === 'GET') return res.json({ list: pub(l) });
    if (req.method !== 'POST') return res.status(405).end();
    const ops = Array.isArray(body.ops) ? body.ops.slice(0, 50) : [];
    const now = Date.now();
    for (const o of ops) {
      if (o.op === 'add' && o.item && o.item.id) {
        if (Object.keys(l.items).length >= 500) break;
        const it = o.item,
          iid = clean(it.id, 40);
        if (!l.items[iid])
          l.items[iid] = {
            id: iid,
            type: it.type === 'series' ? 'series' : 'movie',
            name: clean(it.name, 120),
            poster: /^https:\/\//.test(it.poster || '') ? clean(it.poster, 300) : '',
            by: clean(o.by, 30),
            added: now
          };
      } else if (o.op === 'del' && o.id) delete l.items[clean(o.id, 40)];
      else if (o.op === 'rename' && o.name) l.name = clean(o.name, 60);
    }
    l.updated = now;
    await writeJSON(path, l);
    return res.json({ list: pub(l) });
  } catch (e) {
    return fail(res, e);
  }
}
