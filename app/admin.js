// Painel do administrador: só aparece com sessão de admin válida (cookie HttpOnly validado no servidor)
(function () {
  'use strict';
  if (window.top !== window) return;
  fetch('/api/estado', { cache: 'no-store', credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.admin) montar(d); })
    .catch(function () {});

  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;margin:0;padding:0}',
    '.raiz{position:fixed;z-index:2147483000;left:50%;bottom:20px;transform:translateX(-50%);font:500 13px/1.2 system-ui,-apple-system,"Segoe UI",Inter,sans-serif;color:#f4f1fa;-webkit-font-smoothing:antialiased}',
    '.p{display:flex;align-items:center;gap:6px;padding:7px;border-radius:18px;background:rgba(16,14,26,.86);border:1px solid rgba(255,255,255,.09);box-shadow:0 18px 50px -12px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.06);-webkit-backdrop-filter:blur(22px) saturate(1.3);backdrop-filter:blur(22px) saturate(1.3);animation:ent .5s cubic-bezier(.2,.8,.2,1) both}',
    '@keyframes ent{from{opacity:0;transform:translateY(12px)}}',
    '.est{display:flex;align-items:center;gap:10px;padding:6px 12px 6px 10px;min-width:150px}',
    '.pt{width:9px;height:9px;border-radius:50%;flex:none;background:#34d399;box-shadow:0 0 0 0 rgba(52,211,153,.6);animation:pu 2.2s infinite}',
    '.man .pt{background:#fbbf24;box-shadow:0 0 0 0 rgba(251,191,36,.55)}',
    '@keyframes pu{70%{box-shadow:0 0 0 8px rgba(52,211,153,0)}100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}}',
    '.man .pt{animation-name:pm}@keyframes pm{70%{box-shadow:0 0 0 8px rgba(251,191,36,0)}100%{box-shadow:0 0 0 0 rgba(251,191,36,0)}}',
    '.tx b{display:block;font-size:13px;font-weight:650;letter-spacing:-.01em}',
    '.tx span{display:block;margin-top:3px;font-size:11px;color:#9a92ad}',
    '.sep{width:1px;align-self:stretch;margin:6px 4px;background:rgba(255,255,255,.08)}',
    '.cs{display:flex;gap:2px}',
    '.c{padding:5px 11px;text-align:center;border-radius:11px}',
    '.c b{display:block;font-size:14px;font-weight:650;font-variant-numeric:tabular-nums}',
    '.c span{display:block;margin-top:3px;font-size:10.5px;color:#9a92ad}',
    'button{font:inherit;color:inherit;border:0;cursor:pointer;background:none}',
    'button:focus-visible{outline:2px solid #a885ff;outline-offset:2px}',
    '.tg{display:flex;align-items:center;gap:10px;height:42px;padding:0 14px 0 8px;border-radius:13px;font-weight:600;background:rgba(255,255,255,.06);transition:background .2s}',
    '.tg:hover{background:rgba(255,255,255,.11)}.tg:disabled{opacity:.6;cursor:wait}',
    '.sw{position:relative;width:34px;height:20px;border-radius:99px;background:rgba(255,255,255,.18);transition:background .25s;flex:none}',
    '.sw i{position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .25s cubic-bezier(.3,1.4,.5,1)}',
    '.aberto .sw{background:linear-gradient(110deg,#8b5cff,#ff4d94)}.aberto .sw i{transform:translateX(14px)}',
    '.ic{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;color:#b9b1cc}',
    '.ic:hover{background:rgba(255,255,255,.08);color:#fff}',
    '.ic svg{width:18px;height:18px}',
    '.mini{display:none;width:46px;height:46px;border-radius:50%;place-items:center;background:rgba(16,14,26,.9);border:1px solid rgba(255,255,255,.1);box-shadow:0 12px 30px -8px rgba(0,0,0,.7)}',
    '.mini .pt{margin:0}',
    '.rec .p{display:none}.rec .mini{display:grid}',
    '.vel,.ts{font:500 13px/1.2 system-ui,-apple-system,"Segoe UI",Inter,sans-serif;color:#f4f1fa;-webkit-font-smoothing:antialiased}',
    '.vel{position:fixed;inset:0;z-index:2147483001;display:none;place-items:center;padding:20px;background:rgba(4,3,8,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
    '.vel.on{display:grid;animation:fd .2s both}@keyframes fd{from{opacity:0}}',
    '.md{width:min(380px,100%);padding:26px;border-radius:22px;background:#12101c;border:1px solid rgba(255,255,255,.1);box-shadow:0 40px 90px -20px rgba(0,0,0,.9);animation:ent .3s cubic-bezier(.2,.8,.2,1) both}',
    '.md h2{font-size:19px;font-weight:700;letter-spacing:-.02em;margin-bottom:8px}',
    '.md p{font-size:14px;line-height:1.5;color:#a9a2b8;margin-bottom:22px}',
    '.bt{display:flex;gap:10px}.bt button{flex:1;height:46px;border-radius:13px;font-weight:600;font-size:14px}',
    '.b1{background:rgba(255,255,255,.07)}.b1:hover{background:rgba(255,255,255,.12)}',
    '.b2{color:#fff;background:linear-gradient(110deg,#8b5cff,#ff4d94 62%,#ff6a6a);box-shadow:0 10px 26px -10px rgba(255,77,148,.7)}',
    '.ts{position:fixed;left:50%;bottom:92px;transform:translateX(-50%) translateY(10px);opacity:0;pointer-events:none;padding:10px 16px;border-radius:12px;background:#12101c;border:1px solid rgba(255,255,255,.1);font-size:13px;transition:all .3s;white-space:nowrap}',
    '.ts.on{opacity:1;transform:translateX(-50%)}',
    '@media(max-width:640px){.raiz{bottom:14px;width:calc(100% - 20px)}.p{justify-content:space-between}.cs,.sep{display:none}.est{min-width:0;flex:1}.tg span.l{display:none}.tg{padding:0 10px}}',
    '@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'
  ].join('');

  var ICO_SAIR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';
  var ICO_MIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/></svg>';

  function montar(d) {
    var host = document.createElement('div');
    host.id = 'vv-painel';
    var sh = host.attachShadow({ mode: 'open' });
    var st = document.createElement('style'); st.textContent = CSS; sh.appendChild(st);
    var raiz = document.createElement('div'); raiz.className = 'raiz'; sh.appendChild(raiz);
    var vel = document.createElement('div'); vel.className = 'vel'; sh.appendChild(vel);
    var ts = document.createElement('div'); ts.className = 'ts'; ts.setAttribute('role', 'status'); sh.appendChild(ts);
    document.body.appendChild(host);

    var ativa = d.manutencao !== false, c = d.contadores || {}, ocupado = false, tt;
    var rec = false;
    try { rec = localStorage.getItem('vv_painel_min') === '1'; } catch (e) {}

    function aviso(t) { ts.textContent = t; ts.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { ts.classList.remove('on'); }, 2600); }
    function n(v) { return Number(v || 0).toLocaleString('pt-PT'); }

    function pinta() {
      raiz.className = 'raiz' + (rec ? ' rec' : '') + (ativa ? ' man' : '');
      raiz.innerHTML =
        '<div class="p' + (ativa ? '' : ' aberto') + '">' +
          '<div class="est"><span class="pt"></span><div class="tx"><b>' + (ativa ? 'Em manutenção' : 'Site aberto') + '</b><span>' + (ativa ? 'Só tu vês o site' : 'Visível a toda a gente') + '</span></div></div>' +
          '<div class="sep"></div>' +
          '<div class="cs"><div class="c"><b>' + n(c.windows) + '</b><span>Windows</span></div><div class="c"><b>' + n(c.android) + '</b><span>Android</span></div><div class="c"><b>' + n(c.web) + '</b><span>Web</span></div></div>' +
          '<div class="sep"></div>' +
          '<button class="tg" id="tg" type="button" role="switch" aria-checked="' + (!ativa) + '"' + (ocupado ? ' disabled' : '') + '><span class="sw"><i></i></span><span class="l">' + (ocupado ? 'A gravar' : (ativa ? 'Abrir o site' : 'Pôr em manutenção')) + '</span></button>' +
          '<button class="ic" id="mn" type="button" aria-label="Minimizar painel" title="Minimizar">' + ICO_MIN + '</button>' +
          '<button class="ic" id="sr" type="button" aria-label="Terminar sessão" title="Terminar sessão">' + ICO_SAIR + '</button>' +
        '</div>' +
        '<button class="mini" id="mx" type="button" aria-label="Abrir painel de administração"><span class="pt"></span></button>';
      raiz.querySelector('#tg').onclick = function () { if (ativa) confirmar(); else alternar(true); };
      raiz.querySelector('#mn').onclick = function () { rec = true; try { localStorage.setItem('vv_painel_min', '1'); } catch (e) {} pinta(); };
      raiz.querySelector('#mx').onclick = function () { rec = false; try { localStorage.removeItem('vv_painel_min'); } catch (e) {} pinta(); };
      raiz.querySelector('#sr').onclick = function () {
        fetch('/api/sair', { method: 'POST', credentials: 'same-origin' }).finally(function () { location.href = '/'; });
      };
    }

    function confirmar() {
      vel.innerHTML = '<div class="md" role="dialog" aria-modal="true" aria-labelledby="mt"><h2 id="mt">Abrir o site a toda a gente?</h2><p>Deixa de aparecer a página de manutenção e o Vinovim fica visível para qualquer pessoa. Podes voltar a fechá-lo quando quiseres.</p><div class="bt"><button class="b1" id="cn" type="button">Cancelar</button><button class="b2" id="ok" type="button">Abrir agora</button></div></div>';
      vel.classList.add('on');
      var fecha = function () { vel.classList.remove('on'); };
      vel.querySelector('#cn').onclick = fecha;
      vel.querySelector('#ok').onclick = function () { fecha(); alternar(false); };
      vel.onclick = function (e) { if (e.target === vel) fecha(); };
      vel.querySelector('#ok').focus();
    }

    function alternar(nova) {
      if (ocupado) return;
      ocupado = true; pinta();
      fetch('/api/manutencao', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativa: nova }) })
        .then(function (r) { return r.json(); })
        .then(function (x) {
          if (x && x.ok) { ativa = x.manutencao; aviso(ativa ? 'Site em manutenção' : 'Site aberto a toda a gente'); }
          else aviso('Não foi possível gravar. Tenta outra vez.');
        })
        .catch(function () { aviso('Sem ligação. Tenta outra vez.'); })
        .finally(function () { ocupado = false; pinta(); });
    }

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') vel.classList.remove('on'); });
    pinta();
  }
})();
