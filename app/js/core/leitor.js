/* ---------- leitor ---------- */
const P = $('#player'),
  V = $('#vid'),
  YT = $('#yt');
let PC = null,
  hls = null,
  idleT,
  saveT = 0,
  subs = [];
/* abre o leitor; as funcionalidades podem impedir (perfil infantil) ou reagir antes e depois */
function play(stream, ctx) {
  if (!hooks.allow('play:allow', stream, ctx)) return;
  hooks.emit('play:start', stream, ctx);
  startPlayback(stream, ctx);
  hooks.emit('play:started', stream, ctx);
}
function startPlayback(stream, ctx) {
  if (stream.externalUrl && !stream.url) {
    window.open(stream.externalUrl, '_blank', 'noopener');
    return;
  }
  closeDrawer();
  PC = { ...ctx, stream };
  P.classList.add('open');
  document.body.style.overflow = 'hidden';
  syncHist();
  $('#pErr').classList.remove('show');
  $('#pMenu').classList.remove('open');
  $('#nextUp').classList.remove('show');
  const m = ctx.meta,
    v = ctx.video;
  $('#pTitle').textContent = m ? m.name : ctx.title || 'Vídeo';
  $('#pSub').textContent = v
    ? `${epLabel(v)} · ${v.name || v.title || ''}`
    : (stream.title || stream.name || '').split('\n')[0];
  $('#pNext').classList.toggle('hidden', !nextVideo());
  teardown();
  if (stream.ytId) {
    V.style.display = 'none';
    $('#pBot').style.visibility = 'hidden';
    YT.style.display = 'block';
    if (location.protocol === 'file:' && !NATIVE) {
      window.open('https://www.youtube.com/watch?v=' + encodeURIComponent(stream.ytId), '_blank', 'noopener');
      closePlayer();
      return;
    }
    const org = /^https?:$/.test(location.protocol) ? '&origin=' + encodeURIComponent(location.origin) : '';
    YT.innerHTML = `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(stream.ytId)}?autoplay=1&rel=0&playsinline=1${org}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    $('#pMid').innerHTML =
      `<a class="btn sm gho" style="pointer-events:auto;position:absolute;right:28px;top:26px" href="https://www.youtube.com/watch?v=${encodeURIComponent(stream.ytId)}" target="_blank" rel="noopener">Abrir no YouTube</a>`;
    return;
  }
  V.style.display = '';
  YT.style.display = 'none';
  $('#pBot').style.visibility = '';
  $('#pMid').innerHTML = '<span class="spin"></span>';
  const url = stream.url;
  const prev = ctx.videoId && progressFor(ctx.videoId);
  const start = prev && prev.d && prev.t / prev.d < 0.95 ? prev.t : 0;
  V.volume = S.volume ?? 1;
  const go = () => {
    if (start) V.currentTime = start;
    V.play().catch(() => {});
  };
  if (/\.m3u8(\?|$)/i.test(url) && !V.canPlayType('application/vnd.apple.mpegurl')) {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js')
      .then(() => {
        if (!window.Hls || !Hls.isSupported()) return perr('Este browser não suporta HLS.');
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(V);
        hls.on(Hls.Events.MANIFEST_PARSED, go);
        hls.on(Hls.Events.ERROR, (_, d) => {
          if (d.fatal) perr('A fonte HLS falhou (' + d.details + ').');
        });
      })
      .catch(() => perr('Não foi possível carregar o suporte HLS.'));
  } else {
    if (!stream._local) V.crossOrigin = 'anonymous';
    else V.removeAttribute('crossorigin');
    V.src = url;
    V.addEventListener('loadedmetadata', go, { once: true });
  }
  loadAddonSubs();
  poke();
}
function teardown() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
  V.pause();
  V.removeAttribute('src');
  [...V.querySelectorAll('track')].forEach(t => t.remove());
  V.load();
  YT.innerHTML = '';
  subs = [];
}
function closePlayer() {
  hooks.emit('player:closing');
  saveProgress(true);
  teardown();
  P.classList.remove('open');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (!$('#detail').classList.contains('open')) document.body.style.overflow = '';
  PC = null;
  restorePresence();
  if ($('#detail').classList.contains('open') && D.meta) rerenderDetail();
  else if (location.hash.slice(1) === 'home' || !location.hash) route();
  hooks.emit('player:closed');
}
function perr(msg) {
  $('#pMid').innerHTML = '';
  $('#pErrMsg').textContent = msg;
  $('#pErr').classList.add('show');
}
const loadScript = src =>
  new Promise((ok, no) => {
    if ([...document.scripts].some(s => s.src === src)) return ok();
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = no;
    document.head.appendChild(s);
  });

V.addEventListener('error', () => {
  if (!PC || !V.getAttribute('src')) return;
  // tentar de novo sem CORS (perde legendas externas, mas o vídeo pode tocar)
  if (V.crossOrigin && !PC._retried) {
    PC._retried = true;
    const t = V.currentTime;
    V.removeAttribute('crossorigin');
    V.src = PC.stream.url;
    V.currentTime = t;
    V.play().catch(() => {});
    return;
  }
  perr(
    'O browser não conseguiu abrir esta fonte. Pode ser um formato não suportado (ex.: MKV com HEVC/AC3) ou um link expirado.'
  );
});
V.addEventListener('waiting', () => ($('#pMid').innerHTML = '<span class="spin"></span>'));
V.addEventListener('playing', () => {
  $('#pMid').innerHTML = '';
  syncPlay();
  presencePlay();
});
V.addEventListener('pause', () => {
  syncPlay();
  poke();
  saveProgress(true);
  presencePlay();
});
V.addEventListener('play', syncPlay);
V.addEventListener('timeupdate', () => {
  const d = V.duration || 0,
    t = V.currentTime;
  $('#pProg').style.width = (d ? (t / d) * 100 : 0) + '%';
  $('#pKnob').style.left = (d ? (t / d) * 100 : 0) + '%';
  $('#pTime').textContent = `${fmt(t)} / ${fmt(d)}`;
  if (V.buffered.length) $('#pBuf').style.width = (V.buffered.end(V.buffered.length - 1) / (d || 1)) * 100 + '%';
  if (Date.now() - saveT > 5000) saveProgress();
  const nx = nextVideo();
  $('#nextUp').classList.toggle('show', !!(nx && d && d - t < 40 && d > 120));
  if (nx) $('#nextName').textContent = `${epLabel(nx)} · ${nx.name || nx.title || ''}`;
});
V.addEventListener('ended', () => {
  saveProgress(true);
  if (nextVideo()) goNext();
});
V.addEventListener('volumechange', () => {
  $('#pMute').innerHTML = V.muted || !V.volume ? I.mute : I.vol;
  $('#pVol').value = V.muted ? 0 : V.volume;
  S.volume = V.volume;
  save();
});
function syncPlay() {
  $('#pPlay').innerHTML = V.paused ? I.play : I.pause;
}

function saveProgress(force) {
  saveT = Date.now();
  if (!PC || !PC.meta || PC.stream.ytId || !V.duration || !isFinite(V.duration)) return;
  const m = PC.meta,
    v = PC.video,
    t = V.currentTime,
    d = V.duration;
  if (t < 15 && !force) return;
  if (t / d > 0.92) {
    S.watched[PC.videoId] = true;
    const nx = nextVideo();
    if (nx)
      S.progress[m.id] = {
        id: m.id,
        type: m.type,
        name: m.name,
        poster: m.poster,
        background: m.background,
        videoId: nx.id,
        season: nx.season,
        ep: epLabel(nx),
        thumb: nx.thumbnail,
        t: 0,
        d: 1,
        updated: Date.now()
      };
    else delete S.progress[m.id];
  } else if (t > 15) {
    S.progress[m.id] = {
      id: m.id,
      type: m.type,
      name: m.name,
      poster: m.poster,
      background: m.background,
      videoId: PC.videoId,
      season: v ? v.season : null,
      ep: v ? epLabel(v) : '',
      thumb: v && v.thumbnail,
      t,
      d,
      updated: Date.now(),
      stream: PC.stream._local ? undefined : PC.stream
    };
  }
  save();
}
function nextVideo() {
  if (!PC || !PC.meta || !PC.video) return null;
  const vs = sortedVideos(PC.meta).filter(v => v.season !== 0),
    i = vs.findIndex(v => v.id === PC.video.id);
  return i >= 0 ? vs[i + 1] || null : null;
}
function goNext() {
  const nx = nextVideo();
  if (!nx) return;
  const m = PC.meta;
  closePlayer();
  openStreams(m, nx);
}

/* legendas */
async function loadAddonSubs() {
  if (!PC || !PC.meta) return renderMenu();
  const ctx = PC,
    list = ADDONS.filter(a => supports(a.m, 'subtitles', ctx.type, ctx.videoId));
  for (const a of list) {
    try {
      const d = await getJSON(`${a.base}/subtitles/${ctx.type}/${ctx.videoId}.json`);
      if (PC !== ctx) return;
      (d.subtitles || [])
        .slice(0, 40)
        .forEach(s => subs.push({ label: `${s.lang || '?'} · ${a.m.name}`, url: s.url, lang: s.lang }));
    } catch (e) {}
  }
  const codes = (SUBLANGS[S.prefs.subLang] || SUBLANGS.off)[1];
  const pick = codes.length ? subs.findIndex(s => codes.includes(String(s.lang || '').toLowerCase())) : -1;
  if (pick >= 0 && PC === ctx) return setSub(pick);
  renderMenu();
}
const toVtt = t =>
  t.trim().startsWith('WEBVTT')
    ? t
    : 'WEBVTT\n\n' + t.replace(/\r/g, '').replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
async function setSub(i) {
  if (PC) PC.subDelay = 0;
  [...V.querySelectorAll('track')].forEach(t => t.remove());
  subs.forEach(s => (s.on = false));
  if (i == null) return renderMenu();
  const s = subs[i];
  try {
    const txt = s.text || (await fetch(s.url).then(r => r.text()));
    s.text = txt;
    const tr = document.createElement('track');
    tr.kind = 'subtitles';
    tr.label = s.label;
    tr.srclang = s.lang || 'und';
    tr.default = true;
    tr.src = URL.createObjectURL(new Blob([toVtt(txt)], { type: 'text/vtt' }));
    V.appendChild(tr);
    tr.track.mode = 'showing';
    s.on = true;
  } catch (e) {
    toast('Não foi possível carregar essa legenda');
  }
  renderMenu();
}
function renderMenu() {
  const rate = V.playbackRate,
    pr = S.prefs,
    d = (PC && PC.subDelay) || 0;
  const row = (key, opts, cur) =>
    `<div class="prow">${opts.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-${key}="${v}">${l}</button>`).join('')}</div>`;
  $('#pMenu').innerHTML =
    `<h5>Legendas</h5><button class="${subs.some(s => s.on) ? '' : 'on'}" data-sub="">Desligadas</button>${subs.map((s, i) => `<button class="${s.on ? 'on' : ''}" data-sub="${i}">${esc(s.label)}</button>`).join('')}<button data-subfile>${I.folder.replace('<svg', '<svg width="16" height="16"')} Carregar ficheiro .srt/.vtt</button><small class="phint">Também podes arrastar o ficheiro para cima do vídeo.</small>
  <h5>Tamanho</h5>${row(
    'subsz',
    [
      ['s', 'P'],
      ['m', 'M'],
      ['l', 'G'],
      ['xl', 'XG']
    ],
    pr.subSize
  )}
  <h5>Cor</h5>${row(
    'subcol',
    [
      ['#ffffff', 'Branco'],
      ['#ffe14d', 'Amarelo'],
      ['#7ee8ff', 'Ciano']
    ],
    pr.subColor
  )}
  <h5>Fundo</h5>${row(
    'subbg',
    [
      ['none', 'Nenhum'],
      ['semi', 'Suave'],
      ['solid', 'Sólido']
    ],
    pr.subBg
  )}
  <h5>Sincronizar · ${d > 0 ? '+' : ''}${d.toFixed(1)} s</h5>${row(
    'subdelay',
    [
      ['-0.5', '−0,5 s'],
      ['0.5', '+0,5 s']
    ],
    ''
  )}
  <h5>Velocidade</h5>${[0.75, 1, 1.25, 1.5, 2].map(r => `<button class="${r === rate ? 'on' : ''}" data-rate="${r}">${r === 1 ? 'Normal' : r + '×'}</button>`).join('')}`;
  hooks.emit('player:menu', $('#pMenu'));
}
const SUBSZ = {
  s: 'clamp(14px,1.8vw,22px)',
  m: 'clamp(16px,2.4vw,28px)',
  l: 'clamp(20px,3vw,36px)',
  xl: 'clamp(24px,3.8vw,46px)'
};
const SUBBG = { none: 'transparent', semi: 'rgba(0,0,0,.55)', solid: '#000' };
const SUBOPTS = {
  subSize: [
    'Tamanho',
    [
      ['s', 'Pequeno'],
      ['m', 'Médio'],
      ['l', 'Grande'],
      ['xl', 'Muito grande']
    ]
  ],
  subColor: [
    'Cor',
    [
      ['#ffffff', 'Branco'],
      ['#ffe14d', 'Amarelo'],
      ['#7ee8ff', 'Ciano']
    ]
  ],
  subBg: [
    'Fundo',
    [
      ['none', 'Sem fundo'],
      ['semi', 'Fundo suave'],
      ['solid', 'Fundo sólido']
    ]
  ]
};
function applySubStyle() {
  const pr = S.prefs,
    sz = SUBSZ[pr.subSize] || SUBSZ.m,
    bg = SUBBG[pr.subBg] || SUBBG.semi,
    col = pr.subColor || '#fff',
    sh = pr.subBg === 'none' ? '0 0 4px #000,0 2px 3px #000,0 0 2px #000' : 'none';
  let el = document.getElementById('cueStyle');
  if (!el) {
    el = document.createElement('style');
    el.id = 'cueStyle';
    document.head.appendChild(el);
  }
  el.textContent = `#vid::cue{font-size:${sz};color:${col};background:${bg};text-shadow:${sh};font-family:var(--fb)}`;
  const pv = document.getElementById('subPrev');
  if (pv) Object.assign(pv.style, { fontSize: sz, color: col, background: bg, textShadow: sh });
}
function shiftSubs(d) {
  if (PC) PC.subDelay = Math.round(((PC.subDelay || 0) + d) * 10) / 10;
  const tr = [...V.textTracks].find(t => t.mode === 'showing');
  if (tr && tr.cues)
    [...tr.cues].forEach(c => {
      c.startTime = Math.max(0, c.startTime + d);
      c.endTime = Math.max(0, c.endTime + d);
    });
  renderMenu();
}
P.addEventListener('dragover', e => {
  e.preventDefault();
  P.classList.add('drop');
});
P.addEventListener('dragleave', e => {
  if (!P.contains(e.relatedTarget)) P.classList.remove('drop');
});
P.addEventListener('drop', async e => {
  e.preventDefault();
  e.stopPropagation();
  P.classList.remove('drop');
  const f = e.dataTransfer.files[0];
  if (!f) return;
  if (/\.(srt|vtt)$/i.test(f.name)) {
    subs.push({ label: f.name, text: await f.text() });
    setSub(subs.length - 1);
    toast('Legenda carregada');
  } else if (/^video\//.test(f.type) || /\.(mkv|mp4|webm|m4v|mov)$/i.test(f.name))
    play({ url: URL.createObjectURL(f), name: f.name, _local: true }, PC && PC.meta ? PC : { title: f.name });
  else toast('Esse ficheiro não é suportado');
});
document.addEventListener('dragover', e => {
  if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault();
});
document.addEventListener('drop', e => {
  if (P.classList.contains('open')) return;
  const f = e.dataTransfer && e.dataTransfer.files[0];
  if (!f) return;
  e.preventDefault();
  if (/^video\//.test(f.type) || /\.(mkv|mp4|webm|m4v|mov)$/i.test(f.name))
    play({ url: URL.createObjectURL(f), name: f.name, _local: true }, { title: f.name });
});

/* controlos */
$('#pBack').innerHTML = I.back;
$('#pPlay').innerHTML = I.play;
$('#pRew').innerHTML = I.rew;
$('#pFwd').innerHTML = I.fwd;
$('#pMute').innerHTML = I.vol;
$('#pCC').innerHTML = I.cc;
$('#pFs').innerHTML = I.fs;
$('#pNext').innerHTML = I.next;
document.querySelector('.dph .pb').innerHTML = I.x;
const togglePlay = () => (V.paused ? V.play().catch(() => {}) : V.pause());
const skip = s => {
  V.currentTime = Math.max(0, Math.min(V.duration || 0, V.currentTime + s));
  poke();
};
const toggleFs = () =>
  document.fullscreenElement ? document.exitFullscreen().catch(() => {}) : P.requestFullscreen?.().catch(() => {});
$('#pBack').onclick = () => uiBack();
$('#pPlay').onclick = togglePlay;
$('#pRew').onclick = () => skip(-10);
$('#pFwd').onclick = () => skip(10);
$('#pMute').onclick = () => (V.muted = !V.muted);
$('#pVol').oninput = e => {
  V.volume = +e.target.value;
  V.muted = false;
};
$('#pFs').onclick = toggleFs;
$('#pNext').onclick = goNext;
$('#nextGo').onclick = goNext;
$('#pCC').onclick = () => {
  renderMenu();
  $('#pMenu').classList.toggle('open');
};
$('#pErrBack').onclick = () => {
  const c = PC;
  closePlayer();
  if (c && c.meta) openStreams(c.meta, c.video);
};
$('#pErrOpen').onclick = () => {
  if (PC && PC.stream.url) window.open(PC.stream.url, '_blank', 'noopener');
};
V.onclick = () => {
  if ($('#pMenu').classList.contains('open')) return $('#pMenu').classList.remove('open');
  togglePlay();
};
V.ondblclick = toggleFs;
$('#pMenu').onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.subsz) {
    S.prefs.subSize = b.dataset.subsz;
    save();
    applySubStyle();
    renderMenu();
  } else if (b.dataset.subcol) {
    S.prefs.subColor = b.dataset.subcol;
    save();
    applySubStyle();
    renderMenu();
  } else if (b.dataset.subbg) {
    S.prefs.subBg = b.dataset.subbg;
    save();
    applySubStyle();
    renderMenu();
  } else if (b.dataset.subdelay) shiftSubs(+b.dataset.subdelay);
  else if (b.dataset.rate) {
    V.playbackRate = +b.dataset.rate;
    renderMenu();
  } else if ('sub' in b.dataset) setSub(b.dataset.sub === '' ? null : +b.dataset.sub);
  else if ('subfile' in b.dataset) $('#fileSub').click();
};
const seekEl = $('#pSeek');
const seekPct = e => {
  const r = seekEl.getBoundingClientRect();
  return Math.max(0, Math.min(1, ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width));
};
let dragging = false;
seekEl.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  dragging = true;
  seekEl.setPointerCapture(e.pointerId);
  V.currentTime = seekPct(e) * (V.duration || 0);
});
seekEl.addEventListener('pointermove', e => {
  const p = seekPct(e);
  $('#pTip').style.left = p * 100 + '%';
  $('#pTip').textContent = fmt(p * (V.duration || 0));
  // só muda o tempo enquanto o botão está mesmo carregado (passar o rato por cima nunca avança o vídeo)
  if (dragging && (e.buttons & 1 || e.pointerType === 'touch')) V.currentTime = p * (V.duration || 0);
  else dragging = false;
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev =>
  seekEl.addEventListener(ev, () => (dragging = false))
);
function poke() {
  P.classList.remove('idle');
  clearTimeout(idleT);
  idleT = setTimeout(() => {
    if (!V.paused && !$('#pMenu').classList.contains('open')) P.classList.add('idle');
  }, 3000);
}
P.addEventListener('mousemove', poke);
P.addEventListener('touchstart', poke, { passive: true });

$('#fileVideo').onchange = e => {
  const f = e.target.files[0];
  if (f)
    play(
      { url: URL.createObjectURL(f), name: f.name, _local: true },
      PC && PC.meta ? PC : drawer._ctx || { title: f.name }
    );
  e.target.value = '';
};
$('#fileSub').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  subs.push({ label: f.name, text: await f.text() });
  setSub(subs.length - 1);
  e.target.value = '';
};
$('#fileImport').onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    ['profiles', 'pdata', 'activeProfile', 'addons', 'prefs', 'cats', 'accent'].forEach(k => {
      if (d[k] !== undefined) S[k] = d[k];
    });
    if (!d.pdata)
      ['library', 'progress', 'watched'].forEach(k => {
        if (d[k]) S[k] = d[k];
      });
    save();
    toast('Cópia importada');
    setTimeout(() => location.reload(), 700);
  } catch (err) {
    toast('Ficheiro inválido');
  }
  e.target.value = '';
};
