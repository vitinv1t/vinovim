/* Vinovim — Windows e resumo anual
   Windows: “Continuar a ver” no menu Iniciar e na barra de tarefas · botões na miniatura · progresso no ícone
   O teu ano no Vinovim (Wrapped) com cartões animados para partilhar */
(() => {
  'use strict';
  const PD = () => S.pdata[S.activeProfile];
  const N = window.vinovimNative || null;
  let booted = false,
    queued = null;

  /* =================== Windows: menu Iniciar e barra de tarefas =================== */
  if (N && N.jumpList) {
    const pushJump = () => {
      const items = Object.values(S.progress || {})
        .sort((a, b) => (b.updated || 0) - (a.updated || 0))
        .slice(0, 6)
        .map(p => ({
          title: p.name,
          sub: (p.ep ? p.ep + ' · ' : '') + (p.d > 1 ? Math.round((p.t / p.d) * 100) + '% visto' : 'Próximo episódio'),
          type: p.type,
          id: p.id
        }));
      try {
        N.jumpList(items);
      } catch (e) {}
    };
    let jumpTimer;
    hooks.on('save', () => {
      clearTimeout(jumpTimer);
      jumpTimer = setTimeout(pushJump, 3000);
    });
    hooks.on('profile:switch', () => setTimeout(pushJump, 500));
    const active = () => P.classList.contains('open') || P.classList.contains('mini');
    let lastSend = 0;
    const sendState = force => {
      if (!active() || !PC) {
        N.playing(null);
        return;
      }
      const now = Date.now();
      if (!force && now - lastSend < 2500) return;
      lastSend = now;
      const d = V.duration;
      N.playing({
        playing: !V.paused,
        progress: d && isFinite(d) ? V.currentTime / d : 0,
        hasNext: !!(typeof nextVideo === 'function' && nextVideo()),
        title: $('#pTitle') ? $('#pTitle').textContent : ''
      });
    };
    V.addEventListener('play', () => sendState(true));
    V.addEventListener('pause', () => sendState(true));
    V.addEventListener('timeupdate', () => sendState(false));
    V.addEventListener('ended', () => sendState(true));
    hooks.on('player:closed', () => setTimeout(() => N.playing(null), 0));
    N.onCommand(c => {
      if (!active()) return;
      if (c === 'toggle') togglePlay();
      else if (c === 'back') skip(-10);
      else if (c === 'fwd') skip(10);
      else if (c === 'next') goNext();
      setTimeout(() => sendState(true), 120);
    });
    const doOpen = o => {
      if (!o) return;
      if (o.route) location.hash = o.route;
      else if (o.id) openDetail(o.type, o.id);
    };
    N.onOpen(o => {
      if (booted) doOpen(o);
      else queued = o;
    });
    setTimeout(pushJump, 4000);
  }

  /* =================== O teu ano no Vinovim (Wrapped) =================== */
  const MES = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro'
  ];
  const PALS = [
    ['#ff4d94', '#ff8a3d', '#7c1d6f'],
    ['#7c5cff', '#2f8cff', '#14104a'],
    ['#16c784', '#0f8b8d', '#073b3a'],
    ['#ff7a1a', '#ffc93c', '#7a2e0b'],
    ['#ff4fd8', '#7c5cff', '#2a0f3d'],
    ['#2f8cff', '#5ce1e6', '#0b1f4a'],
    ['#ffc93c', '#ff4d94', '#3a1020'],
    ['#5ce1e6', '#16c784', '#08303a'],
    ['#ff4d94', '#7c5cff', '#16c7b4']
  ];
  function blobs(i) {
    const [a, b] = PALS[i % PALS.length];
    return `<div class="wbg"><span style="width:70%;height:50%;left:-10%;top:5%;background:${a}"></span><span style="width:60%;height:45%;right:-10%;bottom:10%;background:${b};animation-delay:-4s"></span></div>`;
  }
  const PERS = {
    Horror: ['😱', 'Caçador de sustos', 'Para ti, uma noite sem medo é uma noite perdida.'],
    Comedy: ['😂', 'Rei da gargalhada', 'Se é para ver, é para rir.'],
    Drama: ['🎭', 'Coração de cinema', 'As grandes histórias tocam-te a sério.'],
    Action: ['💥', 'Viciado em adrenalina', 'Explosões, perseguições e zero pausas.'],
    'Sci-Fi': ['🚀', 'Explorador do futuro', 'Viagens no tempo, robôs e outros planetas são a tua casa.'],
    Animation: ['🎨', 'Alma de desenho animado', 'Não há idade para uma boa animação.'],
    Romance: ['💘', 'Romântico incurável', 'Um final feliz nunca é demais.'],
    Thriller: ['🕵️', 'Mestre do suspense', 'Adivinhas o culpado antes de toda a gente.'],
    Crime: ['🔍', 'Detetive de sofá', 'Casos, mistérios e reviravoltas.'],
    Documentary: ['🧠', 'Mente curiosa', 'Gostas de aprender enquanto vês.'],
    Fantasy: ['🐉', 'Viajante de outros mundos', 'Magia e dragões fazem parte da tua rotina.'],
    Mystery: ['🗝️', 'Caçador de mistérios', 'Nenhum enigma te escapa.'],
    Family: ['🛋️', 'Rei do sofá em família', 'Os melhores filmes são os que se veem juntos.'],
    Adventure: ['🧭', 'Aventureiro nato', 'Mapas, tesouros e caminhos por explorar.']
  };
  function wrapData() {
    const d = PD(),
      st = d.stats || { days: {}, titles: {} },
      year = new Date().getFullYear();
    const days = Object.entries(st.days || {}).filter(([k]) => k.startsWith(String(year)));
    const secs = days.reduce((a, [, s]) => a + s, 0),
      hours = secs / 3600;
    const titles = Object.entries(st.titles || {})
      .map(([id, t]) => Object.assign({ id }, t))
      .filter(t => t.secs > 60)
      .sort((a, b) => b.secs - a.secs);
    const gw = {};
    titles.forEach(t => (t.genres || []).forEach(g => (gw[g] = (gw[g] || 0) + t.secs)));
    const genres = Object.entries(gw).sort((a, b) => b[1] - a[1]);
    const months = Array(12).fill(0);
    days.forEach(([k, s]) => (months[+k.slice(5, 7) - 1] += s));
    const bestM = months.indexOf(Math.max(...months));
    const best = days.slice().sort((a, b) => b[1] - a[1])[0];
    const eps = Object.keys(d.watched || {}).filter(k => /:\d+:\d+$/.test(k)).length;
    const movies = titles.filter(t => t.type === 'movie').length,
      series = titles.filter(t => t.type === 'series').length;
    let streak = 0,
      run = 0;
    const set = new Set(days.filter(([, s]) => s > 60).map(([k]) => k));
    for (let x = new Date(year, 0, 1); x.getFullYear() === year && x <= new Date(); x.setDate(x.getDate() + 1)) {
      const k = x.toISOString().slice(0, 10);
      if (set.has(k)) {
        run++;
        streak = Math.max(streak, run);
      } else run = 0;
    }
    const topG = genres[0] ? genres[0][0] : null;
    let pers = PERS[topG] || ['🍿', 'Cinéfilo de mão cheia', 'Vês um pouco de tudo e gostas de tudo.'];
    if (d.flags && d.flags.night && hours > 5)
      pers = ['🦉', 'Coruja das maratonas', 'As melhores sessões são de madrugada.'];
    else if (best && best[1] > 5 * 3600 && series > movies)
      pers = ['🏃', 'Maratonista de séries', 'Um episódio? Nunca é só um.'];
    return {
      year,
      hours,
      titles,
      genres,
      months,
      bestM,
      best,
      eps,
      movies,
      series,
      streak,
      pers,
      badges: Object.keys(d.badges || {}).length,
      name: (curProfile() || {}).name || 'Tu',
      profile: curProfile()
    };
  }
  const f1 = v => v.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function slides(w) {
    const S2 = [];
    const top5 = w.titles.slice(0, 5);
    S2.push(
      `<div class="wk win">${w.year} · Vinovim</div><div class="wh win" style="animation-delay:.15s;font-size:clamp(40px,12vw,58px)">O teu ano no Vinovim, ${esc(w.name)}</div><p class="wp win" style="animation-delay:.35s">Preparámos um resumo do que viste. Toca no lado direito para avançar.</p>`
    );
    if (w.hours < 0.2) {
      S2.push(
        `<div class="wemo">🍿</div><div class="wh win">Ainda estás a aquecer</div><p class="wp win" style="animation-delay:.2s">Vê mais alguns filmes ou episódios e volta aqui: o teu resumo vai ficando mais completo.</p>`
      );
      return S2;
    }
    S2.push(
      `<div class="wk win">Tempo a ver</div><div class="wbig win" style="animation-delay:.15s"><span data-count="${w.hours.toFixed(1)}">0</span></div><div class="wh win" style="animation-delay:.3s">horas de filmes e séries</div><p class="wp win" style="animation-delay:.5s">${w.hours >= 24 ? `Isso são <b>${f1(w.hours / 24)} dias</b> seguidos em frente ao ecrã.` : `Isso dá para ver <b>${Math.max(1, Math.round(w.hours / 2))} filmes</b> de duas horas.`}</p>`
    );
    S2.push(
      `<div class="wk win">O que viste</div><div class="wgrid win" style="animation-delay:.15s"><div><b data-count="${w.movies}">0</b><small>filmes</small></div><div><b data-count="${w.series}">0</b><small>séries</small></div><div><b data-count="${w.eps}">0</b><small>episódios vistos</small></div><div><b data-count="${w.streak}">0</b><small>dias seguidos (recorde)</small></div></div>${w.best ? `<p class="wp win" style="animation-delay:.4s">O teu maior dia foi <b>${new Date(w.best[0]).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</b>, com <b>${f1(w.best[1] / 3600)} horas</b>.</p>` : ''}`
    );
    if (w.genres.length) {
      const mx = w.genres[0][1];
      S2.push(
        `<div class="wk win">O teu género</div><div class="wh win" style="animation-delay:.15s;font-size:clamp(44px,13vw,64px)">${esc(GPT[w.genres[0][0]] || w.genres[0][0])}</div><div class="wgen">${w.genres
          .slice(0, 4)
          .map(
            ([g, s], i) =>
              `<div class="win" style="animation-delay:${0.3 + i * 0.12}s">${esc(GPT[g] || g)}<i style="--w:${Math.max(8, (s / mx) * 100)}%;animation-delay:${0.4 + i * 0.12}s"></i></div>`
          )
          .join('')}</div>`
      );
    }
    if (top5.length)
      S2.push(
        `<div class="wk win">Os teus favoritos</div><div class="wh win" style="animation-delay:.1s">Top ${top5.length} do ano</div><div class="wtop5">${top5.map((t, i) => `<div class="win" style="animation-delay:${0.25 + i * 0.12}s"><em>${i + 1}</em><img src="${esc(t.poster || IMG.poster(t.id))}" alt="" onerror="this.style.visibility='hidden'"><span><b>${esc(t.name)}</b><small>${f1(t.secs / 3600)} h · ${t.type === 'series' ? 'Série' : 'Filme'}</small></span></div>`).join('')}</div>`
      );
    const mx = Math.max(...w.months, 1);
    S2.push(
      `<div class="wk win">Mês favorito</div><div class="wh win" style="animation-delay:.15s;font-size:clamp(40px,12vw,58px)">${MES[w.bestM]}</div><p class="wp win" style="animation-delay:.3s">Foi o mês em que mais viste: <b>${f1(w.months[w.bestM] / 3600)} horas</b>.</p><div class="wmon">${w.months.map((s, i) => `<div class="${i === w.bestM ? 'top' : ''}" style="--h:${Math.max(3, (s / mx) * 100)}%;animation-delay:${0.4 + i * 0.05}s"></div>`).join('')}</div><div class="wml">${MES.map(m => `<span>${m[0].toUpperCase()}</span>`).join('')}</div>`
    );
    S2.push(
      `<div class="wk win">A tua personalidade</div><div class="wemo">${w.pers[0]}</div><div class="wh win" style="animation-delay:.3s">${esc(w.pers[1])}</div><p class="wp win" style="animation-delay:.5s">${esc(w.pers[2])}</p>${w.badges ? `<p class="wp win" style="animation-delay:.7s;margin-top:14px">E ainda desbloqueaste <b>${w.badges} conquistas</b>.</p>` : ''}`
    );
    S2.push(`<div class="wk win">${w.year} em resumo</div><div class="wh win" style="animation-delay:.1s">${esc(w.name)}, foste ${esc(w.pers[1].toLowerCase())} ${w.pers[0]}</div><div class="wgrid win" style="animation-delay:.25s"><div><b>${w.hours.toFixed(0)}</b><small>horas</small></div><div><b>${w.movies + w.series}</b><small>títulos</small></div><div><b>${esc((GPT[(w.genres[0] || [])[0]] || 'n/d').slice(0, 12))}</b><small>género</small></div><div><b>${MES[w.bestM].slice(0, 3)}</b><small>melhor mês</small></div></div>
    <div class="wbtns win" style="animation-delay:.45s"><button class="w1" data-wshare>${I.share || ''}Partilhar imagem</button><button class="w2" data-wsave>Guardar imagem</button><button class="w2" data-wagain>Ver outra vez</button></div>`);
    return S2;
  }
  let W = null;
  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count),
        dec = String(el.dataset.count).includes('.') ? 1 : 0,
        t0 = performance.now(),
        dur = 1300;
      const step = t => {
        const p = Math.min(1, (t - t0) / dur),
          e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toLocaleString('pt-PT', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function openWrapped() {
    const w = wrapData(),
      list = slides(w);
    let el = $('#vvWrap');
    if (!el) {
      el = document.createElement('div');
      el.id = 'vvWrap';
      document.body.appendChild(el);
    }
    W = { w, list, i: 0, t: null, el };
    el.innerHTML = `<div class="wcard"><div class="wbars">${list.map(() => '<i><b></b></i>').join('')}</div><div class="wtop">${LOGO.replace('<svg', '<svg width="22" height="22"')}<span>Vinovim ${w.year}</span><span class="sp"></span><button data-wpause title="Pausar">${I.pause}</button><button data-wclose title="Fechar">${I.x}</button></div><div class="wtap l" data-wprev></div><div class="wtap r" data-wnext></div><div id="wslide"></div></div>`;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
    show(0);
  }
  function show(i) {
    if (!W) return;
    clearTimeout(W.t);
    W.i = Math.max(0, Math.min(W.list.length - 1, i));
    const bars = W.el.querySelectorAll('.wbars i');
    bars.forEach((b, k) => {
      b.className = k < W.i ? 'done' : k === W.i ? '' : '';
    });
    void W.el.offsetWidth;
    bars[W.i].className = 'on';
    const box = W.el.querySelector('#wslide'),
      [, , c] = PALS[W.i % PALS.length];
    box.innerHTML = `<div class="wslide" style="background:linear-gradient(165deg,${c},#0b0810 75%)">${blobs(W.i)}${W.list[W.i]}</div>`;
    countUp(box);
    W.el.querySelector('.wcard').classList.remove('paused');
    W.el.querySelector('.wcard').classList.toggle('last', W.i === W.list.length - 1);
    if (W.i < W.list.length - 1) W.t = setTimeout(() => show(W.i + 1), 6500);
    else {
      bars[W.i].className = 'done';
    }
  }
  function closeWrapped() {
    if (!W) return;
    clearTimeout(W.t);
    W.el.classList.remove('open');
    W = null;
    if (!$('#detail').classList.contains('open')) document.body.style.overflow = '';
  }
  document.addEventListener('click', async e => {
    if (!W) {
      if (e.target.closest('[data-wopen]')) openWrapped();
      return;
    }
    if (e.target.closest('[data-wclose]')) return closeWrapped();
    if (e.target.closest('[data-wnext]')) return show(W.i + 1);
    if (e.target.closest('[data-wprev]')) return show(W.i - 1);
    if (e.target.closest('[data-wagain]')) return show(0);
    if (e.target.closest('[data-wpause]')) {
      const c = W.el.querySelector('.wcard');
      const p = c.classList.toggle('paused');
      clearTimeout(W.t);
      if (!p && W.i < W.list.length - 1) W.t = setTimeout(() => show(W.i + 1), 3000);
      return;
    }
    if (e.target.closest('[data-wshare]')) return shareImage(true);
    if (e.target.closest('[data-wsave]')) return shareImage(false);
  });
  document.addEventListener(
    'keydown',
    e => {
      if (!W) return;
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        closeWrapped();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        e.stopImmediatePropagation();
        show(W.i + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopImmediatePropagation();
        show(W.i - 1);
      }
    },
    true
  );

  /* imagem para partilhar (1080 × 1920, formato de stories) */
  const loadImg = src =>
    new Promise(ok => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => ok(i);
      i.onerror = () => ok(null);
      i.src = src;
      setTimeout(() => ok(null), 5000);
    });
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fitText(ctx, txt, max) {
    let t = String(txt);
    while (ctx.measureText(t).width > max && t.length > 3) t = t.slice(0, -2);
    return t === String(txt) ? t : t.trim() + '…';
  }
  async function drawCard(withPosters) {
    const w = W ? W.w : wrapData(),
      c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1920;
    const x = c.getContext('2d'),
      F = getComputedStyle(document.body).getPropertyValue('--fd') || 'sans-serif';
    const g = x.createLinearGradient(0, 0, 1080, 1920);
    g.addColorStop(0, '#2a0f3d');
    g.addColorStop(0.5, '#120d18');
    g.addColorStop(1, '#07202a');
    x.fillStyle = g;
    x.fillRect(0, 0, 1080, 1920);
    [
      ['#ff4d94', 180, 260, 520],
      ['#7c5cff', 920, 820, 560],
      ['#16c7b4', 260, 1680, 520]
    ].forEach(([col, cx, cy, r]) => {
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, col + 'aa');
      rg.addColorStop(1, col + '00');
      x.fillStyle = rg;
      x.fillRect(0, 0, 1080, 1920);
    });
    x.fillStyle = '#fff';
    x.textBaseline = 'alphabetic';
    // o nome “vinovim” com as cores da marca, seguido do ano
    const nh = 46,
      ns = nh / 812;
    x.save();
    x.translate(80 - 8 * ns, 150);
    x.scale(ns, ns);
    const ng = x.createLinearGradient(8, 0, 4026, 0);
    [
      [0, MARCA.violeta],
      [0.6, MARCA.rosa],
      [1, MARCA.coral]
    ].forEach(([o, c]) => ng.addColorStop(o, c));
    x.fillStyle = ng;
    NOME.forEach(([d, dot]) => {
      x.fill(new Path2D(d));
      if (dot) x.fill(new Path2D(dot));
    });
    x.restore();
    x.fillStyle = '#fff';
    x.font = `700 40px ${F}`;
    x.globalAlpha = 0.85;
    x.fillText('· ' + w.year, 80 + 4018 * ns + 18, 150);
    x.globalAlpha = 1;
    x.font = `800 92px ${F}`;
    x.fillText(fitText(x, 'O meu ano', 920), 80, 280);
    x.fillText(fitText(x, 'no Vinovim', 920), 80, 380);
    x.font = `600 44px ${F}`;
    x.globalAlpha = 0.9;
    x.fillText(fitText(x, w.pers[0] + '  ' + w.pers[1], 920), 80, 470);
    x.globalAlpha = 1;
    const stats = [
      [w.hours.toFixed(0), 'horas a ver'],
      [String(w.movies + w.series), 'títulos'],
      [GPT[(w.genres[0] || [])[0]] || 'n/d', 'género favorito'],
      [MES[w.bestM], 'melhor mês']
    ];
    stats.forEach(([v, l], i) => {
      const bx = 80 + (i % 2) * 470,
        by = 540 + Math.floor(i / 2) * 230;
      x.fillStyle = 'rgba(255,255,255,.12)';
      rr(x, bx, by, 450, 200, 36);
      x.fill();
      x.fillStyle = '#fff';
      x.font = `800 72px ${F}`;
      x.fillText(fitText(x, v, 390), bx + 34, by + 110);
      x.font = `600 32px ${F}`;
      x.globalAlpha = 0.8;
      x.fillText(l, bx + 34, by + 160);
      x.globalAlpha = 1;
    });
    x.font = `800 48px ${F}`;
    x.fillText('O meu top do ano', 80, 1100);
    const top = w.titles.slice(0, 5),
      imgs = withPosters ? await Promise.all(top.map(t => loadImg(t.poster || IMG.poster(t.id)))) : [];
    top.forEach((t, i) => {
      const by = 1150 + i * 128;
      x.fillStyle = 'rgba(255,255,255,.1)';
      rr(x, 80, by, 920, 112, 26);
      x.fill();
      x.fillStyle = '#fff';
      x.font = `800 52px ${F}`;
      x.globalAlpha = 0.85;
      x.fillText(String(i + 1), 112, by + 74);
      x.globalAlpha = 1;
      let tx = 190;
      if (imgs[i]) {
        x.save();
        rr(x, 180, by + 10, 62, 92, 12);
        x.clip();
        x.drawImage(imgs[i], 180, by + 10, 62, 92);
        x.restore();
        tx = 270;
      }
      x.font = `700 40px ${F}`;
      x.fillText(fitText(x, t.name, 980 - tx - 40), tx, by + 58);
      x.font = `500 28px ${F}`;
      x.globalAlpha = 0.75;
      x.fillText(f1(t.secs / 3600) + ' h · ' + (t.type === 'series' ? 'Série' : 'Filme'), tx, by + 94);
      x.globalAlpha = 1;
    });
    x.font = `600 34px ${F}`;
    x.globalAlpha = 0.8;
    x.fillText('Faz o teu em vinovim.vercel.app', 80, 1850);
    x.globalAlpha = 1;
    return new Promise((ok, no) => {
      try {
        c.toBlob(b => (b ? ok(b) : no(new Error('blob'))), 'image/png');
      } catch (e) {
        no(e);
      }
    });
  }
  async function shareImage(share) {
    toast('A preparar a imagem…');
    let blob;
    try {
      blob = await drawCard(true);
    } catch (e) {
      blob = await drawCard(false);
    }
    const file = new File([blob], `vinovim-${new Date().getFullYear()}.png`, { type: 'image/png' });
    if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'O meu ano no Vinovim', text: 'O meu ano no Vinovim 🍿' });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast(share ? 'A imagem foi guardada: partilha-a nas tuas redes' : 'Imagem guardada');
  }

  /* entradas: estatísticas e início */
  if (VIEWS.stats) {
    hooks.on('view:stats', () => {
      const pad = document.querySelector('#app .pad');
      if (pad && !pad.querySelector('[data-wopen]'))
        pad.insertAdjacentHTML(
          'afterbegin',
          `<button class="vvwrapbanner" data-wopen style="margin:0 0 24px;width:100%"><span class="e">🎁</span><span><b>O teu ${new Date().getFullYear()} no Vinovim</b><small>Vê o teu resumo animado e partilha-o</small></span></button>`
        );
    });
  }
  hooks.on('view:home', async () => {
    const m = new Date().getMonth(),
      rows = $('#rows');
    if (rows && (m >= 10 || m === 0) && !rows.querySelector('[data-wopen]')) {
      const w = wrapData();
      if (w.hours >= 1)
        rows.insertAdjacentHTML(
          'afterbegin',
          `<button class="vvwrapbanner" data-wopen><span class="e">🎁</span><span><b>O teu ${w.year} no Vinovim já está pronto</b><small>${w.hours.toFixed(0)} horas, ${w.movies + w.series} títulos e a tua personalidade de espectador</small></span></button>`
        );
    }
  });
  defineView('wrapped', function () {
    location.hash = 'stats';
    setTimeout(openWrapped, 300);
  });

  /* arranque */
  hooks.on('boot', () => {
    booted = true;
    if (queued) {
      const o = queued;
      queued = null;
      setTimeout(() => {
        if (o.route) location.hash = o.route;
        else if (o.id) openDetail(o.type, o.id);
      }, 400);
    }
  });
})();
