// Catálogo base do Vinovim: o servidor pede ao fornecedor e devolve o resultado.
// O endereço do fornecedor fica só na variável de ambiente CATALOGO_URL (nunca no código).
export default async function handler(req, res) {
  const base = (process.env.CATALOGO_URL || '').replace(/\/+$/, '');
  if (!base) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end('{"erro":"catalogo indisponivel"}');
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    return res.end();
  }
  const u = new URL(req.url, 'http://x');
  const caminho = u.pathname.startsWith('/api/catalogo/') ? u.pathname.slice(14) : '';
  if (!caminho || caminho.includes('..') || caminho.includes('//') || !/^[\w.,%~:+=@&\-\/]+$/.test(caminho)) {
    res.statusCode = 400;
    return res.end();
  }
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch(base + '/' + caminho + u.search, { signal: c.signal, headers: { accept: 'application/json' } });
    const corpo = Buffer.from(await r.arrayBuffer());
    res.statusCode = r.status;
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json; charset=utf-8');
    if (r.ok) res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
    res.end(corpo);
  } catch {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end('{"erro":"catalogo indisponivel"}');
  } finally {
    clearTimeout(t);
  }
}
