import { json, mesmaOrigem, cookieLimpo } from './_sb.js';

export default function handler(req, res) {
  if (req.method !== 'POST' || !mesmaOrigem(req)) return json(res, 403, { erro: 'origem' });
  res.setHeader('Set-Cookie', cookieLimpo());
  json(res, 200, { ok: true });
}
