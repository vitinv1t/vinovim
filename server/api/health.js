import { BASE, CHAVE, json, sb } from './_sb.js';

// Monitorização: não revela nenhum detalhe interno
export default async function handler(req, res) {
  const t0 = Date.now();
  let supabase = false;
  try {
    if (BASE && CHAVE) supabase = (await sb('/rest/v1/rpc/manutencao_ativa', { method: 'POST', body: '{}' })).ok;
  } catch {}
  json(res, supabase ? 200 : 503, { ok: supabase, supabase, ms: Date.now() - t0, hora: new Date().toISOString() });
}
