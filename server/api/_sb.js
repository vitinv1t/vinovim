// Ajudantes comuns das rotas /api (sem dependências)
export const ADMIN = (process.env.ADMIN_EMAIL || 'vitin7xisde@gmail.com').toLowerCase();
export const BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
export const CHAVE = process.env.SUPABASE_ANON_KEY || '';

export function cookies(req) {
  const o = {};
  String(req.headers.cookie || '')
    .split(';')
    .forEach(p => {
      const i = p.indexOf('=');
      if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    });
  return o;
}

const OP = '; Path=/; HttpOnly; Secure; SameSite=Strict';
export const cookieSessao = (at, rt) => [
  'vv_at=' + encodeURIComponent(at) + OP + '; Max-Age=3600',
  'vv_rt=' + encodeURIComponent(rt) + OP + '; Max-Age=604800',
];
export const cookieLimpo = () => ['vv_at=' + OP + '; Max-Age=0', 'vv_rt=' + OP + '; Max-Age=0'];

export function json(res, status, corpo, extra = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const k in extra) res.setHeader(k, extra[k]);
  res.end(JSON.stringify(corpo));
}

// nunca devolve detalhes de erros internos ao navegador
export function falha(res, e) {
  console.error('[vinovim-api]', e && e.message ? e.message : e);
  json(res, 500, { erro: 'interno' });
}

export function mesmaOrigem(req) {
  const o = req.headers.origin;
  if (!o) return false;
  try {
    return new URL(o).host === req.headers.host;
  } catch {
    return false;
  }
}

export async function lerJson(req, max = 4096) {
  let s = '';
  for await (const c of req) {
    s += c;
    if (s.length > max) throw new Error('corpo grande');
  }
  return s ? JSON.parse(s) : {};
}

// validação estrita (equivalente ao que faria um esquema Zod)
export const esquema = {
  texto: (v, min, max) => typeof v === 'string' && v.length >= min && v.length <= max,
  email: v => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  bool: v => typeof v === 'boolean',
};

// limite de pedidos (por instância; o Supabase Auth tem o seu próprio limite)
const caixa = new Map();
export function limite(chave, max, janelaMs) {
  const agora = Date.now();
  const l = (caixa.get(chave) || []).filter(t => agora - t < janelaMs);
  l.push(agora);
  caixa.set(chave, l);
  if (caixa.size > 5000) caixa.clear();
  return l.length > max;
}
export const ip = req => String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();

export async function sb(caminho, init = {}, token) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 5000);
  try {
    return await fetch(BASE + caminho, {
      ...init,
      signal: c.signal,
      headers: { apikey: CHAVE, Authorization: 'Bearer ' + (token || CHAVE), 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

export async function utilizadorAdmin(req) {
  const tk = cookies(req).vv_at;
  if (!tk || !BASE || !CHAVE) return null;
  const r = await sb('/auth/v1/user', {}, tk);
  if (!r.ok) return null;
  const u = await r.json();
  return String(u.email).toLowerCase() === ADMIN && u.email_confirmed_at ? { email: u.email, token: tk } : null;
}
