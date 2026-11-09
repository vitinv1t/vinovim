/* Vinovim — cinema em casa
   Ecrã de pausa · Continuar noutro dispositivo · Início da época · Contagem para estreias ·
   “Da última vez…” · Protetor de ecrã com o título que estás a ver */
(() => {
'use strict';
const API = /^https?:$/.test(location.protocol) ? '' : ((window.vinovimNative && window.vinovimNative.remote) || 'https://vinovim.vercel.app');
const PD = () => S.pdata[S.activeProfile] || {};
const ON = k => S.prefs['c8_' + k] !== false;
const kids = () => !!(curProfile() || {}).kids;
const IS_CAP = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const castOf = m => (m.cast && m.cast.length ? m.cast : (m.links || []).filter(l => l.category === 'Cast').map(l => l.name)).slice(0, 4);
const yearOf = m => String(m.releaseInfo || m.year || '').slice(0, 4);
const epName = v => v ? (v.name || v.title || '') : '';
const trunc = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const fmtLeft = s => { const m = Math.max(1, Math.round(s / 60)); return m >= 60 ? Math.floor(m / 60) + ' h ' + (m % 60 ? (m % 60) + ' min' : '') : m + ' min'; };
const auth = () => { try { return JSON.parse(localStorage.getItem('vinovim.auth')) || {}; } catch (e) { return {}; } };

document.head.insertAdjacentHTML('beforeend', `<style>
/* ecrã de pausa */
#vvPause{position:absolute;inset:0;z-index:4;display:flex;align-items:center;padding:0 6%;background:linear-gradient(90deg,rgba(5,4,8,.92) 0%,rgba(5,4,8,.75) 45%,rgba(5,4,8,.2) 100%);opacity:0;pointer-events:none;transition:opacity .6s}
#vvPause.show{opacity:1}
#vvPause .pw{max-width:min(620px,60vw)}
#vvPause small{display:block;color:#b9b4c7;font-size:15px;letter-spacing:.04em;margin-bottom:10px}
#vvPause h1{font-family:var(--fd);font-weight:800;font-size:clamp(30px,4.4vw,58px);line-height:1.02;letter-spacing:-.02em;margin:0 0 12px}
#vvPause .c8ep{font-size:18px;font-weight:700;margin:0 0 12px}
#vvPause .c8mt{display:flex;gap:12px;flex-wrap:wrap;color:#cfc9da;font-size:14px;margin-bottom:14px}
#vvPause .c8mt span+span:before{content:'·';margin-right:12px;color:#7d7790}
#vvPause p{color:#ddd6e5;font-size:16px;line-height:1.55;margin:0 0 16px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
#vvPause .cs{color:#9f99ad;font-size:14px}#vvPause .cs b{color:#ddd6e5;font-weight:600}
#vvPause .pz{position:absolute;right:6%;bottom:12%;font-size:13px;letter-spacing:.3em;color:#9f99ad;text-transform:uppercase}
@media (max-width:820px){#vvPause .pw{max-width:88vw}#vvPause p{-webkit-line-clamp:3;font-size:14px}}
/* da última vez / continuar noutro dispositivo */
#vvRecap{position:absolute;inset:0;z-index:6;display:none;place-items:center;padding:24px;background:radial-gradient(800px 500px at 30% 70%,rgba(224,49,91,.18),transparent 60%),rgba(5,4,8,.94)}
#vvRecap.show{display:grid;animation:fade .3s}
#vvRecap .rc{width:min(560px,100%)}
#vvRecap small{color:#b9b4c7;font-size:14px;letter-spacing:.04em}
#vvRecap h2{font-family:var(--fd);font-size:clamp(26px,3.6vw,40px);font-weight:800;margin:6px 0 18px;letter-spacing:-.02em}
#vvRecap .box{display:flex;gap:16px;align-items:flex-start;padding:16px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:12px}
#vvRecap .box img{width:150px;aspect-ratio:16/9;object-fit:cover;border-radius:10px;flex:none;background:#1b1824}
#vvRecap .box b{display:block;margin-bottom:6px}#vvRecap .box p{margin:0;color:#c9c3d4;font-size:14px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
#vvRecap .bt{display:flex;gap:10px;margin-top:18px}
@media (max-width:620px){#vvRecap .box img{width:100px}}
#vvHand{position:fixed;left:50%;bottom:28px;z-index:96;transform:translate(-50%,40px);opacity:0;transition:.35s;display:flex;align-items:center;gap:14px;padding:12px 14px 12px 12px;border-radius:18px;background:rgba(20,17,27,.97);border:1px solid rgba(255,255,255,.1);box-shadow:0 24px 60px rgba(0,0,0,.6);width:min(560px,calc(100vw - 24px))}
#vvHand.show{transform:translate(-50%,0);opacity:1}
#vvHand img{width:96px;aspect-ratio:16/9;object-fit:cover;border-radius:10px;background:#1b1824;flex:none}
#vvHand .c8tx{flex:1;min-width:0}#vvHand .c8tx small{color:#9f99ad;font-size:12px}#vvHand .c8tx b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#vvHand .c8bar{height:3px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:6px;overflow:hidden}#vvHand .c8bar i{display:block;height:100%;background:var(--ac)}
#vvHand .btn{flex:none}
@media (max-width:820px){#vvHand{bottom:84px}}
/* época */
.vvSeason{position:absolute;left:0;right:0;top:0;height:min(100vh,760px);pointer-events:none;overflow:hidden;z-index:1}
.vvSeason i{position:absolute;top:-8%;font-style:normal;animation:vvfall linear infinite;opacity:.85;will-change:transform}
@keyframes vvfall{to{transform:translate3d(var(--dx,30px),115vh,0) rotate(var(--rot,180deg))}}
@media (prefers-reduced-motion:reduce){.vvSeason i{animation:none;display:none}}
.vvSeasonGlow{position:absolute;left:0;right:0;top:0;height:min(100vh,760px);pointer-events:none;z-index:0;background:var(--sg);mix-blend-mode:screen;opacity:.55}
.vvSeasonTag{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:99px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);font-size:13px;font-weight:700;margin-bottom:12px;backdrop-filter:blur(6px)}
/* contagem para estreias */
.vvCount .track{gap:14px}
.vvCd{flex:0 0 auto;width:300px;aspect-ratio:16/9;border-radius:14px;overflow:hidden;position:relative;background:#1b1824;cursor:pointer;border:0;padding:0;color:#fff;text-align:left;scroll-snap-align:start}
.vvCd img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vvCd:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.88),rgba(0,0,0,.1) 65%)}
.vvCd .in{position:absolute;left:14px;right:14px;bottom:12px;z-index:1}
.vvCd .in b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vvCd .cd{display:inline-block;margin-top:6px;padding:4px 10px;border-radius:99px;background:var(--ac);font-size:12.5px;font-weight:800}
.vvCd .cd.ok{background:#16c784}
.vvCd:hover,.vvCd:focus-visible{outline:none;box-shadow:0 0 0 2px var(--ac)}
@media (max-width:820px){.vvCd{width:240px}}
/* protetor de ecrã */
#vvSaver{position:fixed;inset:0;z-index:250;background:radial-gradient(900px 600px at 70% 20%,rgba(224,49,91,.25),transparent 60%),radial-gradient(800px 600px at 10% 90%,rgba(124,92,255,.2),transparent 60%),#07060a;opacity:0;pointer-events:none;transition:opacity 1.2s;cursor:none}
#vvSaver.show{opacity:1;pointer-events:auto}
#vvSaver .c8im{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 2s;transform:scale(1.04)}
#vvSaver .c8im.on{opacity:1;animation:vvkb 14s ease-in-out forwards}
@keyframes vvkb{from{transform:scale(1.04) translate(0,0)}to{transform:scale(1.14) translate(-2%,-1.5%)}}
#vvSaver:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.8),transparent 45%),linear-gradient(90deg,rgba(0,0,0,.45),transparent 50%)}
#vvSaver .cap{position:absolute;left:6%;bottom:9%;z-index:1;max-width:70vw;text-shadow:0 2px 20px rgba(0,0,0,.6)}
#vvSaver .cap small{display:block;font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:#cfc9da;margin-bottom:10px}
#vvSaver .cap h1{font-family:var(--fd);font-size:clamp(34px,5vw,70px);font-weight:800;letter-spacing:-.02em;margin:0 0 10px;line-height:1}
#vvSaver .cap .c8mt{display:flex;gap:14px;font-size:16px;color:#e7e2ee}
#vvSaver .cap .c8mt .r{color:#f5c26b;font-weight:700}
#vvSaver .clk{position:absolute;right:5%;top:6%;z-index:1;font-family:var(--fd);font-size:clamp(28px,3vw,44px);font-weight:700;color:rgba(255,255,255,.85)}
#vvSaver .c8lg{position:absolute;right:5%;bottom:9%;z-index:1;width:46px;opacity:.75}
</style>`);

/* =================== 1. ecrã de pausa =================== */
const pz = document.createElement('div'); pz.id = 'vvPause'; P.appendChild(pz);
let pzT = null;
function pauseInfo() {
  const m = PC && PC.meta; if (!m) return '';
  const v = PC.video, isS = m.type === 'series' && v;
  const meta = [yearOf(m), m.runtime, m.imdbRating ? '★ ' + m.imdbRating : ''].filter(Boolean);
  const desc = isS ? (v.overview || v.description || m.description) : m.description;
  const cast = castOf(m);
  return `<div class="pw"><small>Estás a ver</small><h1>${esc(m.name)}</h1>
    ${isS ? `<div class="c8ep">T${v.season}:E${v.episode}${epName(v) ? ' · ' + esc(epName(v)) : ''}</div>` : ''}
    ${meta.length ? `<div class="c8mt">${meta.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
    ${desc ? `<p>${esc(desc)}</p>` : ''}
    ${cast.length ? `<div class="cs"><b>Elenco:</b> ${esc(cast.join(', '))}</div>` : ''}</div><div class="pz">Em pausa</div>`;
}
const hidePause = () => { clearTimeout(pzT); pz.classList.remove('show'); };
function armPause() {
  clearTimeout(pzT);
  if (!ON('pause') || !PC || !PC.meta || PC.stream.ytId) return;
  pzT = setTimeout(() => {
    if (!V.paused || V.ended || !P.classList.contains('open') || P.classList.contains('mini') || document.querySelector('#vvRecap.show') || document.querySelector('#player.v5end')) return;
    pz.innerHTML = pauseInfo(); pz.classList.add('show');
  }, 5000);
}
V.addEventListener('pause', armPause);
V.addEventListener('play', hidePause);
V.addEventListener('seeking', hidePause);
['pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => P.addEventListener(ev, () => { if (pz.classList.contains('show') || pzT) { hidePause(); if (V.paused) armPause(); } }, { passive: true }));

/* =================== 2. “Da última vez…” =================== */
const rc = document.createElement('div'); rc.id = 'vvRecap'; P.appendChild(rc);
let recapCtx = null;
function showRecap(m, cur, prevV, last) {
  const days = Math.round((Date.now() - last.updated) / 864e5);
  const left = last.d && last.t ? fmtLeft(last.d - last.t) : '';
  rc.innerHTML = `<div class="rc"><small>Da última vez · há ${days} ${days === 1 ? 'dia' : 'dias'}</small><h2>${esc(m.name)}</h2>
    ${prevV ? `<div class="box">${prevV.thumbnail ? `<img src="${esc(prevV.thumbnail)}" alt="">` : ''}<div><b>No episódio anterior · T${prevV.season}:E${prevV.episode}${epName(prevV) ? ' · ' + esc(epName(prevV)) : ''}</b><p>${esc(trunc(prevV.overview || prevV.description || 'Sem resumo disponível.', 320))}</p></div></div>` : ''}
    ${cur ? `<div class="box">${cur.thumbnail ? `<img src="${esc(cur.thumbnail)}" alt="">` : ''}<div><b>Ficaste em T${cur.season}:E${cur.episode}${epName(cur) ? ' · ' + esc(epName(cur)) : ''}</b><p>${left ? 'Faltam ' + left + '. ' : ''}${esc(trunc(cur.overview || cur.description || '', 220))}</p></div></div>` : ''}
    <div class="bt"><button class="btn acc" data-rgo>${I.play || ''} Continuar</button><button class="btn gho" data-rclose>Voltar</button></div></div>`;
  rc.classList.add('show');
  rc.querySelector('[data-rgo]').onclick = () => { rc.classList.remove('show'); V.play().catch(() => {}); };
  rc.querySelector('[data-rclose]').onclick = () => { rc.classList.remove('show'); if (typeof closePlayer === 'function') closePlayer(); };
  setTimeout(() => rc.querySelector('[data-rgo]').focus(), 50);
}
const _play = window.play;
window.play = function (stream, ctx) {
  recapCtx = null;
  try {
    const m = ctx && ctx.meta, last = m && S.progress[m.id];
    if (ON('recap') && m && m.type === 'series' && last && last.updated && Date.now() - last.updated > 5 * 864e5) {
      const vs = (m.videos || []).filter(v => v.season > 0).sort((a, b) => a.season - b.season || a.episode - b.episode);
      const i = vs.findIndex(v => v.id === (ctx.videoId || last.videoId));
      recapCtx = { m, cur: vs[i] || ctx.video, prev: i > 0 ? vs[i - 1] : null, last: Object.assign({}, last) };
    }
  } catch (e) { recapCtx = null; }
  return _play.apply(this, arguments);
};
V.addEventListener('playing', () => {
  if (!recapCtx) return;
  const r = recapCtx; recapCtx = null;
  V.pause(); hidePause(); showRecap(r.m, r.cur, r.prev, r.last);
});

/* =================== 3. continuar noutro dispositivo =================== */
let DEV = ''; try { DEV = localStorage.getItem('vinovim.dev') || ''; if (!DEV) { DEV = Math.random().toString(36).slice(2, 12); localStorage.setItem('vinovim.dev', DEV); } } catch (e) {}
const devName = () => document.documentElement.classList.contains('tv') ? 'na TV' : NATIVE ? 'no PC' : IS_CAP ? 'no telemóvel' : 'no browser';
async function nowApi(method, body) {
  const a = auth(); if (!a.token) return null;
  const r = await fetch(API + '/api/account?a=now', { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  return r.ok ? r.json() : null;
}
let lastPush = 0;
function pushNow(force) {
  if (!ON('handoff') || !PC || !PC.meta || PC.stream.ytId || PC.stream._local || !V.duration || !isFinite(V.duration)) return;
  if (!force && Date.now() - lastPush < 20000) return;
  lastPush = Date.now();
  const m = PC.meta, v = PC.video;
  nowApi('PUT', { dev: DEV, where: devName(), profile: S.activeProfile, id: m.id, type: m.type, name: m.name, poster: m.poster, background: m.background, videoId: PC.videoId || m.id, season: v ? v.season : null, ep: v ? epLabel(v) : '', epName: epName(v), thumb: v && v.thumbnail, t: Math.floor(V.currentTime), d: Math.floor(V.duration), stream: PC.stream }).catch(() => {});
}
V.addEventListener('timeupdate', () => pushNow(false));
V.addEventListener('pause', () => pushNow(true));
let handShown = false;
async function checkHandoff() {
  if (handShown || !ON('handoff') || kids() || P.classList.contains('open')) return;
  let r; try { r = await nowApi('GET'); } catch (e) { return; }
  if (!r || !r.id || r.dev === DEV || r.profile !== S.activeProfile) return;
  if (Date.now() - (r.at || 0) > 2 * 864e5 || !(r.t > 60) || (r.d && r.t > r.d - 120)) return;
  const loc = S.progress[r.id]; if (loc && loc.updated > (r.at || 0) - 5000 && loc.videoId === r.videoId && Math.abs((loc.t || 0) - r.t) < 30) return;
  handShown = true;
  const el = document.createElement('div'); el.id = 'vvHand';
  el.innerHTML = `<img src="${esc(r.thumb || r.background || IMG.bg(r.id))}" alt="" onerror="this.style.visibility='hidden'"><div class="c8tx"><small>Estavas a ver ${esc(r.where || 'noutro dispositivo')}</small><b>${esc(r.name)}${r.ep ? ' · ' + esc(r.ep) : ''}</b><div class="c8bar"><i style="width:${r.d ? Math.round(r.t / r.d * 100) : 0}%"></i></div></div><button class="btn sm acc" data-hgo>Continuar aqui</button><button class="btn sm gho" data-hno>Agora não</button>`;
  document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
  const close = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); };
  const auto = setTimeout(close, 20000);
  el.querySelector('[data-hno]').onclick = () => { clearTimeout(auto); close(); };
  el.querySelector('[data-hgo]').onclick = async () => {
    clearTimeout(auto); close();
    S.progress[r.id] = { id: r.id, type: r.type, name: r.name, poster: r.poster, background: r.background, videoId: r.videoId, season: r.season, ep: r.ep, thumb: r.thumb, t: r.t, d: r.d, updated: Date.now(), stream: r.stream };
    save();
    try {
      const m = await getMeta(r.type, r.id); const v = (m.videos || []).find(x => x.id === r.videoId);
      if (r.stream && r.stream.url) play(r.stream, { meta: m, video: v, type: m.type, videoId: r.videoId });
      else openStreams(m, v);
    } catch (e) { toast('Sem ligação'); }
  };
}
function whenReady(fn) {
  const tryNow = () => {
    if (document.documentElement.classList.contains('vvgate') || document.getElementById('vvLogin') || document.querySelector('#profiles.open')) return false;
    fn(); return true;
  };
  if (tryNow()) return;
  const iv = setInterval(() => { if (tryNow()) clearInterval(iv); }, 1500);
  setTimeout(() => clearInterval(iv), 10 * 60 * 1000);
}

/* =================== 4. início da época =================== */
function season() {
  const q = (location.search.match(/[?&]epoca=([a-z]+)/) || [])[1];
  const d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
  const id = q || (md >= 1015 && md <= 1102 ? 'halloween' : md >= 1108 && md <= 1112 ? 'magusto' : (md >= 1201 || md <= 106) ? 'natal' : md >= 207 && md <= 214 ? 'namorados' : md >= 621 && md <= 915 ? 'verao' : '');
  return {
    halloween: { tag: '🎃 Especial Halloween', fx: ['🦇', '🎃', '🕸️'], n: 14, glow: 'radial-gradient(900px 500px at 70% 10%,rgba(255,120,20,.35),transparent 60%)', rows: [['Terror para esta noite', 'movie', { genre: 'Horror' }], ['Halloween', 'movie', { search: 'halloween' }]] },
    magusto: { tag: '🌰 São Martinho', fx: ['🍂', '🍁', '🌰'], n: 16, glow: 'radial-gradient(900px 500px at 70% 10%,rgba(214,120,40,.32),transparent 60%)', rows: [['Para ver à lareira', 'movie', { genre: 'Family' }], ['Mistérios de outono', 'movie', { genre: 'Mystery' }]] },
    natal: { tag: '🎄 Especial Natal', fx: ['❄', '❅', '❆'], n: 26, glow: 'radial-gradient(900px 500px at 70% 10%,rgba(60,170,110,.28),transparent 60%),radial-gradient(700px 400px at 20% 0,rgba(224,49,91,.25),transparent 60%)', rows: [['Especial Natal', 'movie', { search: 'christmas' }], ['Filmes para ver em família', 'movie', { genre: 'Family' }]] },
    namorados: { tag: '💘 Dia dos Namorados', fx: ['💗', '💕', '💖'], n: 14, glow: 'radial-gradient(900px 500px at 70% 10%,rgba(255,80,140,.3),transparent 60%)', rows: [['Romances para hoje', 'movie', { genre: 'Romance' }], ['Comédias românticas', 'movie', { search: 'love' }]] },
    verao: { tag: '☀️ Verão no Vinovim', fx: ['☀️', '🌴', '🏖️'], n: 10, glow: 'radial-gradient(900px 500px at 75% 5%,rgba(255,200,60,.32),transparent 60%)', rows: [['Comédias de verão', 'movie', { genre: 'Comedy' }], ['Aventuras de verão', 'movie', { genre: 'Adventure' }]] }
  }[id] || null;
}
async function seasonHome() {
  const s = season(); const home = document.querySelector('#app .home') || document.querySelector('#app .view');
  if (!s || !ON('season') || kids() || !home || home.querySelector('.vvSeason')) return;
  if (getComputedStyle(home).position === 'static') home.style.position = 'relative';
  const fx = document.createElement('div'); fx.className = 'vvSeason';
  fx.innerHTML = Array.from({ length: s.n }, (_, i) => `<i style="left:${Math.round(Math.random() * 100)}%;font-size:${12 + Math.round(Math.random() * 16)}px;animation-duration:${9 + Math.random() * 10}s;animation-delay:-${Math.random() * 15}s;--dx:${Math.round(Math.random() * 120 - 60)}px;--rot:${Math.round(Math.random() * 360)}deg">${s.fx[i % s.fx.length]}</i>`).join('');
  const glow = document.createElement('div'); glow.className = 'vvSeasonGlow'; glow.style.setProperty('--sg', s.glow);
  home.prepend(glow); home.prepend(fx);
  const hm = document.querySelector('#hero .hmeta'); if (hm && !document.querySelector('.vvSeasonTag')) hm.insertAdjacentHTML('beforebegin', `<div class="vvSeasonTag">${s.tag}</div>`);
  const rows = $('#rows'); if (!rows) return;
  const out = [];
  for (const [title, type, extra] of s.rows) {
    try { const list = (await catalog(cinemeta(), type, 'top', extra)).filter(m => m.poster).slice(0, 20); if (list.length >= 4) out.push(rowHTML(title, list.map(card).join(''), s.tag)); } catch (e) {}
  }
  if (!out.length || !document.body.contains(rows)) return;
  const anchor = rows.querySelector('.vvCount') || [...rows.children].find(r => /Continuar a ver|Continue watching/i.test(r.querySelector('h2')?.textContent || '')) || null;
  const html = out.join('');
  if (anchor) anchor.insertAdjacentHTML('afterend', html); else rows.insertAdjacentHTML('afterbegin', html);
}

/* =================== 5. contagem para estreias =================== */
function countLabel(d) {
  if (!d) return ['Em breve', false];
  const now = new Date(), a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), b0 = new Date(d), b = new Date(b0.getFullYear(), b0.getMonth(), b0.getDate()).getTime();
  const days = Math.round((b - a) / 864e5);
  if (d <= Date.now()) return ['Já disponível', true];
  if (days <= 0) { const h = Math.max(1, Math.round((d - Date.now()) / 36e5)); return ['Estreia hoje · daqui a ' + h + ' h', false]; }
  if (days === 1) return ['Estreia amanhã', false];
  return ['Estreia em ' + days + ' dias', false];
}
function countdownRow() {
  if (!ON('countdown') || kids()) return;
  const rows = $('#rows'); if (!rows || rows.querySelector('.vvCount')) return;
  const rm = Object.values(PD().remind || {}).filter(x => !x.done || x.done > Date.now() - 3 * 864e5).sort((a, b) => (a.date || 9e15) - (b.date || 9e15));
  if (!rm.length) return;
  const cards = rm.slice(0, 12).map(x => { const [lab, ok] = countLabel(x.done || x.date); return `<button class="vvCd" data-open="${esc(x.type)}|${esc(x.id)}"><img src="${esc(IMG.bg(x.id))}" alt="" loading="lazy" onerror="this.src='${esc(x.poster || '')}'"><div class="in"><b>${esc(x.name)}</b><span class="cd ${ok ? 'ok' : ''}">${esc(lab)}</span></div></button>`; }).join('');
  rows.insertAdjacentHTML('afterbegin', `<section class="row vvCount"><div class="rowh"><h2>Estreias que estás à espera</h2><div class="tsp"></div><button class="arr" data-scroll="-1">${I.left}</button><button class="arr" data-scroll="1">${I.right}</button></div><div class="track">${cards}</div></section>`);
  [...rows.querySelectorAll('.row:not(.vvCount)')].forEach(r => { if (/^(Os teus lembretes)$/i.test(r.querySelector('h2')?.textContent || '')) r.remove(); });
}
const _home = VIEWS.home;
VIEWS.home = async function () {
  const r = await _home.apply(VIEWS, arguments);
  try { countdownRow(); } catch (e) {}
  seasonHome().catch(() => {});
  return r;
};

/* =================== 6. protetor de ecrã com o título que estás a ver =================== */
const sv = document.createElement('div'); sv.id = 'vvSaver';
sv.innerHTML = '<div class="c8im"></div><div class="c8im"></div><div class="cap"></div><div class="clk"></div><img class="c8lg" src="icon.svg" alt="">';
document.body.appendChild(sv);
const SAVER_MIN = () => Math.max(1, +S.prefs.c8_saverMin || 4);
let idleT = null, svTimer = null, svClock = null, svIdx = 0, svOn = false;
async function saverSubject() {
  // 1) o vídeo em pausa  2) a página do título aberta  3) o último título que viste
  if (PC && PC.meta && P.classList.contains('open')) return { m: PC.meta, v: PC.video, why: 'Em pausa' };
  if (typeof D !== 'undefined' && D.meta && $('#detail') && $('#detail').classList.contains('open')) return { m: D.meta, v: null, why: 'A ver os detalhes' };
  const last = Object.values(S.progress || {}).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0];
  if (!last) return null;
  try { const m = await getMeta(last.type, last.id); const v = (m.videos || []).find(x => x.id === last.videoId); return { m, v, why: 'Continuar a ver' }; } catch (e) { return null; }
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
  const sub = await saverSubject(); if (!sub) return;
  const { m, v, why } = sub;
  const imgs = saverImages(m, v); if (!imgs.length) return;
  const meta = [m.imdbRating ? `<span class="r">★ ${esc(m.imdbRating)}</span>` : '', yearOf(m) ? `<span>${esc(yearOf(m))}</span>` : '', v ? `<span>T${v.season}:E${v.episode}${epName(v) ? ' · ' + esc(epName(v)) : ''}</span>` : (m.runtime ? `<span>${esc(m.runtime)}</span>` : '')].filter(Boolean).join('');
  sv.querySelector('.cap').innerHTML = `<small>${esc(why)}</small><h1>${esc(m.name)}</h1><div class="c8mt">${meta}</div>`;
  const ims = sv.querySelectorAll('.c8im'); svIdx = 0;
  const show = () => {
    const el = ims[svIdx % 2], other = ims[(svIdx + 1) % 2], src = imgs[svIdx % imgs.length];
    const pre = new Image(); pre.onload = () => { el.style.backgroundImage = `url("${src.replace(/"/g, '%22')}")`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); other.classList.remove('on'); };
    pre.src = src; svIdx++;
  };
  const tick = () => { const d = new Date(); sv.querySelector('.clk').textContent = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }); };
  show(); tick(); svTimer = setInterval(show, 9000); svClock = setInterval(tick, 15000);
  svOn = true; sv.classList.add('show'); hidePause();
}
function stopSaver() {
  if (!svOn) return;
  svOn = false; clearInterval(svTimer); clearInterval(svClock); sv.classList.remove('show');
  if (P.classList.contains('open') && V.paused) armPause();
}
function bump() {
  if (svOn) stopSaver();
  clearTimeout(idleT);
  idleT = setTimeout(startSaver, SAVER_MIN() * 60 * 1000);
}
['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, bump, { passive: true, capture: true }));
V.addEventListener('play', bump);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSaver(); else bump(); });

/* =================== definições =================== */
const OPTS = [
  ['pause', 'Ecrã de pausa', 'Ao pausar, mostra o título, o episódio, a sinopse e o elenco'],
  ['recap', '“Da última vez…”', 'Ao voltar a uma série depois de uns dias, mostra onde ficaste'],
  ['handoff', 'Continuar noutro dispositivo', 'Retoma no PC, no telemóvel ou na TV o que estavas a ver (precisa de conta)'],
  ['season', 'Início da época', 'Decoração e filas especiais no Natal, Halloween, São Martinho e verão'],
  ['countdown', 'Contagem para estreias', 'Os títulos com “Avisa-me” aparecem no topo com a contagem'],
  ['saver', 'Protetor de ecrã', 'Depois de uns minutos parado, mostra imagens do título que estás a ver']
];
const _settings = VIEWS.settings;
VIEWS.settings = async function () {
  const r = await _settings.apply(VIEWS, arguments);
  const pad = document.querySelector('#app .pad'); if (!pad || kids()) return r;
  const html = `<div class="panel"><h3>Experiência de cinema em casa</h3><p class="m">Os detalhes que tornam o Vinovim mais teu.</p>
    ${OPTS.map(([k, l, s]) => `<div class="srow"><div class="c8tx"><b>${l}</b><small>${s}</small></div><button class="tg ${ON(k) ? 'on' : ''}" data-c8="${k}"></button></div>`).join('')}
    <div class="srow"><div class="c8tx"><b>Protetor de ecrã começa ao fim de</b><small>Minutos sem mexer no Vinovim</small></div><select class="sel" id="c8min">${[2, 4, 8, 15].map(n => `<option value="${n}" ${SAVER_MIN() === n ? 'selected' : ''}>${n} min</option>`).join('')}</select></div></div>`;
  const grp = pad.querySelector('.v6grp[data-g="Aparência"]');
  (grp || pad).insertAdjacentHTML('beforeend', html);
  pad.querySelectorAll('[data-c8]').forEach(b => b.onclick = () => { const k = b.dataset.c8; S.prefs['c8_' + k] = !ON(k); save(); b.classList.toggle('on', ON(k)); if (k === 'pause' && !ON(k)) hidePause(); });
  const sel = pad.querySelector('#c8min'); if (sel) sel.onchange = () => { S.prefs.c8_saverMin = +sel.value; save(); bump(); };
  return r;
};

/* =================== arranque =================== */
const _afterBoot = window.afterBoot;
window.afterBoot = function () {
  _afterBoot();
  bump();
  whenReady(() => setTimeout(checkHandoff, 2500));
  setTimeout(() => { if (location.hash.slice(1) === 'home' || !location.hash) { try { countdownRow(); } catch (e) {} seasonHome().catch(() => {}); } }, 1500);
};
document.addEventListener('visibilitychange', () => { if (!document.hidden) { handShown = false; whenReady(() => setTimeout(checkHandoff, 1500)); } });
})();
