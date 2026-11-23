/* ---------- navegação ----------
   Cada endereço (#home, #movies, #settings…) corresponde a uma vista em VIEWS.
   As funcionalidades podem tratar endereços especiais (route) e reagir antes e
   depois de cada vista ser mostrada (route:start, route:done). */
function route() {
  const hash = location.hash.slice(1);
  if (!hooks.allow('route', hash)) return;
  hooks.emit('route:start', hash);
  if (CUR_VIEW === 'search' && VIEWS._lastQ) addHistory(VIEWS._lastQ);
  const v = location.hash.slice(1) || 'home';
  const name = VIEWS[v] && v[0] !== '_' ? v : 'home';
  document.querySelectorAll('.nv').forEach(a => a.classList.toggle('on', a.dataset.v === name));
  if ($('#detail').classList.contains('open')) {
    $('#detail').classList.remove('open');
    document.body.style.overflow = '';
  }
  closeDrawer();
  clearInterval(heroTimer);
  scrollTo(0, 0);
  CUR_VIEW = name;
  presenceView(name);
  const r = VIEWS[name]();
  if (name === 'movies' && VIEWS._pickG) {
    const g = VIEWS._pickG;
    VIEWS._pickG = null;
    setTimeout(() => document.querySelector(`[data-g="${g}"]`)?.click(), 0);
  }
  if (r && r.catch)
    r.catch(err => {
      console.error(err);
      app.innerHTML = `<div class="view">${topbar('')}<div class="pad">${offlineHTML()}</div></div>`;
    });
  hooks.emit('route:done', hash, name);
}
window.addEventListener('hashchange', route);

function gateProfiles() {
  const root = document.documentElement,
    pr = $('#profiles');
  const ungate = () => {
    root.classList.remove('vvgate');
    try {
      sessionStorage.setItem('vv_prof', '1');
    } catch (e) {}
  };
  new MutationObserver(() => {
    if (root.classList.contains('vvgate') && !pr.classList.contains('open')) ungate();
  }).observe(pr, { attributes: true, attributeFilter: ['class'] });
  showProfiles(false);
}
async function boot() {
  applyAccent();
  window.__vvReady = false;
  if (document.documentElement.classList.contains('vvgate')) gateProfiles();
  app.innerHTML = `<div class="view" style="display:grid;place-items:center;min-height:100vh"><span class="spin" style="width:40px;height:40px;border-width:4px"></span></div>`;
  try {
    await loadAddons();
    window.__vvReady = true;
    route();
    afterBoot();
  } catch (e) {
    app.innerHTML = `<div class="view">${topbar('')}<div class="pad">${offlineHTML()}</div></div>`;
  }
}
document.addEventListener('DOMContentLoaded', boot);
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol))
  navigator.serviceWorker.register('sw.js').catch(() => {});
