/* vinovim — ecrã de entrada (v1.7.7)
   Depois da abertura, quem não tem sessão iniciada vê este ecrã:
   continuar com Google, entrar ou criar conta com email, ou continuar sem conta. */
(() => {
'use strict';
const API = /^https?:$/.test(location.protocol) ? '' : ((window.vinovimNative && window.vinovimNative.remote) || 'https://vinovim.vercel.app');
const AUTH_KEY = 'vinovim.auth', SKIP_KEY = 'vinovim.semconta';
const hasAuth = () => { try { return !!(JSON.parse(localStorage.getItem(AUTH_KEY)) || {}).token; } catch (e) { return false; } };
const deep = /^(comando|colab|lista)=/.test(location.hash.slice(1));
let skipped = false; try { skipped = !!localStorage.getItem(SKIP_KEY); } catch (e) {}
if (hasAuth() || deep || skipped) return;

const IS_ELECTRON = !!window.vinovimNative;
const IS_CAP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

document.head.insertAdjacentHTML('beforeend', `<style>
#vvLogin{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:24px;overflow:auto;background:radial-gradient(900px 520px at 50% -10%,rgba(224,49,91,.22),transparent 60%),radial-gradient(700px 500px at 100% 110%,rgba(124,92,255,.14),transparent 60%),var(--bg,#09080d);animation:fade .35s}
#vvLogin .lw{width:min(400px,100%);text-align:center}
#vvLogin .lg{width:64px;height:64px;margin:0 auto 18px;filter:drop-shadow(0 12px 30px rgba(224,49,91,.45))}
#vvLogin h1{font-family:var(--fd);font-size:30px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px}
#vvLogin .sub{color:var(--mu,#b9b4c7);font-size:14.5px;line-height:1.5;margin:0 0 26px}
#vvLogin .gbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:12px;height:50px;border-radius:14px;border:0;background:#fff;color:#1f1f1f;font:600 15px/1 Inter,Segoe UI,system-ui,sans-serif;cursor:pointer;transition:transform .15s,box-shadow .15s}
#vvLogin .gbtn:hover,#vvLogin .gbtn:focus-visible{transform:translateY(-1px);box-shadow:0 10px 30px rgba(0,0,0,.35);outline:none}
#vvLogin .gbtn svg{width:20px;height:20px}
#vvLogin .or{display:flex;align-items:center;gap:12px;color:var(--mu2,#7d7790);font-size:12.5px;margin:20px 0}
#vvLogin .or:before,#vvLogin .or:after{content:'';flex:1;height:1px;background:var(--line,rgba(255,255,255,.1))}
#vvLogin form{display:grid;gap:10px}
#vvLogin .inp{width:100%;height:48px;box-sizing:border-box}
#vvLogin .go{height:48px;justify-content:center;width:100%}
#vvLogin .lsw{margin-top:18px;font-size:13.5px;color:var(--mu,#b9b4c7)}
#vvLogin .lsw button,#vvLogin .skip{background:none;border:0;color:var(--ac,#e0315b);font:inherit;font-weight:700;cursor:pointer;padding:0}
#vvLogin .skip{display:block;margin:26px auto 0;color:var(--mu2,#7d7790);font-weight:600;font-size:13.5px}
#vvLogin .skip:hover{color:#fff}
#vvLogin .err{min-height:20px;color:#ff8fa8;font-size:13px;margin:4px 0 0}
#vvLogin .wait{display:none;padding:22px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid var(--line,rgba(255,255,255,.1));margin-top:6px}
#vvLogin.waiting .wait{display:block}#vvLogin.waiting .main{display:none}
#vvLogin .wait .spin{width:30px;height:30px;border-width:3px;margin:0 auto 14px;display:block}
#vvLogin .wait p{margin:0 0 14px;color:var(--mu,#b9b4c7);font-size:14px;line-height:1.5}
</style>`);

const G = '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
const LOGO_SVG = '<svg viewBox="0 0 48 48"><defs><linearGradient id="vvlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0315b"/><stop offset="1" stop-color="#f5c26b"/></linearGradient></defs><rect width="48" height="48" rx="14" fill="url(#vvlg)"/><path d="M14 13 L24 35 L34 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="13" r="3" fill="#fff"/></svg>';

let mode = 'login';
const el = document.createElement('div'); el.id = 'vvLogin';
el.innerHTML = `<div class="lw">
  <div class="lg">${LOGO_SVG}</div>
  <h1>Bem-vindo ao Vinovim</h1>
  <p class="sub">Entra para teres a tua lista, os teus perfis e o teu progresso no PC, no telemóvel e na TV.</p>
  <div class="main">
    <button class="gbtn" type="button" data-g>${G}<span>Continuar com Google</span></button>
    <div class="or">ou com email</div>
    <form id="vvLForm" novalidate>
      <input class="inp" name="email" type="email" placeholder="Email" autocomplete="email" required>
      <input class="inp" name="password" type="password" placeholder="Palavra-passe" autocomplete="current-password" minlength="6" required>
      <button class="btn acc go" type="submit">Entrar</button>
      <p class="err" id="vvLErr"></p>
    </form>
    <div class="lsw"><span id="vvLSwTx">Ainda não tens conta?</span> <button type="button" data-sw>Criar conta</button></div>
    <button class="skip" type="button" data-skip>Continuar sem conta</button>
  </div>
  <div class="wait"><span class="spin"></span><p>Conclui o login no browser que abriu.<br>Depois volta aqui: entras sozinho.</p><button class="btn gho" type="button" data-cancel>Cancelar</button></div>
</div>`;
document.body.appendChild(el);

const form = el.querySelector('#vvLForm'), err = el.querySelector('#vvLErr');
const say = t => { err.textContent = t || ''; };
function setMode(m) {
  mode = m; say('');
  form.querySelector('.go').textContent = m === 'register' ? 'Criar conta' : 'Entrar';
  form.password.setAttribute('autocomplete', m === 'register' ? 'new-password' : 'current-password');
  el.querySelector('#vvLSwTx').textContent = m === 'register' ? 'Já tens conta?' : 'Ainda não tens conta?';
  el.querySelector('[data-sw]').textContent = m === 'register' ? 'Entrar' : 'Criar conta';
}
function finish(token, email) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify({ token, email })); localStorage.removeItem(SKIP_KEY); } catch (e) {}
  // recomeça a app já com a sessão: sincroniza e mostra “Quem está a ver?”
  location.reload();
}

form.onsubmit = async e => {
  e.preventDefault();
  const email = form.email.value.trim(), password = form.password.value;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Escreve um email válido.');
  if (password.length < 6) return say('A palavra-passe precisa de pelo menos 6 caracteres.');
  const b = form.querySelector('.go'), label = b.textContent; b.disabled = true; b.innerHTML = '<span class="spin"></span>'; say('');
  try {
    const r = await fetch(API + '/api/account?a=' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.token) throw new Error(j.error || 'Não foi possível entrar. Tenta outra vez.');
    finish(j.token, j.email || email);
  } catch (x) { say(x.message === 'Failed to fetch' ? 'Sem ligação à internet.' : x.message); b.disabled = false; b.textContent = label; }
};
el.querySelector('[data-sw]').onclick = () => setMode(mode === 'login' ? 'register' : 'login');
el.querySelector('[data-skip]').onclick = () => {
  try { localStorage.setItem(SKIP_KEY, '1'); } catch (e) {}
  el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300);
};

/* ---------- Google: o login acontece no browser; a app vai perguntando ao servidor se já terminou ---------- */
let pollT = null, pollEnd = 0;
const stopPoll = () => { clearTimeout(pollT); pollT = null; el.classList.remove('waiting'); };
el.querySelector('[data-cancel]').onclick = stopPoll;
function code() { const a = new Uint8Array(24); crypto.getRandomValues(a); return Array.from(a, x => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[x % 62]).join('') + Date.now().toString(36).replace(/[^A-Za-z0-9]/g, ''); }
el.querySelector('[data-g]').onclick = async () => {
  say('');
  let cfg = {};
  try { cfg = await fetch(API + '/api/google?a=config', { cache: 'no-store' }).then(r => r.json()); } catch (e) { return say('Sem ligação à internet.'); }
  if (!cfg.clientId) return say('O login com Google ainda não está ativo. Por agora, entra com email.');
  const c = code();
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: cfg.clientId, redirect_uri: cfg.redirect, response_type: 'code', scope: 'openid email profile', state: c, prompt: 'select_account' });
  if (IS_ELECTRON) window.open(url, '_blank');            // a app de Windows abre no browser do sistema
  else if (IS_CAP) location.href = url;                    // no Android, o Capacitor abre o browser do sistema
  else if (!window.open(url, 'vvgoogle', 'width=480,height=640')) location.href = url;
  el.classList.add('waiting');
  pollEnd = Date.now() + 5 * 60 * 1000;
  const poll = async () => {
    if (!el.classList.contains('waiting')) return;
    if (Date.now() > pollEnd) { stopPoll(); return say('O tempo para entrar acabou. Tenta outra vez.'); }
    try {
      const r = await fetch(API + '/api/google?a=poll&code=' + c, { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (j.token) return finish(j.token, j.email);
      if (!r.ok && r.status !== 404) { stopPoll(); return say(j.error || 'Não foi possível entrar com Google.'); }
    } catch (e) {}
    pollT = setTimeout(poll, 2000);
  };
  pollT = setTimeout(poll, 2500);
};
})();
