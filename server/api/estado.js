import { BASE, CHAVE, json, falha, sb, utilizadorAdmin } from './_sb.js';

// Público: só diz se está em manutenção. Para o administrador, acrescenta os contadores.
export default async function handler(req, res) {
  try {
    let manutencao = true;
    if (BASE && CHAVE) {
      const r = await sb('/rest/v1/rpc/manutencao_ativa', { method: 'POST', body: '{}' }).catch(() => null);
      if (r && r.ok) manutencao = (await r.json()) !== false;
    }
    const out = { manutencao, admin: false };
    const adm = await utilizadorAdmin(req).catch(() => null);
    if (adm) {
      out.admin = true;
      const c = await sb('/rest/v1/contadores?select=tipo,total', {}, adm.token).catch(() => null);
      out.contadores = {};
      if (c && c.ok) (await c.json()).forEach(l => (out.contadores[l.tipo] = Number(l.total)));
    }
    json(res, 200, out);
  } catch (e) {
    falha(res, e);
  }
}
