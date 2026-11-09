/* ---------- eventos globais ---------- */
document.addEventListener('click', async e => {
  const t = e.target;
  const sc = t.closest('[data-scroll]');
  if (sc) {
    const tr = sc.closest('.row').querySelector('.track');
    tr.scrollBy({ left: +sc.dataset.scroll * tr.clientWidth * 0.85 });
    return;
  }
  const un = t.closest('[data-unprog]');
  if (un) {
    e.stopPropagation();
    delete S.progress[un.dataset.unprog];
    save();
    un.closest('.card').remove();
    toast('Removido de “Continuar a ver”');
    return;
  }
  const pf = t.closest('[data-prof]');
  if (pf) {
    if ($('#profiles').dataset.manage && $('#profiles').classList.contains('open')) editProfile(pf.dataset.prof);
    else switchProfile(pf.dataset.prof);
    return;
  }
  if (t.closest('[data-prof-add]')) return editProfile(null);
  if (t.closest('[data-prof-manage]')) return showProfiles(true);
  if (t.closest('[data-prof-done]')) {
    if (document.documentElement.classList.contains('vvgate')) return showProfiles(false);
    $('#profiles').classList.remove('open');
    route();
    return;
  }
  if (t.closest('#profBtn')) return showProfiles(false);
  const ps = t.closest('[data-person]');
  if (ps) {
    VIEWS._pendingQ = ps.dataset.person;
    if (location.hash === '#search') route();
    else location.hash = 'search';
    return;
  }
  const hd = t.closest('[data-hdel]');
  if (hd) {
    e.stopPropagation();
    (S.searchHistory || []).splice(+hd.dataset.hdel, 1);
    save();
    showSearchHints();
    return;
  }
  if (t.closest('[data-hclear]')) {
    S.searchHistory = [];
    save();
    showSearchHints();
    return;
  }
  const hq = t.closest('[data-hq]');
  if (hq) {
    const q = $('#q');
    if (q) {
      q.value = hq.dataset.hq;
      $('#qclr')?.classList.add('show');
    }
    addHistory(hq.dataset.hq);
    doSearch(hq.dataset.hq);
    return;
  }
  const op = t.closest('[data-open]');
  if (op && CUR_VIEW === 'search' && VIEWS._lastQ) addHistory(VIEWS._lastQ);
  if (op) {
    const [ty, id] = op.dataset.open.split('|');
    openDetail(ty, id);
    return;
  }
  const lb = t.closest('[data-lib]');
  if (lb) {
    const id = lb.dataset.lib,
      m = D.meta && D.meta.id === id ? D.meta : ITEMS.get(id);
    if (!m) return;
    toggleLib(m);
    lb.classList.toggle('on', inLib(id));
    lb.innerHTML = inLib(id) ? I.check : I.plus;
    return;
  }
  const rs = t.closest('[data-resume]');
  if (rs) {
    const p = S.progress[rs.dataset.resume];
    if (!p) return;
    try {
      const m = await getMeta(p.type, p.id);
      const v = (m.videos || []).find(x => x.id === p.videoId);
      if (p.stream && p.t > 0) play(p.stream, { meta: m, video: v, type: m.type, videoId: p.videoId });
      else openStreams(m, v);
    } catch (err) {
      toast('Sem ligação');
    }
    return;
  }
  const qp = t.closest('[data-quickplay]');
  if (qp) {
    const [ty, id] = qp.dataset.quickplay.split('|');
    try {
      const m = await getMeta(ty, id);
      startWatching(m);
    } catch (err) {
      toast('Sem ligação');
    }
    return;
  }
  if (t.closest('[data-dplay]') && D.meta) return startWatching(D.meta);
  if (t.closest('[data-trailer]') && D.meta) {
    const tr = D.meta.trailerStreams[0];
    return play(
      { ytId: tr.ytId, name: 'Trailer', title: tr.title },
      { meta: D.meta, type: D.meta.type, videoId: D.meta.id }
    );
  }
  const ss = t.closest('[data-season]');
  if (ss && D.meta) {
    D.season = +ss.dataset.season;
    $('#epsec').outerHTML = episodesHTML(D.meta);
    return;
  }
  const mk = t.closest('[data-mark]');
  if (mk && D.meta) {
    const id = mk.dataset.mark;
    if (S.watched[id]) delete S.watched[id];
    else S.watched[id] = true;
    save();
    $('#epsec').outerHTML = episodesHTML(D.meta);
    return;
  }
  const ep = t.closest('[data-ep]');
  if (ep && D.meta) {
    const v = D.meta.videos.find(x => x.id === ep.dataset.ep);
    return openStreams(D.meta, v);
  }
  const st = t.closest('[data-stream]');
  if (st && drawer._ctx) {
    const s = drawer._streams[st.dataset.stream];
    if (s) play(s, drawer._ctx);
    return;
  }
  if (t.closest('[data-localfile]')) {
    PC = null;
    $('#fileVideo').click();
    return;
  }
  const ua = t.closest('[data-unaddon]');
  if (ua) {
    const u = ua.dataset.unaddon;
    S.addons = S.addons.filter(x => x !== u);
    save();
    const i = ADDONS.findIndex(a => a.url === u);
    if (i >= 0) ADDONS.splice(i, 1);
    toast('Addon removido');
    VIEWS.addons();
    return;
  }
  if (t.closest('[data-surprise]')) {
    const pool = [...ITEMS.values()].filter(x => x.poster);
    if (pool.length) {
      const r = pool[Math.floor(Math.random() * pool.length)];
      openDetail(r.type, r.id);
    }
    return;
  }
  const pg = t.closest('[data-pickg]');
  if (pg) {
    VIEWS._pickG = pg.dataset.pickg;
  }
  if (t.closest('[data-close-drawer]') || t.closest('[data-close-detail]')) uiBack();
});

/* botão "voltar" do telemóvel/browser fecha a camada de cima */
const openCount = () => [$('#detail'), drawer, P].filter(x => x.classList.contains('open')).length;
function syncHist() {
  const d = (history.state && history.state.ov) || 0,
    n = openCount();
  if (n > d) {
    try {
      history.pushState({ ov: n }, '');
    } catch (e) {}
  }
}
function closeTop() {
  if (P.classList.contains('open')) closePlayer();
  else if (drawer.classList.contains('open')) closeDrawer();
  else if ($('#detail').classList.contains('open')) closeDetail();
}
function uiBack() {
  if (history.state && history.state.ov && openCount()) history.back();
  else closeTop();
}
window.addEventListener('popstate', () => {
  if (openCount()) closeTop();
});
function startWatching(m) {
  if (m.type === 'series') {
    const p = S.progress[m.id];
    const vs = sortedVideos(m).filter(v => v.season !== 0);
    let v = p ? (m.videos || []).find(x => x.id === p.videoId) : vs.find(x => !S.watched[x.id]) || vs[0];
    if (p && p.stream && p.t > 0) return play(p.stream, { meta: m, video: v, type: m.type, videoId: p.videoId });
    if (!v) return toast('Sem episódios disponíveis');
    return openStreams(m, v);
  }
  const p = S.progress[m.id];
  if (p && p.stream && p.t > 0) return play(p.stream, { meta: m, type: m.type, videoId: m.id });
  openStreams(m, null);
}
document.addEventListener('keydown', e => {
  if (P.classList.contains('open')) {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    const k = e.key.toLowerCase();
    if (
      k === ' ' ||
      k === 'k' ||
      k === 'mediaplaypause' ||
      (k === 'enter' && !(e.target.closest && e.target.closest('button')))
    ) {
      e.preventDefault();
      togglePlay();
    } else if (k === 'mediaplay') V.play().catch(() => {});
    else if (k === 'mediapause') V.pause();
    else if (k === 'mediafastforward') skip(30);
    else if (k === 'mediarewind') skip(-30);
    else if (k === 'mediatracknext') goNext();
    else if (k === 'arrowleft') skip(-10);
    else if (k === 'arrowright') skip(10);
    else if (k === 'arrowup') {
      e.preventDefault();
      V.volume = Math.min(1, V.volume + 0.1);
    } else if (k === 'arrowdown') {
      e.preventDefault();
      V.volume = Math.max(0, V.volume - 0.1);
    } else if (k === 'f') toggleFs();
    else if (k === 'm') V.muted = !V.muted;
    else if (k === 'n') goNext();
    else if (k === 'escape' && !document.fullscreenElement) uiBack();
    poke();
    return;
  }
  if (e.key === 'Escape' && $('#profiles').classList.contains('open')) {
    if (document.documentElement.classList.contains('vvgate')) {
      if ($('#profiles').dataset.manage) showProfiles(false);
      return;
    }
    $('#profiles').classList.remove('open');
    return;
  }
  if (e.key === 'Escape' && $('#upd').classList.contains('open')) {
    $('#upd').classList.remove('open');
    return;
  }
  const dirs = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (
    dirs[e.key] &&
    document.documentElement.classList.contains('tv') &&
    e.target.tagName !== 'SELECT' &&
    !(e.target.tagName === 'INPUT' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))
  ) {
    e.preventDefault();
    moveFocus(dirs[e.key]);
    return;
  }
  if (
    e.key === 'Enter' &&
    document.activeElement &&
    document.activeElement.matches('[tabindex]:not(button):not(a):not(input)')
  ) {
    document.activeElement.click();
    return;
  }
  if (e.key === 'Escape' && openCount()) uiBack();
  if (e.key === '/' && e.target.tagName !== 'INPUT') {
    e.preventDefault();
    location.hash = 'search';
  }
});
window.addEventListener(
  'scroll',
  () => {
    const tb = document.querySelector('.home .topbar');
    if (tb) tb.classList.toggle('solid', scrollY > 300);
  },
  { passive: true }
);
