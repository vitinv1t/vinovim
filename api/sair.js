import { BASE, CHAVE, json, sb, mesmaOrigem, cookieLimpo } from './_sb.js';

// Terminar sessão. Com ?acao=web (endereço /api/web), conta uma abertura/instalação pela web (PWA).
export default async function handler(req, res) {
  if (req.method !== 'POST' || !mesmaOrigem(req)) return json(res, 403, { erro: 'origem' });
  const acao = (req.query && req.query.acao) || new URL(req.url, 'http://x').searchParams.get('acao');
  if (acao === 'web') {
    try {
      if (BASE && CHAVE) await sb('/rest/v1/rpc/contar', { method: 'POST', body: JSON.stringify({ p_tipo: 'web' }) });
    } catch {}
    return json(res, 200, { ok: true });
  }
  res.setHeader('Set-Cookie', cookieLimpo());
  json(res, 200, { ok: true });
}
