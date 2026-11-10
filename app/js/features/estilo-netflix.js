/* Vinovim — experiência estilo Netflix
   Abertura animada · Trailer no destaque · Pré-visualização nos cartões · “% para ti” · “Porque viste…” ·
   Top 10 · Continuar a ver com a cena · Fim do filme com sugestões · Novidades · Filas do momento */
(() => {
  'use strict';
  const PD = () => S.pdata[S.activeProfile];
  const P5 = k => S.prefs[k] !== false;
  const ORIGIN = /^https?:$/.test(location.protocol) ? location.origin : '';
  const HOVER = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const XI = {
    vol: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
    mute: sv('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>'),
    like: sv('<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7"/>'),
    more: sv('<path d="m6 9 6 6 6-6"/>'),
    spark: sv('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
    bell: sv('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>')
  };

  /* =================== gosto e “% para ti” =================== */
  function tasteW() {
    const d = PD(),
      w = {},
      add = (gs, k) => (gs || []).forEach(g => (w[g] = (w[g] || 0) + k));
    Object.values((d.stats || {}).titles || {}).forEach(t => add(t.genres, Math.min(10, (t.secs || 0) / 3600)));
    const gb = d.genresById || {};
    Object.entries(d.ratings || {}).forEach(([id, r]) => add(gb[id], r > 0 ? 3 : -4));
    Object.values(S.library || {}).forEach(it => {
      const m = ITEMS.get(it.id);
      if (m) add(m.genres, 1);
    });
    return w;
  }
  let TW = null,
    TWt = 0;
  const taste = () => {
    if (!TW || !Object.keys(TW).length || Date.now() - TWt > 8000) {
      TW = tasteW();
      TWt = Date.now();
    }
    return TW;
  };
  function matchPct(m) {
    if (!P5('matchPct') || !m) return null;
    const w = taste(),
      vals = Object.values(w).filter(x => x > 0);
    if (!vals.length) return null;
    const max = Math.max(...vals),
      gs = m.genres || m.genre || [],
      r = parseFloat(m.imdbRating) || 0;
    let s;
    if (gs.length) {
      const sc = gs.reduce((a, g) => a + (w[g] || 0), 0) / (max * Math.min(gs.length, 2));
      s = 62 + Math.max(-0.5, Math.min(1, sc)) * 30;
    } else s = 70;
    if (r) s += (r - 6.8) * 3.2;
    const id = String(m.id || '');
    s += (id.charCodeAt(id.length - 1) || 0) % 4;
    return Math.max(41, Math.min(99, Math.round(s)));
  }
  const matchHTML = m => {
    const p = matchPct(m);
    return p ? `<span class="vvmatch">${p}% para ti</span>` : '';
  };

  /* =================== abertura animada =================== */
  function tadum() {
    if (!P5('introSound')) return;
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      const ac = new C();
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const t0 = ac.currentTime + 0.05,
        out = ac.createGain();
      out.gain.value = 0.55;
      out.connect(ac.destination);
      const hit = (t, f, len, vol) => {
        const o = ac.createOscillator(),
          g = ac.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f * 2.2, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + len);
        o.connect(g);
        g.connect(out);
        o.start(t);
        o.stop(t + len + 0.05);
      };
      hit(t0 + 0.9, 58, 0.45, 0.9);
      hit(t0 + 1.12, 52, 1.6, 1);
      [130.8, 196, 261.6, 329.6].forEach((f, i) => {
        const o = ac.createOscillator(),
          g = ac.createGain();
        o.type = i % 2 ? 'triangle' : 'sawtooth';
        o.frequency.value = f;
        const lp = ac.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(400, t0 + 1.12);
        lp.frequency.linearRampToValueAtTime(2400, t0 + 2);
        g.gain.setValueAtTime(0, t0 + 1.12);
        g.gain.linearRampToValueAtTime(0.05, t0 + 1.5);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 3.2);
        o.connect(lp);
        lp.connect(g);
        g.connect(out);
        o.start(t0 + 1.1);
        o.stop(t0 + 3.3);
      });
      setTimeout(() => ac.close().catch(() => {}), 4000);
    } catch (e) {}
  }
  (function intro() {
    if (!P5('intro')) return;
    try {
      if (sessionStorage.getItem('vv_intro')) return;
      sessionStorage.setItem('vv_intro', '1');
    } catch (e) {}
    const h = location.hash.slice(1);
    if (/^(comando|colab|lista)=/.test(h)) return;
    const el = document.createElement('div');
    el.id = 'vvIntro';
    // riscas de luz nas cores do logótipo, com larguras e intervalos ao acaso
    const tones = ['#ff2d75', '#ff4d6d', '#ff7a55', '#ffb042', '#c8195f', '#8a1246'];
    let x = 0;
    const stops = [];
    while (x < 100) {
      const gap = 0.3 + Math.random() * 2.2,
        w = 0.15 + Math.random() * 1.5,
        c = tones[Math.floor(Math.random() * tones.length)];
      stops.push(`transparent ${x}% ${x + gap}%`, `${c} ${x + gap}% ${x + gap + w}%`);
      x += gap + w;
    }
    el.innerHTML = `<div class="streaks" style="background:linear-gradient(90deg,${stops.join(',')})"></div><div class="lg"><svg viewBox="0 0 48 48"><defs><linearGradient id="vvigA" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="36"><stop offset="0" stop-color="#ff2d75"/><stop offset="1" stop-color="#ffb042"/></linearGradient><linearGradient id="vvigB" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="36"><stop offset="0" stop-color="#c8195f"/><stop offset="1" stop-color="#e17828"/></linearGradient></defs><path class="v back" d="M32.6 13.6 24 34.4" fill="none" stroke="url(#vvigB)" stroke-width="6.1" stroke-linecap="round"/><path class="v front" d="M15.4 13.6 24 34.4" fill="none" stroke="url(#vvigA)" stroke-width="6.1" stroke-linecap="round"/></svg><div class="name">${[...'VINOVIM'].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('')}</div></div>`;
    document.body.appendChild(el);
    const end = () => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 600);
    };
    el.addEventListener('click', end);
    tadum();
    setTimeout(end, 3350);
  })();

  /* =================== trailer no destaque =================== */
  const ytURL = (id, extra) =>
    `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${encodeURIComponent(id)}&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1${ORIGIN ? '&origin=' + encodeURIComponent(ORIGIN) : ''}${extra || ''}`;
  const ytCmd = (ifr, func) => {
    try {
      ifr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
    } catch (e) {}
  };
  function sizeCover(box, ifr) {
    const W = box.clientWidth,
      H = box.clientHeight;
    if (!W || !H) return;
    if (W / H > 16 / 9) {
      ifr.style.width = W + 'px';
      ifr.style.height = (W * 9) / 16 + 'px';
    } else {
      ifr.style.height = H + 'px';
      ifr.style.width = (H * 16) / 9 + 'px';
    }
  }
  const trailerOf = m => {
    const t = (m && (m.trailerStreams || [])[0]) || (m && (m.trailers || []).find(x => x.source));
    return t ? t.ytId || t.source : null;
  };
  let heroMuted = true;
  hooks.on('hero:shown', el => {
    let tmr = null,
      seq = 0;
    const attach = () => {
      clearTimeout(tmr);
      const my = ++seq;
      const id = el.querySelector('[data-open]')?.dataset.open;
      if (!id) return;
      const [type, mid] = id.split('|');
      const base = ITEMS.get(mid) || {},
        hm = el.querySelector('.hmeta');
      if (hm && !hm.querySelector('.vvmatch')) {
        const mh = matchHTML(base);
        if (mh) hm.insertAdjacentHTML('afterbegin', mh);
      }
      if (!P5('heroTrailer') || location.protocol === 'file:') return;
      tmr = setTimeout(async () => {
        let m;
        try {
          m = await getMeta(type, mid);
        } catch (e) {
          return;
        }
        if (my !== seq || !document.body.contains(el)) return;
        const yt = trailerOf(m);
        if (!yt) return;
        el.querySelector('.htrailer')?.remove();
        el.insertAdjacentHTML(
          'afterbegin',
          `<div class="htrailer"><iframe src="${ytURL(yt, '&start=6')}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe></div>`
        );
        const box = el.querySelector('.htrailer'),
          ifr = box.querySelector('iframe');
        sizeCover(el, ifr);
        ifr.onload = () =>
          setTimeout(() => {
            if (my === seq) {
              box.classList.add('on');
              clearInterval(heroTimer);
              if (!heroMuted) ytCmd(ifr, 'unMute');
            }
          }, 2200);
        let mb = el.querySelector('.hmute');
        if (!mb) {
          el.insertAdjacentHTML('beforeend', `<button class="hmute" title="Som">${XI.mute}</button>`);
          mb = el.querySelector('.hmute');
        }
        mb.innerHTML = heroMuted ? XI.mute : XI.vol;
        mb.classList.add('show');
        mb.onclick = () => {
          heroMuted = !heroMuted;
          ytCmd(el.querySelector('.htrailer iframe'), heroMuted ? 'mute' : 'unMute');
          mb.innerHTML = heroMuted ? XI.mute : XI.vol;
        };
      }, 1800);
    };
    new MutationObserver(() => {
      if (!el.querySelector('.htrailer')) {
        el.querySelector('.hmute')?.classList.remove('show');
        attach();
      }
    }).observe(el, { childList: true });
    attach();
  });
  window.addEventListener('resize', () => {
    const el = $('#hero'),
      f = el && el.querySelector('.htrailer iframe');
    if (f) sizeCover(el, f);
  });
  document.addEventListener('visibilitychange', () => {
    const f = document.querySelector('.htrailer iframe');
    if (f) ytCmd(f, document.hidden ? 'pauseVideo' : 'playVideo');
  });

  /* =================== pré-visualização nos cartões =================== */
  const prev = document.createElement('div');
  prev.id = 'vvPrev';
  document.body.appendChild(prev);
  let pvT = null,
    pvCard = null,
    pvHide = null,
    pvSeq = 0;
  function hidePrev() {
    clearTimeout(pvT);
    pvCard = null;
    prev.classList.remove('show');
    setTimeout(() => {
      if (!prev.classList.contains('show')) prev.innerHTML = '';
    }, 250);
  }
  function liked(id) {
    return (PD().ratings || {})[id] === 1;
  }
  async function showPrev(cardEl) {
    const [type, id] = (cardEl.dataset.open || '').split('|');
    if (!id) return;
    const my = ++pvSeq,
      base = Object.assign({ id, type }, ITEMS.get(id) || {});
    const r = cardEl.getBoundingClientRect(),
      W = Math.max(330, Math.min(420, r.width * 2.15));
    const nr = document.getElementById('nav')?.getBoundingClientRect(),
      minL = (nr && nr.height > innerHeight / 2 ? nr.right : 0) + 12;
    let left = r.left + r.width / 2 - W / 2;
    left = Math.max(minL, Math.min(innerWidth - W - 12, left));
    let top = r.top + r.height / 2 - ((W * 9) / 16 + 120) / 2;
    top = Math.max(12, Math.min(innerHeight - ((W * 9) / 16 + 140), top));
    Object.assign(prev.style, { left: left + 'px', top: top + 'px', width: W + 'px' });
    const render = m => {
      const yr = String(m.releaseInfo || m.year || '').slice(0, 9),
        gs = (m.genres || m.genre || []).slice(0, 3).map(g => GPT[g] || g);
      prev.innerHTML = `<div class="pv" data-open="${esc(type)}|${esc(id)}" style="background-image:url('${esc(m.background || IMG.bg(id))}')"><b>${esc(m.name || '')}</b></div>
      <div class="pb2"><div class="row1"><button class="pp" data-quickplay="${esc(type)}|${esc(id)}" title="Ver agora">${I.play}</button><button data-lib="${esc(id)}" class="${inLib(id) ? 'on' : ''}" title="A minha lista">${inLib(id) ? I.check : I.plus}</button><button data-v5like class="${liked(id) ? 'on' : ''}" title="Gosto">${XI.like}</button><span class="sp"></span><button data-open="${esc(type)}|${esc(id)}" title="Mais informações">${XI.more}</button></div>
      <div class="meta2">${matchHTML(m)}${yr ? `<span>${esc(yr)}</span>` : ''}${m.runtime ? `<span>${esc(m.runtime)}</span>` : ''}${type === 'series' && m.videos ? `<span>${new Set(m.videos.filter(v => v.season > 0).map(v => v.season)).size} temporadas</span>` : ''}${m.imdbRating ? `<span>★ ${esc(m.imdbRating)}</span>` : ''}</div>
      ${gs.length ? `<div class="gen">${gs.map(esc).join('<i>•</i>')}</div>` : ''}</div>`;
    };
    render(base);
    prev.classList.add('show');
    let m = base;
    try {
      m = await getMeta(type, id);
    } catch (e) {}
    if (my !== pvSeq || !prev.classList.contains('show')) return;
    render(m);
    const yt = P5('previewTrailer') && location.protocol !== 'file:' && trailerOf(m);
    if (yt) {
      const pv = prev.querySelector('.pv');
      pv.insertAdjacentHTML(
        'afterbegin',
        `<iframe src="${ytURL(yt, '&start=10')}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe>`
      );
      const f = pv.querySelector('iframe');
      f.onload = () => setTimeout(() => f.classList.add('on'), 1600);
    }
  }
  if (HOVER) {
    document.addEventListener('mouseover', e => {
      if (!P5('previews')) return;
      const c = e.target.closest('#app .card[data-open], #app .t10[data-open]');
      if (c && c !== pvCard) {
        clearTimeout(pvT);
        clearTimeout(pvHide);
        pvCard = c;
        pvT = setTimeout(() => {
          if (pvCard === c && document.body.contains(c)) showPrev(c);
        }, 700);
      } else if (!c && !e.target.closest('#vvPrev')) {
        clearTimeout(pvT);
        if (prev.classList.contains('show')) {
          clearTimeout(pvHide);
          pvHide = setTimeout(hidePrev, 120);
        } else pvCard = null;
      } else if (e.target.closest('#vvPrev')) clearTimeout(pvHide);
    });
    prev.addEventListener('mouseleave', () => {
      pvHide = setTimeout(hidePrev, 150);
    });
    window.addEventListener('scroll', hidePrev, { passive: true, capture: true });
    window.addEventListener('hashchange', hidePrev);
  }
  prev.addEventListener('click', e => {
    const lk = e.target.closest('[data-v5like]');
    if (lk) {
      const [, id] = (prev.querySelector('[data-open]').dataset.open || '').split('|');
      const d = PD();
      d.ratings = d.ratings || {};
      d.genresById = d.genresById || {};
      if (d.ratings[id] === 1) delete d.ratings[id];
      else {
        d.ratings[id] = 1;
        const m = ITEMS.get(id);
        if (m && m.genres) d.genresById[id] = m.genres;
      }
      save();
      TW = null;
      lk.classList.toggle('on', d.ratings[id] === 1);
      toast(d.ratings[id] === 1 ? 'Vamos mostrar-te mais títulos assim' : 'Avaliação removida');
      return;
    }
    const lb = e.target.closest('[data-lib]');
    if (lb)
      setTimeout(() => {
        const on = inLib(lb.dataset.lib);
        lb.classList.toggle('on', on);
        lb.innerHTML = on ? I.check : I.plus;
      }, 50);
    if (e.target.closest('[data-open],[data-quickplay]')) setTimeout(hidePrev, 30);
  });

  /* =================== “% para ti” no detalhe =================== */
  hooks.on('detail:shown', m => {
    const meta = document.querySelector('#detail .dmeta');
    if (meta && !meta.querySelector('.vvmatch')) {
      const p = matchPct(m);
      if (p) meta.insertAdjacentHTML('afterbegin', `<span class="pill vvmatch">${p}% para ti</span>`);
    }
  });

  /* =================== continuar a ver com a cena =================== */
  const FK = 'vinovim.frames';
  const FR = (() => {
    try {
      return JSON.parse(localStorage.getItem(FK)) || {};
    } catch (e) {
      return {};
    }
  })();
  let frT = 0,
    frBad = false;
  function grabFrame() {
    if (
      frBad ||
      !P5('frames') ||
      !PC ||
      !PC.meta ||
      PC.stream._local ||
      PC.stream.ytId ||
      !V.videoWidth ||
      V.currentTime < 20
    )
      return;
    try {
      const c = document.createElement('canvas');
      c.width = 384;
      c.height = Math.round((384 * V.videoHeight) / V.videoWidth) || 216;
      c.getContext('2d').drawImage(V, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/jpeg', 0.62);
      if (url.length < 2000) return;
      FR[PC.meta.id] = { v: PC.videoId, img: url, at: Date.now() };
      const ks = Object.keys(FR).sort((a, b) => FR[b].at - FR[a].at);
      ks.slice(24).forEach(k => delete FR[k]);
      localStorage.setItem(FK, JSON.stringify(FR));
    } catch (e) {
      if (e && e.name === 'SecurityError') frBad = true;
    }
  }
  V.addEventListener('timeupdate', () => {
    if (Date.now() - frT > 15000 && !V.paused) {
      frT = Date.now();
      grabFrame();
    }
  });
  V.addEventListener('pause', grabFrame);
  V.addEventListener('loadstart', () => {
    frBad = false;
  });
  hooks.on('player:closing', () => {
    try {
      grabFrame();
    } catch (e) {}
    endOff();
  });
  // “Continuar a ver” mostra a última cena vista em vez da imagem do catálogo
  hooks.on('progress:image', (img, p) => {
    const f = FR[p.id];
    return f && f.v === p.videoId ? f.img : img;
  });

  /* =================== fim do filme com sugestões =================== */
  P.insertAdjacentHTML(
    'beforeend',
    `<div id="vvEnd"><h3>Mais títulos para ti</h3><p id="vvEndP">Porque viste este filme</p><div class="cards" id="vvEndC"></div><div class="inrow" style="margin:0"><button class="btn gho" id="vvEndBack">Ver os créditos</button><button class="btn gho" id="vvEndClose">Sair</button></div></div>`
  );
  let endOn = false,
    endFor = null,
    endSkip = null,
    endT = null,
    endPicks = [];
  function endOff() {
    endOn = false;
    clearInterval(endT);
    P.classList.remove('v5end');
  }
  async function similarTo(m, n) {
    const gs = (m.genres || []).slice(0, 2);
    if (!gs.length) return [];
    const seen = new Set([m.id, ...Object.keys(S.watched || {}), ...Object.keys((PD().stats || {}).titles || {})]);
    const lists = await Promise.all(
      gs.map(g => catalog(cinemeta(), m.type, 'imdbRating', { genre: g }).catch(() => []))
    );
    const out = new Map();
    lists.flat().forEach(x => {
      if (!seen.has(x.id) && !out.has(x.id)) out.set(x.id, x);
    });
    return [...out.values()]
      .map(x => Object.assign({ _s: (x.genres || []).filter(g => gs.includes(g)).length * 10 + (matchPct(x) || 0) }, x))
      .sort((a, b) => b._s - a._s)
      .slice(0, n);
  }
  async function startEnd() {
    if (endOn || !PC || !PC.meta || PC.video || !P5('endSuggest')) return;
    endOn = true;
    endFor = PC.videoId;
    let m = PC.meta;
    if (!m.genres) {
      try {
        m = await getMeta(m.type, m.id);
      } catch (e) {}
    }
    endPicks = await similarTo(m, 3);
    if (!endPicks.length || !endOn) {
      endOn = false;
      return;
    }
    $('#vvEndP').textContent = `Porque viste ${m.name}`;
    $('#vvEndC').innerHTML = endPicks
      .map(
        (x, i) =>
          `<button class="ec ${i === 0 ? 'first' : ''}" data-v5go="${i}"><div class="im" style="background-image:url('${esc(x.background || IMG.bg(x.id))}')"></div><div><b>${esc(x.name)}</b><small>${matchHTML(x)} ${esc(String(x.releaseInfo || '').slice(0, 4))}</small>${i === 0 ? '<div class="bar5"><i id="vvEndBar"></i></div>' : ''}</div></button>`
      )
      .join('');
    P.classList.add('v5end');
    let n = 15;
    const bar = $('#vvEndBar');
    bar.style.transition = 'none';
    bar.style.width = '0';
    requestAnimationFrame(() => {
      bar.style.transition = 'width 15s linear';
      bar.style.width = '100%';
    });
    endT = setInterval(() => {
      if (--n <= 0) {
        clearInterval(endT);
        goPick(0);
      }
    }, 1000);
  }
  function goPick(i) {
    const x = endPicks[i];
    if (!x) return;
    endOff();
    closePlayer();
    setTimeout(() => openDetail(x.type, x.id), 120);
  }
  $('#vvEndC').addEventListener('click', e => {
    const b = e.target.closest('[data-v5go]');
    if (b) {
      e.stopPropagation();
      goPick(+b.dataset.v5go);
    }
  });
  $('#vvEndBack').onclick = e => {
    e.stopPropagation();
    endSkip = endFor;
    endOff();
  };
  $('#vvEndClose').onclick = e => {
    e.stopPropagation();
    endOff();
    closePlayer();
  };
  $('#vvEnd').addEventListener('click', e => e.stopPropagation());
  V.addEventListener('timeupdate', () => {
    if (!PC || PC.video || !P.classList.contains('open')) return;
    const d = V.duration,
      t = V.currentTime;
    if (!d || !isFinite(d) || d < 1500) return;
    if (d - t <= 100 && !endOn && endSkip !== PC.videoId) startEnd();
    else if (d - t > 140 && endOn) endOff();
  });
  V.addEventListener('ended', () => {
    if (PC && !PC.video && !endOn && endSkip !== PC.videoId) startEnd();
  });
  hooks.on('play:start', () => {
    endOff();
    endSkip = null;
  });

  /* =================== filas do início =================== */
  const top10HTML = (title, list) =>
    `<section class="row t10row"><div class="rowh"><h2>${title}</h2><div class="tsp"></div><button class="arr" data-scroll="-1">${I.left}</button><button class="arr" data-scroll="1">${I.right}</button></div><div class="track">${list
      .slice(0, 10)
      .map((m, i) => {
        remember(m);
        return `<button class="t10" data-open="${esc(m.type)}|${esc(m.id)}" title="${esc(m.name)}"><span class="n">${i + 1}</span><div class="pimg"><img loading="lazy" src="${esc(m.poster || IMG.poster(m.id))}" alt="" onerror="window.vvPoster?vvPoster(this):this.parentNode.classList.add('noimg')"><span class="ptitle">${esc(m.name)}</span></div></button>`;
      })
      .join('')}</div></section>`;
  const seenSet = () => new Set([...Object.keys(S.watched || {}), ...Object.keys((PD().stats || {}).titles || {})]);
  async function becauseRows() {
    const seeds = [],
      used = new Set();
    Object.values(S.progress || {})
      .sort((a, b) => (b.updated || 0) - (a.updated || 0))
      .forEach(p => {
        if (!used.has(p.id)) {
          used.add(p.id);
          seeds.push({ id: p.id, type: p.type, name: p.name });
        }
      });
    Object.entries((PD().stats || {}).titles || {})
      .sort((a, b) => b[1].secs - a[1].secs)
      .forEach(([id, t]) => {
        if (!used.has(id)) {
          used.add(id);
          seeds.push({ id, type: t.type, name: t.name });
        }
      });
    const out = [];
    for (const s of seeds.slice(0, 2)) {
      let m;
      try {
        m = await getMeta(s.type, s.id);
      } catch (e) {
        continue;
      }
      const recs = (await similarTo(m, 24)).filter(x => !inLib(x.id) || true);
      if (recs.length >= 4) out.push(rowHTML(`Porque viste ${m.name}`, recs.map(card).join(''), 'escolhidos para ti'));
    }
    return out;
  }
  function momentRow() {
    const h = new Date().getHours(),
      wd = new Date().getDay();
    if (h >= 6 && h < 12) return ['Para começar bem o dia', ['Comedy', 'Animation', 'Family'], 'movie'];
    if (h >= 12 && h < 19)
      return wd === 0 || wd === 6
        ? ['Maratona de fim de semana', ['Drama', 'Crime', 'Sci-Fi'], 'series']
        : ['Uma tarde de aventura', ['Adventure', 'Action'], 'movie'];
    if (h >= 19) return ['Noite de cinema', ['Thriller', 'Drama', 'Crime'], 'movie'];
    return ['Para ver de madrugada', ['Horror', 'Mystery', 'Thriller'], 'movie'];
  }
  async function momentRows() {
    const cm = cinemeta(),
      seen = seenSet(),
      rows = [];
    const [title, gs, type] = momentRow();
    const pool = new Map();
    (await Promise.all(gs.map(g => catalog(cm, type, 'top', { genre: g }).catch(() => [])))).flat().forEach(x => {
      if (!seen.has(x.id)) pool.set(x.id, x);
    });
    const arr = [...pool.values()].sort((a, b) => (matchPct(b) || 0) - (matchPct(a) || 0)).slice(0, 24);
    if (arr.length >= 5) rows.push(rowHTML(title, arr.map(card).join(''), 'para este momento'));
    const cl = (
      await Promise.all(
        ['Drama', 'Crime', 'Comedy', 'Sci-Fi'].map(g =>
          catalog(cm, 'movie', 'imdbRating', { genre: g }).catch(() => [])
        )
      )
    )
      .flat()
      .filter(x => parseInt(x.releaseInfo, 10) < 1995 && !seen.has(x.id));
    const cm2 = new Map();
    cl.forEach(x => cm2.set(x.id, x));
    const classics = [...cm2.values()].slice(0, 24);
    if (classics.length >= 5)
      rows.push(rowHTML('Clássicos que nunca viste', classics.map(card).join(''), 'obras-primas antes de 1995'));
    return rows;
  }
  async function shortRow() {
    const seen = seenSet(),
      cand = new Map();
    (
      await Promise.all(
        ['Comedy', 'Animation', 'Horror', 'Family'].map(g =>
          catalog(cinemeta(), 'movie', 'top', { genre: g }).catch(() => [])
        )
      )
    )
      .flat()
      .forEach(x => {
        if (!seen.has(x.id)) cand.set(x.id, x);
      });
    const list = [...cand.values()].slice(0, 40),
      out = [];
    for (let i = 0; i < list.length && out.length < 18; i += 8) {
      const ms = await Promise.all(list.slice(i, i + 8).map(x => getMeta('movie', x.id).catch(() => null)));
      ms.forEach(m => {
        const r = m && parseInt(m.runtime, 10);
        if (r && r <= 95) out.push(Object.assign({}, m, { releaseInfo: r + ' min' }));
      });
    }
    return out.length >= 5 ? rowHTML('Filmes curtos para hoje', out.map(card).join(''), 'menos de hora e meia') : '';
  }
  hooks.on('view:home', async () => {
    const rows = $('#rows');
    if (!rows) return;
    const cm = cinemeta(),
      mark = Date.now();
    rows.dataset.v5 = mark;
    const alive = () => $('#rows') && $('#rows').dataset.v5 == mark;
    const after = (html, where) => {
      if (!alive() || !html) return;
      const rs = $('#rows');
      const ref = where(rs);
      if (ref) ref.insertAdjacentHTML('afterend', html);
      else rs.insertAdjacentHTML('beforeend', html);
    };
    const contRow = rs => [...rs.querySelectorAll('.row')].find(x => x.querySelector('.card.wide')) || null;
    Promise.all([catalog(cm, 'movie', 'top').catch(() => []), catalog(cm, 'series', 'top').catch(() => [])]).then(
      ([mv, sr]) => {
        if (!alive()) return;
        if (mv.length >= 10)
          after(top10HTML('Top 10 filmes hoje', mv), rs => contRow(rs) || rs.querySelector('.row:not(.vvwrapbanner)'));
        if (sr.length >= 10)
          setTimeout(
            () =>
              after(top10HTML('Top 10 séries hoje', sr), rs => {
                const b = [...rs.querySelectorAll('.row')].filter(x => !x.classList.contains('t10row'));
                return b[3] || b[b.length - 1];
              }),
            900
          );
      }
    );
    becauseRows()
      .then(list =>
        list.forEach((h, i) =>
          setTimeout(
            () => after(h, rs => rs.querySelector('.t10row') || contRow(rs) || rs.querySelector('.row')),
            300 + i * 200
          )
        )
      )
      .catch(() => {});
    momentRows()
      .then(list =>
        list.forEach((h, i) =>
          setTimeout(
            () =>
              after(h, rs => {
                const b = rs.querySelectorAll('.row');
                return b[Math.min(b.length - 1, 5 + i * 2)];
              }),
            1200 + i * 300
          )
        )
      )
      .catch(() => {});
    shortRow()
      .then(h =>
        setTimeout(
          () =>
            after(h, rs => {
              const b = rs.querySelectorAll('.row');
              return b[Math.min(b.length - 1, 7)];
            }),
          1600
        )
      )
      .catch(() => {});
  });

  /* =================== Novidades =================== */
  const DOW = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dayStart = d => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return +x;
  };
  function whenLabel(t) {
    const today = dayStart(Date.now()),
      d = dayStart(t),
      diff = Math.round((d - today) / 864e5);
    if (diff < -1) return 'Já disponível';
    if (diff === -1) return 'Chegou ontem';
    if (diff === 0) return 'Chega hoje';
    if (diff === 1) return 'Chega amanhã';
    if (diff < 7) return 'Chega ' + DOW[new Date(t).getDay()];
    return 'Chega a ' + new Date(t).getDate() + ' de ' + MON[new Date(t).getMonth()];
  }
  let NV = null;
  async function loadNovidades() {
    try {
      const c = JSON.parse(sessionStorage.getItem('vv_nov') || 'null');
      if (c && Date.now() - c.at < 6 * 3600e3) return c.items;
    } catch (e) {}
    const y = new Date().getFullYear(),
      cm = cinemeta(),
      now = Date.now(),
      from = now - 14 * 864e5,
      to = now + 75 * 864e5;
    const lists = await Promise.all([
      catalog(cm, 'movie', 'year', { genre: y }).catch(() => []),
      catalog(cm, 'movie', 'year', { genre: y + 1 }).catch(() => []),
      catalog(cm, 'series', 'year', { genre: y }).catch(() => []),
      catalog(cm, 'movie', 'top').catch(() => [])
    ]);
    const cand = new Map();
    lists.flat().forEach(x => {
      if (!cand.has(x.id)) cand.set(x.id, x);
    });
    const all = [...cand.values()].slice(0, 90),
      items = [];
    for (let i = 0; i < all.length; i += 10) {
      const ms = await Promise.all(all.slice(i, i + 10).map(x => getMeta(x.type, x.id).catch(() => null)));
      ms.forEach(m => {
        if (!m) return;
        let d = 0,
          ep = '';
        if (m.type === 'movie') d = Date.parse(m.released || '');
        else {
          const v = (m.videos || [])
            .filter(v => v.season > 0 && v.released && v.episode === 1)
            .map(v => ({ v, t: Date.parse(v.released) }))
            .filter(x => x.t >= from && x.t <= to)
            .sort((a, b) => a.t - b.t)[0];
          if (v) {
            d = v.t;
            ep = v.v.season > 1 ? `Temporada ${v.v.season}` : 'Nova série';
          }
        }
        if (d >= from && d <= to)
          items.push({
            id: m.id,
            type: m.type,
            name: m.name,
            desc: m.description || '',
            bg: m.background || IMG.bg(m.id),
            poster: m.poster,
            genres: m.genres || [],
            imdbRating: m.imdbRating,
            d,
            ep
          });
      });
    }
    items.sort((a, b) => a.d - b.d);
    try {
      sessionStorage.setItem('vv_nov', JSON.stringify({ at: Date.now(), items }));
    } catch (e) {}
    return items;
  }
  function nvItem(x) {
    const dt = new Date(x.d),
      fut = x.d > Date.now(),
      on = !!(PD().remind || {})[x.id];
    return `<div class="nvitem"><div class="nvdate"><small>${MON[dt.getMonth()]}</small><b>${dt.getDate()}</b></div>
    <div class="nvbody" data-open="${esc(x.type)}|${esc(x.id)}"><div class="im" style="background-image:url('${esc(x.bg)}')"></div><div>
    <div class="when">${whenLabel(x.d)}${x.ep ? ' · ' + esc(x.ep) : ''}</div><h4>${esc(x.name)}</h4><p>${esc(x.desc)}</p>
    <div class="inrow" style="margin:0">${matchHTML(x)}${fut ? `<button class="btn sm ${on ? 'acc' : 'gho'}" data-v5rem="${esc(x.id)}">${XI.bell}${on ? 'Vou ser avisado' : 'Avisa-me'}</button>` : `<button class="btn sm pri" data-quickplay="${esc(x.type)}|${esc(x.id)}">${I.play}Ver agora</button>`}</div></div></div></div>`;
  }
  defineView('novidades', async function () {
    app.className = '';
    app.innerHTML = `<div class="view">${topbar('Novidades')}<div class="pad" style="max-width:1100px"><p class="m" style="color:var(--mu);margin-top:0">Os filmes e séries que acabaram de chegar e os que estão para estrear.</p><div id="nvBody"><span class="spin"></span></div></div></div>`;
    NV = await loadNovidades().catch(() => []);
    if (!$('#nvBody')) return;
    const now = Date.now(),
      past = NV.filter(x => x.d <= now).reverse(),
      week = NV.filter(x => x.d > now && x.d <= now + 7 * 864e5),
      later = NV.filter(x => x.d > now + 7 * 864e5);
    $('#nvBody').innerHTML =
      (week.length
        ? `<div class="nvsec"><h3>🍿 Chega esta semana</h3><small>${week.length} títulos</small></div><div class="nvlist">${week.map(nvItem).join('')}</div>`
        : '') +
      (later.length
        ? `<div class="nvsec"><h3>📅 Em breve</h3><small>próximas semanas</small></div><div class="nvlist">${later.slice(0, 20).map(nvItem).join('')}</div>`
        : '') +
      (past.length
        ? `<div class="nvsec"><h3>✨ Acabou de chegar</h3><small>últimos 14 dias</small></div><div class="nvlist">${past.slice(0, 20).map(nvItem).join('')}</div>`
        : '') +
      (NV.length
        ? ''
        : emptyHTML(
            XI.spark,
            'Sem novidades por agora',
            'Volta mais tarde: o Vinovim procura estreias todos os dias.'
          ));
  });
  document.addEventListener(
    'click',
    e => {
      const b = e.target.closest('[data-v5rem]');
      if (!b) return;
      e.stopPropagation();
      e.preventDefault();
      const x = (NV || []).find(y => y.id === b.dataset.v5rem);
      if (!x) return;
      const d = PD();
      d.remind = d.remind || {};
      if (d.remind[x.id]) {
        delete d.remind[x.id];
        toast('Lembrete removido');
      } else {
        d.remind[x.id] = {
          id: x.id,
          type: x.type,
          name: x.name,
          poster: x.poster || IMG.poster(x.id),
          date: x.d,
          set: Date.now()
        };
        toast(`Avisamos-te quando “${x.name}” chegar`);
      }
      save();
      const on = !!d.remind[x.id];
      b.className = 'btn sm ' + (on ? 'acc' : 'gho');
      b.innerHTML = XI.bell + (on ? 'Vou ser avisado' : 'Avisa-me');
    },
    true
  );
  Object.assign(VIEW_TXT, { novidades: 'A ver as novidades' });
  function navAdd() {
    if (document.querySelector('.nv[data-v="novidades"]')) return;
    const s = document.querySelector('#nav .nv[data-v="search"]');
    if (s)
      s.insertAdjacentHTML('afterend', `<a class="nv" data-v="novidades" href="#novidades">${XI.spark}Novidades</a>`);
  }

  /* =================== definições =================== */
  hooks.on('view:settings', () => {
    const pad = document.querySelector('#app .pad');
    if (!pad || (curProfile() || {}).kids) return;
    const opts = [
      ['intro', 'Abertura animada', 'O logótipo animado ao abrir a app'],
      ['introSound', 'Som da abertura', 'O “ta-dum” do Vinovim'],
      ['heroTrailer', 'Trailer no destaque', 'O filme em destaque toca o trailer sem som'],
      ['previews', 'Pré-visualização nos cartões', 'Passa o rato por cima de um cartão para ver mais'],
      ['previewTrailer', 'Trailer na pré-visualização', 'Toca o trailer dentro do cartão aumentado'],
      ['matchPct', '“% para ti”', 'Quanto cada título combina contigo'],
      ['endSuggest', 'Sugestões no fim do filme', 'Nos créditos, mostra 3 filmes parecidos'],
      ['frames', 'Imagem da cena em “Continuar a ver”', 'Guarda a imagem do sítio onde paraste']
    ];
    const html = `<div class="panel"><h3>Experiência Vinovim</h3><p class="m">Os detalhes que fazem o Vinovim parecer cinema.</p>${opts.map(([k, l, s]) => `<div class="srow"><div class="tx"><b>${l}</b><small>${s}</small></div><button class="tg ${P5(k) ? 'on' : ''}" data-v5p="${k}"></button></div>`).join('')}</div>`;
    const ap = pad.querySelector('[data-acc]')?.closest('.panel');
    if (ap) ap.insertAdjacentHTML('afterend', html);
    else pad.insertAdjacentHTML('beforeend', html);
    pad.querySelectorAll('[data-v5p]').forEach(
      b =>
        (b.onclick = () => {
          const k = b.dataset.v5p;
          S.prefs[k] = !P5(k);
          save();
          b.classList.toggle('on', P5(k));
        })
    );
  });

  /* =================== arranque =================== */
  navAdd();
  window.addEventListener('hashchange', () => {
    navAdd();
    hidePrev();
  });
  hooks.on('boot', () => {
    navAdd();
  });
})();
