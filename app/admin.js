// Barra flutuante do administrador: só aparece com sessão de admin válida (cookie HttpOnly no servidor)
(function () {
  'use strict';
  if (window.top !== window) return;
  fetch('/api/estado', { cache: 'no-store', credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.admin) montar(d); })
    .catch(function () {});

  function montar(d) {
    var css = document.createElement('style');
    css.textContent = '#vvadm{position:fixed;z-index:2147483000;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:9px 12px 9px 16px;border-radius:999px;background:rgba(14,12,22,.82);border:1px solid rgba(255,255,255,.08);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);color:#f4f1fa;font:500 12.5px Inter,system-ui,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.5)}#vvadm b{font-weight:700}#vvadm .n{color:#a9a2b8}#vvadm button{border:0;border-radius:999px;padding:8px 14px;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer;color:#fff;background:linear-gradient(110deg,#8b5cff,#ff4d94)}#vvadm button.s{background:rgba(255,255,255,.08)}#vvadm button:focus-visible{outline:2px solid #fff;outline-offset:2px}@media(max-width:640px){#vvadm .n{display:none}}';
    document.head.appendChild(css);
    var el = document.createElement('div'); el.id = 'vvadm'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Administração');
    document.body.appendChild(el);
    var ativa = d.manutencao, c = d.contadores || {};
    function pinta() {
      el.innerHTML = '<span><b>Admin</b> ' + (ativa ? 'Site em manutenção' : 'Site aberto') + '</span>' +
        '<span class="n">Windows ' + (c.windows || 0) + ' · Android ' + (c.android || 0) + ' · Web ' + (c.web || 0) + '</span>' +
        '<button id="vvt" type="button">' + (ativa ? 'Abrir o site' : 'Pôr em manutenção') + '</button>' +
        '<button class="s" id="vvs" type="button">Sair</button>';
      el.querySelector('#vvt').onclick = function () {
        if (!ativa || confirm('Abrir o site a toda a gente?')) alternar(!ativa);
      };
      el.querySelector('#vvs').onclick = function () {
        fetch('/api/sair', { method: 'POST', credentials: 'same-origin' }).finally(function () { location.href = '/'; });
      };
    }
    function alternar(nova) {
      var b = el.querySelector('#vvt'); b.disabled = true; b.textContent = 'A gravar...';
      fetch('/api/manutencao', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativa: nova }) })
        .then(function (r) { return r.json(); })
        .then(function (x) { if (x && x.ok) ativa = x.manutencao; pinta(); })
        .catch(function () { pinta(); });
    }
    pinta();
  }
})();
