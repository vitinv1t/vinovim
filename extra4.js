/* vinovim — funcionalidades extra (v1.6)
   Windows: “Continuar a ver” no menu Iniciar e na barra de tarefas · botões na miniatura · progresso no ícone
   O teu ano no vinovim (Wrapped) com cartões animados para partilhar */
(() => {
'use strict';
const PD = () => S.pdata[S.activeProfile];
const N = window.vinovimNative || null;
let booted = false, queued = null;

/* =================== Windows: menu Iniciar e barra de tarefas =================== */
if (N && N.jumpList) {
  const pushJump = () => {
    const items = Object.values(S.progress || {}).sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 6)
      .map(p => ({ title: p.name, sub: (p.ep ? p.ep + ' · ' : '') + (p.d > 1 ? Math.round(p.t / p.d * 100) + '% visto' : 'Próximo episódio'), type: p.type, id: p.id }));
    try { N.jumpList(items); } catch (e) {}
  };
  let jT; const _save = window.save; window.save = function () { const r = _save.apply(this, arguments); clearTimeout(jT); jT = setTimeout(pushJump, 3000); return r; };
  const _sw = window.switchProfile; window.switchProfile = function () { const r = _sw.apply(this, arguments); setTimeout(pushJump, 500); return r; };
  const active = () => P.classList.contains('open') || P.classList.contains('mini');
  let lastSend = 0;
  const sendState = force => {
    if (!active() || !PC) { N.playing(null); return; }
    const now = Date.now(); if (!force && now - lastSend < 2500) return; lastSend = now;
    const d = V.duration;
    N.playing({ playing: !V.paused, progress: d && isFinite(d) ? V.currentTime / d : 0, hasNext: !!(typeof nextVideo === 'function' && nextVideo()), title: $('#pTitle') ? $('#pTitle').textContent : '' });
  };
  V.addEventListener('play', () => sendState(true)); V.addEventListener('pause', () => sendState(true));
  V.addEventListener('timeupdate', () => sendState(false)); V.addEventListener('ended', () => sendState(true));
  const _cp = window.closePlayer; window.closePlayer = function () { const r = _cp.apply(this, arguments); setTimeout(() => N.playing(null), 0); return r; };
  N.onCommand(c => {
    if (!active()) return;
    if (c === 'toggle') togglePlay(); else if (c === 'back') skip(-10); else if (c === 'fwd') skip(10); else if (c === 'next') goNext();
    setTimeout(() => sendState(true), 120);
  });
  const doOpen = o => { if (!o) return; if (o.route) location.hash = o.route; else if (o.id) openDetail(o.type, o.id); };
  N.onOpen(o => { if (booted) doOpen(o); else queued = o; });
  setTimeout(pushJump, 4000);
}

/* =================== O teu ano no vinovim (Wrapped) =================== */
document.head.insertAdjacentHTML('beforeend', `<style>
#vvWrap{position:fixed;inset:0;z-index:140;background:#050407;display:none;align-items:center;justify-content:center}
#vvWrap.open{display:flex;animation:fade .25s}
.wcard{position:relative;width:min(440px,100vw);height:min(860px,100vh);overflow:hidden;border-radius:28px;color:#fff;background:#120d18;box-shadow:0 30px 120px rgba(0,0,0,.7);user-select:none}
@media (max-width:520px){.wcard{border-radius:0}}
.wbars{position:absolute;top:14px;left:14px;right:14px;display:flex;gap:5px;z-index:5}
.wbars i{flex:1;height:3px;border-radius:9px;background:rgba(255,255,255,.25);overflow:hidden}
.wbars i b{display:block;height:100%;width:0;background:#fff}
.wbars i.done b{width:100%}.wbars i.on b{animation:wfill var(--wd,6.5s) linear forwards}
.wcard.paused .wbars i.on b{animation-play-state:paused}
@keyframes wfill{to{width:100%}}
.wtop{position:absolute;top:26px;left:16px;right:12px;display:flex;align-items:center;gap:8px;z-index:5;font-size:13px;font-weight:700;opacity:.9}
.wtop .sp{flex:1}.wtop button{width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.25);color:#fff;display:grid;place-items:center;cursor:pointer}.wtop button svg{width:18px;height:18px}
.wtap{position:absolute;top:70px;bottom:90px;width:35%;z-index:4;cursor:pointer}.wtap.l{left:0}.wtap.r{right:0;width:65%}
.wslide{position:absolute;inset:0;padding:96px 30px 40px;display:flex;flex-direction:column;justify-content:center}
.wbg{position:absolute;inset:-20%;z-index:0;filter:blur(40px);opacity:.9}
.wbg span{position:absolute;border-radius:50%;animation:wblob 9s ease-in-out infinite alternate}
@keyframes wblob{to{transform:translate(18%,12%) scale(1.25)}}
.wslide>*:not(.wbg){position:relative;z-index:1}
.wk{font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
.wbig{font-family:var(--fd);font-size:clamp(64px,22vw,104px);font-weight:800;line-height:.95;letter-spacing:-.03em;margin:10px 0}
.wh{font-family:var(--fd);font-size:clamp(28px,8vw,40px);font-weight:800;line-height:1.05;margin:8px 0 12px}
.wp{font-size:17px;line-height:1.45;opacity:.92;margin:0}
.win{opacity:0;transform:translateY(24px);animation:wup .7s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes wup{to{opacity:1;transform:none}}
.wtop5{display:flex;flex-direction:column;gap:10px;margin-top:14px}
.wtop5 div{display:flex;align-items:center;gap:12px;padding:8px;border-radius:16px;background:rgba(255,255,255,.1);backdrop-filter:blur(6px)}
.wtop5 img{width:46px;height:68px;object-fit:cover;border-radius:10px;background:rgba(255,255,255,.15)}
.wtop5 em{font-style:normal;font-family:var(--fd);font-size:26px;font-weight:800;width:26px;text-align:center;opacity:.8}
.wtop5 b{display:block;font-size:15px}.wtop5 small{opacity:.75;font-size:12px}
.wgen{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.wgen div{display:flex;flex-direction:column;gap:5px;font-weight:700}
.wgen i{display:block;height:12px;border-radius:9px;background:#fff;width:0;animation:wgrow 1.1s cubic-bezier(.2,.8,.2,1) forwards}
@keyframes wgrow{to{width:var(--w)}}
.wmon{display:flex;align-items:flex-end;gap:5px;height:150px;margin-top:20px}
.wmon div{flex:1;border-radius:6px 6px 2px 2px;background:rgba(255,255,255,.35);height:0;animation:wh 1s cubic-bezier(.2,.8,.2,1) forwards}
.wmon div.top{background:#fff}
@keyframes wh{to{height:var(--h)}}
.wml{display:flex;gap:5px;margin-top:6px;font-size:10px;opacity:.7}.wml span{flex:1;text-align:center}
.wemo{font-size:86px;line-height:1;margin-bottom:6px;animation:wpop .8s cubic-bezier(.2,1.6,.4,1) both}
@keyframes wpop{from{transform:scale(.2) rotate(-20deg);opacity:0}}
.wgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
.wgrid div{padding:14px;border-radius:18px;background:rgba(255,255,255,.12)}
.wgrid b{display:block;font-family:var(--fd);font-size:30px;font-weight:800}.wgrid small{opacity:.8;font-size:12px}
.wslide>.wbtns{display:flex;flex-direction:column;gap:10px;margin-top:16px;position:relative;z-index:6}.wcard.last .wtap.r{display:none}
.wbtns button{height:52px;border-radius:99px;border:0;font-weight:800;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.wbtns .w1{background:#fff;color:#111}.wbtns .w2{background:rgba(255,255,255,.16);color:#fff}
.vvwrapbanner{display:flex;align-items:center;gap:18px;margin:0 40px 30px;padding:20px 24px;border-radius:24px;background:linear-gradient(120deg,#e0315b,#7c5cff 55%,#16c7b4);color:#fff;cursor:pointer;border:0;text-align:left;width:calc(100% - 80px);box-shadow:0 20px 60px rgba(124,92,255,.25)}
.vvwrapbanner b{display:block;font-family:var(--fd);font-size:22px}.vvwrapbanner small{opacity:.9;font-size:14px}.vvwrapbanner .e{font-size:40px}
@media (max-width:820px){.vvwrapbanner{margin:0 18px 24px;width:calc(100% - 36px)}}
</style>`);
const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const PALS = [['#e0315b', '#ff8a3d', '#7c1d6f'], ['#7c5cff', '#2f8cff', '#14104a'], ['#16c784', '#0f8b8d', '#073b3a'], ['#ff7a1a', '#f5c26b', '#7a2e0b'], ['#ff4fd8', '#7c5cff', '#2a0f3d'], ['#2f8cff', '#5ce1e6', '#0b1f4a'], ['#f5c26b', '#e0315b', '#3a1020'], ['#5ce1e6', '#16c784', '#08303a'], ['#e0315b', '#7c5cff', '#16c7b4']];
function blobs(i) { const [a, b] = PALS[i % PALS.length]; return `<div class="wbg"><span style="width:70%;height:50%;left:-10%;top:5%;background:${a}"></span><span style="width:60%;height:45%;right:-10%;bottom:10%;background:${b};animation-delay:-4s"></span></div>`; }
const PERS = {
  Horror: ['😱', 'Caçador de sustos', 'Para ti, uma noite sem medo é uma noite perdida.'], Comedy: ['😂', 'Rei da gargalhada', 'Se é para ver, é para rir.'],
  Drama: ['🎭', 'Coração de cinema', 'As grandes histórias tocam-te a sério.'], Action: ['💥', 'Viciado em adrenalina', 'Explosões, perseguições e zero pausas.'],
  'Sci-Fi': ['🚀', 'Explorador do futuro', 'Viagens no tempo, robôs e outros planetas são a tua casa.'], Animation: ['🎨', 'Alma de desenho animado', 'Não há idade para uma boa animação.'],
  Romance: ['💘', 'Romântico incurável', 'Um final feliz nunca é demais.'], Thriller: ['🕵️', 'Mestre do suspense', 'Adivinhas o culpado antes de toda a gente.'],
  Crime: ['🔍', 'Detetive de sofá', 'Casos, mistérios e reviravoltas.'], Documentary: ['🧠', 'Mente curiosa', 'Gostas de aprender enquanto vês.'],
  Fantasy: ['🐉', 'Viajante de outros mundos', 'Magia e dragões fazem parte da tua rotina.'], Mystery: ['🗝️', 'Caçador de mistérios', 'Nenhum enigma te escapa.'],
  Family: ['🛋️', 'Rei do sofá em família', 'Os melhores filmes são os que se veem juntos.'], Adventure: ['🧭', 'Aventureiro nato', 'Mapas, tesouros e caminhos por explorar.']
};
function wrapData() {
  const d = PD(), st = d.stats || { days: {}, titles: {} }, year = new Date().getFullYear();
  const days = Object.entries(st.days || {}).filter(([k]) => k.startsWith(String(year)));
  const secs = days.reduce((a, [, s]) => a + s, 0), hours = secs / 3600;
  const titles = Object.entries(st.titles || {}).map(([id, t]) => Object.assign({ id }, t)).filter(t => t.secs > 60).sort((a, b) => b.secs - a.secs);
  const gw = {}; titles.forEach(t => (t.genres || []).forEach(g => gw[g] = (gw[g] || 0) + t.secs));
  const genres = Object.entries(gw).sort((a, b) => b[1] - a[1]);
  const months = Array(12).fill(0); days.forEach(([k, s]) => months[+k.slice(5, 7) - 1] += s);
  const bestM = months.indexOf(Math.max(...months));
  const best = days.slice().sort((a, b) => b[1] - a[1])[0];
  const eps = Object.keys(d.watched || {}).filter(k => /:\d+:\d+$/.test(k)).length;
  const movies = titles.filter(t => t.type === 'movie').length, series = titles.filter(t => t.type === 'series').length;
  let streak = 0, run = 0; const set = new Set(days.filter(([, s]) => s > 60).map(([k]) => k));
  for (let x = new Date(year, 0, 1); x.getFullYear() === year && x <= new Date(); x.setDate(x.getDate() + 1)) { const k = x.toISOString().slice(0, 10); if (set.has(k)) { run++; streak = Math.max(streak, run); } else run = 0; }
  const topG = genres[0] ? genres[0][0] : null;
  let pers = PERS[topG] || ['🍿', 'Cinéfilo de mão cheia', 'Vês um pouco de tudo e gostas de tudo.'];
  if (d.flags && d.flags.night && hours > 5) pers = ['🦉', 'Coruja das maratonas', 'As melhores sessões são de madrugada.'];
  else if (best && best[1] > 5 * 3600 && series > movies) pers = ['🏃', 'Maratonista de séries', 'Um episódio? Nunca é só um.'];
  return { year, hours, titles, genres, months, bestM, best, eps, movies, series, streak, pers, badges: Object.keys(d.badges || {}).length, name: (curProfile() || {}).name || 'Tu', profile: curProfile() };
}
const f1 = v => v.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function slides(w) {
  const S2 = [];
  const top5 = w.titles.slice(0, 5);
  S2.push(`<div class="wk win">${w.year} · vinovim</div><div class="wh win" style="animation-delay:.15s;font-size:clamp(40px,12vw,58px)">O teu ano no vinovim, ${esc(w.name)}</div><p class="wp win" style="animation-delay:.35s">Preparámos um resumo do que viste. Toca no lado direito para avançar.</p>`);
  if (w.hours < 0.2) { S2.push(`<div class="wemo">🍿</div><div class="wh win">Ainda estás a aquecer</div><p class="wp win" style="animation-delay:.2s">Vê mais alguns filmes ou episódios e volta aqui: o teu resumo vai ficando mais completo.</p>`); return S2; }
  S2.push(`<div class="wk win">Tempo a ver</div><div class="wbig win" style="animation-delay:.15s"><span data-count="${w.hours.toFixed(1)}">0</span></div><div class="wh win" style="animation-delay:.3s">horas de filmes e séries</div><p class="wp win" style="animation-delay:.5s">${w.hours >= 24 ? `Isso são <b>${f1(w.hours / 24)} dias</b> seguidos em frente ao ecrã.` : `Isso dá para ver <b>${Math.max(1, Math.round(w.hours / 2))} filmes</b> de duas horas.`}</p>`);
  S2.push(`<div class="wk win">O que viste</div><div class="wgrid win" style="animation-delay:.15s"><div><b data-count="${w.movies}">0</b><small>filmes</small></div><div><b data-count="${w.series}">0</b><small>séries</small></div><div><b data-count="${w.eps}">0</b><small>episódios vistos</small></div><div><b data-count="${w.streak}">0</b><small>dias seguidos (recorde)</small></div></div>${w.best ? `<p class="wp win" style="animation-delay:.4s">O teu maior dia foi <b>${new Date(w.best[0]).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</b>, com <b>${f1(w.best[1] / 3600)} horas</b>.</p>` : ''}`);
  if (w.genres.length) { const mx = w.genres[0][1]; S2.push(`<div class="wk win">O teu género</div><div class="wh win" style="animation-delay:.15s;font-size:clamp(44px,13vw,64px)">${esc(GPT[w.genres[0][0]] || w.genres[0][0])}</div><div class="wgen">${w.genres.slice(0, 4).map(([g, s], i) => `<div class="win" style="animation-delay:${.3 + i * .12}s">${esc(GPT[g] || g)}<i style="--w:${Math.max(8, s / mx * 100)}%;animation-delay:${.4 + i * .12}s"></i></div>`).join('')}</div>`); }
  if (top5.length) S2.push(`<div class="wk win">Os teus favoritos</div><div class="wh win" style="animation-delay:.1s">Top ${top5.length} do ano</div><div class="wtop5">${top5.map((t, i) => `<div class="win" style="animation-delay:${.25 + i * .12}s"><em>${i + 1}</em><img src="${esc(t.poster || IMG.poster(t.id))}" alt="" onerror="this.style.visibility='hidden'"><span><b>${esc(t.name)}</b><small>${f1(t.secs / 3600)} h · ${t.type === 'series' ? 'Série' : 'Filme'}</small></span></div>`).join('')}</div>`);
  const mx = Math.max(...w.months, 1);
  S2.push(`<div class="wk win">Mês favorito</div><div class="wh win" style="animation-delay:.15s;font-size:clamp(40px,12vw,58px)">${MES[w.bestM]}</div><p class="wp win" style="animation-delay:.3s">Foi o mês em que mais viste: <b>${f1(w.months[w.bestM] / 3600)} horas</b>.</p><div class="wmon">${w.months.map((s, i) => `<div class="${i === w.bestM ? 'top' : ''}" style="--h:${Math.max(3, s / mx * 100)}%;animation-delay:${.4 + i * .05}s"></div>`).join('')}</div><div class="wml">${MES.map(m => `<span>${m[0].toUpperCase()}</span>`).join('')}</div>`);
  S2.push(`<div class="wk win">A tua personalidade</div><div class="wemo">${w.pers[0]}</div><div class="wh win" style="animation-delay:.3s">${esc(w.pers[1])}</div><p class="wp win" style="animation-delay:.5s">${esc(w.pers[2])}</p>${w.badges ? `<p class="wp win" style="animation-delay:.7s;margin-top:14px">E ainda desbloqueaste <b>${w.badges} conquistas</b>.</p>` : ''}`);
  S2.push(`<div class="wk win">${w.year} em resumo</div><div class="wh win" style="animation-delay:.1s">${esc(w.name)}, foste ${esc(w.pers[1].toLowerCase())} ${w.pers[0]}</div><div class="wgrid win" style="animation-delay:.25s"><div><b>${w.hours.toFixed(0)}</b><small>horas</small></div><div><b>${w.movies + w.series}</b><small>títulos</small></div><div><b>${esc((GPT[(w.genres[0] || [])[0]] || '—').slice(0, 12))}</b><small>género</small></div><div><b>${MES[w.bestM].slice(0, 3)}</b><small>melhor mês</small></div></div>
    <div class="wbtns win" style="animation-delay:.45s"><button class="w1" data-wshare>${I.share || ''}Partilhar imagem</button><button class="w2" data-wsave>Guardar imagem</button><button class="w2" data-wagain>Ver outra vez</button></div>`);
  return S2;
}
let W = null;
function countUp(root) {
  root.querySelectorAll('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count), dec = String(el.dataset.count).includes('.') ? 1 : 0, t0 = performance.now(), dur = 1300;
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = (to * e).toLocaleString('pt-PT', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
function openWrapped() {
  const w = wrapData(), list = slides(w);
  let el = $('#vvWrap'); if (!el) { el = document.createElement('div'); el.id = 'vvWrap'; document.body.appendChild(el); }
  W = { w, list, i: 0, t: null, el };
  el.innerHTML = `<div class="wcard"><div class="wbars">${list.map(() => '<i><b></b></i>').join('')}</div><div class="wtop">${LOGO.replace('<svg', '<svg width="22" height="22"')}<span>vinovim ${w.year}</span><span class="sp"></span><button data-wpause title="Pausar">${I.pause}</button><button data-wclose title="Fechar">${I.x}</button></div><div class="wtap l" data-wprev></div><div class="wtap r" data-wnext></div><div id="wslide"></div></div>`;
  el.classList.add('open'); document.body.style.overflow = 'hidden';
  show(0);
}
function show(i) {
  if (!W) return; clearTimeout(W.t);
  W.i = Math.max(0, Math.min(W.list.length - 1, i));
  const bars = W.el.querySelectorAll('.wbars i'); bars.forEach((b, k) => { b.className = k < W.i ? 'done' : k === W.i ? '' : ''; });
  void W.el.offsetWidth; bars[W.i].className = 'on';
  const box = W.el.querySelector('#wslide'), [a, b, c] = PALS[W.i % PALS.length];
  box.innerHTML = `<div class="wslide" style="background:linear-gradient(165deg,${c},#0b0810 75%)">${blobs(W.i)}${W.list[W.i]}</div>`;
  countUp(box);
  W.el.querySelector('.wcard').classList.remove('paused'); W.el.querySelector('.wcard').classList.toggle('last', W.i === W.list.length - 1);
  if (W.i < W.list.length - 1) W.t = setTimeout(() => show(W.i + 1), 6500);
  else { bars[W.i].className = 'done'; }
}
function closeWrapped() { if (!W) return; clearTimeout(W.t); W.el.classList.remove('open'); W = null; if (!$('#detail').classList.contains('open')) document.body.style.overflow = ''; }
document.addEventListener('click', async e => {
  if (!W) { if (e.target.closest('[data-wopen]')) openWrapped(); return; }
  if (e.target.closest('[data-wclose]')) return closeWrapped();
  if (e.target.closest('[data-wnext]')) return show(W.i + 1);
  if (e.target.closest('[data-wprev]')) return show(W.i - 1);
  if (e.target.closest('[data-wagain]')) return show(0);
  if (e.target.closest('[data-wpause]')) { const c = W.el.querySelector('.wcard'); const p = c.classList.toggle('paused'); clearTimeout(W.t); if (!p && W.i < W.list.length - 1) W.t = setTimeout(() => show(W.i + 1), 3000); return; }
  if (e.target.closest('[data-wshare]')) return shareImage(true);
  if (e.target.closest('[data-wsave]')) return shareImage(false);
});
document.addEventListener('keydown', e => {
  if (!W) return;
  if (e.key === 'Escape') { e.stopImmediatePropagation(); closeWrapped(); }
  else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); show(W.i + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); show(W.i - 1); }
}, true);

/* imagem para partilhar (1080 × 1920, formato de stories) */
const loadImg = src => new Promise(ok => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; setTimeout(() => ok(null), 5000); });
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function fitText(ctx, txt, max) { let t = String(txt); while (ctx.measureText(t).width > max && t.length > 3) t = t.slice(0, -2); return t === String(txt) ? t : t.trim() + '…'; }
async function drawCard(withPosters) {
  const w = W ? W.w : wrapData(), c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
  const x = c.getContext('2d'), F = getComputedStyle(document.body).getPropertyValue('--fd') || 'sans-serif';
  const g = x.createLinearGradient(0, 0, 1080, 1920); g.addColorStop(0, '#2a0f3d'); g.addColorStop(.5, '#120d18'); g.addColorStop(1, '#07202a'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
  [['#e0315b', 180, 260, 520], ['#7c5cff', 920, 820, 560], ['#16c7b4', 260, 1680, 520]].forEach(([col, cx, cy, r]) => { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, col + 'aa'); rg.addColorStop(1, col + '00'); x.fillStyle = rg; x.fillRect(0, 0, 1080, 1920); });
  x.fillStyle = '#fff'; x.textBaseline = 'alphabetic';
  x.font = `800 40px ${F}`; x.globalAlpha = .85; x.fillText('vinovim · ' + w.year, 80, 150); x.globalAlpha = 1;
  x.font = `800 92px ${F}`; x.fillText(fitText(x, 'O meu ano', 920), 80, 280); x.fillText(fitText(x, 'no vinovim', 920), 80, 380);
  x.font = `600 44px ${F}`; x.globalAlpha = .9; x.fillText(fitText(x, w.pers[0] + '  ' + w.pers[1], 920), 80, 470); x.globalAlpha = 1;
  const stats = [[w.hours.toFixed(0), 'horas a ver'], [String(w.movies + w.series), 'títulos'], [(GPT[(w.genres[0] || [])[0]] || '—'), 'género favorito'], [MES[w.bestM], 'melhor mês']];
  stats.forEach(([v, l], i) => { const bx = 80 + (i % 2) * 470, by = 540 + Math.floor(i / 2) * 230; x.fillStyle = 'rgba(255,255,255,.12)'; rr(x, bx, by, 450, 200, 36); x.fill(); x.fillStyle = '#fff'; x.font = `800 72px ${F}`; x.fillText(fitText(x, v, 390), bx + 34, by + 110); x.font = `600 32px ${F}`; x.globalAlpha = .8; x.fillText(l, bx + 34, by + 160); x.globalAlpha = 1; });
  x.font = `800 48px ${F}`; x.fillText('O meu top do ano', 80, 1100);
  const top = w.titles.slice(0, 5), imgs = withPosters ? await Promise.all(top.map(t => loadImg(t.poster || IMG.poster(t.id)))) : [];
  top.forEach((t, i) => {
    const by = 1150 + i * 128; x.fillStyle = 'rgba(255,255,255,.1)'; rr(x, 80, by, 920, 112, 26); x.fill();
    x.fillStyle = '#fff'; x.font = `800 52px ${F}`; x.globalAlpha = .85; x.fillText(String(i + 1), 112, by + 74); x.globalAlpha = 1;
    let tx = 190; if (imgs[i]) { x.save(); rr(x, 180, by + 10, 62, 92, 12); x.clip(); x.drawImage(imgs[i], 180, by + 10, 62, 92); x.restore(); tx = 270; }
    x.font = `700 40px ${F}`; x.fillText(fitText(x, t.name, 980 - tx - 40), tx, by + 58); x.font = `500 28px ${F}`; x.globalAlpha = .75; x.fillText(f1(t.secs / 3600) + ' h · ' + (t.type === 'series' ? 'Série' : 'Filme'), tx, by + 94); x.globalAlpha = 1;
  });
  x.font = `600 34px ${F}`; x.globalAlpha = .8; x.fillText('Faz o teu em vinovim.vercel.app', 80, 1850); x.globalAlpha = 1;
  return new Promise((ok, no) => { try { c.toBlob(b => b ? ok(b) : no(new Error('blob')), 'image/png'); } catch (e) { no(e); } });
}
async function shareImage(share) {
  toast('A preparar a imagem…');
  let blob; try { blob = await drawCard(true); } catch (e) { blob = await drawCard(false); }
  const file = new File([blob], `vinovim-${new Date().getFullYear()}.png`, { type: 'image/png' });
  if (share && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'O meu ano no vinovim', text: 'O meu ano no vinovim 🍿' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(share ? 'A imagem foi guardada: partilha-a nas tuas redes' : 'Imagem guardada');
}

/* entradas: estatísticas e início */
if (VIEWS.stats) {
  const _stats = VIEWS.stats;
  VIEWS.stats = function () {
    const r = _stats.apply(VIEWS, arguments);
    const pad = document.querySelector('#app .pad'); if (pad && !pad.querySelector('[data-wopen]')) pad.insertAdjacentHTML('afterbegin', `<button class="vvwrapbanner" data-wopen style="margin:0 0 24px;width:100%"><span class="e">🎁</span><span><b>O teu ${new Date().getFullYear()} no vinovim</b><small>Vê o teu resumo animado e partilha-o</small></span></button>`);
    return r;
  };
}
const _home = VIEWS.home;
VIEWS.home = async function () {
  const r = await _home.apply(VIEWS, arguments);
  const m = new Date().getMonth(), rows = $('#rows');
  if (rows && (m >= 10 || m === 0) && !rows.querySelector('[data-wopen]')) {
    const w = wrapData();
    if (w.hours >= 1) rows.insertAdjacentHTML('afterbegin', `<button class="vvwrapbanner" data-wopen><span class="e">🎁</span><span><b>O teu ${w.year} no vinovim já está pronto</b><small>${w.hours.toFixed(0)} horas, ${w.movies + w.series} títulos e a tua personalidade de espectador</small></span></button>`);
  }
  return r;
};
VIEWS.wrapped = function () { location.hash = 'stats'; setTimeout(openWrapped, 300); };

/* arranque */
const _afterBoot = window.afterBoot;
window.afterBoot = function () { _afterBoot(); booted = true; if (queued) { const o = queued; queued = null; setTimeout(() => { if (o.route) location.hash = o.route; else if (o.id) openDetail(o.type, o.id); }, 400); } };
})();
