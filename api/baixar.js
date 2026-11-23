import { BASE, CHAVE, sb } from './_sb.js';

const ALVOS = { windows: '/downloads/vinovim-setup.exe', android: '/downloads/vinovim.apk' };

// Conta a transferência e entrega o ficheiro (o tipo vem de uma lista fechada)
export default async function handler(req, res) {
  const tipo = new URL(req.url, 'http://x').searchParams.get('tipo') || '';
  if (!Object.prototype.hasOwnProperty.call(ALVOS, tipo)) {
    res.statusCode = 400;
    return res.end('tipo invalido');
  }
  try {
    if (BASE && CHAVE) await sb('/rest/v1/rpc/contar', { method: 'POST', body: JSON.stringify({ p_tipo: tipo }) });
  } catch {}
  res.statusCode = 302;
  res.setHeader('Location', ALVOS[tipo]);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}
