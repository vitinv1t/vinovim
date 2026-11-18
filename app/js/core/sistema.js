/* ---------- Discord Rich Presence (app de PC) ----------
   Ao estilo do PreMiD: aparece "A ver" (não "A jogar"), a capa do título como imagem grande,
   um ícone pequeno de play/pausa, a barra de progresso e, na lista de membros, o nome do que estás a ver. */
let CUR_VIEW = 'home',
  lastPres = '';
const SESSION_START = Date.now();
const VIEW_TXT = {
  home: '🏠 No início',
  movies: '🎬 A explorar filmes',
  series: '📺 A explorar séries',
  search: '🔎 À procura do que ver',
  library: '📚 Na minha lista',
  novidades: '✨ A ver as novidades',
  calendar: '🗓️ No calendário de estreias',
  stats: '📊 Nas estatísticas',
  downloads: '⬇️ Nas transferências',
  addons: '🧩 Nos addons',
  settings: '⚙️ Nas definições'
};
const SITE_BTN = { label: 'Experimentar o Vinovim', url: 'https://vinovim.vercel.app/download' };
function presence(p) {
  if (!NATIVE || !NATIVE.rpc) return;
  if (!S.prefs.rpc) {
    if (lastPres !== 'off') {
      NATIVE.rpc(null);
      lastPres = 'off';
    }
    return;
  }
  const k = JSON.stringify(p);
  if (k === lastPres) return;
  lastPres = k;
  NATIVE.rpc(p);
}
const presYear = m => (m && m.releaseInfo ? String(m.releaseInfo).slice(0, 4) : '');
const presRating = m => (m && parseFloat(m.imdbRating) ? '⭐ ' + parseFloat(m.imdbRating).toFixed(1) : '');
function presenceView(name) {
  presence({
    details: VIEW_TXT[name] || VIEW_TXT.home,
    state: 'A escolher o que ver 🍿',
    small: 'browse',
    smallText: 'A navegar',
    start: SESSION_START,
    buttons: [SITE_BTN]
  });
}
function presenceDetail(m) {
  if (S.prefs.rpcPrivate) return presenceView(CUR_VIEW);
  presence({
    details: '👀 ' + m.name,
    state: [m.type === 'series' ? '📺 Série' : '🎬 Filme', presYear(m), presRating(m)].filter(Boolean).join(' · '),
    image: m.poster,
    imageText: m.name,
    small: 'browse',
    smallText: 'A ver os detalhes',
    start: SESSION_START,
    buttons: [SITE_BTN]
  });
}
function presencePlay() {
  if (!PC || !PC.meta || PC.stream.ytId) return;
  const m = PC.meta,
    v = PC.video,
    paused = V.paused,
    priv = S.prefs.rpcPrivate,
    title = v && (v.name || v.title);
  const what = v
    ? `T${v.season} · E${v.episode}${title ? ' · ' + title : ''}`
    : ['🎬 Filme', presYear(m), presRating(m)].filter(Boolean).join(' · ');
  const dur = V.duration && isFinite(V.duration) ? V.duration : 0;
  presence({
    details: priv ? (m.type === 'series' ? 'Uma série 📺' : 'Um filme 🎬') : m.name,
    state: priv ? (paused ? '⏸️ Em pausa' : '▶️ A ver') : (paused ? '⏸️ Em pausa · ' : '') + what,
    image: priv ? undefined : m.poster,
    imageText: priv
      ? 'Vinovim'
      : v
        ? `${m.name} — T${v.season} E${v.episode}`
        : m.name + (presYear(m) ? ` (${presYear(m)})` : ''),
    small: paused ? 'pause' : 'play',
    smallText: paused ? 'Em pausa' : 'A ver',
    show: priv ? undefined : 'details',
    start: paused ? undefined : Date.now() - Math.floor(V.currentTime * 1000),
    end: paused || !dur ? undefined : Date.now() + Math.floor((dur - V.currentTime) * 1000),
    buttons: [SITE_BTN]
  });
}
function restorePresence() {
  if (D.meta && $('#detail').classList.contains('open')) presenceDetail(D.meta);
  else presenceView(CUR_VIEW);
}
function refreshPresence() {
  lastPres = '';
  if (PC) presencePlay();
  else restorePresence();
}
V.addEventListener('seeked', presencePlay);

/* ---------- atualizações ---------- */
const cmpVer = (a, b) => {
  const x = String(a).split('.').map(Number),
    y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0) ? 1 : -1;
  return 0;
};
const VERSION_URL = /^https?:$/.test(location.protocol)
  ? 'version.json'
  : NATIVE && NATIVE.remote
    ? NATIVE.remote + '/version.json'
    : null;
function showUpdate(o) {
  const el = $('#upd');
  el.innerHTML = `<div class="ucard"><div class="uglow"></div><div class="uhead">${LOGO}<h2>${esc(o.title)}</h2><span class="uver">${o.from ? esc(o.from) + ' → ' : ''}<b>v${esc(o.version)}</b></span></div>
    <ul class="ulist">${(o.notes || [])
      .slice(0, 4)
      .map(n => `<li><i>✓</i><span>${esc(n)}</span></li>`)
      .join(
        ''
      )}${(o.notes || []).length > 4 ? `<li class="umore"><button type="button" data-umore>+ ${o.notes.length - 4} ${o.notes.length - 4 === 1 ? 'novidade' : 'novidades'}</button></li>` : ''}</ul>
    <div class="uprog" id="uprog"><b></b></div>
    <div class="ubtns">${o.later ? `<button class="btn gho" data-uclose>${esc(o.later)}</button>` : ''}<button class="btn acc" id="ugo">${esc(o.go)}</button></div></div>`;
  el.classList.add('open');
  el.onclick = e => {
    if (e.target === el && o.later) el.classList.remove('open');
  };
  el.querySelectorAll('[data-uclose]').forEach(b => (b.onclick = () => el.classList.remove('open')));
  const um = el.querySelector('[data-umore]');
  if (um)
    um.onclick = () => {
      el.querySelector('.ulist').innerHTML = o.notes.map(n => `<li><i>✓</i><span>${esc(n)}</span></li>`).join('');
    };
  $('#ugo').onclick = () => {
    if (o.action) o.action();
    else el.classList.remove('open');
  };
}
async function checkUpdates(manual) {
  if (!VERSION_URL) {
    if (manual) toast('Sem servidor de atualizações nesta versão');
    return;
  }
  try {
    const v = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json());
    if (cmpVer(v.version, APP_VERSION) > 0) {
      return showUpdate({
        title: 'Nova atualização disponível',
        from: 'v' + APP_VERSION,
        version: v.version,
        notes: v.notes,
        later: 'Mais tarde',
        go: 'Atualizar agora',
        action: async () => {
          $('#uprog').style.display = 'block';
          $('#ugo').disabled = true;
          $('#ugo').textContent = 'A atualizar…';
          try {
            const r = await navigator.serviceWorker?.getRegistration();
            await r?.update();
          } catch (e) {}
          try {
            const ks = await caches.keys();
            await Promise.all(ks.map(k => caches.delete(k)));
          } catch (e) {}
          setTimeout(() => location.reload(), 700);
        }
      });
    }
    if (NATIVE && v.native && v.native.min && cmpVer(v.native.min, NATIVE.version) > 0) {
      const url = v.native.download;
      if (NATIVE.update && NATIVE.platform === 'Windows') {
        const exe = (NATIVE.remote || location.origin) + '/downloads/vinovim-setup.exe';
        return showUpdate({
          title: 'Nova versão da app',
          from: 'v' + NATIVE.version,
          version: v.native.min,
          notes: v.native.notes || [],
          later: 'Mais tarde',
          go: 'Atualizar agora',
          action: async () => {
            const g = $('#ugo'),
              pr = $('#uprog'),
              bar = pr.querySelector('b');
            g.disabled = true;
            g.textContent = 'A descarregar…';
            pr.style.display = 'block';
            bar.style.animation = 'none';
            bar.style.width = '0%';
            NATIVE.onUpdateProgress &&
              NATIVE.onUpdateProgress(p => {
                bar.style.width = Math.round(p * 100) + '%';
                g.textContent =
                  p >= 1
                    ? 'A instalar… o Vinovim volta a abrir sozinho'
                    : 'A descarregar… ' + Math.round(p * 100) + '%';
              });
            try {
              await NATIVE.update(exe);
            } catch (e) {
              g.disabled = false;
              g.textContent = 'Descarregar no site';
              pr.style.display = 'none';
              toast('Não foi possível atualizar aqui. Abre o site para descarregar.');
              g.onclick = () => {
                if (url) window.open(url, '_blank', 'noopener');
                $('#upd').classList.remove('open');
              };
            }
          }
        });
      }
      return showUpdate({
        title: 'Nova versão da app',
        from: 'v' + NATIVE.version,
        version: v.native.min,
        notes: v.native.notes || ['Esta atualização precisa de reinstalar a app.'],
        later: 'Mais tarde',
        go: url ? 'Descarregar' : 'Entendido',
        action: () => {
          if (url) window.open(url, '_blank', 'noopener');
          $('#upd').classList.remove('open');
        }
      });
    }
    const CAPP =
      !NATIVE && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()
        ? window.Capacitor.Plugins
        : null;
    if (CAPP && CAPP.VinovimUpdate && CAPP.App && v.native && v.native.min) {
      let av = '0';
      try {
        av = (await CAPP.App.getInfo()).version;
      } catch (e) {}
      if (cmpVer(v.native.min, av) > 0) {
        return showUpdate({
          title: 'Nova versão da app',
          from: 'v' + av,
          version: v.native.min,
          notes: v.native.notes || [],
          later: 'Mais tarde',
          go: 'Atualizar agora',
          action: async () => {
            const g = $('#ugo');
            g.disabled = true;
            g.textContent = 'A descarregar…';
            $('#uprog').style.display = 'block';
            try {
              await CAPP.VinovimUpdate.install({ url: location.origin + '/downloads/vinovim.apk' });
              g.textContent = 'Quando acabar, carrega em Instalar';
              toast('A descarregar a nova versão: vê a notificação');
            } catch (e) {
              g.disabled = false;
              $('#uprog').style.display = 'none';
              if (String((e && e.message) || e).includes('PERMISSAO')) {
                g.textContent = 'Tentar outra vez';
                toast('Autoriza o Vinovim a instalar apps e carrega outra vez em Atualizar');
              } else {
                g.textContent = 'Atualizar agora';
                toast('Não foi possível descarregar a atualização');
              }
            }
          }
        });
      }
    }
    if (manual) toast('Já tens a versão mais recente (' + APP_VERSION + ')');
  } catch (e) {
    if (manual) toast('Não foi possível verificar atualizações');
  }
}
function showNews() {
  showUpdate({ title: 'Novidades do Vinovim', version: APP_VERSION, notes: CHANGELOG, go: 'Vamos lá!' });
}
function afterBoot() {
  updateProfBtn();
  applySubStyle();
  if (document.documentElement.classList.contains('vvgate') && !$('#profiles').classList.contains('open'))
    showProfiles(false);
  if (document.documentElement.classList.contains('tv'))
    setTimeout(() => {
      if (document.activeElement === document.body) moveFocus('down');
    }, 900);
  if (S.seenVersion !== APP_VERSION) {
    setTimeout(showNews, 1200);
    S.seenVersion = APP_VERSION;
    save();
  }
  setTimeout(() => checkUpdates(false), 5000);
  setInterval(() => checkUpdates(false), 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkUpdates(false);
  });
  hooks.emit('boot');
}
