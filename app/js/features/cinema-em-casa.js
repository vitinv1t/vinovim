/* Vinovim — cinema em casa
   Ecrã de pausa · Continuar noutro dispositivo · Início da época · Contagem para estreias ·
   “Da última vez…” · Protetor de ecrã com o título que estás a ver */
(() => {
  'use strict';
  const API = /^https?:$/.test(location.protocol)
    ? ''
    : (window.vinovimNative && window.vinovimNative.remote) || 'https://vinovim.vercel.app';
  const PD = () => S.pdata[S.activeProfile] || {};
  const ON = k => S.prefs['c8_' + k] !== false;
  const kids = () => !!(curProfile() || {}).kids;
  const IS_CAP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const castOf = m =>
    (m.cast && m.cast.length ? m.cast : (m.links || []).filter(l => l.category === 'Cast').map(l => l.name)).slice(
      0,
      4
    );
  const yearOf = m => String(m.releaseInfo || m.year || '').slice(0, 4);
  const epName = v => (v ? v.name || v.title || '' : '');
  const trunc = (s, n) => {
    s = String(s || '').trim();
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
  };
  const fmtLeft = s => {
    const m = Math.max(1, Math.round(s / 60));
    return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60 ? (m % 60) + ' min' : '') : m + ' min';
  };
  const auth = () => {
    try {
      return JSON.parse(localStorage.getItem('vinovim.auth')) || {};
    } catch (e) {
      return {};
    }
  };

  /* =================== ecrã de pausa =================== */
  const pz = document.createElement('div');
  pz.id = 'vvPause';
  P.appendChild(pz);
  let pzT = null;
  function pauseInfo() {
    const m = PC && PC.meta;
    if (!m) return '';
    const v = PC.video,
      isS = m.type === 'series' && v;
    const meta = [yearOf(m), m.runtime].filter(Boolean);
    const desc = isS ? v.overview || v.description || m.description : m.description;
    const cast = castOf(m);
    return `<div class="pw"><small>Estás a ver</small><h1>${esc(m.name)}</h1>
    ${isS ? `<div class="c8ep">T${v.season}:E${v.episode}${epName(v) ? ' · ' + esc(epName(v)) : ''}</div>` : ''}
    ${meta.length ? `<div class="c8mt">${meta.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    ${desc ? `<p>${esc(desc)}</p>` : ''}
    ${cast.length ? `<div class="cs"><b>Elenco:</b> ${esc(cast.join(', '))}</div>` : ''}</div><div class="pz">Em pausa</div>`;
  }
  const hidePause = () => {
    clearTimeout(pzT);
    pz.classList.remove('show');
  };
  function armPause() {
    clearTimeout(pzT);
    if (!ON('pause') || !PC || !PC.meta || PC.stream.ytId) return;
    pzT = setTimeout(() => {
      if (
        !V.paused ||
        V.ended ||
        !P.classList.contains('open') ||
        P.classList.contains('mini') ||
        document.querySelector('#vvRecap.show') ||
        document.querySelector('#player.v5end')
      )
        return;
      pz.innerHTML = pauseInfo();
      pz.classList.add('show');
    }, 5000);
  }
  V.addEventListener('pause', armPause);
  V.addEventListener('play', hidePause);
  V.addEventListener('seeking', hidePause);
  ['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    P.addEventListener(
      ev,
      () => {
        if (pz.classList.contains('show') || pzT) {
          hidePause();
          if (V.paused) armPause();
        }
      },
      { passive: true }
    )
  );

  /* =================== “Da última vez…” =================== */
  const rc = document.createElement('div');
  rc.id = 'vvRecap';
  P.appendChild(rc);
  let recapCtx = null;
  function showRecap(m, cur, prevV, last) {
    const days = Math.round((Date.now() - last.updated) / 864e5);
    const left = last.d && last.t ? fmtLeft(last.d - last.t) : '';
    rc.innerHTML = `<div class="rc"><small>Da última vez · há ${days} ${days === 1 ? 'dia' : 'dias'}</small><h2>${esc(m.name)}</h2>
    ${prevV ? `<div class="box">${prevV.thumbnail ? `<img src="${esc(prevV.thumbnail)}" alt="">` : ''}<div><b>No episódio anterior · T${prevV.season}:E${prevV.episode}${epName(prevV) ? ' · ' + esc(epName(prevV)) : ''}</b><p>${esc(trunc(prevV.overview || prevV.description || 'Sem resumo disponível.', 320))}</p></div></div>` : ''}
    ${cur ? `<div class="box">${cur.thumbnail ? `<img src="${esc(cur.thumbnail)}" alt="">` : ''}<div><b>Ficaste em T${cur.season}:E${cur.episode}${epName(cur) ? ' · ' + esc(epName(cur)) : ''}</b><p>${left ? 'Faltam ' + left + '. ' : ''}${esc(trunc(cur.overview || cur.description || '', 220))}</p></div></div>` : ''}
    <div class="bt"><button class="btn acc" data-rgo>${I.play || ''} Continuar</button><button class="btn gho" data-rclose>Voltar</button></div></div>`;
    rc.classList.add('show');
    rc.querySelector('[data-rgo]').onclick = () => {
      rc.classList.remove('show');
      V.play().catch(() => {});
    };
    rc.querySelector('[data-rclose]').onclick = () => {
      rc.classList.remove('show');
      if (typeof closePlayer === 'function') closePlayer();
    };
    setTimeout(() => rc.querySelector('[data-rgo]').focus(), 50);
  }
  hooks.on('play:start', (stream, ctx) => {
    recapCtx = null;
    try {
      const m = ctx && ctx.meta,
        last = m && S.progress[m.id];
      if (ON('recap') && m && m.type === 'series' && last && last.updated && Date.now() - last.updated > 5 * 864e5) {
        const vs = (m.videos || [])
          .filter(v => v.season > 0)
          .sort((a, b) => a.season - b.season || a.episode - b.episode);
        const i = vs.findIndex(v => v.id === (ctx.videoId || last.videoId));
        recapCtx = { m, cur: vs[i] || ctx.video, prev: i > 0 ? vs[i - 1] : null, last: Object.assign({}, last) };
      }
    } catch (e) {
      recapCtx = null;
    }
  });
  V.addEventListener('playing', () => {
    if (!recapCtx) return;
    const r = recapCtx;
    recapCtx = null;
    V.pause();
    hidePause();
    showRecap(r.m, r.cur, r.prev, r.last);
  });

  /* =================== continuar noutro dispositivo =================== */
  let DEV = '';
  try {
    DEV = localStorage.getItem('vinovim.dev') || '';
    if (!DEV) {
      DEV = Math.random().toString(36).slice(2, 12);
      localStorage.setItem('vinovim.dev', DEV);
    }
  } catch (e) {}
  const devName = () =>
    document.documentElement.classList.contains('tv')
      ? 'na TV'
      : NATIVE
        ? 'no PC'
        : IS_CAP
          ? 'no telemóvel'
          : 'no browser';
  async function nowApi(method, body) {
    const a = auth();
    if (!a.token) return null;
    const r = await fetch(API + '/api/account?a=now', {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    });
    return r.ok ? r.json() : null;
  }
  // diz à conta onde vais: ao começar, ao pausar, ao fechar e, durante o vídeo, de 10 em 10 minutos
  let lastPush = 0;
  function pushNow(force) {
    if (!ON('handoff') || !PC || !PC.meta || PC.stream.ytId || PC.stream._local || !V.duration || !isFinite(V.duration))
      return;
    if (Date.now() - lastPush < (force ? 15000 : 10 * 60 * 1000)) return;
    lastPush = Date.now();
    const m = PC.meta,
      v = PC.video;
    nowApi('PUT', {
      dev: DEV,
      where: devName(),
      profile: S.activeProfile,
      id: m.id,
      type: m.type,
      name: m.name,
      poster: m.poster,
      background: m.background,
      videoId: PC.videoId || m.id,
      season: v ? v.season : null,
      ep: v ? epLabel(v) : '',
      epName: epName(v),
      thumb: v && v.thumbnail,
      t: Math.floor(V.currentTime),
      d: Math.floor(V.duration),
      stream: PC.stream
    }).catch(() => {});
  }
  V.addEventListener('timeupdate', () => pushNow(false));
  V.addEventListener('pause', () => pushNow(true));
  hooks.on('play:started', () => (lastPush = 0));
  hooks.on('player:closing', () => pushNow(true));
  let handShown = false;
  async function checkHandoff() {
    if (handShown || !ON('handoff') || kids() || P.classList.contains('open')) return;
    let r;
    try {
      r = await nowApi('GET');
    } catch (e) {
      return;
    }
    if (!r || !r.id || r.dev === DEV || r.profile !== S.activeProfile) return;
    if (Date.now() - (r.at || 0) > 2 * 864e5 || !(r.t > 60) || (r.d && r.t > r.d - 120)) return;
    const loc = S.progress[r.id];
    if (loc && loc.updated > (r.at || 0) - 5000 && loc.videoId === r.videoId && Math.abs((loc.t || 0) - r.t) < 30)
      return;
    handShown = true;
    const el = document.createElement('div');
    el.id = 'vvHand';
    el.innerHTML = `<img src="${esc(r.thumb || r.background || IMG.bg(r.id))}" alt="" onerror="this.style.visibility='hidden'"><div class="c8tx"><small>Estavas a ver ${esc(r.where || 'noutro dispositivo')}</small><b>${esc(r.name)}${r.ep ? ' · ' + esc(r.ep) : ''}</b><div class="c8bar"><i style="width:${r.d ? Math.round((r.t / r.d) * 100) : 0}%"></i></div></div><button class="btn sm acc" data-hgo>Continuar aqui</button><button class="btn sm gho" data-hno>Agora não</button>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const close = () => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 400);
    };
    const auto = setTimeout(close, 20000);
    el.querySelector('[data-hno]').onclick = () => {
      clearTimeout(auto);
      close();
    };
    el.querySelector('[data-hgo]').onclick = async () => {
      clearTimeout(auto);
      close();
      S.progress[r.id] = {
        id: r.id,
        type: r.type,
        name: r.name,
        poster: r.poster,
        background: r.background,
        videoId: r.videoId,
        season: r.season,
        ep: r.ep,
        thumb: r.thumb,
        t: r.t,
        d: r.d,
        updated: Date.now(),
        stream: r.stream
      };
      save();
      try {
        const m = await getMeta(r.type, r.id);
        const v = (m.videos || []).find(x => x.id === r.videoId);
        if (r.stream && r.stream.url) play(r.stream, { meta: m, video: v, type: m.type, videoId: r.videoId });
        else openStreams(m, v);
      } catch (e) {
        toast('Sem ligação');
      }
    };
  }
  function whenReady(fn) {
    const tryNow = () => {
      if (
        document.documentElement.classList.contains('vvgate') ||
        document.getElementById('vvLogin') ||
        document.querySelector('#profiles.open')
      )
        return false;
      fn();
      return true;
    };
    if (tryNow()) return;
    const iv = setInterval(() => {
      if (tryNow()) clearInterval(iv);
    }, 1500);
    setTimeout(() => clearInterval(iv), 10 * 60 * 1000);
  }

  /* =================== início da época =================== */
  function season() {
    const q = (location.search.match(/[?&]epoca=([a-z]+)/) || [])[1];
    const d = new Date(),
      md = (d.getMonth() + 1) * 100 + d.getDate();
    const id =
      q ||
      (md >= 1015 && md <= 1102
        ? 'halloween'
        : md >= 1108 && md <= 1112
          ? 'magusto'
          : md >= 1201 || md <= 106
            ? 'natal'
            : md >= 207 && md <= 214
              ? 'namorados'
              : md >= 621 && md <= 915
                ? 'verao'
                : '');
    return (
      {
        halloween: {
          tag: '🎃 Especial Halloween',
          fx: ['🦇', '🎃', '🕸️'],
          n: 14,
          glow: 'radial-gradient(900px 500px at 70% 10%,rgba(255,120,20,.35),transparent 60%)',
          rows: [
            ['Terror para esta noite', 'movie', { genre: 'Horror' }],
            ['Halloween', 'movie', { search: 'halloween' }]
          ]
        },
        magusto: {
          tag: '🌰 São Martinho',
          fx: ['🍂', '🍁', '🌰'],
          n: 16,
          glow: 'radial-gradient(900px 500px at 70% 10%,rgba(214,120,40,.32),transparent 60%)',
          rows: [
            ['Para ver à lareira', 'movie', { genre: 'Family' }],
            ['Mistérios de outono', 'movie', { genre: 'Mystery' }]
          ]
        },
        natal: {
          tag: '🎄 Especial Natal',
          fx: ['❄', '❅', '❆'],
          n: 26,
          glow: 'radial-gradient(900px 500px at 70% 10%,rgba(60,170,110,.28),transparent 60%),radial-gradient(700px 400px at 20% 0,rgba(255,77,148,.25),transparent 60%)',
          rows: [
            ['Especial Natal', 'movie', { search: 'christmas' }],
            ['Filmes para ver em família', 'movie', { genre: 'Family' }]
          ]
        },
        namorados: {
          tag: '💘 Dia dos Namorados',
          fx: ['💗', '💕', '💖'],
          n: 14,
          glow: 'radial-gradient(900px 500px at 70% 10%,rgba(255,80,140,.3),transparent 60%)',
          rows: [
            ['Romances para hoje', 'movie', { genre: 'Romance' }],
            ['Comédias românticas', 'movie', { search: 'love' }]
          ]
        },
        verao: {
          tag: '☀️ Verão no Vinovim',
          fx: ['☀️', '🌴', '🏖️'],
          n: 10,
          glow: 'radial-gradient(900px 500px at 75% 5%,rgba(255,200,60,.32),transparent 60%)',
          rows: [
            ['Comédias de verão', 'movie', { genre: 'Comedy' }],
            ['Aventuras de verão', 'movie', { genre: 'Adventure' }]
          ]
        }
      }[id] || null
    );
  }
  async function seasonHome() {
    const s = season();
    const home = document.querySelector('#app .home') || document.querySelector('#app .view');
    if (!s || !ON('season') || kids() || !home || home.querySelector('.vvSeason')) return;
    if (getComputedStyle(home).position === 'static') home.style.position = 'relative';
    const fx = document.createElement('div');
    fx.className = 'vvSeason';
    fx.innerHTML = Array.from(
      { length: s.n },
      (_, i) =>
        `<i style="left:${Math.round(Math.random() * 100)}%;font-size:${12 + Math.round(Math.random() * 16)}px;animation-duration:${9 + Math.random() * 10}s;animation-delay:-${Math.random() * 15}s;--dx:${Math.round(Math.random() * 120 - 60)}px;--rot:${Math.round(Math.random() * 360)}deg">${s.fx[i % s.fx.length]}</i>`
    ).join('');
    const glow = document.createElement('div');
    glow.className = 'vvSeasonGlow';
    glow.style.setProperty('--sg', s.glow);
    home.prepend(glow);
    home.prepend(fx);
    const hm = document.querySelector('#hero .hmeta');
    if (hm && !document.querySelector('.vvSeasonTag'))
      hm.insertAdjacentHTML('beforebegin', `<div class="vvSeasonTag">${s.tag}</div>`);
    const rows = $('#rows');
    if (!rows) return;
    const out = [];
    for (const [title, type, extra] of s.rows) {
      try {
        const list = (await catalog(cinemeta(), type, 'top', extra)).filter(m => m.poster).slice(0, 20);
        if (list.length >= 4) out.push(rowHTML(title, list.map(card).join(''), s.tag));
      } catch (e) {}
    }
    if (!out.length || !document.body.contains(rows)) return;
    const anchor =
      rows.querySelector('.vvCount') ||
      [...rows.children].find(r =>
        /Continuar a ver|Continue watching/i.test(r.querySelector('h2')?.textContent || '')
      ) ||
      null;
    const html = out.join('');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else rows.insertAdjacentHTML('afterbegin', html);
  }

  /* =================== contagem para estreias =================== */
  function countLabel(d) {
    if (!d) return ['Em breve', false];
    const now = new Date(),
      a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
      b0 = new Date(d),
      b = new Date(b0.getFullYear(), b0.getMonth(), b0.getDate()).getTime();
    const days = Math.round((b - a) / 864e5);
    if (d <= Date.now()) return ['Já disponível', true];
    if (days <= 0) {
      const h = Math.max(1, Math.round((d - Date.now()) / 36e5));
      return ['Estreia hoje · daqui a ' + h + ' h', false];
    }
    if (days === 1) return ['Estreia amanhã', false];
    return ['Estreia em ' + days + ' dias', false];
  }
  function countdownRow() {
    if (!ON('countdown') || kids()) return;
    const rows = $('#rows');
    if (!rows || rows.querySelector('.vvCount')) return;
    const rm = Object.values(PD().remind || {})
      .filter(x => !x.done || x.done > Date.now() - 3 * 864e5)
      .sort((a, b) => (a.date || 9e15) - (b.date || 9e15));
    if (!rm.length) return;
    const cards = rm
      .slice(0, 12)
      .map(x => {
        const [lab, ok] = countLabel(x.done || x.date);
        return `<button class="vvCd" data-open="${esc(x.type)}|${esc(x.id)}"><img src="${esc(IMG.bg(x.id))}" alt="" loading="lazy" onerror="this.src='${esc(x.poster || '')}'"><div class="in"><b>${esc(x.name)}</b><span class="cd ${ok ? 'ok' : ''}">${esc(lab)}</span></div></button>`;
      })
      .join('');
    rows.insertAdjacentHTML(
      'afterbegin',
      `<section class="row vvCount"><div class="rowh"><h2>Estreias que estás à espera</h2><div class="tsp"></div><button class="arr" data-scroll="-1">${I.left}</button><button class="arr" data-scroll="1">${I.right}</button></div><div class="track">${cards}</div></section>`
    );
    [...rows.querySelectorAll('.row:not(.vvCount)')].forEach(r => {
      if (/^(Os teus lembretes)$/i.test(r.querySelector('h2')?.textContent || '')) r.remove();
    });
  }
  hooks.on('view:home', async () => {
    try {
      countdownRow();
    } catch (e) {}
    seasonHome().catch(() => {});
  });

  /* =================== protetor de ecrã com o título que estás a ver =================== */
  const sv = document.createElement('div');
  sv.id = 'vvSaver';
  sv.innerHTML =
    '<div class="c8im"></div><div class="c8im"></div><div class="cap"></div><div class="clk"></div><img class="c8lg" src="icon.svg" alt="">';
  document.body.appendChild(sv);
  const SAVER_MIN = () => Math.max(1, +S.prefs.c8_saverMin || 4);
  let idleT = null,
    svTimer = null,
    svClock = null,
    svIdx = 0,
    svOn = false;
  async function saverSubject() {
    // 1) o vídeo em pausa  2) a página do título aberta  3) o último título que viste
    if (PC && PC.meta && P.classList.contains('open')) return { m: PC.meta, v: PC.video, why: 'Em pausa' };
    if (typeof D !== 'undefined' && D.meta && $('#detail') && $('#detail').classList.contains('open'))
      return { m: D.meta, v: null, why: 'A ver os detalhes' };
    const last = Object.values(S.progress || {}).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    if (!last) return null;
    try {
      const m = await getMeta(last.type, last.id);
      const v = (m.videos || []).find(x => x.id === last.videoId);
      return { m, v, why: 'Continuar a ver' };
    } catch (e) {
      return null;
    }
  }
  function saverImages(m, v) {
    const imgs = [];
    if (v && v.thumbnail) imgs.push(v.thumbnail);
    if (m.background) imgs.push(m.background);
    imgs.push(IMG.bg(m.id));
    if (m.type === 'series') {
      const vs = (m.videos || []).filter(x => x.thumbnail && x.season > 0);
      const s = v ? vs.filter(x => x.season === v.season) : vs;
      (s.length ? s : vs).slice(0, 14).forEach(x => imgs.push(x.thumbnail));
    }
    return [...new Set(imgs.filter(Boolean))];
  }
  async function startSaver() {
    if (svOn || !ON('saver') || document.hidden) return;
    if (P.classList.contains('open') && !V.paused) return;
    if (document.querySelector('#vvLogin, #profiles.open, #upd.open, .xmodal.open, #vvRecap.show')) return;
    const sub = await saverSubject();
    if (!sub) return;
    const { m, v, why } = sub;
    const imgs = saverImages(m, v);
    if (!imgs.length) return;
    const meta = [
      yearOf(m) ? `<span>${esc(yearOf(m))}</span>` : '',
      v
        ? `<span>T${v.season}:E${v.episode}${epName(v) ? ' · ' + esc(epName(v)) : ''}</span>`
        : m.runtime
          ? `<span>${esc(m.runtime)}</span>`
          : ''
    ]
      .filter(Boolean)
      .join('');
    sv.querySelector('.cap').innerHTML =
      `<small>${esc(why)}</small><h1>${esc(m.name)}</h1><div class="c8mt">${meta}</div>`;
    const ims = sv.querySelectorAll('.c8im');
    svIdx = 0;
    const show = () => {
      const el = ims[svIdx % 2],
        other = ims[(svIdx + 1) % 2],
        src = imgs[svIdx % imgs.length];
      const pre = new Image();
      pre.onload = () => {
        el.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`;
        el.classList.remove('on');
        void el.offsetWidth;
        el.classList.add('on');
        other.classList.remove('on');
      };
      pre.src = src;
      svIdx++;
    };
    const tick = () => {
      const d = new Date();
      sv.querySelector('.clk').textContent = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    };
    show();
    tick();
    svTimer = setInterval(show, 9000);
    svClock = setInterval(tick, 15000);
    svOn = true;
    sv.classList.add('show');
    hidePause();
  }
  function stopSaver() {
    if (!svOn) return;
    svOn = false;
    clearInterval(svTimer);
    clearInterval(svClock);
    sv.classList.remove('show');
    if (P.classList.contains('open') && V.paused) armPause();
  }
  function bump() {
    if (svOn) stopSaver();
    clearTimeout(idleT);
    idleT = setTimeout(startSaver, SAVER_MIN() * 60 * 1000);
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, bump, { passive: true, capture: true })
  );
  V.addEventListener('play', bump);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSaver();
    else bump();
  });

  /* =================== definições =================== */
  const OPTS = [
    ['pause', 'Ecrã de pausa', 'Ao pausar, mostra o título, o episódio, a sinopse e o elenco'],
    ['recap', '“Da última vez…”', 'Ao voltar a uma série depois de uns dias, mostra onde ficaste'],
    [
      'handoff',
      'Continuar noutro dispositivo',
      'Retoma no PC, no telemóvel ou na TV o que estavas a ver (precisa de conta)'
    ],
    ['season', 'Início da época', 'Decoração e filas especiais no Natal, Halloween, São Martinho e verão'],
    ['countdown', 'Contagem para estreias', 'Os títulos com “Avisa-me” aparecem no topo com a contagem'],
    ['saver', 'Protetor de ecrã', 'Depois de uns minutos parado, mostra imagens do título que estás a ver']
  ];
  hooks.on('view:settings', async () => {
    const pad = document.querySelector('#app .pad');
    if (!pad || kids()) return;
    const html = `<div class="panel"><h3>Experiência de cinema em casa</h3><p class="m">Os detalhes que tornam o Vinovim mais teu.</p>
    ${OPTS.map(([k, l, s]) => `<div class="srow"><div class="c8tx"><b>${l}</b><small>${s}</small></div><button class="tg ${ON(k) ? 'on' : ''}" data-c8="${k}"></button></div>`).join('')}
    <div class="srow"><div class="c8tx"><b>Protetor de ecrã começa ao fim de</b><small>Minutos sem mexer no Vinovim</small></div><select class="sel" id="c8min">${[2, 4, 8, 15].map(n => `<option value="${n}" ${SAVER_MIN() === n ? 'selected' : ''}>${n} min</option>`).join('')}</select></div></div>`;
    const grp = pad.querySelector('.v6grp[data-g="Aparência"]');
    (grp || pad).insertAdjacentHTML('beforeend', html);
    pad.querySelectorAll('[data-c8]').forEach(
      b =>
        (b.onclick = () => {
          const k = b.dataset.c8;
          S.prefs['c8_' + k] = !ON(k);
          save();
          b.classList.toggle('on', ON(k));
          if (k === 'pause' && !ON(k)) hidePause();
        })
    );
    const sel = pad.querySelector('#c8min');
    if (sel)
      sel.onchange = () => {
        S.prefs.c8_saverMin = +sel.value;
        save();
        bump();
      };
  });

  /* =================== arranque =================== */
  hooks.on('boot', () => {
    bump();
    whenReady(() => setTimeout(checkHandoff, 2500));
    setTimeout(() => {
      if (location.hash.slice(1) === 'home' || !location.hash) {
        try {
          countdownRow();
        } catch (e) {}
        seasonHome().catch(() => {});
      }
    }, 1500);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handShown = false;
      whenReady(() => setTimeout(checkHandoff, 1500));
    }
  });
})();
