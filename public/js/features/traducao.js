/* títulos e sinopses no idioma da app: o catálogo base vem em inglês, aqui traduzimos por ID do IMDb.
   Guarda o resultado neste aparelho para não repetir pedidos. */
(function () {
  const HOST = 'https://tmdb.elfhosted.com/';
  const MAP = { 'pt-PT': 'pt-PT', 'pt-BR': 'pt-BR', es: 'es-ES' };
  const lang = () => MAP[S.prefs.lang || 'pt-PT'] || null;
  const GENERIC = /^(epis[oó]dio|episode|episodio)\s*\d+$/i;
  let cache = {},
    loaded = null,
    saveT = 0;

  function load(l) {
    if (loaded === l) return;
    loaded = l;
    try {
      cache = JSON.parse(localStorage.getItem('vinovim.tr.' + l) || '{}');
    } catch (e) {
      cache = {};
    }
  }
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try {
        const k = Object.keys(cache);
        if (k.length > 4000) k.slice(0, k.length - 3000).forEach(x => delete cache[x]);
        localStorage.setItem('vinovim.tr.' + loaded, JSON.stringify(cache));
      } catch (e) {}
    }, 1500);
  }

  /* fila com no máximo 4 pedidos ao mesmo tempo */
  const waiting = [],
    inflight = new Map(),
    failed = new Map();
  let running = 0;
  function pump() {
    while (running < 4 && waiting.length) {
      const job = waiting.shift();
      running++;
      job().finally(() => {
        running--;
        pump();
      });
    }
  }
  function fetchMeta(type, id, l) {
    const key = l + '|' + type + '|' + id;
    if (inflight.has(key)) return inflight.get(key);
    if (failed.get(key) > Date.now()) return Promise.resolve(null);
    const p = new Promise(res => {
      waiting.push(async () => {
        try {
          const url = HOST + encodeURIComponent(JSON.stringify({ language: l })) + '/meta/' + type + '/' + id + '.json';
          const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
          const j = r.ok ? (await r.json()).meta : null;
          if (!j || !j.name) {
            failed.set(key, Date.now() + 10 * 60 * 1000);
            return res(null);
          }
          res(j);
        } catch (e) {
          failed.set(key, Date.now() + 60 * 1000);
          res(null);
        }
      });
      pump();
    });
    inflight.set(key, p);
    p.finally(() => setTimeout(() => inflight.delete(key), 30000));
    return p;
  }
  const okId = id => /^tt\d+$/.test(id || '');

  /* devolve {n, d} do cache ou vai buscar */
  async function get(type, id, wantFull) {
    const l = lang();
    if (!l || !okId(id)) return null;
    load(l);
    if (cache[id] && !wantFull) return cache[id];
    const types = type === 'series' || type === 'movie' ? [type] : ['movie', 'series'];
    for (const t of types) {
      const m = await fetchMeta(t, id, l);
      if (m) {
        cache[id] = { n: m.name, d: m.description || '' };
        persist();
        return wantFull ? { ...cache[id], meta: m } : cache[id];
      }
    }
    return null;
  }

  /* nos detalhes: nome, sinopse e episódios */
  const origGetMeta = getMeta;
  getMeta = async function (type, id) {
    const m = await origGetMeta(type, id);
    try {
      if (!lang() || !okId(m.id)) return m;
      const t = await Promise.race([get(m.type || type, m.id, true), new Promise(r => setTimeout(r, 3500, null))]);
      if (!t) return m;
      m.name = t.n || m.name;
      if (t.d) m.description = t.d;
      const tv = (t.meta && t.meta.videos) || [];
      if (tv.length && Array.isArray(m.videos)) {
        const by = new Map(tv.map(v => [v.season + ':' + (v.episode ?? v.number), v]));
        m.videos.forEach(v => {
          const x = by.get(v.season + ':' + (v.episode ?? v.number));
          if (!x) return;
          const nm = x.name || x.title;
          if (nm && !GENERIC.test(nm)) {
            if ('title' in v) v.title = nm;
            v.name = nm;
          }
          const ov = x.overview || x.description;
          if (ov) {
            if ('description' in v) v.description = ov;
            v.overview = ov;
          }
        });
      }
      remember(m);
    } catch (e) {}
    return m;
  };

  /* nos cartões e no destaque: traduz o que aparece no ecrã */
  const pending = new Set();
  function setCard(el, n) {
    el.title = n;
    const a = el.querySelector('.ptitle'),
      b = el.querySelector('.cinfo span');
    if (a) a.textContent = n;
    if (b) b.textContent = n;
    const w = el.querySelector('.wt');
    if (w && w.firstChild && w.firstChild.nodeType === 3) w.firstChild.nodeValue = n;
  }
  async function scan() {
    const l = lang();
    if (!l) return;
    load(l);
    document.querySelectorAll('.card[data-open],.card[data-resume]').forEach(el => {
      if (el.dataset.tr === l) return;
      let type, id;
      if (el.dataset.open) [type, id] = el.dataset.open.split('|');
      else {
        id = String(el.dataset.resume).split(':')[0];
        type = (ITEMS.get(id) || {}).type;
      }
      if (!okId(id)) return;
      const c = cache[id];
      if (c) {
        el.dataset.tr = l;
        return setCard(el, c.n);
      }
      if (pending.has(id)) return;
      pending.add(id);
      get(type, id).then(t => {
        pending.delete(id);
        if (!t) return;
        const it = ITEMS.get(id);
        if (it) it.name = t.n;
        document.querySelectorAll('.card[data-open$="|' + id + '"],.card[data-resume^="' + id + '"]').forEach(x => {
          x.dataset.tr = l;
          setCard(x, t.n);
        });
        heroFix();
      });
    });
    heroFix();
  }
  async function heroFix() {
    const h = document.getElementById('hero');
    const b = h && h.querySelector('[data-open]');
    if (!b) return;
    const [type, id] = b.dataset.open.split('|');
    if (!okId(id) || h.dataset.tr === id + lang()) return;
    const t = await get(type, id);
    const b2 = h.querySelector('[data-open]');
    if (!t || !b2 || b2.dataset.open !== b.dataset.open) return;
    h.dataset.tr = id + lang();
    const d = h.querySelector('.hdesc'),
      ti = h.querySelector('.htitle'),
      lg = h.querySelector('.hlogo');
    if (d && t.d) d.textContent = t.d;
    if (ti) ti.textContent = t.n;
    if (lg) lg.alt = t.n;
  }
  let st = 0;
  new MutationObserver(() => {
    clearTimeout(st);
    st = setTimeout(scan, 200);
  }).observe(document.body, { childList: true, subtree: true });
  hooks.on('hero:shown', () => {
    const h = document.getElementById('hero');
    if (h) delete h.dataset.tr;
    setTimeout(scan, 100);
  });
  setTimeout(scan, 800);
})();
