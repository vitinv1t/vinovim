import { BASE, CHAVE, json, sb, mesmaOrigem } from './_sb.js';

// Conta uma abertura/instalação pela web (PWA)
export default async function handler(req, res) {
  if (req.method !== 'POST' || !mesmaOrigem(req)) return json(res, 403, { erro: 'origem' });
  try {
    if (BASE && CHAVE) await sb('/rest/v1/rpc/contar', { method: 'POST', body: JSON.stringify({ p_tipo: 'web' }) });
  } catch {}
  json(res, 200, { ok: true });
}
