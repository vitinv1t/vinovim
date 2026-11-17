// Vinovim — funções partilhadas pelas APIs (o "_" no nome faz com que o Vercel não a publique como rota)
//
// Onde ficam as contas e os dados sincronizados:
//  • Upstash Redis, quando o projeto o tem ligado no Vercel (variáveis KV_REST_API_URL e KV_REST_API_TOKEN);
//  • senão, o Vercel Blob privado, como antes.
// Com o Redis ligado, o que ainda não estiver lá é lido uma vez do Blob e copiado (se o Blob responder),
// para as contas antigas continuarem a funcionar.
import crypto from 'node:crypto';

export const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
export const validCode = c => /^[A-Za-z0-9]{24,64}$/.test(String(c || ''));
export const GOOGLE_REDIRECT = process.env.GOOGLE_REDIRECT_URI || 'https://vinovim.vercel.app/api/google-callback';

/* falha do armazenamento (servidor sem resposta, limite gasto…), diferente de "não existe" */
export class StoreError extends Error {}

// o Vercel cria KV_REST_API_URL/TOKEN (às vezes com um prefixo à frente); a Upstash usa UPSTASH_REDIS_REST_*
function upstashEnv() {
  const e = process.env;
  if (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN)
    return [e.UPSTASH_REDIS_REST_URL, e.UPSTASH_REDIS_REST_TOKEN];
  const k = Object.keys(e).find(n => n.endsWith('KV_REST_API_URL'));
  return k ? [e[k], e[k.slice(0, -'URL'.length) + 'TOKEN']] : [];
}
const [R_URL, R_TOKEN] = upstashEnv();
export const STORE = R_URL && R_TOKEN ? 'redis' : 'blob';
const KEY = 'vv:';

async function redis(cmd) {
  let r, j;
  try {
    r = await fetch(R_URL, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + R_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd)
    });
    j = await r.json();
  } catch (e) {
    throw new StoreError('redis: ' + e.message);
  }
  if (!r.ok || j.error) throw new StoreError('redis: ' + (j.error || r.status));
  return j.result;
}

let blobSdk = null;
const blob = async () => (blobSdk ||= await import('@vercel/blob'));

async function blobRead(path) {
  let r;
  try {
    r = await (await blob()).get(path, { access: 'private', useCache: false });
  } catch (e) {
    throw new StoreError('blob: ' + e.message);
  }
  if (!r) return null; // não existe
  if (r.statusCode !== 200) throw new StoreError('blob: estado ' + r.statusCode);
  return parse(await new Response(r.stream).text());
}

async function blobWrite(path, text) {
  try {
    await (
      await blob()
    ).put(path, text, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    });
  } catch (e) {
    throw new StoreError('blob: ' + e.message);
  }
}

function parse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new StoreError('dados ilegíveis');
  }
}

// o que é passageiro não vale a pena ir buscar ao armazenamento antigo
const passageiro = path => /^(pending|now)\//.test(path);

/* devolve null só quando não existe; se o armazenamento falhar, lança StoreError
   (assim uma falha nunca é confundida com "esta conta não existe") */
export async function readJSON(path) {
  if (STORE === 'blob') return blobRead(path);
  const v = await redis(['GET', KEY + path]);
  if (v != null) return parse(v);
  if (passageiro(path)) return null;
  const old = await blobRead(path).catch(() => null);
  if (old != null) await redis(['SET', KEY + path, JSON.stringify(old), 'NX']);
  return old;
}

/* ttl (segundos) só se aplica no Redis: os registos passageiros apagam-se sozinhos */
export async function writeJSON(path, obj, ttl) {
  const text = JSON.stringify(obj);
  if (STORE === 'blob') return blobWrite(path, text);
  await redis(ttl ? ['SET', KEY + path, text, 'EX', ttl] : ['SET', KEY + path, text]);
}

/* grava só se ainda não existir e devolve o que ficou guardado */
async function keepFirst(path, obj) {
  if (STORE === 'blob') {
    await writeJSON(path, obj);
    return obj;
  }
  const ok = await redis(['SET', KEY + path, JSON.stringify(obj), 'NX']);
  return ok === 'OK' ? obj : readJSON(path);
}

/* ---------- sessões: token assinado com uma chave que só o servidor conhece ---------- */
let SECRET = process.env.SESSION_SECRET || null;
async function secret() {
  if (SECRET) return SECRET;
  let c = await readJSON('config/secret.json');
  if (!c || !c.s) c = await keepFirst('config/secret.json', { s: crypto.randomBytes(32).toString('hex') });
  return (SECRET = c.s);
}
const hmac = (k, p) => crypto.createHmac('sha256', k).update(p).digest('base64url');

export async function sign(uid) {
  const p = Buffer.from(JSON.stringify({ uid, exp: Date.now() + 180 * 864e5 })).toString('base64url');
  return p + '.' + hmac(await secret(), p);
}

export async function verify(tok) {
  const [p, sig] = String(tok || '').split('.');
  if (!p || !sig) return null;
  const a = Buffer.from(sig),
    b = Buffer.from(hmac(await secret(), p));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString());
    return d.exp > Date.now() ? d.uid : null;
  } catch (e) {
    return null;
  }
}

/* ---------- pedidos e respostas ---------- */
export function body(req) {
  const b = req.body || {};
  if (typeof b !== 'string') return b;
  try {
    return JSON.parse(b);
  } catch (e) {
    return {};
  }
}

export function fail(res, e) {
  console.error('[vinovim]', e && e.message ? e.message : e);
  if (e instanceof StoreError)
    return res.status(503).json({
      error:
        'O serviço de contas está temporariamente indisponível. Os teus dados não se perderam: tenta outra vez mais tarde.'
    });
  return res.status(500).json({ error: 'Erro no servidor. Tenta outra vez daqui a pouco.' });
}
