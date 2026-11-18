/* ---------- detalhe ---------- */
const D = { meta: null, season: null };
async function openDetail(type, id) {
  const el = $('#detail');
  el.classList.add('open');
  el.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  syncHist();
  const pre = ITEMS.get(id) || { id, type };
  el.innerHTML = detailShell(pre, true);
  try {
    const m = await getMeta(type, id);
    D.meta = m;
    presenceDetail(m);
    const prog = S.progress[m.id];
    const seasons = seasonList(m);
    D.season = prog && prog.season != null ? prog.season : (seasons.find(s => s > 0) ?? seasons[0]);
    if (el.classList.contains('open')) {
      el.innerHTML = detailShell(m, false);
      loadSimilar(m);
    }
  } catch (e) {
    el.innerHTML = `<div class="dwrap"><div class="dtop"><button class="btn gho ico" data-close-detail>${I.back}</button></div>${offlineHTML()}</div>`;
  }
}
function closeDetail() {
  $('#detail').classList.remove('open');
  document.body.style.overflow = '';
  D.meta = null;
  presenceView(CUR_VIEW);
  if (location.hash.slice(1) === 'home') VIEWS.home().catch(() => {});
}
async function loadSimilar(m) {
  hooks.emit('detail:shown', m);
  const g = (m.genres || [])[0];
  if (!g || !cinemeta()) return;
  try {
    const x = (await catalog(cinemeta(), m.type, 'top', { genre: g })).filter(i => i.id !== m.id).slice(0, 24);
    const el = $('#similar');
    if (el && D.meta === m && x.length) el.innerHTML = rowHTML('Mais como este', x.map(card).join(''), GPT[g] || g);
  } catch (e) {}
}
function rerenderDetail() {
  if (D.meta && $('#detail').classList.contains('open')) {
    const y = $('#detail').scrollTop;
    $('#detail').innerHTML = detailShell(D.meta, false);
    $('#detail').scrollTop = y;
    loadSimilar(D.meta);
  }
}
const seasonList = m =>
  [...new Set((m.videos || []).map(v => v.season).filter(s => s != null))].sort(
    (a, b) => (a === 0) - (b === 0) || a - b
  );
const sortedVideos = m =>
  (m.videos || [])
    .slice()
    .sort((a, b) => (a.season === 0) - (b.season === 0) || a.season - b.season || a.episode - b.episode);

function detailShell(m, loading) {
  const isS = m.type === 'series';
  const prog = S.progress[m.id];
  const nextUnw =
    isS && !loading
      ? sortedVideos(m)
          .filter(v => v.season !== 0)
          .find(v => !S.watched[v.id])
      : null;
  const playLbl = prog
    ? isS && prog.ep
      ? `Continuar ${prog.ep}`
      : 'Continuar'
    : isS
      ? nextUnw
        ? `Ver ${epLabel(nextUnw)}`
        : 'Ver'
      : 'Ver agora';
  return `<div class="dbg" style="background-image:url('${esc(m.background || IMG.bg(m.id))}')"></div>
  <div class="dwrap">
    <div class="dtop"><button class="btn gho ico" data-close-detail title="Voltar">${I.back}</button></div>
    <div class="dmain"><div>
      <img class="dlogo" src="${esc(m.logo || IMG.logo(m.id))}" alt="${esc(m.name || '')}" onerror="this.outerHTML='<h1 class=dtitle>${esc(m.name || '').replace(/'/g, '&#39;')}</h1>'">
      <div class="dmeta">${m.imdbRating ? `<span class="pill g">${I.star}${esc(m.imdbRating)}</span>` : ''}${m.releaseInfo ? `<span class="pill">${esc(m.releaseInfo)}</span>` : ''}${m.runtime ? `<span class="pill">${esc(m.runtime)}</span>` : ''}${isS ? '<span class="pill">Série</span>' : ''}${(m.genres || []).map(g => `<span class="pill">${esc(GPT[g] || g)}</span>`).join('')}</div>
      ${
        loading
          ? '<div class="sk" style="height:80px;border-radius:12px;max-width:640px;margin-bottom:24px"></div>'
          : `<p class="ddesc">${esc(m.description || 'Sem sinopse disponível.')}</p>
`
      }
      <div class="hbtns">${
        loading
          ? ''
          : `<button class="btn pri" data-dplay>${I.play}${esc(playLbl)}</button>
        ${(m.trailerStreams || []).length ? `<button class="btn gho" data-trailer>${I.yt}Trailer</button>` : ''}`
      }
        <button class="btn gho ico ${inLib(m.id) ? 'on' : ''}" data-lib="${esc(m.id)}" title="A minha lista">${inLib(m.id) ? I.check : I.plus}</button></div>
    </div><img class="dposter" src="${esc(m.poster || IMG.poster(m.id))}" alt="" onerror="this.style.visibility='hidden'"></div>
    ${!loading && isS ? episodesHTML(m) : ''}
    ${!loading ? castHTML(m) + ratingsHTML(m) : ''}
    ${!loading ? '<div class="dsec flush" id="similar"></div>' : ''}
  </div>`;
}
const initials = n =>
  String(n || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
function castList(m) {
  const ex = m.app_extras && Array.isArray(m.app_extras.cast) ? m.app_extras.cast : [];
  if (ex.length) return ex.slice(0, 20).map(c => ({ name: c.name, role: c.character, photo: c.photo }));
  const links = (m.links || []).filter(l => l.category === 'Cast').map(l => ({ name: l.name }));
  return (links.length ? links : (m.cast || []).map(n => ({ name: n }))).slice(0, 20);
}
function castHTML(m) {
  const c = castList(m);
  if (!c.length) return '';
  return `<section class="row dsec flush"><div class="rowh"><h2>Elenco</h2><div class="tsp"></div><button class="arr" data-scroll="-1">${I.left}</button><button class="arr" data-scroll="1">${I.right}</button></div>
    <div class="track castt">${c.map(p => `<button class="person" data-person="${esc(p.name)}" title="Procurar ${esc(p.name)}"><span class="ph"><i>${esc(initials(p.name))}</i>${p.photo ? `<img loading="lazy" src="${esc(p.photo)}" alt="" onerror="this.remove()">` : ''}</span><b>${esc(p.name)}</b>${p.role ? `<small>${esc(p.role)}</small>` : ''}</button>`).join('')}</div></section>`;
}
function ratingsHTML(m) {
  const r = parseFloat(m.imdbRating);
  const rel = m.released ? new Date(m.released) : null;
  const facts = [
    [
      'Estreia',
      rel && !isNaN(rel) ? rel.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
    ],
    ['Duração', m.runtime],
    ['País', m.country],
    ['Idioma', m.language],
    ['Realização', [].concat(m.director || []).join(', ')],
    [
      'Argumento',
      []
        .concat(m.writer || [])
        .slice(0, 3)
        .join(', ')
    ],
    ['Prémios', m.awards]
  ].filter(x => x[1]);
  if (isNaN(r) && !facts.length) return '';
  return `<div class="dsec"><div class="rowh" style="padding:0"><h2>Avaliações e informação</h2></div>
    <div class="rinfo">${!isNaN(r) ? `<div class="rate-card"><div class="ring" style="--p:${r * 10}"><span>${r.toFixed(1)}</span></div><div><b>Nota</b><small>${r >= 8 ? 'Excelente' : r >= 7 ? 'Muito bom' : r >= 6 ? 'Bom' : r >= 5 ? 'Razoável' : 'Fraco'} · de 10</small></div></div>` : ''}</div>
    <div class="facts">${facts.map(([k, v]) => `<div><small>${k}</small><b>${esc(v)}</b></div>`).join('')}</div></div>`;
}
function episodesHTML(m) {
  const ss = seasonList(m);
  if (!ss.length) return '';
  const eps = sortedVideos(m).filter(v => v.season === D.season);
  return `<div class="dsec" id="epsec"><div class="rowh" style="padding:0;margin-bottom:14px"><h2>Episódios</h2><small>${eps.length} na temporada</small></div>
    <div class="stabs">${ss.map(s => `<button class="chip ${s === D.season ? 'on' : ''}" data-season="${s}">${s === 0 ? 'Extras' : 'Temporada ' + s}</button>`).join('')}</div>
    <div class="eps">${eps
      .map(v => {
        const p = progressFor(v.id),
          w = S.watched[v.id];
        const date = v.released ? new Date(v.released) : null,
          future = date && date > new Date();
        return `<button class="ep" data-ep="${esc(v.id)}" ${future ? 'style="opacity:.55"' : ''}><div class="eth"><img loading="lazy" src="${esc(v.thumbnail || m.background || '')}" alt="" onerror="this.style.display='none'"><span class="mk ${w ? 'on' : ''}" data-mark="${esc(v.id)}" title="${w ? 'Marcar como não visto' : 'Marcar como visto'}">✓</span>${p && p.d ? `<i class="bar"><b style="width:${(p.t / p.d) * 100}%"></b></i>` : ''}</div>
        <div class="etx"><b>${v.episode}. ${esc(v.name || v.title || 'Episódio ' + v.episode)}</b><small>${date && !isNaN(date) ? (future ? 'Estreia ' : '') + date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</small><p>${esc(v.overview || v.description || '')}</p></div></button>`;
      })
      .join('')}</div></div>`;
}
const epLabel = v => (v ? `T${v.season}·E${v.episode}` : '');

/* ---------- fontes (streams) ---------- */
const drawer = $('#drawer');
async function openStreams(m, video) {
  const type = m.type,
    vid = video ? video.id : m.id;
  $('#drTitle').textContent = m.name;
  $('#drSub').textContent = video ? `${epLabel(video)} · ${video.name || video.title || ''}` : m.releaseInfo || '';
  drawer.classList.add('open');
  syncHist();
  const body = $('#drBody');
  const srcs = ADDONS.filter(a => supports(a.m, 'stream', type, vid));
  const ctx = { meta: m, video, type, videoId: vid };
  let h = '';
  const resume = progressFor(vid);
  if (resume && resume.stream)
    h += `<div class="sgrp"><h4>Retomar</h4>${streamBtn(resume.stream, 'r', `Continuar em ${fmt(resume.t)}`)}</div>`;
  if (!video && (m.trailerStreams || []).length)
    h += `<div class="sgrp"><h4>${I.yt.replace('<svg', '<svg width="16" height="16"')} Trailers</h4>${m.trailerStreams.map((t, i) => streamBtn({ ytId: t.ytId, name: 'YouTube', title: t.title || 'Trailer' }, 't' + i)).join('')}</div>`;
  if (!srcs.length)
    h += `<div class="note"><b style="color:var(--tx)">Nenhum addon de fontes instalado.</b><br>O Vinovim não traz conteúdo próprio. Instala um addon que forneça fontes (“streams”) para este tipo de título, ou reproduz um ficheiro teu.</div><div class="inrow"><a class="btn sm acc" href="#addons">${I.puzzle}Gerir addons</a><button class="btn sm gho" data-localfile>${I.folder}Ficheiro local</button></div>`;
  srcs.forEach(
    (a, i) =>
      (h += `<div class="sgrp" id="sg${i}"><h4>${a.m.logo ? `<img src="${esc(a.m.logo)}" alt="" onerror="this.remove()">` : ''}${esc(a.m.name)}</h4><div><span class="spin"></span></div></div>`)
  );
  body.innerHTML = h;
  drawer._ctx = ctx;
  drawer._streams = {};
  if (resume && resume.stream) drawer._streams.r = resume.stream;
  (m.trailerStreams || []).forEach(
    (t, i) => (drawer._streams['t' + i] = { ytId: t.ytId, name: 'YouTube', title: t.title || 'Trailer' })
  );
  if (S.prefs.autoplay && resume && resume.stream) {
    ctx._auto = true;
    return play(resume.stream, ctx);
  }
  srcs.forEach(async (a, i) => {
    let out;
    try {
      const d = await getJSON(`${a.base}/stream/${type}/${vid}.json`);
      let list = d.streams || [];
      if (S.prefs.hideTorrent) list = list.filter(s => s.url || s.ytId || s.externalUrl);
      if (S.prefs.sortQ)
        list = list
          .map((s, j) => [s, j])
          .sort((x, y) => quality(y[0]) - quality(x[0]) || x[1] - y[1])
          .map(x => x[0]);
      if (S.prefs.autoplay && !ctx._auto && drawer._ctx === ctx) {
        const best = list.find(s => s.url);
        if (best) {
          ctx._auto = true;
          return play(best, ctx);
        }
      }
      out = list.length
        ? list
            .map((s, j) => {
              const k = `${i}_${j}`;
              drawer._streams[k] = s;
              return streamBtn(s, k);
            })
            .join('')
        : '<div class="note">Sem fontes deste addon para este título.</div>';
    } catch (e) {
      out = '<div class="note">O addon não respondeu.</div>';
    }
    const g = $('#sg' + i);
    if (g && drawer._ctx === ctx) g.lastElementChild.innerHTML = out;
  });
}
function quality(s) {
  const t = `${s.name || ''} ${s.title || ''} ${s.description || ''}`;
  return /2160|4k|uhd/i.test(t) ? 4 : /1080/.test(t) ? 3 : /720/.test(t) ? 2 : /480|sd\b/i.test(t) ? 1 : 0;
}
function streamBtn(s, k, override) {
  const playable = s.url || s.ytId || s.externalUrl;
  const ic = s.ytId ? I.yt : s.infoHash ? I.magnet : s.externalUrl ? I.link : I.play;
  const title = override || (s.name || 'Fonte').split('\n')[0];
  const desc =
    s.description ||
    s.title ||
    (s.infoHash ? 'Torrent — não suportado no browser' : s.externalUrl ? 'Abre fora do Vinovim' : '');
  return `<button class="st" data-stream="${k}" ${playable ? '' : 'disabled'}><span class="si">${ic}</span><div style="min-width:0"><b>${esc(title)}</b><span>${esc(desc)}</span></div></button>`;
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawer._ctx = null;
}
