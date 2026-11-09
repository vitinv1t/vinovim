/* Vinovim — primeiro perfil
   Numa conta nova (ou sem conta) ainda não há perfil de ninguém: o “Quem está a ver?”
   mostra só “Adicionar”. O perfil automático “Eu” fica escondido e sai assim que
   a pessoa cria o seu. */
(function () {
  const empty = o => !o || (Array.isArray(o) ? !o.length : !Object.keys(o).length);
  const pdEmpty = d => !d || (empty(d.library) && empty(d.progress) && empty(d.watched) && empty(d.lists));
  // o perfil que a app cria sozinha quando ainda não existe nenhum
  const isStub = (p, pd) => !!p && p.id === 'p1' && p.name === 'Eu' && !p.pin && !p.photo && !p.kids && pdEmpty(pd);
  const stubLocal = p => isStub(p, S.pdata[p.id]);
  const real = () => S.profiles.filter(p => !stubLocal(p));
  const gated = () => document.documentElement.classList.contains('vvgate');
  let madeAt = 0;

  // quando já há perfis a sério, o automático desaparece
  function prune() {
    const stubs = S.profiles.filter(stubLocal);
    if (!stubs.length || stubs.length === S.profiles.length) return false;
    const ids = new Set(stubs.map(p => p.id));
    S.profiles = S.profiles.filter(p => !ids.has(p.id));
    ids.forEach(id => { delete S.pdata[id]; });
    if (ids.has(S.activeProfile) || !S.pdata[S.activeProfile]) S.activeProfile = S.profiles[0].id;
    madeAt = Date.now();
    save(); try { (window.__vvBtn || updateProfBtn)(); } catch (e) {}
    return true;
  }

  const _show = window.showProfiles;
  window.showProfiles = function (manage) {
    prune();
    // acabou de criar o primeiro perfil: volta logo ao “Quem está a ver?”
    if (manage && gated() && Date.now() - madeAt < 2500) manage = false;
    const r = _show.call(this, manage);
    const none = !real().length;
    const el = document.getElementById('profiles');
    if (el && none) {
      el.querySelectorAll('[data-prof]').forEach(b => { const p = S.profiles.find(x => x.id === b.dataset.prof); if (stubLocal(p)) b.remove(); });
      if (!manage) {
        el.querySelector('[data-prof-manage]')?.remove();
        const h = el.querySelector('h2');
        if (h && !el.querySelector('.vvFirst')) h.insertAdjacentHTML('afterend', '<p class="vvFirst" style="margin:-6px 0 22px;color:var(--mut,#a9a3b8);text-align:center">Cria o teu perfil para começar.</p>');
      }
      setTimeout(() => el.querySelector('[data-prof-add]')?.focus(), 60);
    }
    return r;
  };

  // ao sincronizar: o perfil da conta ganha ao automático deste aparelho
  function adopt(remote) {
    if (!remote || !Array.isArray(remote.profiles)) return;
    const rp = remote.profiles.find(p => p.id === 'p1'), lp = S.profiles.find(p => p.id === 'p1');
    if (rp && lp && stubLocal(lp) && !isStub(rp, (remote.pdata || {}).p1)) Object.assign(lp, rp);
  }
  const _fetch = window.fetch;
  window.fetch = async function (url, opt) {
    const res = await _fetch.apply(this, arguments);
    try {
      const u = String(url && url.url || url), m = ((opt && opt.method) || 'GET').toUpperCase();
      if (m === 'GET' && /\/api\/account\?a=data\b/.test(u) && res.ok) adopt(((await res.clone().json()) || {}).data);
    } catch (e) {}
    return res;
  };

  // depois de sincronizar, atualiza o “Quem está a ver?” se estiver aberto
  const _btn = window.updateProfBtn; window.__vvBtn = _btn;
  window.updateProfBtn = function () {
    prune();
    const r = _btn.apply(this, arguments);
    const el = document.getElementById('profiles');
    if (el && el.classList.contains('open') && !el.querySelector('.pedit, input')) {
      const want = real().map(p => p.id).join(), shown = [...el.querySelectorAll('[data-prof]')].map(b => b.dataset.prof).join();
      if (want !== shown) window.showProfiles(!!el.dataset.manage);
    }
    return r;
  };
})();
