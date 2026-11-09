// Vinovim — o Google volta para aqui depois de a pessoa escolher a conta.
// Usa o fluxo "id_token" do Google: não precisa de segredo, só do ID do cliente (que é público).
//   GET  → página que lê o token que o Google pôs no endereço (#id_token=…) e envia-o para aqui
//   POST → confirma o token junto do Google, cria/encontra a conta e deixa a sessão pronta para a app
import crypto from 'node:crypto';
import { readJSON, writeJSON, sha, sign, validCode } from './_lib.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const PAGE = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vinovim</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(700px 400px at 50% 0,rgba(224,49,91,.25),transparent 60%),#09080d;color:#fff;font-family:Inter,Segoe UI,system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
.c{max-width:420px}.i{width:76px;height:76px;margin:0 auto 22px;border-radius:24px;display:grid;place-items:center;font-size:38px;background:#2a2433}.i.ok{background:linear-gradient(135deg,#e0315b,#f5c26b)}
h1{font-size:26px;margin:0 0 10px}p{color:#b9b4c7;line-height:1.5;margin:0}
.sp{width:34px;height:34px;border:3px solid rgba(255,255,255,.2);border-top-color:#fff;border-radius:50%;animation:r 1s linear infinite}@keyframes r{to{transform:rotate(1turn)}}</style></head>
<body><div class="c"><div class="i" id="i"><div class="sp"></div></div><h1 id="t">A entrar…</h1><p id="m">Só um momento.</p></div>
<script>
(function(){
  var h=new URLSearchParams(location.hash.slice(1)), q=new URLSearchParams(location.search);
  function show(ok,t,m){var i=document.getElementById('i');i.className='i'+(ok?' ok':'');i.textContent=ok?'\\u2713':'!';document.getElementById('t').textContent=t;document.getElementById('m').textContent=m;if(ok)setTimeout(function(){try{window.close()}catch(e){}},1500);}
  history.replaceState(null,'',location.pathname);
  if(h.get('error')||q.get('error'))return show(false,'Login cancelado','Podes fechar esta janela e tentar outra vez no Vinovim.');
  var tok=h.get('id_token'), st=h.get('state');
  if(!tok||!st)return show(false,'Pedido inválido','Volta ao Vinovim e carrega outra vez em “Continuar com Google”.');
  fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id_token:tok,state:st})})
    .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
    .then(function(x){ if(x.ok) show(true,'Sessão iniciada','Já podes voltar ao Vinovim. Esta janela pode ser fechada.'); else show(false,'Não foi possível entrar',x.j.error||'Tenta outra vez.'); })
    .catch(function(){ show(false,'Sem ligação','Verifica a internet e tenta outra vez.'); });
})();
</script></body></html>`;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(PAGE);
  }
  if (req.method !== 'POST') return res.status(405).end();
  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const idToken = String(body.id_token || ''),
      state = String(body.state || '');
    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) return res.status(503).json({ error: 'O login com Google ainda não está ativo.' });
    if (!idToken || idToken.length > 5000 || !validCode(state))
      return res.status(400).json({ error: 'Pedido inválido.' });

    // o próprio Google confirma a assinatura e a validade do token
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken));
    const c = await r.json().catch(() => ({}));
    if (!r.ok || c.aud !== id || !/^(https:\/\/)?accounts\.google\.com$/.test(c.iss || ''))
      return res.status(401).json({ error: 'O Google não confirmou o login. Tenta outra vez.' });
    if (c.nonce !== state) return res.status(401).json({ error: 'Pedido inválido.' });
    if (!c.email || String(c.email_verified) !== 'true')
      return res.status(401).json({ error: 'Esta conta Google não tem um email confirmado.' });
    if (Number(c.exp) * 1000 < Date.now()) return res.status(401).json({ error: 'O login expirou. Tenta outra vez.' });

    const email = String(c.email).toLowerCase();
    const path = 'users/' + sha(email) + '.json';
    const ex = await readJSON(path);
    let uid;
    if (ex && ex.uid) {
      uid = ex.uid;
      if (!ex.google) await writeJSON(path, Object.assign({}, ex, { google: c.sub }));
    } else {
      uid = crypto.randomBytes(12).toString('hex');
      await writeJSON(path, { uid, google: c.sub, created: Date.now() });
    }
    const pend = 'pending/' + sha(state) + '.json';
    const old = await readJSON(pend);
    if (old && old.used) return res.status(409).json({ error: 'Este login já foi usado. Tenta outra vez.' });
    await writeJSON(pend, { token: await sign(uid), email, name: c.name || '', exp: Date.now() + 10 * 60 * 1000 });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Erro no servidor. Tenta outra vez daqui a pouco.' });
  }
}
