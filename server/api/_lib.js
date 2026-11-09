// Vinovim — funções partilhadas pelas APIs (o "_" no nome faz com que o Vercel não a publique como rota)
import { put, get } from '@vercel/blob';
import crypto from 'node:crypto';

export const sha = s => crypto.createHash('sha256').update(s).digest('hex');

export async function readJSON(path) {
  try {
    const r = await get(path, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch (e) {
    return null;
  }
}

export const writeJSON = (path, obj) =>
  put(path, JSON.stringify(obj), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json'
  });

// a mesma chave e o mesmo formato de sessão que /api/account usa
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
export async function sign(uid) {
  const p = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 180 * 864e5 })).toString('base64url');
  return p + '.' + hmac(await secret(), p);
}

export const GOOGLE_REDIRECT = process.env.GOOGLE_REDIRECT_URI || 'https://vinovim.vercel.app/api/google-callback';
export const validCode = c => /^[A-Za-z0-9]{24,64}$/.test(String(c || ''));
