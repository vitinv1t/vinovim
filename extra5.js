/* vinovim — funcionalidades extra (v1.7) · experiência estilo Netflix, só para ti
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

/* =================== estilos =================== */
document.head.insertAdjacentHTML('beforeend', `<style>
#vvIntro{position:fixed;inset:0;z-index:300;background:#000;display:grid;place-items:center;transition:opacity .5s}
#vvIntro.out{opacity:0;pointer-events:none}
#vvIntro .lg{width:min(34vw,220px);aspect-ratio:1;position:relative;animation:vin 2.1s cubic-bezier(.6,0,.2,1) forwards}
#vvIntro svg{width:100%;height:100%;overflow:visible}
#vvIntro .v{stroke-dasharray:90;stroke-dashoffset:90;animation:vdraw .9s .25s cubic-bezier(.6,0,.2,1) forwards}
#vvIntro .dot{transform-origin:24px 13px;transform:scale(0);animation:vdot .35s 1s cubic-bezier(.2,1.8,.4,1) forwards}
#vvIntro .rays{position:absolute;inset:-60% -200%;background:repeating-linear-gradient(90deg,transparent 0 9px,rgba(224,49,91,.0) 9px 10px);opacity:0}
#vvIntro .name{position:absolute;left:50%;top:calc(50% + min(19vw,125px));transform:translateX(-50%);font-family:var(--fd);font-weight:800;font-size:clamp(22px,4vw,34px);letter-spacing:.3em;color:#fff;opacity:0;animation:vname .6s 1.15s forwards}
#vvIntro .burst{position:absolute;inset:0;margin:auto;width:10px;height:10px;border-radius:50%;box-shadow:0 0 120px 60px rgba(224,49,91,.55),0 0 260px 140px rgba(124,92,255,.35);opacity:0;animation:vburst 1.2s .95s ease-out forwards}
@keyframes vin{0%{transform:scale(.6);opacity:0}25%{opacity:1}70%{transform:scale(1)}100%{transform:scale(1.04)}}
@keyframes vdraw{to{stroke-dashoffset:0}}@keyframes vdot{to{transform:scale(1)}}
@keyframes vname{from{opacity:0;letter-spacing:.8em}to{opacity:.95;letter-spacing:.3em}}
@keyframes vburst{0%{opacity:0;transform:scale(.3)}30%{opacity:1}100%{opacity:0;transform:scale(2.4)}}
.htrailer{position:absolute;inset:0;overflow:hidden;opacity:0;transition:opacity 1.2s;pointer-events:none;z-index:0}
.htrailer.on{opacity:1}.htrailer iframe{position:absolute;top:50%;left:50%;border:0;transform:translate(-50%,-50%) scale(1.18)}
.hero .hcon,.hero .hdots{z-index:2}.hero::after{z-index:1}
.hmute{position:absolute;right:40px;bottom:120px;z-index:3;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.5);background:rgba(0,0,0,.35);color:#fff;display:none;place-items:center;cursor:pointer}
.hmute.show{display:grid}.hmute svg{width:20px;height:20px}
.vvmatch{color:#46d369;font-weight:800}
.pill.vvmatch{background:rgba(70,211,105,.14);color:#46d369}
#vvPrev{position:fixed;z-index:85;border-radius:14px;overflow:hidden;background:#181520;box-shadow:0 18px 60px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.06);transform-origin:center;transform:scale(.7);opacity:0;transition:transform .22s cubic-bezier(.2,.8,.2,1),opacity .18s;pointer-events:none}
#vvPrev.show{transform:none;opacity:1;pointer-events:auto}
#vvPrev .pv{position:relative;aspect-ratio:16/9;background:#000 center/cover no-repeat;cursor:pointer}
#vvPrev .pv iframe{position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0;transition:opacity .8s;pointer-events:none;transform:scale(1.2)}
#vvPrev .pv iframe.on{opacity:1}
#vvPrev .pv b{position:absolute;left:12px;bottom:10px;right:12px;font-family:var(--fd);font-size:17px;text-shadow:0 2px 10px #000}
#vvPrev .pb2{padding:12px 14px 14px}
#vvPrev .row1{display:flex;gap:8px;align-items:center;margin-bottom:10px}
#vvPrev .row1 button{width:38px;height:38px;border-radius:50%;border:1.5px solid rgba(255,255,255,.45);background:rgba(255,255,255,.04);color:#fff;display:grid;place-items:center;cursor:pointer;padding:0}
#vvPrev .row1 button svg{width:18px;height:18px}
#vvPrev .row1 .pp{background:#fff;color:#000;border-color:#fff}
#vvPrev .row1 .sp{flex:1}
#vvPrev .row1 button.on{border-color:var(--ac);color:var(--ac)}
#vvPrev .meta2{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:13px;color:var(--mu)}
#vvPrev .meta2 .age{border:1px solid rgba(255,255,255,.4);padding:0 5px;border-radius:3px}
#vvPrev .gen{margin-top:7px;font-size:13px;color:var(--tx)}#vvPrev .gen i{color:var(--mu2);font-style:normal;margin:0 6px}
.t10row .track{gap:0}
.t10{display:flex;align-items:flex-end;flex:0 0 auto;width:250px;scroll-snap-align:start;background:none;border:0;padding:0;cursor:pointer;color:inherit;text-align:left}
.t10 .n{font-family:var(--fd);font-weight:900;font-size:190px;line-height:.74;letter-spacing:-.06em;color:var(--bg);-webkit-text-stroke:4px #59536a;margin-right:-26px;position:relative;z-index:0;user-select:none}
.t10 .pimg{width:140px;flex:none;position:relative;z-index:1}
.t10:hover .pimg,.t10:focus-visible .pimg{box-shadow:0 0 0 2px var(--ac),0 14px 34px rgba(0,0,0,.5)}
.t10:focus-visible{outline:none}
@media (max-width:820px){.t10{width:190px}.t10 .n{font-size:140px;-webkit-text-stroke:3px #59536a;margin-right:-20px}.t10 .pimg{width:108px}}
.rowh h2 em{font-style:normal;color:var(--ac2)}
.card.wide .wt small b{color:var(--tx);font-weight:700}
#player.v5end video{position:absolute;top:28px;right:28px;left:auto;width:42%;height:auto;aspect-ratio:16/9;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.7);transition:all .6s cubic-bezier(.2,.8,.2,1);z-index:4}
#player video{transition:all .6s cubic-bezier(.2,.8,.2,1)}
#vvEnd{position:absolute;inset:0;z-index:5;display:none;background:radial-gradient(90% 90% at 20% 80%,rgba(124,92,255,.18),transparent),linear-gradient(90deg,rgba(9,8,13,.97) 50%,rgba(9,8,13,.6));padding:60px 48px;flex-direction:column;justify-content:flex-end;pointer-events:auto}
#player.v5end #vvEnd{display:flex;animation:fade .5s}
#player.v5end .pui{opacity:0!important;pointer-events:none}
#vvEnd h3{font-family:var(--fd);font-size:30px;margin:0 0 4px}#vvEnd p{color:var(--mu);margin:0 0 18px}
#vvEnd .cards{display:flex;gap:16px;margin-bottom:22px}
#vvEnd .ec{width:min(230px,28vw);border-radius:14px;overflow:hidden;background:#181520;cursor:pointer;border:0;padding:0;color:inherit;text-align:left;transition:transform .2s}
#vvEnd .ec:hover,#vvEnd .ec:focus-visible{transform:scale(1.04);outline:2px solid var(--ac)}
#vvEnd .ec .im{aspect-ratio:16/9;background:#000 center/cover}
#vvEnd .ec div{padding:10px 12px}#vvEnd .ec b{display:block;font-size:14px}#vvEnd .ec small{font-size:12px}
#vvEnd .ec.first{outline:2px solid #fff}
#vvEnd .bar5{height:4px;border-radius:9px;background:rgba(255,255,255,.2);overflow:hidden;margin-top:6px}#vvEnd .bar5 i{display:block;height:100%;background:#fff;width:0}
@media (max-width:820px){#player.v5end video{width:60%;top:16px;right:16px}#vvEnd{padding:20px}#vvEnd .cards{overflow-x:auto}#vvEnd .ec{flex:none;width:200px}}
.nvsec{display:flex;align-items:baseline;gap:12px;margin:8px 0 14px}.nvsec h3{font-family:var(--fd);font-size:24px;margin:0}.nvsec small{color:var(--mu)}
.nvlist{display:flex;flex-direction:column;gap:18px;margin-bottom:34px}
.nvitem{display:grid;grid-template-columns:86px 1fr;gap:18px;align-items:stretch}
.nvdate{text-align:center;padding-top:6px}.nvdate b{display:block;font-family:var(--fd);font-size:34px;line-height:1}.nvdate small{color:var(--mu);text-transform:uppercase;font-size:12px;letter-spacing:.08em}
.nvbody{display:grid;grid-template-columns:minmax(200px,380px) 1fr;gap:18px;padding:14px;border-radius:18px;background:var(--card);border:1px solid var(--line);cursor:pointer}
.nvbody .im{aspect-ratio:16/9;border-radius:12px;background:#000 center/cover}
.nvbody h4{font-family:var(--fd);font-size:22px;margin:4px 0 6px}.nvbody p{color:var(--mu);font-size:14px;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.nvbody .when{color:var(--ac2);font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.06em}
@media (max-width:820px){.nvitem{grid-template-columns:54px 1fr;gap:10px}.nvdate b{font-size:24px}.nvbody{grid-template-columns:1fr}}
</style>`);

/* =================== gosto e “% para ti” =================== */
function tasteW() {
  const d = PD(), w = {}, add = (gs, k) => (gs || []).forEach(g => w[g] = (w[g] || 0) + k);
  Object.values((d.stats || {}).titles || {}).forEach(t => add(t.genres, Math.min(10, (t.secs || 0) / 3600)));
  const gb = d.genresById || {};
  Object.entries(d.ratings || {}).forEach(([id, r]) => add(gb[id], r > 0 ? 3 : -4));
  Object.values(S.library || {}).forEach(it => { const m = ITEMS.get(it.id); if (m) add(m.genres, 1); });
  return w;
}
let TW = null, TWt = 0;
const taste = () => { if (!TW || !Object.keys(TW).length || Date.now() - TWt > 8000) { TW = tasteW(); TWt = Date.now(); } return TW; };
function matchPct(m) {
  if (!P5('matchPct') || !m) return null;
  const w = taste(), vals = Object.values(w).filter(x => x > 0); if (!vals.length) return null;
  const max = Math.max(...vals), gs = m.genres || m.genre || [], r = parseFloat(m.imdbRating) || 0;
  let s;
  if (gs.length) { const sc = gs.reduce((a, g) => a + (w[g] || 0), 0) / (max * Math.min(gs.length, 2)); s = 62 + Math.max(-.5, Math.min(1, sc)) * 30; }
  else s = 70;
  if (r) s += (r - 6.8) * 3.2;
  const id = String(m.id || ''); s += (id.charCodeAt(id.length - 1) || 0) % 4;
  return Math.max(41, Math.min(99, Math.round(s)));
}
const matchHTML = m => { const p = matchPct(m); return p ? `<span class="vvmatch">${p}% para ti</span>` : ''; };

/* =================== 1. abertura animada =================== */
function tadum() {
  if (!P5('introSound')) return;
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return; const ac = new C(); if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t0 = ac.currentTime + .05, out = ac.createGain(); out.gain.value = .55; out.connect(ac.destination);
    const hit = (t, f, len, vol) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + .08); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(g); g.connect(out); o.start(t); o.stop(t + len + .05); };
    hit(t0 + .9, 58, .45, .9); hit(t0 + 1.12, 52, 1.6, 1);
    [130.8, 196, 261.6, 329.6].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = i % 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t0 + 1.12); lp.frequency.linearRampToValueAtTime(2400, t0 + 2); g.gain.setValueAtTime(0, t0 + 1.12); g.gain.linearRampToValueAtTime(.05, t0 + 1.5); g.gain.exponentialRampToValueAtTime(.001, t0 + 3.2); o.connect(lp); lp.connect(g); g.connect(out); o.start(t0 + 1.1); o.stop(t0 + 3.3); });
    setTimeout(() => ac.close().catch(() => {}), 4000);
  } catch (e) {}
}
(function intro() {
  if (!P5('intro')) return;
  try { if (sessionStorage.getItem('vv_intro')) return; sessionStorage.setItem('vv_intro', '1'); } catch (e) {}
  const h = location.hash.slice(1); if (/^(comando|colab|lista)=/.test(h)) return;
  const el = document.createElement('div'); el.id = 'vvIntro';
  el.innerHTML = `<div class="burst"></div><div class="lg"><svg viewBox="0 0 48 48"><defs><linearGradient id="vvig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0315b"/><stop offset="1" stop-color="#f5c26b"/></linearGradient></defs><rect width="48" height="48" rx="14" fill="url(#vvig)"/><path class="v" d="M14 13 L24 35 L34 13" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle class="dot" cx="24" cy="13" r="3" fill="#fff"/></svg></div><div class="name">VINOVIM</div>`;
  document.body.appendChild(el);
  const end = () => { el.classList.add('out'); setTimeout(() => el.remove(), 600); };
  el.addEventListener('click', end);
  tadum(); setTimeout(end, 2600);
})();

/* =================== 2. trailer no destaque =================== */
const ytURL = (id, extra) => `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${encodeURIComponent(id)}&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&enablejsapi=1${ORIGIN ? '&origin=' + encodeURIComponent(ORIGIN) : ''}${extra || ''}`;
const ytCmd = (ifr, func) => { try { ifr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*'); } catch (e) {} };
function sizeCover(box, ifr) { const W = box.clientWidth, H = box.clientHeight; if (!W || !H) return; if (W / H > 16 / 9) { ifr.style.width = W + 'px'; ifr.style.height = W * 9 / 16 + 'px'; } else { ifr.style.height = H + 'px'; ifr.style.width = H * 16 / 9 + 'px'; } }
const trailerOf = m => { const t = (m && (m.trailerStreams || [])[0]) || (m && (m.trailers || []).find(x => x.source)); return t ? (t.ytId || t.source) : null; };
let heroMuted = true;
const _hero = window.hero;
window.hero = function (list) {
  _hero(list);
  const el = $('#hero'); if (!el) return;
  let tmr = null, seq = 0;
  const attach = () => {
    clearTimeout(tmr); const my = ++seq;
    const id = el.querySelector('[data-open]')?.dataset.open; if (!id) return;
    const [type, mid] = id.split('|');
    const base = ITEMS.get(mid) || {}, hm = el.querySelector('.hmeta');
    if (hm && !hm.querySelector('.vvmatch')) { const mh = matchHTML(base); if (mh) hm.insertAdjacentHTML('afterbegin', mh); }
    if (!P5('heroTrailer') || location.protocol === 'file:') return;
    tmr = setTimeout(async () => {
      let m; try { m = await getMeta(type, mid); } catch (e) { return; }
      if (my !== seq || !document.body.contains(el)) return;
      const yt = trailerOf(m); if (!yt) return;
      el.querySelector('.htrailer')?.remove();
      el.insertAdjacentHTML('afterbegin', `<div class="htrailer"><iframe src="${ytURL(yt, '&start=6')}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe></div>`);
      const box = el.querySelector('.htrailer'), ifr = box.querySelector('iframe'); sizeCover(el, ifr);
      ifr.onload = () => setTimeout(() => { if (my === seq) { box.classList.add('on'); clearInterval(heroTimer); if (!heroMuted) ytCmd(ifr, 'unMute'); } }, 2200);
      let mb = el.querySelector('.hmute'); if (!mb) { el.insertAdjacentHTML('beforeend', `<button class="hmute" title="Som">${XI.mute}</button>`); mb = el.querySelector('.hmute'); }
      mb.innerHTML = heroMuted ? XI.mute : XI.vol; mb.classList.add('show');
      mb.onclick = () => { heroMuted = !heroMuted; ytCmd(el.querySelector('.htrailer iframe'), heroMuted ? 'mute' : 'unMute'); mb.innerHTML = heroMuted ? XI.mute : XI.vol; };
    }, 1800);
  };
  new MutationObserver(() => { if (!el.querySelector('.htrailer')) { el.querySelector('.hmute')?.classList.remove('show'); attach(); } }).observe(el, { childList: true });
  attach();
};
window.addEventListener('resize', () => { const el = $('#hero'), f = el && el.querySelector('.htrailer iframe'); if (f) sizeCover(el, f); });
document.addEventListener('visibilitychange', () => { const f = document.querySelector('.htrailer iframe'); if (f) ytCmd(f, document.hidden ? 'pauseVideo' : 'playVideo'); });

/* =================== 3. pré-visualização nos cartões =================== */
const prev = document.createElement('div'); prev.id = 'vvPrev'; document.body.appendChild(prev);
let pvT = null, pvCard = null, pvHide = null, pvSeq = 0;
function hidePrev() { clearTimeout(pvT); pvCard = null; prev.classList.remove('show'); setTimeout(() => { if (!prev.classList.contains('show')) prev.innerHTML = ''; }, 250); }
function liked(id) { return (PD().ratings || {})[id] === 1; }
async function showPrev(cardEl) {
  const [type, id] = (cardEl.dataset.open || '').split('|'); if (!id) return;
  const my = ++pvSeq, base = Object.assign({ id, type }, ITEMS.get(id) || {});
  const r = cardEl.getBoundingClientRect(), W = Math.max(330, Math.min(420, r.width * 2.15));
  const nr = document.getElementById('nav')?.getBoundingClientRect(), minL = (nr && nr.height > innerHeight / 2 ? nr.right : 0) + 12;
  let left = r.left + r.width / 2 - W / 2; left = Math.max(minL, Math.min(innerWidth - W - 12, left));
  let top = r.top + r.height / 2 - (W * 9 / 16 + 120) / 2; top = Math.max(12, Math.min(innerHeight - (W * 9 / 16 + 140), top));
  Object.assign(prev.style, { left: left + 'px', top: top + 'px', width: W + 'px' });
  const render = m => {
    const yr = String(m.releaseInfo || m.year || '').slice(0, 9), gs = (m.genres || m.genre || []).slice(0, 3).map(g => GPT[g] || g);
    prev.innerHTML = `<div class="pv" data-open="${esc(type)}|${esc(id)}" style="background-image:url('${esc(m.background || IMG.bg(id))}')"><b>${esc(m.name || '')}</b></div>
      <div class="pb2"><div class="row1"><button class="pp" data-quickplay="${esc(type)}|${esc(id)}" title="Ver agora">${I.play}</button><button data-lib="${esc(id)}" class="${inLib(id) ? 'on' : ''}" title="A minha lista">${inLib(id) ? I.check : I.plus}</button><button data-v5like class="${liked(id) ? 'on' : ''}" title="Gosto">${XI.like}</button><span class="sp"></span><button data-open="${esc(type)}|${esc(id)}" title="Mais informações">${XI.more}</button></div>
      <div class="meta2">${matchHTML(m)}${yr ? `<span>${esc(yr)}</span>` : ''}${m.runtime ? `<span>${esc(m.runtime)}</span>` : ''}${type === 'series' && m.videos ? `<span>${new Set(m.videos.filter(v => v.season > 0).map(v => v.season)).size} temporadas</span>` : ''}${m.imdbRating ? `<span>★ ${esc(m.imdbRating)}</span>` : ''}</div>
      ${gs.length ? `<div class="gen">${gs.map(esc).join('<i>•</i>')}</div>` : ''}</div>`;
  };
  render(base); prev.classList.add('show');
  let m = base; try { m = await getMeta(type, id); } catch (e) {}
  if (my !== pvSeq || !prev.classList.contains('show')) return;
  render(m);
  const yt = P5('previewTrailer') && location.protocol !== 'file:' && trailerOf(m);
  if (yt) { const pv = prev.querySelector('.pv'); pv.insertAdjacentHTML('afterbegin', `<iframe src="${ytURL(yt, '&start=10')}" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe>`); const f = pv.querySelector('iframe'); f.onload = () => setTimeout(() => f.classList.add('on'), 1600); }
}
if (HOVER) {
  document.addEventListener('mouseover', e => {
    if (!P5('previews')) return;
    const c = e.target.closest('#app .card[data-open], #app .t10[data-open]');
    if (c && c !== pvCard) { clearTimeout(pvT); clearTimeout(pvHide); pvCard = c; pvT = setTimeout(() => { if (pvCard === c && document.body.contains(c)) showPrev(c); }, 700); }
    else if (!c && !e.target.closest('#vvPrev')) { clearTimeout(pvT); if (prev.classList.contains('show')) { clearTimeout(pvHide); pvHide = setTimeout(hidePrev, 120); } else pvCard = null; }
    else if (e.target.closest('#vvPrev')) clearTimeout(pvHide);
  });
  prev.addEventListener('mouseleave', () => { pvHide = setTimeout(hidePrev, 150); });
  window.addEventListener('scroll', hidePrev, { passive: true, capture: true });
  window.addEventListener('hashchange', hidePrev);
}
prev.addEventListener('click', e => {
  const lk = e.target.closest('[data-v5like]');
  if (lk) { const [, id] = (prev.querySelector('[data-open]').dataset.open || '').split('|'); const d = PD(); d.ratings = d.ratings || {}; d.genresById = d.genresById || {}; if (d.ratings[id] === 1) delete d.ratings[id]; else { d.ratings[id] = 1; const m = ITEMS.get(id); if (m && m.genres) d.genresById[id] = m.genres; } save(); TW = null; lk.classList.toggle('on', d.ratings[id] === 1); toast(d.ratings[id] === 1 ? 'Vamos mostrar-te mais títulos assim' : 'Avaliação removida'); return; }
  const lb = e.target.closest('[data-lib]'); if (lb) setTimeout(() => { const on = inLib(lb.dataset.lib); lb.classList.toggle('on', on); lb.innerHTML = on ? I.check : I.plus; }, 50);
  if (e.target.closest('[data-open],[data-quickplay]')) setTimeout(hidePrev, 30);
});

/* =================== 4. “% para ti” no detalhe =================== */
const _ls = window.loadSimilar;
window.loadSimilar = function (m) {
  try { const meta = document.querySelector('#detail .dmeta'); if (meta && !meta.querySelector('.vvmatch')) { const p = matchPct(m); if (p) meta.insertAdjacentHTML('afterbegin', `<span class="pill vvmatch">${p}% para ti</span>`); } } catch (e) {}
  return _ls(m);
};

/* =================== 7. continuar a ver com a cena =================== */
const FK = 'vinovim.frames';
const FR = (() => { try { return JSON.parse(localStorage.getItem(FK)) || {}; } catch (e) { return {}; } })();
let frT = 0, frBad = false;
function grabFrame() {
  if (frBad || !P5('frames') || !PC || !PC.meta || PC.stream._local || PC.stream.ytId || !V.videoWidth || V.currentTime < 20) return;
  try {
    const c = document.createElement('canvas'); c.width = 384; c.height = Math.round(384 * V.videoHeight / V.videoWidth) || 216;
    c.getContext('2d').drawImage(V, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', .62); if (url.length < 2000) return;
    FR[PC.meta.id] = { v: PC.videoId, img: url, at: Date.now() };
    const ks = Object.keys(FR).sort((a, b) => FR[b].at - FR[a].at); ks.slice(24).forEach(k => delete FR[k]);
    localStorage.setItem(FK, JSON.stringify(FR));
  } catch (e) { if (e && e.name === 'SecurityError') frBad = true; }
}
V.addEventListener('timeupdate', () => { if (Date.now() - frT > 15000 && !V.paused) { frT = Date.now(); grabFrame(); } });
V.addEventListener('pause', grabFrame);
V.addEventListener('loadstart', () => { frBad = false; });
const _cp = window.closePlayer; window.closePlayer = function () { try { grabFrame(); } catch (e) {} endOff(); return _cp.apply(this, arguments); };
const left = s => { const m = Math.max(1, Math.round(s / 60)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
window.wideCard = function (p) {
  const pct = p.d > 1 ? Math.min(100, p.t / p.d * 100) : 0, f = FR[p.id], img = f && f.v === p.videoId ? f.img : (p.thumb || p.background || IMG.bg(p.id));
  const sub = p.d > 1 ? `faltam <b>${left(p.d - p.t)}</b>` : 'Próximo episódio';
  return `<button class="card wide" data-resume="${esc(p.id)}">
    <div class="pimg"><img loading="lazy" src="${esc(img)}" alt="" onerror="this.src='${esc(p.background || IMG.bg(p.id))}'"><div class="ov"></div><span class="play">${I.play}</span>
    <span class="rm" data-unprog="${esc(p.id)}" title="Tirar de “Continuar a ver”">${I.x}</span>
    <div class="wt">${esc(p.name)}<small>${p.ep ? esc(p.ep) + ' · ' : ''}${sub}</small></div><i class="bar"><b style="width:${pct}%"></b></i></div></button>`;
};

/* =================== 8. fim do filme com sugestões =================== */
P.insertAdjacentHTML('beforeend', `<div id="vvEnd"><h3>Mais títulos para ti</h3><p id="vvEndP">Porque viste este filme</p><div class="cards" id="vvEndC"></div><div class="inrow" style="margin:0"><button class="btn gho" id="vvEndBack">Ver os créditos</button><button class="btn gho" id="vvEndClose">Sair</button></div></div>`);
let endOn = false, endFor = null, endSkip = null, endT = null, endPicks = [];
function endOff() { endOn = false; clearInterval(endT); P.classList.remove('v5end'); }
async function similarTo(m, n) {
  const gs = (m.genres || []).slice(0, 2); if (!gs.length) return [];
  const seen = new Set([m.id, ...Object.keys(S.watched || {}), ...Object.keys((PD().stats || {}).titles || {})]);
  const lists = await Promise.all(gs.map(g => catalog(cinemeta(), m.type, 'imdbRating', { genre: g }).catch(() => [])));
  const out = new Map(); lists.flat().forEach(x => { if (!seen.has(x.id) && !out.has(x.id)) out.set(x.id, x); });
  return [...out.values()].map(x => Object.assign({ _s: (x.genres || []).filter(g => gs.includes(g)).length * 10 + (matchPct(x) || 0) }, x)).sort((a, b) => b._s - a._s).slice(0, n);
}
async function startEnd() {
  if (endOn || !PC || !PC.meta || PC.video || !P5('endSuggest')) return;
  endOn = true; endFor = PC.videoId;
  let m = PC.meta; if (!m.genres) { try { m = await getMeta(m.type, m.id); } catch (e) {} }
  endPicks = await similarTo(m, 3); if (!endPicks.length || !endOn) { endOn = false; return; }
  $('#vvEndP').textContent = `Porque viste ${m.name}`;
  $('#vvEndC').innerHTML = endPicks.map((x, i) => `<button class="ec ${i === 0 ? 'first' : ''}" data-v5go="${i}"><div class="im" style="background-image:url('${esc(x.background || IMG.bg(x.id))}')"></div><div><b>${esc(x.name)}</b><small>${matchHTML(x)} ${esc(String(x.releaseInfo || '').slice(0, 4))}</small>${i === 0 ? '<div class="bar5"><i id="vvEndBar"></i></div>' : ''}</div></button>`).join('');
  P.classList.add('v5end');
  let n = 15; const bar = $('#vvEndBar'); bar.style.transition = 'none'; bar.style.width = '0'; requestAnimationFrame(() => { bar.style.transition = 'width 15s linear'; bar.style.width = '100%'; });
  endT = setInterval(() => { if (--n <= 0) { clearInterval(endT); goPick(0); } }, 1000);
}
function goPick(i) { const x = endPicks[i]; if (!x) return; endOff(); closePlayer(); setTimeout(() => openDetail(x.type, x.id), 120); }
$('#vvEndC').addEventListener('click', e => { const b = e.target.closest('[data-v5go]'); if (b) { e.stopPropagation(); goPick(+b.dataset.v5go); } });
$('#vvEndBack').onclick = e => { e.stopPropagation(); endSkip = endFor; endOff(); };
$('#vvEndClose').onclick = e => { e.stopPropagation(); endOff(); closePlayer(); };
$('#vvEnd').addEventListener('click', e => e.stopPropagation());
V.addEventListener('timeupdate', () => {
  if (!PC || PC.video || !P.classList.contains('open')) return;
  const d = V.duration, t = V.currentTime; if (!d || !isFinite(d) || d < 1500) return;
  if (d - t <= 100 && !endOn && endSkip !== PC.videoId) startEnd();
  else if (d - t > 140 && endOn) endOff();
});
V.addEventListener('ended', () => { if (PC && !PC.video && !endOn && endSkip !== PC.videoId) startEnd(); });
const _pl = window.play; window.play = function () { endOff(); endSkip = null; return _pl.apply(this, arguments); };

/* =================== 5, 6, 10. filas do início =================== */
const top10HTML = (title, list) => `<section class="row t10row"><div class="rowh"><h2>${title}</h2><div class="tsp"></div><button class="arr" data-scroll="-1">${I.left}</button><button class="arr" data-scroll="1">${I.right}</button></div><div class="track">${list.slice(0, 10).map((m, i) => { remember(m); return `<button class="t10" data-open="${esc(m.type)}|${esc(m.id)}" title="${esc(m.name)}"><span class="n">${i + 1}</span><div class="pimg"><img loading="lazy" src="${esc(m.poster || IMG.poster(m.id))}" alt="" onerror="window.vvPoster?vvPoster(this):this.parentNode.classList.add('noimg')"><span class="ptitle">${esc(m.name)}</span></div></button>`; }).join('')}</div></section>`;
const seenSet = () => new Set([...Object.keys(S.watched || {}), ...Object.keys((PD().stats || {}).titles || {})]);
async function becauseRows() {
  const seeds = [], used = new Set();
  Object.values(S.progress || {}).sort((a, b) => (b.updated || 0) - (a.updated || 0)).forEach(p => { if (!used.has(p.id)) { used.add(p.id); seeds.push({ id: p.id, type: p.type, name: p.name }); } });
  Object.entries((PD().stats || {}).titles || {}).sort((a, b) => b[1].secs - a[1].secs).forEach(([id, t]) => { if (!used.has(id)) { used.add(id); seeds.push({ id, type: t.type, name: t.name }); } });
  const out = [];
  for (const s of seeds.slice(0, 2)) {
    let m; try { m = await getMeta(s.type, s.id); } catch (e) { continue; }
    const recs = (await similarTo(m, 24)).filter(x => !inLib(x.id) || true);
    if (recs.length >= 4) out.push(rowHTML(`Porque viste ${m.name}`, recs.map(card).join(''), 'escolhidos para ti'));
  }
  return out;
}
function momentRow() {
  const h = new Date().getHours(), wd = new Date().getDay();
  if (h >= 6 && h < 12) return ['Para começar bem o dia', ['Comedy', 'Animation', 'Family'], 'movie'];
  if (h >= 12 && h < 19) return wd === 0 || wd === 6 ? ['Maratona de fim de semana', ['Drama', 'Crime', 'Sci-Fi'], 'series'] : ['Uma tarde de aventura', ['Adventure', 'Action'], 'movie'];
  if (h >= 19) return ['Noite de cinema', ['Thriller', 'Drama', 'Crime'], 'movie'];
  return ['Para ver de madrugada', ['Horror', 'Mystery', 'Thriller'], 'movie'];
}
async function momentRows() {
  const cm = cinemeta(), seen = seenSet(), rows = [];
  const [title, gs, type] = momentRow();
  const pool = new Map(); (await Promise.all(gs.map(g => catalog(cm, type, 'top', { genre: g }).catch(() => [])))).flat().forEach(x => { if (!seen.has(x.id)) pool.set(x.id, x); });
  const arr = [...pool.values()].sort((a, b) => (matchPct(b) || 0) - (matchPct(a) || 0)).slice(0, 24);
  if (arr.length >= 5) rows.push(rowHTML(title, arr.map(card).join(''), 'para este momento'));
  const cl = (await Promise.all(['Drama', 'Crime', 'Comedy', 'Sci-Fi'].map(g => catalog(cm, 'movie', 'imdbRating', { genre: g }).catch(() => [])))).flat().filter(x => parseInt(x.releaseInfo, 10) < 1995 && !seen.has(x.id));
  const cm2 = new Map(); cl.forEach(x => cm2.set(x.id, x)); const classics = [...cm2.values()].slice(0, 24);
  if (classics.length >= 5) rows.push(rowHTML('Clássicos que nunca viste', classics.map(card).join(''), 'obras-primas antes de 1995'));
  return rows;
}
async function shortRow() {
  const seen = seenSet(), cand = new Map();
  (await Promise.all(['Comedy', 'Animation', 'Horror', 'Family'].map(g => catalog(cinemeta(), 'movie', 'top', { genre: g }).catch(() => [])))).flat().forEach(x => { if (!seen.has(x.id)) cand.set(x.id, x); });
  const list = [...cand.values()].slice(0, 40), out = [];
  for (let i = 0; i < list.length && out.length < 18; i += 8) {
    const ms = await Promise.all(list.slice(i, i + 8).map(x => getMeta('movie', x.id).catch(() => null)));
    ms.forEach(m => { const r = m && parseInt(m.runtime, 10); if (r && r <= 95) out.push(Object.assign({}, m, { releaseInfo: r + ' min' })); });
  }
  return out.length >= 5 ? rowHTML('Filmes curtos para hoje', out.map(card).join(''), 'menos de hora e meia') : '';
}
const _home = VIEWS.home;
VIEWS.home = async function () {
  const r = await _home.apply(VIEWS, arguments);
  const rows = $('#rows'); if (!rows) return r;
  const cm = cinemeta(), mark = Date.now(); rows.dataset.v5 = mark;
  const alive = () => $('#rows') && $('#rows').dataset.v5 == mark;
  const after = (html, where) => { if (!alive() || !html) return; const rs = $('#rows'); const ref = where(rs); if (ref) ref.insertAdjacentHTML('afterend', html); else rs.insertAdjacentHTML('beforeend', html); };
  const contRow = rs => [...rs.querySelectorAll('.row')].find(x => x.querySelector('.card.wide')) || null;
  Promise.all([catalog(cm, 'movie', 'top').catch(() => []), catalog(cm, 'series', 'top').catch(() => [])]).then(([mv, sr]) => {
    if (!alive()) return;
    if (mv.length >= 10) after(top10HTML('Top 10 filmes hoje', mv), rs => contRow(rs) || rs.querySelector('.row:not(.vvwrapbanner)'));
    if (sr.length >= 10) setTimeout(() => after(top10HTML('Top 10 séries hoje', sr), rs => { const b = [...rs.querySelectorAll('.row')].filter(x => !x.classList.contains('t10row')); return b[3] || b[b.length - 1]; }), 900);
  });
  becauseRows().then(list => list.forEach((h, i) => setTimeout(() => after(h, rs => rs.querySelector('.t10row') || contRow(rs) || rs.querySelector('.row')), 300 + i * 200))).catch(() => {});
  momentRows().then(list => list.forEach((h, i) => setTimeout(() => after(h, rs => { const b = rs.querySelectorAll('.row'); return b[Math.min(b.length - 1, 5 + i * 2)]; }), 1200 + i * 300))).catch(() => {});
  shortRow().then(h => setTimeout(() => after(h, rs => { const b = rs.querySelectorAll('.row'); return b[Math.min(b.length - 1, 7)]; }), 1600)).catch(() => {});
  return r;
};

/* =================== 9. Novidades =================== */
const DOW = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MON = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return +x; };
function whenLabel(t) {
  const today = dayStart(Date.now()), d = dayStart(t), diff = Math.round((d - today) / 864e5);
  if (diff < -1) return 'Já disponível'; if (diff === -1) return 'Chegou ontem'; if (diff === 0) return 'Chega hoje'; if (diff === 1) return 'Chega amanhã';
  if (diff < 7) return 'Chega ' + DOW[new Date(t).getDay()]; return 'Chega a ' + new Date(t).getDate() + ' de ' + MON[new Date(t).getMonth()];
}
let NV = null;
async function loadNovidades() {
  try { const c = JSON.parse(sessionStorage.getItem('vv_nov') || 'null'); if (c && Date.now() - c.at < 6 * 3600e3) return c.items; } catch (e) {}
  const y = new Date().getFullYear(), cm = cinemeta(), now = Date.now(), from = now - 14 * 864e5, to = now + 75 * 864e5;
  const lists = await Promise.all([catalog(cm, 'movie', 'year', { genre: y }).catch(() => []), catalog(cm, 'movie', 'year', { genre: y + 1 }).catch(() => []), catalog(cm, 'series', 'year', { genre: y }).catch(() => []), catalog(cm, 'movie', 'top').catch(() => [])]);
  const cand = new Map(); lists.flat().forEach(x => { if (!cand.has(x.id)) cand.set(x.id, x); });
  const all = [...cand.values()].slice(0, 90), items = [];
  for (let i = 0; i < all.length; i += 10) {
    const ms = await Promise.all(all.slice(i, i + 10).map(x => getMeta(x.type, x.id).catch(() => null)));
    ms.forEach(m => {
      if (!m) return; let d = 0, ep = '';
      if (m.type === 'movie') d = Date.parse(m.released || '');
      else { const v = (m.videos || []).filter(v => v.season > 0 && v.released && v.episode === 1).map(v => ({ v, t: Date.parse(v.released) })).filter(x => x.t >= from && x.t <= to).sort((a, b) => a.t - b.t)[0]; if (v) { d = v.t; ep = v.v.season > 1 ? `Temporada ${v.v.season}` : 'Nova série'; } }
      if (d >= from && d <= to) items.push({ id: m.id, type: m.type, name: m.name, desc: m.description || '', bg: m.background || IMG.bg(m.id), poster: m.poster, genres: m.genres || [], imdbRating: m.imdbRating, d, ep });
    });
  }
  items.sort((a, b) => a.d - b.d);
  try { sessionStorage.setItem('vv_nov', JSON.stringify({ at: Date.now(), items })); } catch (e) {}
  return items;
}
function nvItem(x) {
  const dt = new Date(x.d), fut = x.d > Date.now(), on = !!(PD().remind || {})[x.id];
  return `<div class="nvitem"><div class="nvdate"><small>${MON[dt.getMonth()]}</small><b>${dt.getDate()}</b></div>
    <div class="nvbody" data-open="${esc(x.type)}|${esc(x.id)}"><div class="im" style="background-image:url('${esc(x.bg)}')"></div><div>
    <div class="when">${whenLabel(x.d)}${x.ep ? ' · ' + esc(x.ep) : ''}</div><h4>${esc(x.name)}</h4><p>${esc(x.desc)}</p>
    <div class="inrow" style="margin:0">${matchHTML(x)}${fut ? `<button class="btn sm ${on ? 'acc' : 'gho'}" data-v5rem="${esc(x.id)}">${XI.bell}${on ? 'Vou ser avisado' : 'Avisa-me'}</button>` : `<button class="btn sm pri" data-quickplay="${esc(x.type)}|${esc(x.id)}">${I.play}Ver agora</button>`}</div></div></div></div>`;
}
VIEWS.novidades = async function () {
  app.className = '';
  app.innerHTML = `<div class="view">${topbar('Novidades')}<div class="pad" style="max-width:1100px"><p class="m" style="color:var(--mu);margin-top:0">Os filmes e séries que acabaram de chegar e os que estão para estrear.</p><div id="nvBody"><span class="spin"></span></div></div></div>`;
  NV = await loadNovidades().catch(() => []); if (!$('#nvBody')) return;
  const now = Date.now(), past = NV.filter(x => x.d <= now).reverse(), week = NV.filter(x => x.d > now && x.d <= now + 7 * 864e5), later = NV.filter(x => x.d > now + 7 * 864e5);
  $('#nvBody').innerHTML = (week.length ? `<div class="nvsec"><h3>🍿 Chega esta semana</h3><small>${week.length} títulos</small></div><div class="nvlist">${week.map(nvItem).join('')}</div>` : '')
    + (later.length ? `<div class="nvsec"><h3>📅 Em breve</h3><small>próximas semanas</small></div><div class="nvlist">${later.slice(0, 20).map(nvItem).join('')}</div>` : '')
    + (past.length ? `<div class="nvsec"><h3>✨ Acabou de chegar</h3><small>últimos 14 dias</small></div><div class="nvlist">${past.slice(0, 20).map(nvItem).join('')}</div>` : '')
    + (NV.length ? '' : emptyHTML(XI.spark, 'Sem novidades por agora', 'Volta mais tarde: o vinovim procura estreias todos os dias.'));
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-v5rem]'); if (!b) return;
  e.stopPropagation(); e.preventDefault();
  const x = (NV || []).find(y => y.id === b.dataset.v5rem); if (!x) return;
  const d = PD(); d.remind = d.remind || {};
  if (d.remind[x.id]) { delete d.remind[x.id]; toast('Lembrete removido'); } else { d.remind[x.id] = { id: x.id, type: x.type, name: x.name, poster: x.poster || IMG.poster(x.id), date: x.d, set: Date.now() }; toast(`Avisamos-te quando “${x.name}” chegar`); }
  save(); const on = !!d.remind[x.id]; b.className = 'btn sm ' + (on ? 'acc' : 'gho'); b.innerHTML = XI.bell + (on ? 'Vou ser avisado' : 'Avisa-me');
}, true);
Object.assign(VIEW_TXT, { novidades: 'A ver as novidades' });
function navAdd() {
  if (document.querySelector('.nv[data-v="novidades"]')) return;
  const s = document.querySelector('#nav .nv[data-v="search"]'); if (s) s.insertAdjacentHTML('afterend', `<a class="nv" data-v="novidades" href="#novidades">${XI.spark}Novidades</a>`);
}

/* =================== definições =================== */
const _settings = VIEWS.settings;
VIEWS.settings = function () {
  const r = _settings.apply(VIEWS, arguments);
  const pad = document.querySelector('#app .pad'); if (!pad || (curProfile() || {}).kids) return r;
  const opts = [['intro', 'Abertura animada', 'O logótipo animado ao abrir a app'], ['introSound', 'Som da abertura', 'O “ta-dum” do vinovim'], ['heroTrailer', 'Trailer no destaque', 'O filme em destaque toca o trailer sem som'], ['previews', 'Pré-visualização nos cartões', 'Passa o rato por cima de um cartão para ver mais'], ['previewTrailer', 'Trailer na pré-visualização', 'Toca o trailer dentro do cartão aumentado'], ['matchPct', '“% para ti”', 'Quanto cada título combina contigo'], ['endSuggest', 'Sugestões no fim do filme', 'Nos créditos, mostra 3 filmes parecidos'], ['frames', 'Imagem da cena em “Continuar a ver”', 'Guarda a imagem do sítio onde paraste']];
  const html = `<div class="panel"><h3>Experiência vinovim</h3><p class="m">Os detalhes que fazem o vinovim parecer cinema.</p>${opts.map(([k, l, s]) => `<div class="srow"><div class="tx"><b>${l}</b><small>${s}</small></div><button class="tg ${P5(k) ? 'on' : ''}" data-v5p="${k}"></button></div>`).join('')}</div>`;
  const ap = pad.querySelector('[data-acc]')?.closest('.panel');
  if (ap) ap.insertAdjacentHTML('afterend', html); else pad.insertAdjacentHTML('beforeend', html);
  pad.querySelectorAll('[data-v5p]').forEach(b => b.onclick = () => { const k = b.dataset.v5p; S.prefs[k] = !P5(k); save(); b.classList.toggle('on', P5(k)); });
  return r;
};

/* =================== arranque =================== */
navAdd();
window.addEventListener('hashchange', () => { navAdd(); hidePrev(); });
const _afterBoot = window.afterBoot; window.afterBoot = function () { _afterBoot(); navAdd(); };
})();
