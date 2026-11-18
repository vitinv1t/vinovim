/* Vinovim — temas e extras
   Capas que faltavam · Catálogo do perfil infantil · Transferências offline · Widget Android ·
   Comando no telemóvel · Pesquisa por voz · Temas · Mini-player · Conquistas ·
   Importar Trakt/Letterboxd · Gestor de addons */
(() => {
  'use strict';
  const PD = () => S.pdata[S.activeProfile];
  const LANG = S.prefs.lang || 'pt-PT';
  const LI = { 'pt-BR': 0, en: 1, es: 2 }[LANG];
  const TT = {
    Transferências: ['Downloads', 'Downloads', 'Descargas'],
    Conquistas: ['Conquistas', 'Achievements', 'Logros'],
    'Comando no telemóvel': ['Controle pelo celular', 'Phone remote', 'Control desde el móvil'],
    'Mini-player': ['Mini-player', 'Mini player', 'Minirreproductor'],
    'Importar de outros serviços': [
      'Importar de outros serviços',
      'Import from other services',
      'Importar de otros servicios'
    ],
    'Perfil infantil': ['Perfil infantil', 'Kids profile', 'Perfil infantil'],
    Tema: ['Tema', 'Theme', 'Tema'],
    'Transferir para ver offline': [
      'Baixar para ver offline',
      'Download to watch offline',
      'Descargar para ver sin conexión'
    ],
    'Gerir addons': ['Gerenciar addons', 'Manage add-ons', 'Gestionar complementos'],
    'Verificar estado': ['Verificar status', 'Check status', 'Comprobar estado']
  };
  const t = s => (LI === undefined ? s : (TT[s] || [])[LI] || s);
  const Cap = () => (window.Capacitor && window.Capacitor.Plugins) || {};
  const XI = {
    dl: sv('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    phone: sv('<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>'),
    mic: sv('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    mini: sv(
      '<rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor"/>'
    ),
    expand: sv('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    up: sv('<path d="m6 15 6-6 6 6"/>'),
    down: sv('<path d="m6 9 6 6 6-6"/>'),
    film: sv(
      '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'
    ),
    tv: sv('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m8 3 4 4 4-4"/>'),
    play: sv('<path d="m7 4 13 8-13 8z" fill="currentColor"/>'),
    pause: sv('<path d="M7 4h3v16H7zM14 4h3v16h-3z" fill="currentColor"/>'),
    kid: sv('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>')
  };

  const loadJS = src =>
    new Promise((ok, no) => {
      if ([...document.scripts].some(s => s.src === src)) return ok();
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = no;
      document.head.appendChild(s);
    });
  async function peerLib() {
    if (window.Peer) return;
    try {
      await loadJS('https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js');
    } catch (e) {
      await loadJS('https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js');
    }
  }

  /* =================== capas que faltavam =================== */
  const PCK = 'vinovim.posters';
  const POSTERS = (() => {
    try {
      return JSON.parse(localStorage.getItem(PCK)) || {};
    } catch (e) {
      return {};
    }
  })();
  let pcT;
  function savePosters() {
    clearTimeout(pcT);
    pcT = setTimeout(() => {
      try {
        const k = Object.keys(POSTERS);
        k.slice(0, Math.max(0, k.length - 1500)).forEach(x => delete POSTERS[x]);
        localStorage.setItem(PCK, JSON.stringify(POSTERS));
      } catch (e) {}
    }, 1500);
  }
  const hueOf = s => {
    let h = 2166136261;
    for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return ((h >>> 0) % 36) * 10;
  };
  function artCard(pimg, type, name, year) {
    const h = hueOf(name);
    pimg.classList.add('noimg', 'vvart');
    pimg.style.background = `linear-gradient(160deg,hsl(${h} 50% 34%),hsl(${(h + 50) % 360} 55% 13%))`;
    if (!pimg.querySelector('.vvico'))
      pimg.insertAdjacentHTML(
        'afterbegin',
        `<span class="vvico">${type === 'series' ? XI.tv : XI.film}</span>${year ? `<span class="vvyr">${esc(year)}</span>` : ''}`
      );
  }
  const metaTries = new Map();
  window.vvPoster = function (img) {
    const pimg = img.parentNode,
      card = img.closest('[data-open]');
    const [type, id] = ((card && card.dataset.open) || '|').split('|');
    const name = (pimg.querySelector('.ptitle') || {}).textContent || '';
    const year = ((card && card.querySelector('.cinfo small')) || {}).textContent || '';
    const tried = new Set((img.dataset.tried || '').split('\n').filter(Boolean));
    tried.add(img.src);
    img.dataset.tried = [...tried].join('\n');
    const give = () => {
      POSTERS[id] = '-';
      savePosters();
      artCard(pimg, type, name, (year.match(/\d{4}/) || [''])[0]);
    };
    const tryUrl = u => {
      if (!u || tried.has(u)) return false;
      img.onload = () => {
        if (img.naturalWidth > 40) {
          img.classList.add('vvok');
          POSTERS[id] = u;
          savePosters();
        } else window.vvPoster(img);
      };
      img.src = u;
      return true;
    };
    if (POSTERS[id] === '-') return give();
    const cands = [POSTERS[id]];
    if (/^tt\d+$/.test(id))
      cands.push(
        `https://images.metahub.space/poster/medium/${id}/img`,
        `https://images.metahub.space/poster/small/${id}/img`,
        `https://live.metahub.space/poster/medium/${id}/img`
      );
    for (const u of cands) if (tryUrl(u)) return;
    if (img.dataset.meta) return give();
    img.dataset.meta = '1';
    let job = metaTries.get(id);
    if (!job) {
      job = Promise.race([
        getMeta(type || 'movie', id).catch(() => null),
        new Promise(r => setTimeout(() => r(null), 6000))
      ]);
      metaTries.set(id, job);
    }
    job.then(m => {
      if (
        m &&
        (tryUrl(m.poster) ||
          tryUrl(m.background) ||
          tryUrl(m.logo && /^tt/.test(id) ? `https://images.metahub.space/background/medium/${id}/img` : null))
      )
        return;
      give();
    });
  };
  /* capas guardadas aparecem logo à primeira */
  hooks.on('card', it =>
    it && POSTERS[it.id] && POSTERS[it.id] !== '-' && !it.poster ? { ...it, poster: POSTERS[it.id] } : it
  );

  /* =================== perfil infantil (o PIN e o editor estão em core/perfis.js) =================== */
  const KID_OK = ['Animation', 'Family'],
    MATURE = ['Horror', 'Thriller', 'Crime', 'War'];
  const kidOk = m => {
    const g = (m && (m.genres || m.genre)) || [];
    if (!g.length) return null;
    if (g.some(x => MATURE.includes(x))) return false;
    return g.some(x => KID_OK.includes(x));
  };
  // no perfil infantil os catálogos só mostram animação e filmes para a família
  hooks.on('catalog:extra', (extra, a) => {
    if (!isKids()) return extra;
    extra = { ...extra };
    if (a && a.url === CINEMETA && !extra.search && (!extra.genre || !KID_OK.includes(extra.genre)))
      extra.genre = extra.genre && !MATURE.includes(extra.genre) ? extra.genre : 'Animation';
    return extra;
  });
  hooks.on('catalog:items', (items, extra) => {
    if (!isKids()) return items;
    const familyGenre = KID_OK.includes((extra || {}).genre);
    return items.filter(m => {
      const k = kidOk(m);
      return k === true || (k === null && familyGenre);
    });
  });
  hooks.on('play:allow', (stream, ctx) => {
    if (isKids() && ctx && ctx.meta && kidOk(ctx.meta) === false) {
      toast('Isto não está disponível no perfil infantil');
      return false;
    }
  });
  hooks.on('play:start', () => P.classList.remove('mini'));
  hooks.on('play:started', () => setTimeout(addMiniBtn, 0));
  /* =================== transferências offline =================== */
  const DLK = 'vinovim.dl';
  const DLS = (() => {
    try {
      return JSON.parse(localStorage.getItem(DLK)) || [];
    } catch (e) {
      return [];
    }
  })();
  const saveDL = () => {
    try {
      localStorage.setItem(DLK, JSON.stringify(DLS));
    } catch (e) {}
  };
  const ACTIVE = new Map();
  const idb = () =>
    new Promise((ok, no) => {
      const r = indexedDB.open('vinovim-dl', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('parts');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
    });
  async function idbDo(mode, fn) {
    const db = await idb();
    return new Promise((ok, no) => {
      const tx = db.transaction('parts', mode);
      const st = tx.objectStore('parts');
      let res;
      const r = fn(st);
      if (r) r.onsuccess = () => (res = r.result);
      tx.oncomplete = () => ok(res);
      tx.onerror = () => no(tx.error);
      tx.onabort = () => no(tx.error);
    });
  }
  const PART = 16 * 1024 * 1024;
  const fmtMB = b => (b > 1e9 ? (b / 1e9).toFixed(2).replace('.', ',') + ' GB' : Math.round(b / 1e6) + ' MB');
  async function startDownload() {
    if (!PC || !PC.stream) return;
    const st = PC.stream,
      url = st.url;
    if (!url || st._local || st.ytId) return toast('Esta fonte não pode ser transferida');
    if (/\.m3u8(\?|$)/i.test(url)) return toast('Fontes HLS (.m3u8) não podem ser transferidas');
    const m = PC.meta || {},
      v = PC.video;
    const id = 'd' + Date.now().toString(36);
    const item = {
      id,
      metaId: m.id,
      type: m.type,
      name: m.name || PC.title || 'Vídeo',
      poster: m.poster || (m.id ? IMG.poster(m.id) : ''),
      videoId: PC.videoId,
      ep: v ? epLabel(v) + (v.name || v.title ? ' · ' + (v.name || v.title) : '') : '',
      size: 0,
      parts: 0,
      mime: 'video/mp4',
      done: false,
      added: Date.now()
    };
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const ac = new AbortController();
    const job = { item, got: 0, total: 0, ac, err: '' };
    ACTIVE.set(id, job);
    DLS.unshift(item);
    saveDL();
    toast('A transferir… vê o progresso em Transferências');
    refreshDLView();
    try {
      const r = await fetch(url, { signal: ac.signal });
      if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
      job.total = +r.headers.get('content-length') || 0;
      item.mime = (r.headers.get('content-type') || 'video/mp4').split(';')[0];
      const rd = r.body.getReader();
      let buf = [],
        bl = 0,
        last = 0;
      const flush = async () => {
        if (!bl) return;
        const blob = new Blob(buf, { type: item.mime });
        const n = item.parts++;
        await idbDo('readwrite', s => s.put(blob, id + ':' + n));
        buf = [];
        bl = 0;
      };
      for (;;) {
        const { done, value } = await rd.read();
        if (done) break;
        buf.push(value);
        bl += value.length;
        job.got += value.length;
        if (bl >= PART) await flush();
        if (Date.now() - last > 500) {
          last = Date.now();
          refreshDLView();
        }
      }
      await flush();
      item.size = job.got;
      item.done = true;
      saveDL();
      ACTIVE.delete(id);
      refreshDLView();
      toast('Transferência concluída: ' + item.name);
    } catch (e) {
      ACTIVE.delete(id);
      await removeDL(id, true);
      toast(
        e.name === 'AbortError'
          ? 'Transferência cancelada'
          : 'Esta fonte não permite transferências (' + (e.message || 'erro') + ')'
      );
    }
  }
  async function removeDL(id, quiet) {
    const it = DLS.find(x => x.id === id);
    const j = ACTIVE.get(id);
    if (j) j.ac.abort();
    if (it) {
      for (let n = 0; n < (it.parts || 0) + 1; n++) {
        try {
          await idbDo('readwrite', s => s.delete(id + ':' + n));
        } catch (e) {}
      }
    }
    const i = DLS.findIndex(x => x.id === id);
    if (i >= 0) DLS.splice(i, 1);
    saveDL();
    refreshDLView();
    if (!quiet) toast('Transferência apagada');
  }
  async function playDL(id) {
    const it = DLS.find(x => x.id === id);
    if (!it || !it.done) return;
    const parts = [];
    for (let n = 0; n < it.parts; n++) parts.push(await idbDo('readonly', s => s.get(id + ':' + n)));
    if (parts.some(x => !x)) return toast('Esta transferência está incompleta. Apaga-a e transfere outra vez.');
    const url = URL.createObjectURL(new Blob(parts, { type: it.mime }));
    const meta = it.metaId
      ? Object.assign(
          { id: it.metaId, type: it.type, name: it.name, poster: it.poster, videos: [] },
          ITEMS.get(it.metaId) || {}
        )
      : null;
    if (meta && !Array.isArray(meta.videos)) meta.videos = [];
    const video = meta && (meta.videos || []).find(v => v.id === it.videoId);
    play(
      { url, name: 'Offline', title: 'Offline', _local: true },
      { meta, video, videoId: it.videoId, title: it.name }
    );
  }
  function dlRow(it) {
    const j = ACTIVE.get(it.id),
      pct = j && j.total ? Math.round((j.got / j.total) * 100) : null;
    return `<div class="vvdl"><img src="${esc(it.poster || '')}" alt="" onerror="this.style.visibility='hidden'"><div class="tx"><b>${esc(it.name)}</b><small>${esc(it.ep || (it.type === 'series' ? 'Série' : 'Filme'))} · ${it.done ? fmtMB(it.size) : j ? fmtMB(j.got) + (j.total ? ' de ' + fmtMB(j.total) : '') : 'Interrompida'}</small>
    ${j ? `<div class="vvbar"><i style="width:${pct == null ? 30 : pct}%"></i></div>` : ''}</div>
    ${it.done ? `<button class="btn sm pri" data-dlplay="${it.id}">${I.play || ''}Ver</button>` : ''}<button class="btn ico gho" data-dldel="${it.id}" title="${j ? 'Cancelar' : 'Apagar'}">${I.trash}</button></div>`;
  }
  function refreshDLView() {
    const el = $('#vvDlList');
    if (el)
      el.innerHTML = DLS.length
        ? DLS.map(dlRow).join('')
        : emptyHTML(
            XI.dl,
            'Ainda não transferiste nada',
            'Abre um filme ou episódio, carrega no botão de definições do leitor e escolhe “Transferir para ver offline”.'
          );
  }
  defineView('downloads', function () {
    app.className = '';
    app.innerHTML = `<div class="view">${topbar(t('Transferências'))}<div class="pad" style="max-width:900px"><p class="m" style="color:var(--mu);margin-top:0">Os vídeos transferidos ficam guardados neste dispositivo e podes vê-los sem internet. Só funcionam fontes com link direto (MP4/MKV/WebM) que permitam transferências.</p><div id="vvDlUsage" class="m" style="color:var(--mu);font-size:13px;margin-bottom:14px"></div><div id="vvDlList"></div></div></div>`;
    refreshDLView();
    if (navigator.storage && navigator.storage.estimate)
      navigator.storage
        .estimate()
        .then(e => {
          const u = $('#vvDlUsage');
          if (u) u.textContent = `Espaço usado: ${fmtMB(e.usage || 0)} de ${fmtMB(e.quota || 0)} disponíveis`;
        })
        .catch(() => {});
  });
  document.addEventListener('click', e => {
    const p = e.target.closest('[data-dlplay]');
    if (p) return playDL(p.dataset.dlplay);
    const d = e.target.closest('[data-dldel]');
    if (d) return removeDL(d.dataset.dldel);
  });
  hooks.on(
    'offline',
    html =>
      html +
      (DLS.some(x => x.done)
        ? `<div style="text-align:center;margin-top:-10px"><a class="btn gho" href="#downloads">${XI.dl}Ver as minhas transferências</a></div>`
        : '')
  );

  /* =================== widget Android =================== */
  function widgetPush() {
    const pr = Cap().Preferences;
    if (!pr) return;
    const p = Object.values(S.progress || {}).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    const val = p
      ? {
          title: p.name || 'Vinovim',
          sub: (p.ep ? p.ep + ' · ' : '') + (p.d > 1 ? Math.round((p.t / p.d) * 100) + '% visto' : 'Próximo episódio'),
          id: p.id,
          type: p.type
        }
      : { title: 'Abre o Vinovim', sub: 'Nada a meio por agora' };
    pr.set({ key: 'vv_widget', value: JSON.stringify(val) }).catch(() => {});
  }
  let widgetTimer;
  hooks.on('save', () => {
    clearTimeout(widgetTimer);
    widgetTimer = setTimeout(widgetPush, 1500);
  });
  function handleLaunch(url) {
    if (!url || !/continue/.test(url)) return;
    const p = Object.values(S.progress || {}).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
    if (p) setTimeout(() => openDetail(p.type, p.id), 600);
  }
  try {
    const A = Cap().App;
    if (A) {
      A.addListener('appUrlOpen', d => handleLaunch(d && d.url));
      A.getLaunchUrl()
        .then(r => handleLaunch(r && r.url))
        .catch(() => {});
    }
  } catch (e) {}

  /* =================== comando no telemóvel =================== */
  const remote = { peer: null, conns: [], code: '' };
  const SITE = 'https://vinovim.vercel.app';
  async function startRemoteHost() {
    if (remote.peer && !remote.peer.destroyed) return showRemoteCode();
    try {
      await peerLib();
    } catch (e) {
      return toast('Sem ligação ao serviço do comando');
    }
    remote.code = Math.random().toString(36).slice(2, 7).toUpperCase();
    const peer = new Peer('vinovim-r-' + remote.code);
    remote.peer = peer;
    peer.on('open', showRemoteCode);
    peer.on('error', err => {
      toast('Comando: ' + (err.type || 'erro'));
    });
    peer.on('connection', conn => {
      remote.conns.push(conn);
      conn.on('open', () => {
        toast('Telemóvel ligado como comando');
        closeModal();
        sendRState();
      });
      conn.on('data', handleRCmd);
      conn.on('close', () => {
        remote.conns = remote.conns.filter(c => c !== conn);
      });
    });
  }
  async function showRemoteCode() {
    const link = SITE + '/?web#comando=' + remote.code;
    openModal(
      `<h3 style="text-align:center">${t('Comando no telemóvel')}</h3><p class="m" style="text-align:center">Aponta a câmara do telemóvel ao código ou abre <b>vinovim.vercel.app</b> e escolhe “Usar como comando”.</p>
    <div class="vvqr" id="vvQr"></div><div class="vvcode">${remote.code}</div>
    <div class="inrow" style="justify-content:center"><button class="btn gho" data-close-modal>Fechar</button><button class="btn gho" id="vvRStop">Desligar comando</button></div>`,
      m => {
        m.querySelector('#vvRStop').onclick = () => {
          try {
            remote.peer.destroy();
          } catch (e) {}
          remote.peer = null;
          remote.conns = [];
          closeModal();
          toast('Comando desligado');
        };
      }
    );
    try {
      await loadJS('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
      new QRCode($('#vvQr'), { text: link, width: 190, height: 190, correctLevel: QRCode.CorrectLevel.M });
    } catch (e) {
      const q = $('#vvQr');
      if (q) q.outerHTML = `<p class="m" style="text-align:center;word-break:break-all">${esc(link)}</p>`;
    }
  }
  function sendRState() {
    if (!remote.conns.length) return;
    const open = P.classList.contains('open') || P.classList.contains('mini');
    const msg = {
      type: 'state',
      open,
      title: open ? $('#pTitle').textContent : 'Vinovim',
      sub: open ? $('#pSub').textContent : 'Escolhe algo para ver',
      t: V.currentTime || 0,
      d: isFinite(V.duration) ? V.duration : 0,
      playing: open && !V.paused,
      vol: V.volume
    };
    remote.conns.forEach(c => {
      try {
        c.open && c.send(msg);
      } catch (e) {}
    });
  }
  setInterval(sendRState, 1000);
  function handleRCmd(c) {
    if (!c || !c.cmd) return;
    const open = P.classList.contains('open') || P.classList.contains('mini');
    const tvKey = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    switch (c.cmd) {
      case 'toggle':
        if (open) togglePlay();
        break;
      case 'seek':
        if (open) skip(+c.v || 0);
        break;
      case 'vol':
        V.volume = Math.max(0, Math.min(1, V.volume + (+c.v || 0)));
        V.muted = false;
        break;
      case 'mute':
        V.muted = !V.muted;
        break;
      case 'next':
        if (open) goNext();
        break;
      case 'back':
        uiBack();
        break;
      case 'search':
        VIEWS._pendingQ = String(c.v || '').slice(0, 80);
        if (location.hash === '#search') route();
        else location.hash = 'search';
        break;
      case 'home':
        location.hash = 'home';
        break;
      case 'nav':
        if (open && (c.v === 'left' || c.v === 'right')) skip(c.v === 'left' ? -10 : 10);
        else {
          const k = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[c.v];
          if (k) {
            if (!document.documentElement.classList.contains('tv')) {
              const f = document.activeElement;
              if (!f || f === document.body)
                (document.querySelector('#app .card, #app a, #app button') || {}).focus?.();
            }
            typeof moveFocus === 'function' ? moveFocus(c.v) : tvKey(k);
          }
        }
        break;
      case 'ok':
        if (open) togglePlay();
        else {
          const a = document.activeElement;
          if (a && a !== document.body) a.click();
        }
        break;
    }
    setTimeout(sendRState, 150);
  }
  /* lado do telemóvel */
  async function remoteClient(code) {
    code = String(code || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (code && remote.curCode === code && $('#vvRemote')) return;
    remote.curCode = code;
    let el = $('#vvRemote');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vvRemote';
      document.body.appendChild(el);
    }
    document.body.style.overflow = 'hidden';
    if (!code) {
      el.innerHTML = `<div class="rbox" style="margin-top:12vh"><div style="text-align:center">${LOGO.replace('<svg', '<svg width="64" height="64"')}<h2 style="font-family:var(--fd)">${t('Comando no telemóvel')}</h2><p style="color:var(--mu)">No PC ou na TV abre Definições → Comando no telemóvel e escreve aqui o código.</p></div>
      <input class="inp" id="vvRc" placeholder="CÓDIGO" maxlength="5" style="text-align:center;font-size:28px;letter-spacing:6px;text-transform:uppercase;height:64px"><button class="big" id="vvRgo">Ligar</button><button id="vvRx">Voltar ao Vinovim</button></div>`;
      el.querySelector('#vvRgo').onclick = () => {
        location.hash = 'comando=' + el.querySelector('#vvRc').value.trim().toUpperCase();
      };
      el.querySelector('#vvRx').onclick = exitRemote;
      return;
    }
    el.innerHTML = `<div class="rbox"><div class="now"><small id="rs">A ligar a ${esc(code)}…</small><b id="rt">Vinovim</b><small id="rsub"></small><div class="vvbar"><i id="rp" style="width:0"></i></div><small id="rtime" style="display:block;margin-top:6px"></small></div>
    <div class="rrow"><button data-c="seek" data-v="-30">−30 s</button><button class="big" data-c="toggle" id="rpp">${XI.play}</button><button data-c="seek" data-v="30">+30 s</button></div>
    <div class="pad3"><span></span><button data-c="nav" data-v="up">${XI.up}</button><span></span><button data-c="nav" data-v="left">${XI.up.replace('m6 15 6-6 6 6', 'm15 6-6 6 6 6')}</button><button data-c="ok">OK</button><button data-c="nav" data-v="right">${XI.up.replace('m6 15 6-6 6 6', 'm9 6 6 6-6 6')}</button><span></span><button data-c="nav" data-v="down">${XI.down}</button><span></span></div>
    <div class="rrow"><button data-c="vol" data-v="-0.1">Vol −</button><button data-c="mute">Som</button><button data-c="vol" data-v="0.1">Vol +</button></div>
    <div class="rrow"><button data-c="back">Voltar</button><button data-c="home">Início</button><button data-c="next">Próximo</button></div>
    <form id="rsf" style="display:flex;gap:8px"><input class="inp" id="rq" placeholder="Pesquisar no ecrã grande…" style="flex:1"><button style="width:62px">${I.search}</button></form>
    <p class="st"><button id="vvRx" style="height:44px;width:100%">Sair do modo comando</button></p></div>`;
    el.querySelector('#vvRx').onclick = exitRemote;
    try {
      await peerLib();
    } catch (e) {
      el.querySelector('#rs').textContent = 'Sem ligação à internet';
      return;
    }
    const peer = new Peer();
    let conn = null;
    const sendC = (cmd, v) => {
      if (conn && conn.open) conn.send({ cmd, v });
      if (navigator.vibrate) navigator.vibrate(15);
    };
    peer.on('open', () => {
      conn = peer.connect('vinovim-r-' + code, { reliable: true });
      conn.on('open', () => {
        el.querySelector('#rs').textContent = 'Ligado';
      });
      conn.on('data', s => {
        if (!s || s.type !== 'state') return;
        el.querySelector('#rt').textContent = s.title || 'Vinovim';
        el.querySelector('#rsub').textContent = s.sub || '';
        el.querySelector('#rp').style.width = (s.d ? (s.t / s.d) * 100 : 0) + '%';
        el.querySelector('#rtime').textContent = s.d ? fmt(s.t) + ' / ' + fmt(s.d) : '';
        el.querySelector('#rpp').innerHTML = s.playing ? XI.pause : XI.play;
      });
      conn.on('close', () => {
        el.querySelector('#rs').textContent = 'Ligação terminada';
      });
    });
    peer.on('error', err => {
      el.querySelector('#rs').textContent =
        err.type === 'peer-unavailable' ? 'Código não encontrado. Confirma no PC/TV.' : 'Erro: ' + err.type;
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-c]');
      if (b) sendC(b.dataset.c, b.dataset.v);
    });
    el.querySelector('#rsf').onsubmit = e => {
      e.preventDefault();
      const q = el.querySelector('#rq').value.trim();
      if (q) {
        sendC('search', q);
        el.querySelector('#rq').value = '';
        el.querySelector('#rq').blur();
      }
    };
    remote.client = peer;
  }
  function exitRemote() {
    remote.curCode = null;
    try {
      remote.client && remote.client.destroy();
    } catch (e) {}
    const el = $('#vvRemote');
    if (el) el.remove();
    document.body.style.overflow = '';
    location.hash = 'home';
  }

  /* =================== pesquisa por voz =================== */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceOK = () => !!Cap().SpeechRecognition || (!!SR && !window.vinovimNative);
  const speechLang = () => ({ 'pt-PT': 'pt-PT', 'pt-BR': 'pt-BR', en: 'en-US', es: 'es-ES' })[LANG] || 'pt-PT';
  async function listen() {
    const plug = Cap().SpeechRecognition;
    if (plug) {
      const a = await plug.available().catch(() => ({ available: false }));
      if (a && a.available) {
        try {
          await plug.requestPermissions();
        } catch (e) {}
        const r = await plug.start({
          language: speechLang(),
          maxResults: 1,
          prompt: 'Diz o que queres ver',
          partialResults: false,
          popup: true
        });
        return ((r && r.matches) || [])[0] || '';
      }
    }
    if (!SR) throw new Error('indisponível');
    return new Promise((ok, no) => {
      const r = new SR();
      r.lang = speechLang();
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onresult = e => ok(e.results[0][0].transcript);
      r.onerror = e => no(new Error(e.error));
      r.onend = () => ok('');
      r.start();
    });
  }
  hooks.on('view:search', () => {
    const box = document.querySelector('#app .sbox');
    if (!box || !voiceOK() || box.querySelector('.vvmic')) return;
    box.classList.add('vvhasmic');
    box.insertAdjacentHTML(
      'beforeend',
      `<button class="vvmic" id="vvMic" title="Pesquisar por voz" aria-label="Pesquisar por voz">${XI.mic}</button>`
    );
    $('#vvMic').onclick = async function () {
      if (this.classList.contains('on')) return;
      this.classList.add('on');
      toast('A ouvir… diz o nome de um filme ou série');
      try {
        const txt = (await listen()).trim();
        if (txt) {
          const q = $('#q');
          if (q) {
            q.value = txt;
            $('#qclr')?.classList.add('show');
            addHistory(txt);
            doSearch(txt);
          }
        } else toast('Não percebi. Tenta outra vez.');
      } catch (e) {
        toast(
          /not-allowed|denied/i.test(e.message)
            ? 'Dá permissão ao microfone para pesquisar por voz'
            : 'A pesquisa por voz não está disponível aqui'
        );
      }
      this.classList.remove('on');
    };
  });

  /* =================== temas =================== */
  const THEMES = [
    ['dark', 'Escuro (Vinovim)'],
    ['amoled', 'Preto AMOLED'],
    ['midnight', 'Azul meia-noite'],
    ['forest', 'Floresta'],
    ['wine', 'Vinho'],
    ['slate', 'Grafite']
  ];
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const f = c =>
      Math.round(Math.min(255, c + (255 - c) * k))
        .toString(16)
        .padStart(2, '0');
    return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
  };
  hooks.on('theme', () => {
    const h = document.documentElement,
      th = S.prefs.amoled ? 'amoled' : S.prefs.theme || 'dark';
    THEMES.forEach(([k]) => h.classList.toggle('th-' + k, th === k && k !== 'dark' && k !== 'amoled'));
    h.classList.toggle('ui-l', S.prefs.uiScale === 'l');
    h.classList.toggle('ui-s', S.prefs.uiScale === 's');
    if (/^#[0-9a-f]{6}$/i.test(S.prefs.customAc || '')) {
      h.style.setProperty('--ac', S.prefs.customAc);
      h.style.setProperty('--ac2', shade(S.prefs.customAc, 0.45));
      h.style.setProperty('--acs', S.prefs.customAc + '29');
    }
    const mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.content = getComputedStyle(h).getPropertyValue('--bg').trim() || '#09080d';
  });

  /* =================== mini-player e imagem na imagem =================== */
  P.insertAdjacentHTML(
    'beforeend',
    `<div id="vvMiniBar"><span class="mt" id="vvMiniT"></span><button id="vvMiniPlay" title="Reproduzir/pausar"></button><button id="vvMiniBig" title="Expandir">${XI.expand}</button><button id="vvMiniX" title="Fechar">${I.x}</button></div>`
  );
  function enterMini() {
    if (!P.classList.contains('open') || (PC && PC.stream && PC.stream.ytId))
      return toast('O mini-player só funciona com vídeos normais');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    $('#pMenu').classList.remove('open');
    P.classList.remove('open');
    P.classList.add('mini');
    if (!$('#detail').classList.contains('open')) document.body.style.overflow = '';
    $('#vvMiniT').textContent = $('#pTitle').textContent;
    syncMini();
    if (history.state && history.state.ov) {
      try {
        history.replaceState({ ov: openCount() }, '');
      } catch (e) {}
    }
  }
  function exitMini() {
    if (!P.classList.contains('mini')) return;
    P.classList.remove('mini');
    P.classList.add('open');
    document.body.style.overflow = 'hidden';
    syncHist();
    poke();
  }
  function syncMini() {
    const b = $('#vvMiniPlay');
    if (b) b.innerHTML = V.paused ? XI.play : XI.pause;
  }
  V.addEventListener('play', syncMini);
  V.addEventListener('pause', syncMini);
  $('#vvMiniPlay').onclick = e => {
    e.stopPropagation();
    togglePlay();
  };
  $('#vvMiniBig').onclick = e => {
    e.stopPropagation();
    exitMini();
  };
  $('#vvMiniX').onclick = e => {
    e.stopPropagation();
    P.classList.remove('mini');
    closePlayer();
  };
  $('#vvMiniBar').addEventListener('dblclick', exitMini);
  let closingFromMini = false;
  hooks.on('player:closing', () => {
    closingFromMini = P.classList.contains('mini');
    P.classList.remove('mini');
  });
  hooks.on('player:closed', () => {
    if (closingFromMini && $('#detail').classList.contains('open')) document.body.style.overflow = 'hidden';
  });
  async function pip() {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await V.requestPictureInPicture();
    } catch (e) {
      toast('A imagem na imagem não está disponível aqui');
    }
  }
  function addMiniBtn() {
    const top = document.querySelector('#player .ptop');
    if (!top || top.querySelector('#vvMiniBtn')) return;
    top.insertAdjacentHTML(
      'beforeend',
      `<div style="flex:1"></div><button class="pb" id="vvMiniBtn" title="${t('Mini-player')}" aria-label="${t('Mini-player')}">${XI.mini}</button>`
    );
    $('#vvMiniBtn').onclick = e => {
      e.stopPropagation();
      enterMini();
    };
  }
  addMiniBtn();
  hooks.on('player:menu', menu => {
    const canDl =
      PC && PC.stream && PC.stream.url && !PC.stream._local && !PC.stream.ytId && !/\.m3u8(\?|$)/i.test(PC.stream.url);
    menu.insertAdjacentHTML(
      'beforeend',
      `<h5>Ecrã</h5><div class="prow"><button data-vvmini>${t('Mini-player')}</button>${document.pictureInPictureEnabled ? '<button data-vvpip>Imagem na imagem</button>' : ''}</div>
    ${canDl ? `<h5>Offline</h5><div class="prow"><button data-vvdl>${t('Transferir para ver offline')}</button></div>` : ''}
    <h5>${t('Comando no telemóvel')}</h5><div class="prow"><button data-vvremote>Usar o telemóvel como comando</button></div>`
    );
  });
  $('#pMenu').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if ('vvmini' in b.dataset) enterMini();
    else if ('vvpip' in b.dataset) {
      $('#pMenu').classList.remove('open');
      pip();
    } else if ('vvdl' in b.dataset) {
      $('#pMenu').classList.remove('open');
      startDownload();
    } else if ('vvremote' in b.dataset) {
      $('#pMenu').classList.remove('open');
      startRemoteHost();
    }
  });

  /* =================== conquistas =================== */
  const BADGES = [
    ['first', '🎬', 'Primeira sessão', 'Vê o teu primeiro título', s => s.titles >= 1],
    ['t10', '🍿', 'Cinéfilo', 'Vê 10 títulos diferentes', s => s.titles >= 10],
    ['t50', '🎞️', 'Devorador', 'Vê 50 títulos diferentes', s => s.titles >= 50],
    ['m25', '🏆', 'Sala de cinema', 'Vê 25 filmes', s => s.movies >= 25],
    ['s10', '📺', 'Viciado em séries', 'Acompanha 10 séries', s => s.series >= 10],
    ['h10', '⏱️', '10 horas', 'Passa 10 horas a ver', s => s.hours >= 10],
    ['h100', '🔥', '100 horas', 'Passa 100 horas a ver', s => s.hours >= 100],
    ['h500', '💎', 'Lenda', 'Passa 500 horas a ver', s => s.hours >= 500],
    ['mara', '🏃', 'Maratonista', 'Vê mais de 5 horas num só dia', s => s.bestDay >= 5 * 3600],
    ['streak7', '📅', 'Semana perfeita', 'Vê algo 7 dias seguidos', s => s.streak >= 7],
    ['days30', '🗓️', 'Fiel', 'Vê algo em 30 dias diferentes', s => s.days >= 30],
    ['night', '🦉', 'Coruja', 'Vê algo entre as 2h e as 5h', s => s.night],
    ['genres', '🧭', 'Explorador', 'Vê 6 géneros diferentes', s => s.genres >= 6],
    ['critic', '⭐', 'Crítico', 'Avalia 10 títulos', s => s.ratings >= 10],
    ['coll', '📚', 'Colecionador', 'Guarda 25 títulos na lista', s => s.lib >= 25],
    ['curator', '🗂️', 'Curador', 'Cria 3 listas', s => s.lists >= 3],
    ['eps', '✅', 'Episódio a episódio', 'Marca 100 episódios como vistos', s => s.watched >= 100],
    ['offline', '✈️', 'Modo avião', 'Transfere um vídeo para ver offline', s => s.dl >= 1]
  ];
  function badgeStats() {
    const d = PD(),
      st = d.stats || {},
      titles = Object.values(st.titles || {}).filter(x => x.secs > 60),
      days = Object.entries(st.days || {});
    const dk = x => x.toISOString().slice(0, 10);
    let streak = 0;
    for (let x = new Date(); streak < 4000; x.setDate(x.getDate() - 1)) {
      if ((st.days || {})[dk(x)] > 60) streak++;
      else if (streak || dk(x) !== dk(new Date())) break;
    }
    const g = new Set();
    titles.forEach(x => (x.genres || []).forEach(y => g.add(y)));
    return {
      titles: titles.length,
      movies: titles.filter(x => x.type === 'movie').length,
      series: titles.filter(x => x.type === 'series').length,
      hours: days.reduce((a, [, s]) => a + s, 0) / 3600,
      bestDay: Math.max(0, ...days.map(([, s]) => s)),
      days: days.filter(([, s]) => s > 60).length,
      streak,
      night: !!(d.flags && d.flags.night),
      genres: g.size,
      ratings: Object.keys(d.ratings || {}).length,
      lib: Object.keys(d.library || {}).length,
      lists: (d.lists || []).length,
      watched: Object.keys(d.watched || {}).length,
      dl: DLS.filter(x => x.done).length
    };
  }
  function checkBadges(quiet) {
    const d = PD();
    const first = !d.badges;
    d.badges = d.badges || {};
    const s = badgeStats();
    const now = [];
    BADGES.forEach(([id, e, n, , fn]) => {
      if (!d.badges[id] && fn(s)) {
        d.badges[id] = Date.now();
        now.push([e, n]);
      }
    });
    if (now.length) {
      if (!quiet && !first)
        now.slice(0, 2).forEach(([e, n], i) => setTimeout(() => toast(`${e} Nova conquista: ${n}!`), i * 2600));
      save();
    }
  }
  setInterval(() => {
    if (P.classList.contains('open') || P.classList.contains('mini')) {
      if (!V.paused) {
        const h = new Date().getHours();
        if (h >= 2 && h < 5) {
          const d = PD();
          d.flags = d.flags || {};
          d.flags.night = 1;
        }
      }
    }
    checkBadges(false);
  }, 60000);
  const badgesHTML = () => {
    const d = PD().badges || {};
    const got = BADGES.filter(b => d[b[0]]).length;
    return `<h3 class="sec">${t('Conquistas')} · ${got}/${BADGES.length}</h3><div class="vvbadges">${BADGES.map(([id, e, n, desc]) => `<div class="vvbadge ${d[id] ? 'got' : 'lock'}"><span class="e">${e}</span><b>${n}</b><small>${d[id] ? 'Desde ' + new Date(d[id]).toLocaleDateString() : desc}</small></div>`).join('')}</div>`;
  };

  /* =================== importar Trakt / Letterboxd =================== */
  function parseCSV(txt) {
    const rows = [];
    let row = [],
      cur = '',
      q = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (q) {
        if (c === '"') {
          if (txt[i + 1] === '"') {
            cur += '"';
            i++;
          } else q = false;
        } else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') {
        row.push(cur);
        cur = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && txt[i + 1] === '\n') i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = '';
      } else cur += c;
    }
    if (cur || row.length) {
      row.push(cur);
      rows.push(row);
    }
    const h = (rows.shift() || []).map(x => x.trim());
    return rows.filter(r => r.length > 1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
  }
  const lbCache = new Map();
  async function findImdb(name, year) {
    const k = name + '|' + year;
    if (lbCache.has(k)) return lbCache.get(k);
    let res = null;
    try {
      const list = await catalog(cinemeta(), 'movie', 'top', { search: name });
      const y = String(year || '');
      res =
        list.find(m => String(m.releaseInfo || '').startsWith(y) && m.name.toLowerCase() === name.toLowerCase()) ||
        list.find(m => String(m.releaseInfo || '').startsWith(y)) ||
        (y ? null : list[0]) ||
        null;
    } catch (e) {}
    lbCache.set(k, res);
    return res;
  }
  async function runImport(files, setMsg) {
    const out = { lib: 0, watched: 0, rated: 0, eps: 0, miss: 0 };
    const d = PD();
    d.ratings = d.ratings || {};
    const entries = [];
    for (const f of files) {
      if (/\.zip$/i.test(f.name)) {
        setMsg('A abrir o ficheiro .zip…');
        await loadJS('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        const z = await JSZip.loadAsync(f);
        for (const n of Object.keys(z.files))
          if (/\.(csv|json)$/i.test(n) && !z.files[n].dir)
            entries.push([n.split('/').pop(), await z.files[n].async('string')]);
      } else entries.push([f.name, await f.text()]);
    }
    const lib = (id, type, name) => {
      if (!S.library[id]) {
        S.library[id] = { id, type, name, poster: IMG.poster(id), added: Date.now() };
        out.lib++;
      }
    };
    const rateIt = (id, r10) => {
      const v = r10 >= 7 ? 1 : r10 <= 4 ? -1 : 0;
      if (v) {
        d.ratings[id] = v;
        out.rated++;
      }
    };
    for (const [name, txt] of entries) {
      const low = name.toLowerCase();
      if (low.endsWith('.json')) {
        let arr;
        try {
          arr = JSON.parse(txt);
        } catch (e) {
          continue;
        }
        if (!Array.isArray(arr)) continue;
        for (const x of arr) {
          const o = x.movie || x.show;
          if (!o || !o.ids || !/^tt\d+$/.test(o.ids.imdb || '')) {
            if (o) out.miss++;
            continue;
          }
          const id = o.ids.imdb,
            type = x.movie ? 'movie' : 'series';
          if (/watchlist/.test(low)) lib(id, type, o.title);
          else if (/rating/.test(low)) rateIt(id, +x.rating || 0);
          else if (/watched|history/.test(low)) {
            if (type === 'movie') {
              if (!S.watched[id]) {
                S.watched[id] = true;
                out.watched++;
              }
            } else
              (x.seasons || []).forEach(s =>
                (s.episodes || []).forEach(e => {
                  const k = `${id}:${s.number}:${e.number}`;
                  if (!S.watched[k]) {
                    S.watched[k] = true;
                    out.eps++;
                  }
                })
              );
            if (x.episode && x.show) {
              const k = `${id}:${x.episode.season}:${x.episode.number}`;
              if (!S.watched[k]) {
                S.watched[k] = true;
                out.eps++;
              }
            }
          }
        }
      } else if (low.endsWith('.csv')) {
        const kind = /watchlist/.test(low)
          ? 'wl'
          : /rating/.test(low)
            ? 'rate'
            : /watched|diary/.test(low)
              ? 'seen'
              : null;
        if (!kind) continue;
        const rows = parseCSV(txt);
        let i = 0;
        for (const r of rows) {
          i++;
          if (i % 5 === 0) setMsg(`A procurar filmes do Letterboxd… ${i}/${rows.length}`);
          const nm = r.Name || r.Title;
          if (!nm) continue;
          const m = await findImdb(nm, r.Year);
          if (!m) {
            out.miss++;
            continue;
          }
          if (kind === 'wl') lib(m.id, 'movie', m.name);
          else if (kind === 'seen') {
            if (!S.watched[m.id]) {
              S.watched[m.id] = true;
              out.watched++;
            }
          }
          if (r.Rating) rateIt(m.id, parseFloat(r.Rating) * 2);
        }
      }
    }
    save();
    checkBadges(true);
    return out;
  }
  function importDialog() {
    openModal(
      `<h3>${t('Importar de outros serviços')}</h3>
    <p class="m"><b>Letterboxd:</b> em letterboxd.com → Settings → Import & Export → <i>Export your data</i>. Escolhe aqui o .zip (ou os ficheiros watched.csv, ratings.csv e watchlist.csv).</p>
    <p class="m"><b>Trakt:</b> em trakt.tv → Settings → Data → <i>Export data</i>. Escolhe o .zip ou os ficheiros .json.</p>
    <p class="m" id="vvImpMsg" style="color:var(--tx);min-height:20px"></p>
    <div class="inrow"><button class="btn acc" id="vvImpPick">Escolher ficheiros</button><button class="btn gho" data-close-modal>Fechar</button></div>
    <input type="file" id="vvImpFile" accept=".zip,.csv,.json" multiple hidden>`,
      m => {
        const msg = s => {
          const e = m.querySelector('#vvImpMsg');
          if (e) e.textContent = s;
        };
        m.querySelector('#vvImpPick').onclick = () => m.querySelector('#vvImpFile').click();
        m.querySelector('#vvImpFile').onchange = async e => {
          const fs = [...e.target.files];
          if (!fs.length) return;
          m.querySelector('#vvImpPick').disabled = true;
          msg('A importar…');
          try {
            const o = await runImport(fs, msg);
            msg(
              `Feito! ${o.lib} na tua lista · ${o.watched} filmes vistos · ${o.eps} episódios vistos · ${o.rated} avaliações${o.miss ? ` · ${o.miss} não encontrados` : ''}.`
            );
          } catch (err) {
            msg('Não foi possível ler esses ficheiros (' + (err.message || 'erro') + ').');
          }
          m.querySelector('#vvImpPick').disabled = false;
        };
      }
    );
  }

  /* =================== gestor de addons =================== */
  const ALLAD = [];
  hooks.on('addons:loaded', () => {
    ALLAD.length = 0;
    ALLAD.push(...ADDONS);
    applyAddonPrefs();
  });
  function applyAddonPrefs() {
    ADDONS.forEach(a => {
      if (!ALLAD.some(x => x.url === a.url)) ALLAD.push(a);
    });
    for (let i = ALLAD.length - 1; i >= 0; i--)
      if (ALLAD[i].url !== CINEMETA && !S.addons.includes(ALLAD[i].url)) ALLAD.splice(i, 1);
    const off = new Set(S.addonsOff || []),
      idx = u => (u === CINEMETA ? -1 : S.addons.indexOf(u));
    const list = ALLAD.filter(a => !off.has(a.url)).sort((a, b) => idx(a.url) - idx(b.url));
    ADDONS.length = 0;
    ADDONS.push(...list);
  }
  const HEALTH = new Map();
  async function checkAddon(a) {
    HEALTH.set(a.url, { s: 'chk' });
    paintHealth(a.url);
    const ac = new AbortController(),
      to = setTimeout(() => ac.abort(), 9000),
      t0 = performance.now();
    try {
      const r = await fetch(normUrl(a.url), { cache: 'no-store', signal: ac.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const m = await r.json();
      const ms = Math.round(performance.now() - t0);
      HEALTH.set(a.url, { s: ms > 2500 ? 'slow' : 'ok', ms });
      if (m && m.id) a.m = m;
    } catch (e) {
      HEALTH.set(a.url, { s: 'bad', e: e.name === 'AbortError' ? 'sem resposta' : e.message || 'erro' });
    }
    clearTimeout(to);
    paintHealth(a.url);
  }
  function healthHTML(u) {
    const h = HEALTH.get(u);
    if (!h) return '<span class="vvst">Por verificar</span>';
    if (h.s === 'chk') return '<span class="vvst">A verificar…</span>';
    if (h.s === 'bad') return `<span class="vvst bad">Em baixo · ${esc(h.e)}</span>`;
    return `<span class="vvst ${h.s}">${h.s === 'ok' ? 'Online' : 'Lento'} · ${h.ms} ms</span>`;
  }
  function paintHealth(u) {
    document.querySelectorAll('.vvadw').forEach(w => {
      if (w.dataset.u === u) {
        const s = w.querySelector('.vvst');
        if (s) s.outerHTML = healthHTML(u);
      }
    });
  }
  // o perfil infantil não mexe nos addons nem nas definições completas
  hooks.on('view:addons:before', () => {
    if (isKids()) {
      location.hash = 'home';
      return false;
    }
  });
  hooks.on('view:addons', () => {
    applyAddonPrefs();
    const el = $('#alist');
    if (!el) return;
    const off = new Set(S.addonsOff || []),
      idx = u => (u === CINEMETA ? -1 : S.addons.indexOf(u));
    const all = ALLAD.slice().sort((a, b) => idx(a.url) - idx(b.url)),
      extras = all.filter(a => a.url !== CINEMETA);
    el.innerHTML = all
      .map(a => {
        const base = a.url === CINEMETA,
          pos = extras.indexOf(a);
        return `<div class="vvadw ${off.has(a.url) ? 'off' : ''}" data-u="${esc(a.url)}">${addonRow(a)}<div class="vvctl">${healthHTML(a.url)}<span class="sp"></span>
    ${
      base
        ? '<small style="color:var(--mu)">Catálogo base (sempre primeiro)</small>'
        : `<button class="btn ico gho" data-vvmv="-1" ${pos === 0 ? 'disabled' : ''} title="Subir">${XI.up}</button><button class="btn ico gho" data-vvmv="1" ${pos === extras.length - 1 ? 'disabled' : ''} title="Descer">${XI.down}</button>
    <span style="font-size:13px;color:var(--mu)">${off.has(a.url) ? 'Desativado' : 'Ativo'}</span><button class="tg ${off.has(a.url) ? '' : 'on'}" data-vvtg></button>`
    }</div></div>`;
      })
      .join('');
    el.insertAdjacentHTML(
      'beforebegin',
      `<div class="inrow" style="margin:-4px 0 14px"><button class="btn sm gho" id="vvChk">${t('Verificar estado')}</button><small style="color:var(--mu);align-self:center">A ordem conta: os addons de cima aparecem primeiro nas fontes.</small></div>`
    );
    $('#vvChk').onclick = () => ALLAD.forEach(checkAddon);
    el.onclick = e => {
      const w = e.target.closest('.vvadw');
      if (!w) return;
      const u = w.dataset.u;
      const mv = e.target.closest('[data-vvmv]');
      if (mv) {
        const i = S.addons.indexOf(u),
          j = i + +mv.dataset.vvmv;
        if (i < 0 || j < 0 || j >= S.addons.length) return;
        [S.addons[i], S.addons[j]] = [S.addons[j], S.addons[i]];
        save();
        VIEWS.addons();
        return;
      }
      if (e.target.closest('[data-vvtg]')) {
        const s = new Set(S.addonsOff || []);
        s.has(u) ? s.delete(u) : s.add(u);
        S.addonsOff = [...s];
        save();
        applyAddonPrefs();
        cache.clear();
        toast(s.has(u) ? 'Addon desativado' : 'Addon ativado');
        VIEWS.addons();
      }
    };
    if (!HEALTH.size) ALLAD.forEach(checkAddon);
  });

  /* =================== definições, navegação e estatísticas =================== */
  hooks.on('view:settings:before', () => {
    if (isKids()) {
      app.className = '';
      app.innerHTML = `<div class="view">${topbar('Definições')}<div class="pad" style="max-width:820px"><div class="panel"><h3>Perfil infantil</h3><p class="m">Estás no perfil <b style="color:var(--tx)">${esc(curProfile().name)}</b>. Para mudar as definições, entra num perfil de adulto.</p>
      <div class="plinks">${S.profiles.map(p => `<button class="pcard ${p.id === S.activeProfile ? 'on' : ''}" data-prof="${p.id}">${avatar(p, 34)}<b>${esc(p.name)}</b></button>`).join('')}</div></div></div></div>`;
      return false;
    }
  });
  hooks.on('view:settings', () => {
    const pad = document.querySelector('#app .pad');
    if (!pad) return;
    const sw = pad.querySelector('[data-acc]'),
      ap = sw && sw.closest('.panel');
    if (ap) {
      ap.querySelector('.swatches').insertAdjacentHTML(
        'afterend',
        `<div class="srow"><div class="tx"><b>${t('Tema')}</b><small>Cores de fundo da app</small></div><select class="sel" id="vvTheme">${THEMES.map(([k, n]) => `<option value="${k}" ${(S.prefs.amoled ? 'amoled' : S.prefs.theme || 'dark') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="srow"><div class="tx"><b>Cor personalizada</b><small>Escolhe qualquer cor de destaque</small></div><div style="display:flex;gap:8px;align-items:center"><input type="color" class="vvcolor" id="vvColor" value="${S.prefs.customAc || '#ff4d94'}">${S.prefs.customAc ? '<button class="btn sm gho" id="vvColorX">Repor</button>' : ''}</div></div>
      <div class="srow"><div class="tx"><b>Tamanho da interface</b><small>Útil em ecrãs grandes ou pequenos</small></div><select class="sel" id="vvScale">${[
        ['s', 'Compacta'],
        ['n', 'Normal'],
        ['l', 'Grande']
      ]
        .map(([k, n]) => `<option value="${k}" ${(S.prefs.uiScale || 'n') === k ? 'selected' : ''}>${n}</option>`)
        .join('')}</select></div>`
      );
      $('#vvTheme').onchange = e => {
        const v = e.target.value;
        S.prefs.amoled = v === 'amoled';
        S.prefs.theme = v;
        save();
        applyAccent();
        VIEWS.settings();
      };
      $('#vvColor').oninput = e => {
        S.prefs.customAc = e.target.value;
        applyAccent();
      };
      $('#vvColor').onchange = () => {
        save();
        VIEWS.settings();
      };
      const cx = $('#vvColorX');
      if (cx)
        cx.onclick = () => {
          delete S.prefs.customAc;
          save();
          applyAccent();
          VIEWS.settings();
        };
      ap.querySelectorAll('[data-acc]').forEach(b =>
        b.addEventListener('click', () => {
          if (S.prefs.customAc) {
            delete S.prefs.customAc;
            save();
            applyAccent();
          }
        })
      );
      $('#vvScale').onchange = e => {
        S.prefs.uiScale = e.target.value;
        save();
        applyAccent();
      };
    }
    const anchor = [...pad.querySelectorAll('.panel')].find(p => p.querySelector('#chkUpd')) || null;
    const html = `<div class="panel"><h3>${t('Comando no telemóvel')}</h3><p class="m">Controla o Vinovim deste ecrã com o telemóvel: reproduzir, avançar, volume, setas e pesquisa.</p>
      <div class="inrow"><button class="btn gho" id="vvRemoteHost">${XI.phone}Ligar comando</button><button class="btn gho" id="vvRemoteMe">Usar ESTE aparelho como comando</button></div></div>
    <div class="panel"><h3>${t('Importar de outros serviços')}</h3><p class="m">Traz a tua lista, os vistos e as avaliações do Letterboxd ou do Trakt.</p><div class="inrow"><button class="btn gho" id="vvImport">Importar do Letterboxd ou Trakt</button></div></div>
    <div class="panel"><h3>${t('Transferências')}</h3><p class="m">${DLS.filter(x => x.done).length} vídeo(s) guardados para ver offline.</p><div class="inrow"><a class="btn gho" href="#downloads">${XI.dl}Abrir transferências</a></div></div>`;
    if (anchor) anchor.insertAdjacentHTML('beforebegin', html);
    else pad.insertAdjacentHTML('beforeend', html);
    $('#vvRemoteHost').onclick = startRemoteHost;
    $('#vvRemoteMe').onclick = () => {
      location.hash = 'comando=';
    };
    $('#vvImport').onclick = importDialog;
  });
  if (VIEWS.stats) {
    hooks.on('view:stats', () => {
      checkBadges(true);
      const pad = document.querySelector('#app .pad');
      if (pad) pad.insertAdjacentHTML('beforeend', '<div style="margin-top:28px">' + badgesHTML() + '</div>');
    });
  }
  hooks.on('view:library', () => {
    const row = document.querySelector('#app .pad .inrow');
    if (row && !row.querySelector('[href="#downloads"]'))
      row.insertAdjacentHTML('beforeend', `<a class="btn sm gho" href="#downloads">${XI.dl}${t('Transferências')}</a>`);
  });
  Object.assign(VIEW_TXT, { downloads: 'Nas transferências' });
  function navAdd() {
    if (document.querySelector('.nv[data-v="downloads"]')) return;
    const sp = document.querySelector('#nav .nvsp');
    if (sp)
      sp.insertAdjacentHTML(
        'beforebegin',
        `<a class="nv dk" data-v="downloads" href="#downloads">${XI.dl}${t('Transferências')}</a>`
      );
  }
  // #comando=… transforma o telemóvel num comando; o perfil infantil não abre os addons
  hooks.on('route', hash => {
    if (hash.startsWith('comando=')) {
      remoteClient(hash.slice(8));
      return false;
    }
    if (isKids() && hash === 'addons') {
      location.hash = 'home';
      return false;
    }
  });
  hooks.on('route:done', hash => {
    if ($('#vvRemote') && !hash.startsWith('comando')) {
      try {
        remote.client && remote.client.destroy();
      } catch (e) {}
      remote.curCode = null;
      $('#vvRemote').remove();
      document.body.style.overflow = '';
    }
    navAdd();
    applyKids();
  });

  /* =================== arranque =================== */
  navAdd();
  applyKids();
  applyAccent();
  if (location.hash.slice(1).startsWith('comando=')) setTimeout(() => remoteClient(location.hash.slice(9)), 0);
  hooks.on('boot', () => {
    setTimeout(() => {
      checkBadges(true);
      widgetPush();
    }, 3000);
  });
})();
