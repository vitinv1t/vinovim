/* =========================================================
   Vinovim — hub de filmes e séries compatível com addons Stremio
   Núcleo: constantes, ícones, estado, addons e ajudantes de interface.
   ========================================================= */

/* ---------- pontos de extensão ----------
   O núcleo anuncia o que acontece (guardar, abrir o leitor, mostrar uma vista…)
   e cada funcionalidade em js/features regista-se aqui, em vez de substituir
   funções do núcleo.
     hooks.on(nome, fn)          regista uma função
     hooks.emit(nome, ...)       avisa todas as funções registadas
     hooks.emitAsync(nome, ...)  igual, mas espera pelas que são assíncronas
     hooks.allow(nome, ...)      pergunta se a ação pode continuar (false cancela)
     hooks.pipe(nome, valor, ...) passa um valor por todas e devolve o resultado */
const hooks = {
  list: {},
  on(name, fn) {
    (this.list[name] ||= []).push(fn);
  },
  emit(name, ...args) {
    for (const fn of this.list[name] || []) {
      try {
        fn(...args);
      } catch (e) {
        console.error(`[${name}]`, e);
      }
    }
  },
  async emitAsync(name, ...args) {
    for (const fn of this.list[name] || []) {
      try {
        const r = fn(...args);
        if (r && typeof r.then === 'function') await r;
      } catch (e) {
        console.error(`[${name}]`, e);
      }
    }
  },
  allow(name, ...args) {
    return (this.list[name] || []).every(fn => fn(...args) !== false);
  },
  pipe(name, value, ...args) {
    return (this.list[name] || []).reduce((v, fn) => fn(v, ...args), value);
  }
};

const CINEMETA = 'https://v3-cinemeta.strem.io/manifest.json';
const IMG = {
  bg: id => `https://images.metahub.space/background/medium/${id}/img`,
  logo: id => `https://images.metahub.space/logo/medium/${id}/img`,
  poster: id => `https://images.metahub.space/poster/medium/${id}/img`
};
const GENRES = [
  ['Action', 'Ação'],
  ['Adventure', 'Aventura'],
  ['Animation', 'Animação'],
  ['Comedy', 'Comédia'],
  ['Crime', 'Crime'],
  ['Documentary', 'Documentário'],
  ['Drama', 'Drama'],
  ['Family', 'Família'],
  ['Fantasy', 'Fantasia'],
  ['History', 'História'],
  ['Horror', 'Terror'],
  ['Mystery', 'Mistério'],
  ['Romance', 'Romance'],
  ['Sci-Fi', 'Ficção científica'],
  ['Thriller', 'Suspense'],
  ['War', 'Guerra'],
  ['Western', 'Western']
];
const GPT = Object.fromEntries(GENRES);
const ACCENTS = [
  ['#e0315b', '#f5c26b'],
  ['#7c5cff', '#5ce1e6'],
  ['#16c784', '#d4f55c'],
  ['#ff7a1a', '#ffd25c'],
  ['#2f8cff', '#9ed0ff'],
  ['#ff4fd8', '#ffb86b']
];

const APP_VERSION = '1.0.0';
const NATIVE = window.vinovimNative || null;
const CHANGELOG = [
  'Bem-vindo ao Vinovim 1.0 🎉',
  'Ecrã de pausa e “Da última vez…” ao voltar a uma série',
  'Continua noutro dispositivo o que estavas a ver',
  'Início que muda com a época e contagem para as estreias',
  'Protetor de ecrã com imagens do título que estás a ver'
];

/* ---------- ícones ---------- */
const sv = p =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>',
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  check: sv('<path d="m5 12 5 5 9-10"/>'),
  clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  back: sv('<path d="M15 5l-7 7 7 7"/>'),
  left: sv('<path d="M15 5l-7 7 7 7"/>'),
  right: sv('<path d="m9 5 7 7-7 7"/>'),
  film: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16"/>'),
  yt: sv('<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>'),
  link: sv('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
  magnet: sv('<path d="M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3zM6 7h4M14 7h4"/>'),
  folder: sv('<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  rew: sv(
    '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><text x="12" y="15.5" font-size="7" fill="currentColor" stroke="none" text-anchor="middle" font-family="Inter" font-weight="700">10</text>'
  ),
  fwd: sv(
    '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/><text x="12" y="15.5" font-size="7" fill="currentColor" stroke="none" text-anchor="middle" font-family="Inter" font-weight="700">10</text>'
  ),
  vol: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  mute: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 6 6M22 9l-6 6"/>'),
  cc: sv('<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3"/>'),
  fs: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  next: sv('<path d="m5 4 10 8-10 8z" fill="currentColor"/><path d="M19 5v14"/>'),
  dice: sv(
    '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'
  ),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  star: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="m12 2 3 6.6 7 .7-5.3 4.7 1.6 7L12 17.4 5.7 21l1.6-7L2 9.3l7-.7z"/></svg>',
  puzzle: sv(
    '<path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z"/>'
  ),
  book: sv('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  trash: sv('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  wifi: sv(
    '<path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>'
  )
};

/* ---------- estado guardado no aparelho ---------- */
const KEY = 'vinovim.v1';
const S = (() => {
  let d = {};
  try {
    d = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {}
  const o = Object.assign(
    { addons: [], library: {}, progress: {}, watched: {}, accent: 0, volume: 1, cats: { order: [], on: {} } },
    d
  );
  o.prefs = Object.assign(
    {
      sortQ: true,
      autoplay: false,
      hideTorrent: true,
      subLang: 'pt',
      amoled: false,
      rpc: true,
      rpcPrivate: false,
      subSize: 'm',
      subColor: '#ffffff',
      subBg: 'semi'
    },
    d.prefs || {}
  );
  return o;
})();
const SUBLANGS = {
  off: ['Desligadas', []],
  pt: ['Português (PT)', ['por', 'pt', 'pt-pt', 'portuguese']],
  br: ['Português (BR)', ['pob', 'pt-br', 'ptbr', 'brazilian']],
  en: ['Inglês', ['eng', 'en', 'english']],
  es: ['Espanhol', ['spa', 'es', 'spanish']],
  fr: ['Francês', ['fre', 'fra', 'fr', 'french']]
};
/* guarda o estado; com { quiet: true } não avisa as funcionalidades (usado pela sincronização) */
function save({ quiet = false } = {}) {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
  if (!quiet) hooks.emit('save');
}
/* cada perfil tem a sua lista, progresso, vistos e histórico */
const PCOLORS = ['#e0315b', '#7c5cff', '#16c784', '#ff7a1a', '#2f8cff', '#ff4fd8', '#f5c26b', '#5ce1e6'];
const PKEYS = ['library', 'progress', 'watched', 'searchHistory'];
const emptyPData = () => ({ library: {}, progress: {}, watched: {}, searchHistory: [] });
(function migrateProfiles() {
  if (!Array.isArray(S.profiles) || !S.profiles.length) {
    S.profiles = [{ id: 'p1', name: 'Eu', color: 0 }];
    S.activeProfile = 'p1';
  }
  S.pdata = S.pdata || {};
  S.profiles.forEach(p => {
    S.pdata[p.id] = Object.assign(emptyPData(), S.pdata[p.id] || {});
  });
  const first = S.pdata[S.profiles[0].id];
  PKEYS.forEach(k => {
    if (Object.prototype.hasOwnProperty.call(S, k)) {
      const v = S[k];
      delete S[k];
      if (v && (Array.isArray(v) ? v.length : Object.keys(v).length)) first[k] = v;
    }
  });
  if (!S.pdata[S.activeProfile]) S.activeProfile = S.profiles[0].id;
  PKEYS.forEach(k =>
    Object.defineProperty(S, k, {
      enumerable: false,
      configurable: true,
      get() {
        return S.pdata[S.activeProfile][k];
      },
      set(v) {
        S.pdata[S.activeProfile][k] = v;
      }
    })
  );
})();

const $ = (s, r = document) => r.querySelector(s);
const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const ITEMS = new Map();
const remember = it => {
  if (it && it.id) ITEMS.set(it.id, Object.assign(ITEMS.get(it.id) || {}, it));
  return it;
};
function toast(m) {
  const t = $('#toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2400);
}
function fmt(s) {
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    x = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
}
function applyAccent() {
  const [a, b] = ACCENTS[S.accent] || ACCENTS[0];
  const r = document.documentElement.style;
  r.setProperty('--ac', a);
  r.setProperty('--ac2', b);
  r.setProperty('--acs', a + '29');
  document.documentElement.classList.toggle('amoled', !!S.prefs.amoled);
  document.documentElement.classList.toggle('vvside', !!S.prefs.sideNav);
  document.documentElement.classList.toggle('vvmini', !!S.prefs.sideNav && !!S.prefs.sideMini);
  if (typeof applyTV === 'function') applyTV();
  hooks.emit('theme');
}

/* ---------- addons (protocolo Stremio) ---------- */
const normUrl = u => u.trim().replace(/^stremio:\/\//i, 'https://');
const baseOf = u => normUrl(u).replace(/\/manifest\.json(\?.*)?$/i, '');
const cache = new Map();
function getJSON(u) {
  if (!cache.has(u))
    cache.set(
      u,
      fetch(u)
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .catch(e => {
          cache.delete(u);
          throw e;
        })
    );
  return cache.get(u);
}
const ADDONS = []; // {url, base, m}
async function loadAddons() {
  const urls = [CINEMETA, ...S.addons.filter(u => u !== CINEMETA)];
  const res = await Promise.allSettled(urls.map(u => getJSON(normUrl(u))));
  ADDONS.length = 0;
  res.forEach((r, i) => {
    if (r.status === 'fulfilled') ADDONS.push({ url: urls[i], base: baseOf(urls[i]), m: r.value });
  });
  if (!ADDONS.length) throw new Error('offline');
  hooks.emit('addons:loaded');
}
function supports(m, res, type, id) {
  for (const r of m.resources || []) {
    const name = typeof r === 'string' ? r : r.name;
    if (name !== res) continue;
    const types = (typeof r === 'object' && r.types) || m.types || [];
    const pref = (typeof r === 'object' && r.idPrefixes) || m.idPrefixes;
    if (type && types.length && !types.includes(type)) continue;
    if (id && pref && pref.length && !pref.some(p => id.startsWith(p))) continue;
    return true;
  }
  return false;
}
const extraStr = ex => {
  const p = Object.entries(ex || {})
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return p.length ? '/' + p.join('&') : '';
};
async function catalog(a, type, id, extra) {
  extra = hooks.pipe('catalog:extra', extra, a);
  const d = await getJSON(`${a.base}/catalog/${type}/${id}${extraStr(extra)}.json`);
  const items = (d.metas || []).map(x => remember({ ...x, type: x.type || type }));
  return hooks.pipe('catalog:items', items, extra);
}
const cinemeta = () => ADDONS.find(a => a.url === CINEMETA) || ADDONS[0];
async function getMeta(type, id) {
  const list = ADDONS.filter(a => supports(a.m, 'meta', type, id));
  list.sort((a, b) => (a.url === CINEMETA) - (b.url === CINEMETA)); // addons específicos primeiro
  for (const a of list.length ? list : [cinemeta()]) {
    try {
      const d = await getJSON(`${a.base}/meta/${type}/${encodeURIComponent(id)}.json`);
      if (d.meta) return remember({ ...d.meta, type: d.meta.type || type });
    } catch (e) {}
  }
  throw new Error('Sem metadados');
}

/* ---------- biblioteca e progresso ---------- */
const slim = m => ({
  id: m.id,
  type: m.type,
  name: m.name,
  poster: m.poster,
  background: m.background,
  releaseInfo: m.releaseInfo,
  imdbRating: m.imdbRating
});
const inLib = id => !!S.library[id];
function toggleLib(m) {
  hooks.emit('library:toggle', m, inLib(m.id));
  if (inLib(m.id)) {
    delete S.library[m.id];
    toast('Removido da tua lista');
  } else {
    S.library[m.id] = { ...slim(m), added: Date.now() };
    toast('Adicionado à tua lista');
  }
  save();
}
function progressFor(videoId) {
  for (const p of Object.values(S.progress)) if (p.videoId === videoId) return p;
  return null;
}

/* ---------- ajudantes de interface ---------- */
function card(it) {
  it = hooks.pipe('card', it);
  remember(it);
  const year = (it.releaseInfo || '').toString().slice(0, 9);
  return `<button class="card" data-open="${esc(it.type)}|${esc(it.id)}" title="${esc(it.name)}">
    <div class="pimg"><img loading="lazy" src="${esc(it.poster || IMG.poster(it.id))}" alt="" onerror="window.vvPoster?vvPoster(this):this.parentNode.classList.add('noimg')"><span class="ptitle">${esc(it.name)}</span>${it.imdbRating ? `<span class="badge">★ ${esc(it.imdbRating)}</span>` : ''}</div>
    <div class="cinfo"><span>${esc(it.name)}</span><small>${esc(year)}${it.type === 'series' ? ' · Série' : ''}</small></div></button>`;
}
const timeLeft = s => {
  const m = Math.max(1, Math.round(s / 60));
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};
/* cartão de “Continuar a ver”: a imagem pode ser a última cena vista (ver estilo-netflix.js) */
function wideCard(p) {
  const pct = p.d > 1 ? Math.min(100, (p.t / p.d) * 100) : 0;
  const img = hooks.pipe('progress:image', p.thumb || p.background || IMG.bg(p.id), p);
  const sub = p.d > 1 ? `faltam <b>${timeLeft(p.d - p.t)}</b>` : 'Próximo episódio';
  return `<button class="card wide" data-resume="${esc(p.id)}">
    <div class="pimg"><img loading="lazy" src="${esc(img)}" alt="" onerror="this.src='${esc(p.background || IMG.bg(p.id))}'"><div class="ov"></div><span class="play">${I.play}</span>
    <span class="rm" data-unprog="${esc(p.id)}" title="Tirar de “Continuar a ver”">${I.x}</span>
    <div class="wt">${esc(p.name)}<small>${p.ep ? esc(p.ep) + ' · ' : ''}${sub}</small></div><i class="bar"><b style="width:${pct}%"></b></i></div></button>`;
}
function rowHTML(title, inner, sub = '') {
  return `<section class="row"><div class="rowh"><h2>${esc(title)}</h2>${sub ? `<small>${esc(sub)}</small>` : ''}<div class="tsp"></div><button class="arr" data-scroll="-1">${I.left}</button><button class="arr" data-scroll="1">${I.right}</button></div><div class="track">${inner}</div></section>`;
}
const skRow = (n = 8) =>
  rowHTML(
    '…',
    Array.from(
      { length: n },
      () =>
        `<div class="card"><div class="pimg sk"></div><div class="cinfo"><span class="sk" style="height:12px;border-radius:6px;width:80%">&nbsp;</span></div></div>`
    ).join('')
  );
/* janela por cima da app (escolher lista, PIN, partilhar…); fecha com Esc, fora da caixa ou [data-close-modal] */
const modal = document.createElement('div');
modal.className = 'xmodal';
document.body.appendChild(modal);
function openModal(html, onReady, wide) {
  modal.innerHTML = `<div class="xbox ${wide ? 'wide' : ''}">${html}</div>`;
  modal.classList.add('open');
  if (onReady) onReady(modal);
  setTimeout(() => modal.querySelector('input, textarea, button')?.focus(), 60);
}
function closeModal() {
  modal.classList.remove('open');
}
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('[data-close-modal]')) closeModal();
});
document.addEventListener(
  'keydown',
  e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      e.stopImmediatePropagation();
      closeModal();
    }
  },
  true
);
function emptyHTML(icon, t, p, btn = '') {
  return `<div class="empty">${icon}<h3>${t}</h3><p>${p}</p>${btn}</div>`;
}
function offlineHTML() {
  const html = emptyHTML(
    I.wifi,
    'Sem ligação aos addons',
    'Não foi possível contactar o catálogo. Verifica a tua ligação à internet e tenta outra vez.',
    '<button class="btn pri" onclick="boot()">Tentar de novo</button>'
  );
  return hooks.pipe('offline', html);
}
const LOGO =
  '<svg viewBox="0 0 48 48"><path d="M34.5 9.5 24 38.5" fill="none" stroke="url(#lg)" stroke-opacity=".7" stroke-width="8" stroke-linecap="round"/><path d="M13.5 9.5 24 38.5" fill="none" stroke="url(#lg)" stroke-width="8" stroke-linecap="round"/></svg>';
const topbar = (title, solid = true, home = false) =>
  `<div class="topbar ${solid ? 'solid' : ''}">${home ? `<a class="mbrand" href="#home">${LOGO}Vinovim</a>` : ''}${title ? `<h1>${title}</h1>` : ''}<div class="tsp"></div>${home ? '<nav class="seg"><a href="#movies">Filmes</a><a href="#series">Séries</a></nav>' : ''}<button class="qbtn" data-surprise>${I.dice}<span>Surpreende-me</span></button><a class="qbtn" href="#search">${I.search}<span>Pesquisar</span></a></div>`;
