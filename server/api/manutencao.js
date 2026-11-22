import { json, falha, mesmaOrigem, lerJson, esquema, sb, utilizadorAdmin } from './_sb.js';

// Só o administrador liga ou desliga a manutenção (o RLS do Supabase também o garante)
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return json(res, 405, { erro: 'metodo' });
    if (!mesmaOrigem(req)) return json(res, 403, { erro: 'origem' });
    const adm = await utilizadorAdmin(req);
    if (!adm) return json(res, 401, { erro: 'sem-sessao' });
    const b = await lerJson(req);
    if (!esquema.bool(b.ativa)) return json(res, 400, { erro: 'dados' });
    const r = await sb(
      '/rest/v1/site_settings?key=eq.manutencao',
      { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ value: { ativa: b.ativa }, updated_at: new Date().toISOString(), updated_by: adm.email }) },
      adm.token
    );
    const linhas = r.ok ? await r.json() : [];
    if (!linhas.length) return json(res, 502, { erro: 'nao-gravou' });
    json(res, 200, { ok: true, manutencao: b.ativa });
  } catch (e) {
    falha(res, e);
  }
}
