// Vinovim: bloqueio de manutenção feito no servidor, antes de qualquer página.
// Regra "fail-closed": se não der para ler o estado no Supabase, o site fica em manutenção.
declare const process: any;

export const config = { matcher: ['/((?!_vercel/).*)'] };

const LIVRES = [
  /^\/manutencao(\.html)?$/,
  /^\/v-16ef525c7fe8edb052b50791(\.html)?$/,
  /^\/admin\.js$/,
  /^\/icon\.svg$/,
  /^\/icons\//,
  /^\/manifest\.webmanifest$/,
  /^\/version\.json$/,
  /^\/api\/(health|estado|entrar|sair|manutencao)$/,
];

const ADMIN = (process.env.ADMIN_EMAIL || 'vitin7xisde@gmail.com').toLowerCase();

function cookie(req: Request, nome: string): string {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

async function comTempo(url: string, init: RequestInit, ms = 3000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: c.signal });
  } finally {
    clearTimeout(t);
  }
}

async function manutencaoAtiva(base: string, chave: string): Promise<boolean> {
  try {
    const r = await comTempo(base + '/rest/v1/rpc/manutencao_ativa', {
      method: 'POST',
      headers: { apikey: chave, Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' },
      body: '{}',
      cache: 'no-store',
    });
    if (!r.ok) return true;
    const v = await r.json();
    return v !== false; // só abre se for exatamente false
  } catch {
    return true;
  }
}

async function eAdmin(base: string, chave: string, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const r = await comTempo(base + '/auth/v1/user', { headers: { apikey: chave, Authorization: 'Bearer ' + token } });
    if (!r.ok) return false;
    const u = await r.json();
    return String(u && u.email).toLowerCase() === ADMIN && !!u.email_confirmed_at;
  } catch {
    return false;
  }
}

async function renovar(base: string, chave: string, rt: string) {
  try {
    const r = await comTempo(base + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.access_token && d.refresh_token ? d : null;
  } catch {
    return null;
  }
}

const seguir = (extra?: string[]) => {
  const h = new Headers({ 'x-middleware-next': '1' });
  (extra || []).forEach(c => h.append('set-cookie', c));
  return new Response(null, { headers: h });
};

// o endereço antigo do login já não existe: responde como qualquer página inexistente
const velho = (p: string) => /^\/entrar(\.html)?\/?$/.test(p);
async function naoExiste(req: Request): Promise<Response> {
  const cab = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Content-Type': 'text/html; charset=utf-8' };
  try {
    const pag = await fetch(new URL('/404.html', req.url), { cache: 'no-store' });
    return new Response(pag.body, { status: 404, headers: cab });
  } catch {
    return new Response('Não encontrado.', { status: 404, headers: cab });
  }
}

export default async function middleware(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (LIVRES.some(r => r.test(url.pathname))) return seguir();

  const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const chave = process.env.SUPABASE_ANON_KEY || '';
  let bloqueado = true; // por defeito, bloqueado
  if (base && chave) bloqueado = await manutencaoAtiva(base, chave);
  if (!bloqueado) return velho(url.pathname) ? naoExiste(req) : seguir();

  // em manutenção: só o administrador entra
  if (base && chave) {
    if (await eAdmin(base, chave, cookie(req, 'vv_at'))) return velho(url.pathname) ? naoExiste(req) : seguir();
    const rt = cookie(req, 'vv_rt');
    if (rt) {
      const d = await renovar(base, chave, rt);
      if (d && (await eAdmin(base, chave, d.access_token))) {
        const op = '; Path=/; HttpOnly; Secure; SameSite=Strict';
        return seguir([
          'vv_at=' + encodeURIComponent(d.access_token) + op + '; Max-Age=3600',
          'vv_rt=' + encodeURIComponent(d.refresh_token) + op + '; Max-Age=604800',
        ]);
      }
    }
  }

  const cab = { 'Cache-Control': 'no-store', 'Retry-After': '600', 'X-Robots-Tag': 'noindex' };
  const quer = req.headers.get('accept') || '';
  if (url.pathname.startsWith('/api/') || (!quer.includes('text/html') && req.headers.get('sec-fetch-mode') !== 'navigate')) {
    return new Response(JSON.stringify({ erro: 'manutencao' }), {
      status: 503,
      headers: { ...cab, 'Content-Type': 'application/json; charset=utf-8' },
    });
  }
  try {
    const pag = await fetch(new URL('/manutencao.html', req.url), { cache: 'no-store' });
    return new Response(pag.body, { status: 503, headers: { ...cab, 'Content-Type': 'text/html; charset=utf-8' } });
  } catch {
    return new Response('Vinovim em manutenção.', { status: 503, headers: cab });
  }
}
