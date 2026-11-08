/* vinovim — funcionalidades extra (v1.5)
   Barra lateral compacta · Avatares e fotos · Próximo episódio automático · Listas partilhadas ·
   Avisa-me · Início por perfil · “Não sei o que ver” · Atalhos e comandos de jogos ·
   Cópia de segurança automática · Página de ator · Notas privadas */
(() => {
'use strict';
const PD = () => S.pdata[S.activeProfile];
const API = /^https?:$/.test(location.protocol) ? '' : ((window.vinovimNative && window.vinovimNative.remote) || 'https://vinovim.vercel.app');
const SITE = 'https://vinovim.vercel.app';
const auth = () => { try { return JSON.parse(localStorage.getItem('vinovim.auth')) || {}; } catch (e) { return {}; } };
const XI = {
  pen: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'),
  bell: sv('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>'),
  share: sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/>'),
  target: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  pad: sv('<path d="M6 9h12a4 4 0 0 1 3.9 4.9l-1 4A2.6 2.6 0 0 1 16.5 19L15 17H9l-1.5 2a2.6 2.6 0 0 1-4.4-1.1l-1-4A4 4 0 0 1 6 9z"/><path d="M8 12v3M6.5 13.5h3M15.5 13h.01M17.5 14.5h.01"/>'),
  cloud: sv('<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>'),
  x: I.x
};

/* =================== estilos =================== */
document.head.insertAdjacentHTML('beforeend', `<style>
@media (min-width:821px){#nav{overflow-y:auto;overflow-x:hidden;scrollbar-width:none}#nav::-webkit-scrollbar{display:none}#nav .nv,#nav .brand{flex:none}}
@media (min-width:821px) and (max-height:940px){#nav{gap:2px;padding:12px 0}.brand{margin-bottom:8px}.brand svg{width:34px;height:34px}.nv{height:50px;gap:3px;font-size:10px}.nv svg{width:20px;height:20px}}
@media (min-width:821px) and (max-height:760px){.brand span{display:none}.nv{height:44px;font-size:9.5px}.nv svg{width:19px;height:19px}}
@media (min-width:821px) and (max-height:640px){.nv{height:40px;font-size:0;gap:0}.nv svg{width:20px;height:20px}}
.track{scroll-padding-inline:40px}.flush .track{scroll-padding-inline:0}html.tv .track{scroll-padding-inline:56px}@media (max-width:820px){.track{scroll-padding-inline:18px}}
.pav.vvav{overflow:hidden}.pav.vvav img{width:100%;height:100%;object-fit:cover;display:block}
.pav.emo{background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.28),transparent 55%),var(--pc)}
.vvavs{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;width:min(420px,100%);margin-top:6px}
.vvavs button{aspect-ratio:1;border-radius:14px;border:1px solid var(--line);background:var(--card);font-size:22px;display:grid;place-items:center;cursor:pointer;color:var(--tx)}
.vvavs button.on{outline:2px solid var(--ac);background:var(--acs)}
.vvavs button.wide{grid-column:span 4;aspect-ratio:auto;height:42px;font-size:13px;font-weight:700}
#vvNext{position:absolute;right:28px;bottom:120px;z-index:6;width:min(360px,calc(100% - 40px));padding:16px;border-radius:20px;background:rgba(14,12,19,.92);border:1px solid rgba(255,255,255,.1);box-shadow:0 20px 60px rgba(0,0,0,.6);display:none;backdrop-filter:blur(12px)}
#vvNext.show{display:block;animation:fade .25s}
#vvNext small{color:var(--mu)}#vvNext b{display:block;font-family:var(--fd);font-size:17px;margin:2px 0 10px}
#vvNext .ring{height:5px;border-radius:9px;background:var(--line);overflow:hidden;margin-bottom:12px}#vvNext .ring i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--ac),var(--ac2));transition:width 1s linear}
#vvNext .inrow{margin:0}
#player.mini #vvNext{display:none!important}
.vvnote{margin:-6px 0 18px;max-width:640px;padding:12px 14px;border-radius:14px;background:rgba(245,194,107,.1);border:1px solid rgba(245,194,107,.3);color:#f5d9a6;font-size:14px;white-space:pre-wrap}
.vvnote b{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#f5c26b;margin-bottom:4px}
.btn.on.vvrem{background:var(--acs);border-color:var(--ac)}
.vvmood{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:14px 0}
.vvmood button{padding:14px 12px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--tx);text-align:left;cursor:pointer;font-weight:700;font-size:14px}
.vvmood button span{display:block;font-size:24px;margin-bottom:6px}
.vvmood button:hover,.vvmood button:focus-visible{border-color:var(--ac);background:var(--acs);outline:none}
.vvsteps{display:flex;gap:6px;margin-bottom:6px}.vvsteps i{flex:1;height:4px;border-radius:9px;background:var(--line)}.vvsteps i.on{background:var(--ac)}
.vvpicks{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
.vvpicks .card{width:auto}
.xbox.wide{width:min(620px,100%)}
.vvkeys .srow kbd{min-width:90px;display:inline-block;text-align:center;padding:7px 12px;border-radius:10px;background:var(--card2);border:1px solid var(--line);font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;color:var(--tx)}
.vvkeys .srow kbd.wait{border-color:var(--ac);color:var(--ac2);animation:vvpulse 1.2s infinite}
.vvperson{display:flex;gap:24px;align-items:center;margin-bottom:26px;flex-wrap:wrap}
.vvperson .ph{width:150px;height:150px;border-radius:50%;overflow:hidden;background:var(--card2);display:grid;place-items:center;font-family:var(--fd);font-size:46px;font-weight:800;flex:none;box-shadow:0 0 0 4px var(--acs)}
.vvperson .ph img{width:100%;height:100%;object-fit:cover}
.vvperson h1{font-family:var(--fd);font-size:clamp(28px,4vw,46px);margin:0 0 6px}.vvperson p{color:var(--mu);margin:0 0 6px;max-width:640px}
.vvcolabs{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:20px}
.vvcolab{padding:14px;border-radius:16px;background:var(--card);border:1px solid var(--line);text-align:left;cursor:pointer;color:var(--tx)}
.vvcolab b{display:block}.vvcolab small{color:var(--mu)}
.vvcwrap{position:relative}.vvcwrap .vvdelc{position:absolute;top:8px;right:8px;z-index:3;width:30px;height:30px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;display:grid;place-items:center;cursor:pointer}
.vvcwrap .vvdelc svg{width:14px;height:14px}
.vvby{display:block;font-size:11px;color:var(--mu);margin-top:-4px}
.vvlive{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#6ff0b8}.vvlive:before{content:"";width:8px;height:8px;border-radius:50%;background:#16c784;animation:vvpulse 1.6s infinite}
.vvnotes .vvn{padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line);margin-bottom:8px;cursor:pointer}
.vvnotes .vvn b{display:block}.vvnotes .vvn small{color:var(--mu);white-space:pre-wrap}
@keyframes vvpulse{50%{box-shadow:0 0 0 8px var(--acs)}}
</style>`);

/* =================== utilidades =================== */
const modal = document.createElement('div'); modal.className = 'xmodal'; document.body.appendChild(modal);
function openModal(html, onReady, wide) { modal.innerHTML = `<div class="xbox ${wide ? 'wide' : ''}">${html}</div>`; modal.classList.add('open'); onReady && onReady(modal); setTimeout(() => modal.querySelector('input, textarea, button')?.focus(), 60); }
function closeModal() { modal.classList.remove('open'); }
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-v3close]')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) { e.stopImmediatePropagation(); closeModal(); } }, true);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtDate = d => new Date(d).toLocaleDateString(S.prefs.lang && S.prefs.lang !== 'pt-PT' ? S.prefs.lang : 'pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });

/* =================== 0. barra lateral =================== */
function fixNav() { const d = document.querySelector('.nv[data-v="downloads"]'); if (d && !d.dataset.v3) { d.dataset.v3 = 1; d.lastChild.textContent = 'Offline'; d.title = 'Transferências'; } }

/* =================== 1. avatares e fotos =================== */
const EMOJIS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐨', '🐙', '🐶', '🐱', '🐧', '🦉', '🐻', '🐰', '🦄', '🐲', '👾', '🤖', '👻', '🎮', '🍿', '🎬', '⚽', '🚀'];
function paintPav(pav, p) {
  if (!pav || !p) return;
  pav.classList.remove('vvav', 'emo');
  if (p.photo) { pav.classList.add('vvav'); pav.innerHTML = `<img src="${esc(p.photo)}" alt="">`; }
  else if (p.emoji) { pav.classList.add('vvav', 'emo'); pav.textContent = p.emoji; pav.style.fontSize = Math.round((parseFloat(pav.style.width) || 40) * .56) + 'px'; }
}
function decorateAvatars() {
  document.querySelectorAll('[data-prof]').forEach(b => paintPav(b.querySelector('.pav'), S.profiles.find(x => x.id === b.dataset.prof)));
  const pb = $('#profBtn'); if (pb) paintPav(pb.querySelector('.pav'), curProfile());
}
const _upb = window.updateProfBtn; window.updateProfBtn = function () { _upb(); decorateAvatars(); };
const _showP = window.showProfiles; window.showProfiles = function (m) { const r = _showP(m); decorateAvatars(); setTimeout(decorateAvatars, 30); return r; };
async function photoFrom(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const n = 192, c = document.createElement('canvas'); c.width = c.height = n;
    const s = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - s) / 2, sy = (img.naturalHeight - s) / 2;
    c.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, n, n);
    return c.toDataURL('image/jpeg', .82);
  } finally { URL.revokeObjectURL(url); }
}
const _editP = window.editProfile;
window.editProfile = function (id) {
  _editP(id);
  const old = id ? S.profiles.find(x => x.id === id) : null;
  const draft = { emoji: (old && old.emoji) || '', photo: (old && old.photo) || '' };
  const av = document.querySelector('#profiles .pedit .pav'), pcol = $('#pcol'); if (!av || !pcol) return;
  const repaint = () => { if (draft.photo || draft.emoji) paintPav(av, draft); else { av.classList.remove('vvav', 'emo'); av.style.fontSize = Math.round(112 * .42) + 'px'; av.textContent = (($('#pname').value.trim()[0]) || '?').toUpperCase(); } };
  pcol.insertAdjacentHTML('afterend', `<div class="vvavs" id="vvAvs">${EMOJIS.map(e => `<button type="button" data-av="${e}" class="${draft.emoji === e && !draft.photo ? 'on' : ''}">${e}</button>`).join('')}
    <button type="button" class="wide" data-avup>📷 Escolher foto</button><button type="button" class="wide ${!draft.emoji && !draft.photo ? 'on' : ''}" data-av="">Só a inicial</button></div><input type="file" accept="image/*" id="vvAvFile" hidden>`);
  repaint();
  const mark = () => $('#vvAvs').querySelectorAll('[data-av]').forEach(b => b.classList.toggle('on', !draft.photo && b.dataset.av === draft.emoji));
  $('#vvAvs').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if ('avup' in b.dataset) return $('#vvAvFile').click();
    draft.emoji = b.dataset.av; draft.photo = ''; mark(); repaint();
  };
  $('#vvAvFile').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { draft.photo = await photoFrom(f); draft.emoji = ''; mark(); repaint(); } catch (err) { toast('Não foi possível usar essa imagem'); } };
  $('#pname').oninput = () => repaint();
  const ps = $('#psave'), prev = ps.onclick;
  ps.onclick = async () => {
    const before = new Set(S.profiles.map(x => x.id));
    await prev();
    const prof = id ? S.profiles.find(x => x.id === id) : S.profiles.find(x => !before.has(x.id));
    if (!prof) return;
    if (draft.photo) { prof.photo = draft.photo; delete prof.emoji; } else if (draft.emoji) { prof.emoji = draft.emoji; delete prof.photo; } else { delete prof.photo; delete prof.emoji; }
    save(); updateProfBtn(); if ($('#profiles').classList.contains('open') && !$('#pname')) { decorateAvatars(); }
  };
};

/* =================== 2. próximo episódio automático =================== */
P.insertAdjacentHTML('beforeend', `<div id="vvNext"><small>Próximo episódio</small><b id="vvNextName"></b><div class="ring"><i id="vvNextBar"></i></div><div class="inrow"><button class="btn sm pri" id="vvNextGo">${I.play}Ver agora</button><button class="btn sm gho" id="vvNextNo">Cancelar <span id="vvNextN"></span></button></div></div>`);
let nextT = null, nextLeft = 0, nextCancelled = null, nextFor = null;
function stopNext(cancel) { clearInterval(nextT); nextT = null; $('#vvNext').classList.remove('show'); if (cancel && PC) nextCancelled = PC.videoId; }
function autoNext() {
  stopNext(false);
  const nx = nextVideo(); if (!nx) return;
  const m = PC.meta, keep = S.prefs.autoplay;
  closePlayer(); S.prefs.autoplay = true; openStreams(m, nx);
  const restore = () => { S.prefs.autoplay = keep; };
  setTimeout(restore, 20000); V.addEventListener('playing', restore, { once: true });
}
function startNext() {
  const nx = nextVideo(); if (!nx || nextT) return;
  nextFor = PC.videoId; nextLeft = 10;
  $('#vvNextName').textContent = `${epLabel(nx)}${nx.name || nx.title ? ' · ' + (nx.name || nx.title) : ''}`;
  $('#nextUp').classList.remove('show'); $('#vvNext').classList.add('show');
  const bar = $('#vvNextBar'); bar.style.transition = 'none'; bar.style.width = '100%'; requestAnimationFrame(() => { bar.style.transition = 'width 1s linear'; });
  const tick = () => { $('#vvNextN').textContent = `(${nextLeft})`; bar.style.width = (nextLeft / 10 * 100) + '%'; if (nextLeft <= 0) return autoNext(); nextLeft--; };
  tick(); nextT = setInterval(tick, 1000);
}
V.addEventListener('timeupdate', () => {
  if (S.prefs.autoNext === false || !PC || !PC.video || !P.classList.contains('open')) return;
  const d = V.duration, t = V.currentTime;
  if (nextT && nextFor !== PC.videoId) stopNext(false);
  if (!d || !isFinite(d) || d < 300 || nextCancelled === PC.videoId) return;
  if (d - t <= 30 && !nextT) startNext();
  else if (d - t > 40 && nextT) stopNext(false);
});
V.addEventListener('ended', () => { if (S.prefs.autoNext !== false && PC && PC.video && nextCancelled !== PC.videoId && !nextT) startNext(); });
$('#vvNextGo').onclick = e => { e.stopPropagation(); autoNext(); };
$('#vvNextNo').onclick = e => { e.stopPropagation(); stopNext(true); toast('Próximo episódio automático cancelado'); };
const _cp = window.closePlayer; window.closePlayer = function () { stopNext(false); return _cp.apply(this, arguments); };
const _pl = window.play; window.play = function () { stopNext(false); nextCancelled = null; return _pl.apply(this, arguments); };

/* =================== 3. listas partilhadas =================== */
const CK = 'vinovim.colab';
const colabs = () => { try { return JSON.parse(localStorage.getItem(CK)) || []; } catch (e) { return []; } };
const saveColabs = l => { try { localStorage.setItem(CK, JSON.stringify(l)); } catch (e) {} scheduleBackup(); };
const CL_CACHE = new Map();
async function capi(q, opts) {
  const r = await fetch(API + '/api/lists' + q, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}));
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(j.error || ('Erro ' + r.status));
  return j;
}
async function fetchColab(c) { const j = await capi(`?id=${c.id}&k=${encodeURIComponent(c.key)}`); CL_CACHE.set(c.id, j.list); const l = colabs(), x = l.find(y => y.id === c.id); if (x && x.name !== j.list.name) { x.name = j.list.name; saveColabs(l); } return j.list; }
async function colabOps(c, ops) { const j = await capi(`?a=op&id=${c.id}&k=${encodeURIComponent(c.key)}`, { method: 'POST', body: JSON.stringify({ ops }) }); CL_CACHE.set(c.id, j.list); return j.list; }
const inviteLink = c => `${SITE}/?web#colab=${c.id}.${c.key}`;
async function newColab() {
  openModal(`<h3>Nova lista partilhada</h3><p class="m">Toda a gente com o link de convite pode ver e editar esta lista, ao mesmo tempo que tu.</p><form id="v3nc"><input class="inp" name="n" maxlength="60" placeholder="Ex.: Filmes para ver com a Ana" required><div class="inrow"><button class="btn acc">Criar</button><button class="btn gho" type="button" data-v3close>Cancelar</button></div></form>`, m => {
    m.querySelector('#v3nc').onsubmit = async e => {
      e.preventDefault(); const name = e.target.n.value.trim(); if (!name) return;
      try { const j = await capi('?a=create', { method: 'POST', body: JSON.stringify({ name, by: curProfile().name }) }); const l = colabs(); l.push({ id: j.id, key: j.key, name }); saveColabs(l); CL_CACHE.set(j.id, j.list); closeModal(); shareColab({ id: j.id, key: j.key, name }); }
      catch (err) { toast(err.message || 'Não foi possível criar a lista'); }
    };
  });
}
function shareColab(c) {
  const link = inviteLink(c);
  openModal(`<h3>Convidar para “${esc(c.name)}”</h3><p class="m">Envia este link a quem quiseres. Quem o abrir no vinovim passa a poder adicionar e tirar títulos.</p><input class="inp" value="${esc(link)}" readonly id="v3link"><div class="inrow"><button class="btn acc" id="v3copy">Copiar link</button><button class="btn gho" data-v3close>Fechar</button></div>`, m => {
    const i = m.querySelector('#v3link'); i.onclick = () => i.select();
    m.querySelector('#v3copy').onclick = async () => { try { await navigator.clipboard.writeText(link); toast('Link copiado'); } catch (e) { i.select(); document.execCommand && document.execCommand('copy'); toast('Link copiado'); } };
  });
}
async function joinColab(code) {
  const [id, key] = String(code || '').split('.'); if (!id || !key) return toast('Link de lista inválido');
  try { const list = await fetchColab({ id, key }); const l = colabs(); if (!l.some(x => x.id === id)) { l.push({ id, key, name: list.name }); saveColabs(l); toast(`Entraste na lista “${list.name}”`); } VIEWS._colab = id; location.hash = 'colab'; }
  catch (e) { toast(e.message || 'Não foi possível abrir a lista'); location.hash = 'library'; }
}
let colabPoll = null;
VIEWS.colab = function () {
  app.className = '';
  const c = colabs().find(x => x.id === VIEWS._colab); if (!c) { location.hash = 'library'; return; }
  const render = list => {
    if (location.hash !== '#colab' || !$('#v3cgrid')) return;
    const items = Object.values(list.items || {}).sort((a, b) => b.added - a.added);
    $('#v3ctitle').textContent = list.name;
    $('#v3cgrid').innerHTML = items.length ? items.map(it => `<div class="vvcwrap">${card({ id: it.id, type: it.type, name: it.name, poster: it.poster || IMG.poster(it.id) })}<button class="vvdelc" data-v3del="${esc(it.id)}" title="Tirar da lista">${XI.x}</button>${it.by ? `<small class="vvby">por ${esc(it.by)}</small>` : ''}</div>`).join('') : emptyHTML(XI.share, 'A lista está vazia', 'Abre um filme ou série e carrega em “Lista partilhada” para o pôr aqui.');
  };
  app.innerHTML = `<div class="view">${topbar('Lista partilhada')}<div class="pad"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px"><h2 id="v3ctitle" style="font-family:var(--fd);margin:0">${esc(c.name)}</h2><span class="vvlive">ao vivo</span><div style="flex:1"></div>
    <button class="btn sm acc" id="v3inv">${XI.share}Convidar</button><button class="btn sm gho" id="v3ren">${XI.pen}Mudar nome</button><button class="btn sm gho" id="v3leave">Sair da lista</button></div><div class="grid" id="v3cgrid"><span class="spin"></span></div></div></div>`;
  $('#v3inv').onclick = () => shareColab(c);
  $('#v3ren').onclick = () => openModal(`<h3>Mudar nome</h3><form id="v3rf"><input class="inp" name="n" maxlength="60" value="${esc(c.name)}" required><div class="inrow"><button class="btn acc">Guardar</button></div></form>`, m => m.querySelector('#v3rf').onsubmit = async e => { e.preventDefault(); try { render(await colabOps(c, [{ op: 'rename', name: e.target.n.value }])); const l = colabs(); const x = l.find(y => y.id === c.id); if (x) { x.name = e.target.n.value; saveColabs(l); } closeModal(); } catch (err) { toast(err.message); } });
  $('#v3leave').onclick = function () { if (!this.dataset.c) { this.dataset.c = 1; this.textContent = 'Carrega outra vez para sair'; return; } saveColabs(colabs().filter(x => x.id !== c.id)); toast('Saíste da lista'); location.hash = 'library'; };
  $('#v3cgrid').addEventListener('click', async e => { const d = e.target.closest('[data-v3del]'); if (!d) return; e.stopPropagation(); try { render(await colabOps(c, [{ op: 'del', id: d.dataset.v3del }])); } catch (err) { toast(err.message); } }, true);
  if (CL_CACHE.has(c.id)) render(CL_CACHE.get(c.id));
  const poll = () => fetchColab(c).then(render).catch(err => { const g = $('#v3cgrid'); if (g && !CL_CACHE.has(c.id)) g.innerHTML = emptyHTML(XI.share, 'Não foi possível abrir a lista', esc(err.message)); });
  poll(); clearInterval(colabPoll); colabPoll = setInterval(() => { if (location.hash === '#colab' && !document.hidden) poll(); else if (location.hash !== '#colab') clearInterval(colabPoll); }, 6000);
};
function addToColabDialog(m) {
  const l = colabs();
  openModal(`<h3>Lista partilhada</h3><p class="m">Escolhe a lista onde pôr <b>${esc(m.name)}</b>.</p><div class="vvcolabs" style="grid-template-columns:1fr">${l.map(c => `<button class="vvcolab" data-v3add="${c.id}"><b>${esc(c.name)}</b><small>Partilhada</small></button>`).join('') || '<p class="m">Ainda não tens listas partilhadas.</p>'}</div><div class="inrow"><button class="btn gho" id="v3new">${I.plus}Nova lista partilhada</button><button class="btn gho" data-v3close>Fechar</button></div>`, md => {
    md.querySelector('#v3new').onclick = newColab;
    md.querySelectorAll('[data-v3add]').forEach(b => b.onclick = async () => { const c = l.find(x => x.id === b.dataset.v3add); try { await colabOps(c, [{ op: 'add', by: curProfile().name, item: { id: m.id, type: m.type, name: m.name, poster: m.poster || IMG.poster(m.id) } }]); toast(`Adicionado a “${c.name}”`); closeModal(); } catch (err) { toast(err.message); } });
  });
}
function colabSection() {
  const l = colabs();
  return `<h3 class="sec" style="display:flex;align-items:center;gap:10px">Listas partilhadas <span style="flex:1"></span><button class="btn sm gho" data-v3newc>${I.plus}Nova</button><button class="btn sm gho" data-v3join>Entrar com link</button></h3>
    ${l.length ? `<div class="vvcolabs">${l.map(c => `<button class="vvcolab" data-v3open="${c.id}"><b>${esc(c.name)}</b><small>Com amigos · edição ao vivo</small></button>`).join('')}</div>` : '<p class="m" style="color:var(--mu);margin-bottom:22px">Cria uma lista e envia o link a um amigo: os dois podem pôr e tirar títulos ao mesmo tempo.</p>'}`;
}
function joinDialog() { openModal(`<h3>Entrar numa lista partilhada</h3><p class="m">Cola o link de convite que recebeste.</p><form id="v3jf"><input class="inp" name="l" placeholder="${SITE}/?web#colab=…" required><div class="inrow"><button class="btn acc">Entrar</button></div></form>`, m => m.querySelector('#v3jf').onsubmit = e => { e.preventDefault(); const v = e.target.l.value; const mm = v.match(/colab=([a-f0-9]+\.[\w-]+)/); closeModal(); joinColab(mm ? mm[1] : v.trim()); }); }

/* =================== 4. Avisa-me (lembrete de estreia) =================== */
const remind = () => { const d = PD(); return d.remind || (d.remind = {}); };
function releaseDate(m) {
  const now = Date.now();
  if (m.type === 'movie') { const d = Date.parse(m.released || ''); if (d > now) return d; const y = parseInt(m.releaseInfo || m.year, 10); if (!d && y > new Date().getFullYear()) return Date.UTC(y, 0, 1); return 0; }
  const vs = (m.videos || []).filter(v => v.season > 0 && v.released).map(v => Date.parse(v.released)).filter(Boolean).sort((a, b) => a - b);
  if (vs.length && vs[0] > now) return vs[0];
  if (!vs.length) { const y = parseInt(m.releaseInfo || m.year, 10); if (y >= new Date().getFullYear() && !(m.videos || []).length) return Date.UTC(y, 11, 31); }
  return 0;
}
function toggleRemind(m, d) {
  const r = remind();
  if (r[m.id]) { delete r[m.id]; toast('Lembrete removido'); }
  else { r[m.id] = { id: m.id, type: m.type, name: m.name, poster: m.poster || IMG.poster(m.id), date: d, set: Date.now() }; toast(`Avisamos-te quando “${m.name}” sair`); if (S.prefs.notify === undefined || S.prefs.notify) { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} } }
  save(); scheduleBackup();
}
async function checkReminders() {
  const r = remind(), now = Date.now(), hits = [];
  for (const it of Object.values(r)) {
    if (it.done) continue;
    let d = it.date;
    if (!d || d > now) { try { const m = await getMeta(it.type, it.id); const nd = releaseDate(m); d = nd || (Date.parse(m.released || '') || now); it.date = d; } catch (e) {} }
    if (d && d <= now) { it.done = now; hits.push(it); }
  }
  if (!hits.length) return;
  save();
  const msg = hits.length === 1 ? `Já saiu: ${hits[0].name}!` : `${hits.length} títulos que pediste já saíram`;
  toast('🔔 ' + msg);
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification('vinovim', { body: msg, icon: 'icons/icon-192.png' }); } catch (e) {}
}

/* =================== 10. notas privadas =================== */
const notes = () => { const d = PD(); return d.notes || (d.notes = {}); };
function noteDialog(m) {
  const n = notes()[m.id];
  openModal(`<h3>Nota sobre “${esc(m.name)}”</h3><p class="m">Só tu vês esta nota (fica no teu perfil).</p><textarea class="inp" id="v3note" rows="5" maxlength="1000" style="height:auto;padding:12px;resize:vertical" placeholder="Ex.: ver com a Ana · recomendado pelo Rui">${esc(n ? n.text : '')}</textarea>
    <div class="inrow"><button class="btn acc" id="v3ns">Guardar</button>${n ? '<button class="btn gho" id="v3nd">Apagar nota</button>' : ''}<button class="btn gho" data-v3close>Cancelar</button></div>`, md => {
    md.querySelector('#v3ns').onclick = () => { const t = md.querySelector('#v3note').value.trim(); if (t) notes()[m.id] = { text: t, name: m.name, type: m.type, updated: Date.now() }; else delete notes()[m.id]; save(); scheduleBackup(); closeModal(); detailExtras3(m); toast('Nota guardada'); };
    const del = md.querySelector('#v3nd'); if (del) del.onclick = () => { delete notes()[m.id]; save(); scheduleBackup(); closeModal(); detailExtras3(m); toast('Nota apagada'); };
  });
}

/* detalhe: botões extra */
function detailExtras3(m) {
  const box = document.querySelector('#detail .hbtns'); if (!box || !m) return;
  box.querySelectorAll('.v3dx').forEach(x => x.remove());
  const n = notes()[m.id], rd = releaseDate(m), on = !!remind()[m.id];
  box.insertAdjacentHTML('beforeend', `${rd || on ? `<button class="btn gho v3dx ${on ? 'on vvrem' : ''}" data-v3rem>${XI.bell}${on ? 'Vou ser avisado' : 'Avisa-me'}</button>` : ''}<button class="btn gho v3dx" data-v3note title="Nota privada">${XI.pen}${n ? 'Editar nota' : 'Nota'}</button><button class="btn gho v3dx" data-v3col title="Lista partilhada">${XI.share}Partilhada</button>`);
  box.querySelector('[data-v3rem]')?.addEventListener('click', () => { toggleRemind(m, rd); detailExtras3(m); });
  box.querySelector('[data-v3note]').onclick = () => noteDialog(m);
  box.querySelector('[data-v3col]').onclick = () => addToColabDialog(m);
  document.querySelectorAll('#detail .vvnote').forEach(x => x.remove());
  if (n) { const desc = document.querySelector('#detail .ddesc'); if (desc) desc.insertAdjacentHTML('afterend', `<div class="vvnote"><b>A tua nota</b>${esc(n.text)}</div>`); }
  if (rd && !document.querySelector('#detail .v3soon')) { const meta = document.querySelector('#detail .dmeta'); if (meta) meta.insertAdjacentHTML('beforeend', `<span class="pill v3soon">Estreia: ${fmtDate(rd)}</span>`); }
}
const _ls = window.loadSimilar;
window.loadSimilar = function (m) { try { detailExtras3(m); } catch (e) {} return _ls(m); };

/* =================== 5. início personalizável por perfil =================== */
function bindCats() { const d = PD(); if (!d.cats) d.cats = JSON.parse(JSON.stringify(S.cats || { order: [], on: {} })); S.cats = d.cats; }
const SPECIAL = [['cont', 'Continuar a ver', /^(Continuar a ver|Continuar assistindo|Continue watching|Seguir viendo)$/i], ['lib', 'A tua biblioteca', /^(A tua biblioteca|Sua biblioteca|Your library|Tu biblioteca)$/i], ['rec', 'Recomendado para ti', /Recomendado|Recommended/i], ['eps', 'Novos episódios', /Novos episódios|New episodes|Nuevos episodios/i], ['rem', 'Os teus lembretes', /lembretes|reminders|recordatorios/i]];
const homeRows = () => { const d = PD(); return d.homeRows || (d.homeRows = {}); };
let rowsObs = null;
function filterRows() {
  const rows = $('#rows'); if (!rows) return; const hr = homeRows();
  rows.querySelectorAll('.row').forEach(r => { const t = (r.querySelector('h2')?.textContent || '').trim(); const sp = SPECIAL.find(([, , re]) => re.test(t)); r.style.display = sp && hr[sp[0]] === false ? 'none' : ''; });
}
const _home = VIEWS.home;
VIEWS.home = async function () {
  bindCats();
  const r = await _home.apply(VIEWS, arguments);
  const rows = $('#rows'); if (!rows) return r;
  const rm = Object.values(remind()).filter(x => !x.done || x.done > Date.now() - 14 * 864e5).sort((a, b) => (a.date || 0) - (b.date || 0));
  if (rm.length) rows.insertAdjacentHTML('afterbegin', rowHTML('Os teus lembretes', rm.map(x => card({ id: x.id, type: x.type, name: x.name, poster: x.poster, releaseInfo: x.done ? 'Já disponível!' : (x.date ? fmtDate(x.date) : 'Em breve') })).join(''), 'carregaste em “Avisa-me”'));
  if (rowsObs) rowsObs.disconnect(); rowsObs = new MutationObserver(filterRows); rowsObs.observe(rows, { childList: true }); filterRows();
  return r;
};

/* =================== 6. “Não sei o que ver” =================== */
const MOODS = [['😂', 'Quero rir', ['Comedy', 'Animation']], ['😭', 'Quero emoção', ['Drama', 'Romance']], ['💥', 'Adrenalina', ['Action', 'Thriller', 'Adventure']], ['😱', 'Quero medo', ['Horror', 'Mystery']], ['🧠', 'Pôr a cabeça a pensar', ['Sci-Fi', 'Mystery', 'Documentary']], ['🛋️', 'Algo leve e tranquilo', ['Family', 'Animation', 'Comedy']]];
const TIMES = [['⏱️', 'Pouco tempo (um episódio)', 'series'], ['🎬', 'Um filme (até 2 horas)', 'movie'], ['🌙', 'A noite toda (maratona)', 'series'], ['🤷', 'Tanto faz', 'any']];
function moodDialog() {
  const st = { step: 0, mood: null, time: null, genre: null };
  const steps = () => `<div class="vvsteps">${[0, 1, 2].map(i => `<i class="${i <= st.step ? 'on' : ''}"></i>`).join('')}</div>`;
  const render = () => {
    let body = '';
    if (st.step === 0) body = `<h3>Como te sentes hoje?</h3><div class="vvmood">${MOODS.map((m, i) => `<button data-mo="${i}"><span>${m[0]}</span>${m[1]}</button>`).join('')}</div>`;
    else if (st.step === 1) body = `<h3>Quanto tempo tens?</h3><div class="vvmood">${TIMES.map((t, i) => `<button data-ti="${i}"><span>${t[0]}</span>${t[1]}</button>`).join('')}</div>`;
    else if (st.step === 2) body = `<h3>E o género?</h3><div class="vvmood">${MOODS[st.mood][2].map(g => `<button data-ge="${g}"><span>🎯</span>${GPT[g] || g}</button>`).join('')}<button data-ge=""><span>🎲</span>Surpreende-me</button></div>`;
    else body = `<h3>Experimenta um destes</h3><div class="vvpicks" id="v3picks"><span class="spin"></span></div><div class="inrow"><button class="btn acc" id="v3more">🎲 Outras sugestões</button><button class="btn gho" id="v3again">Recomeçar</button><button class="btn gho" data-v3close>Fechar</button></div>`;
    openModal(steps() + body + (st.step < 3 ? `<div class="inrow">${st.step ? '<button class="btn gho" id="v3back">Voltar</button>' : ''}<button class="btn gho" data-v3close>Cancelar</button></div>` : ''), md => {
      md.querySelectorAll('[data-mo]').forEach(b => b.onclick = () => { st.mood = +b.dataset.mo; st.step = 1; render(); });
      md.querySelectorAll('[data-ti]').forEach(b => b.onclick = () => { st.time = +b.dataset.ti; st.step = 2; render(); });
      md.querySelectorAll('[data-ge]').forEach(b => b.onclick = () => { st.genre = b.dataset.ge; st.step = 3; render(); });
      md.querySelector('#v3back')?.addEventListener('click', () => { st.step--; render(); });
      md.querySelector('#v3again')?.addEventListener('click', () => { st.step = 0; render(); });
      md.querySelector('#v3more')?.addEventListener('click', () => suggest(st));
      md.addEventListener('click', e => { if (e.target.closest('[data-open]')) closeModal(); });
      if (st.step === 3) suggest(st);
    }, st.step === 3);
  };
  render();
}
const POOL = new Map();
async function suggest(st) {
  const el = $('#v3picks'); if (!el) return; el.innerHTML = '<span class="spin"></span>';
  const type = TIMES[st.time][2], genres = st.genre ? [st.genre] : MOODS[st.mood][2];
  const types = type === 'any' ? ['movie', 'series'] : [type];
  const key = types.join() + genres.join();
  if (!POOL.has(key)) {
    const jobs = []; types.forEach(t => genres.forEach(g => jobs.push(catalog(cinemeta(), t, 'imdbRating', { genre: g }).catch(() => []), catalog(cinemeta(), t, 'top', { genre: g }).catch(() => []))));
    const seen = new Set([...Object.keys(S.library || {}), ...Object.keys((PD().stats || {}).titles || {}), ...Object.keys(S.watched || {})]);
    const all = new Map(); (await Promise.all(jobs)).flat().forEach(m => { if (!seen.has(m.id) && !all.has(m.id)) all.set(m.id, m); });
    POOL.set(key, shuffle([...all.values()]));
  }
  const pool = POOL.get(key); if (!$('#v3picks')) return;
  if (!pool.length) { $('#v3picks').outerHTML = '<p class="m" id="v3picks">Não encontrei nada novo para ti com essas escolhas. Experimenta outras respostas.</p>'; return; }
  const picks = pool.splice(0, 3); if (pool.length < 3) POOL.delete(key);
  $('#v3picks').innerHTML = picks.map(card).join('');
}

/* =================== 7. atalhos de teclado e comandos de jogos =================== */
const ACTIONS = [['toggle', 'Reproduzir / pausar', ' '], ['back', 'Recuar 10 segundos', 'arrowleft'], ['fwd', 'Avançar 10 segundos', 'arrowright'], ['volup', 'Subir volume', 'arrowup'], ['voldown', 'Baixar volume', 'arrowdown'], ['fs', 'Ecrã inteiro', 'f'], ['mute', 'Tirar / pôr som', 'm'], ['next', 'Próximo episódio', 'n'], ['mini', 'Mini-player', 'i'], ['menu', 'Legendas e definições', 'c']];
const kname = k => ({ ' ': 'Espaço', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓', escape: 'Esc', enter: 'Enter' }[k] || (k.length === 1 ? k.toUpperCase() : k));
const keyOf = a => ((S.prefs.keys || {})[a[0]] || a[2]);
function runAction(id) {
  switch (id) {
    case 'toggle': togglePlay(); break; case 'back': skip(-10); break; case 'fwd': skip(10); break;
    case 'volup': V.volume = Math.min(1, V.volume + .1); V.muted = false; break; case 'voldown': V.volume = Math.max(0, V.volume - .1); break;
    case 'fs': toggleFs(); break; case 'mute': V.muted = !V.muted; break; case 'next': goNext(); break;
    case 'mini': $('#vvMiniBtn')?.click(); break; case 'menu': $('#pCC')?.click(); break;
  }
  poke();
}
let capturing = null;
document.addEventListener('keydown', e => {
  if (capturing) { e.preventDefault(); e.stopImmediatePropagation(); const k = e.key.toLowerCase(); capturing(k === 'escape' ? null : k); return; }
  if (!P.classList.contains('open') || modal.classList.contains('open')) return;
  if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), custom = S.prefs.keys || {};
  if (!Object.keys(custom).length) return;
  const hit = ACTIONS.find(a => keyOf(a) === k);
  if (hit) { e.preventDefault(); e.stopImmediatePropagation(); runAction(hit[0]); return; }
  if (ACTIONS.some(a => custom[a[0]] && a[2] === k)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
function keysPanel() {
  return `<div class="panel vvkeys"><h3>Atalhos do leitor</h3><p class="m">Carrega num atalho e depois na tecla que queres usar (Esc cancela).</p>
    ${ACTIONS.map(a => `<div class="srow"><div class="tx"><b>${a[1]}</b></div><kbd data-v3key="${a[0]}" tabindex="0">${esc(kname(keyOf(a)))}</kbd></div>`).join('')}
    <div class="inrow" style="margin-top:12px"><button class="btn gho" id="v3kreset">Repor atalhos</button></div></div>
    <div class="panel"><h3>Comandos de jogos</h3><p class="m">Liga um comando de Xbox ou PlayStation (por cabo ou Bluetooth) e carrega num botão. Funciona no PC, na TV e no Android.</p>
    <p class="m" style="margin:0;line-height:1.8">A / ✕ escolher · B / ○ voltar · X / □ reproduzir ou pausar · Y / △ pesquisar · LB-RB / L1-R1 −10 s / +10 s · Setas ou analógico para navegar · Start / Options legendas · Select / Share mini-player</p>
    <p class="m" id="v3padst" style="margin-top:10px;color:var(--tx)">${padName ? '🎮 Ligado: ' + esc(padName) : 'Nenhum comando ligado'}</p></div>`;
}
function bindKeys(pad) {
  pad.querySelectorAll('[data-v3key]').forEach(kb => kb.onclick = () => {
    pad.querySelectorAll('kbd.wait').forEach(x => x.classList.remove('wait'));
    kb.classList.add('wait'); kb.textContent = 'Carrega…';
    capturing = k => { capturing = null; kb.classList.remove('wait'); if (k) { const id = kb.dataset.v3key; ACTIONS.forEach(a => { if (a[0] !== id && keyOf(a) === k) { S.prefs.keys = S.prefs.keys || {}; S.prefs.keys[a[0]] = a[2] === k ? '' : a[2]; } }); S.prefs.keys = S.prefs.keys || {}; S.prefs.keys[id] = k; save(); scheduleBackup(); } VIEWS.settings(); };
  });
  const rs = pad.querySelector('#v3kreset'); if (rs) rs.onclick = () => { delete S.prefs.keys; save(); scheduleBackup(); VIEWS.settings(); toast('Atalhos repostos'); };
}
/* comandos de jogos (Gamepad API) */
let padName = '', padLoop = null, padPrev = [], padRepeat = {}, axisPrev = '';
const pressKey = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
function padNav(dir) {
  if (P.classList.contains('open')) { pressKey({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir]); return; }
  if (typeof moveFocus === 'function') moveFocus(dir);
}
function padOK() { const a = document.activeElement; if (P.classList.contains('open') && (!a || a === document.body || a === V)) return togglePlay(); if (a && a !== document.body) a.click(); else padNav('down'); }
function padBack() { if (modal.classList.contains('open')) return closeModal(); const xm = document.querySelector('.xmodal.open'); if (xm) { xm.classList.remove('open'); return; } if ($('#profiles').classList.contains('open')) { $('#profiles').classList.remove('open'); return; } if (typeof openCount === 'function' && openCount()) uiBack(); else if (location.hash !== '#home' && location.hash) history.back(); }
const PADMAP = { 0: padOK, 1: padBack, 2: () => P.classList.contains('open') ? togglePlay() : null, 3: () => { location.hash = 'search'; }, 4: () => P.classList.contains('open') && skip(-10), 5: () => P.classList.contains('open') && skip(10), 8: () => $('#vvMiniBtn')?.click(), 9: () => P.classList.contains('open') ? $('#pCC')?.click() : null, 12: () => padNav('up'), 13: () => padNav('down'), 14: () => padNav('left'), 15: () => padNav('right') };
function padTick() {
  const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(Boolean);
  if (!pads.length) { padLoop = null; return; }
  const gp = pads[0], now = performance.now();
  gp.buttons.forEach((b, i) => {
    const down = b.pressed || b.value > .5, was = padPrev[i];
    if (down && !was) { padRepeat[i] = now + 420; PADMAP[i] && PADMAP[i](); }
    else if (down && was && i >= 12 && i <= 15 && now > (padRepeat[i] || 0)) { padRepeat[i] = now + 140; PADMAP[i](); }
    padPrev[i] = down;
  });
  const [x, y] = [gp.axes[0] || 0, gp.axes[1] || 0];
  const dir = Math.abs(x) > .6 || Math.abs(y) > .6 ? (Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up')) : '';
  if (dir && (dir !== axisPrev || now > (padRepeat.ax || 0))) { padRepeat.ax = now + (dir !== axisPrev ? 420 : 160); padNav(dir); }
  axisPrev = dir;
  padLoop = requestAnimationFrame(padTick);
}
window.addEventListener('gamepadconnected', e => {
  padName = /xbox|xinput/i.test(e.gamepad.id) ? 'Comando Xbox' : /054c|playstation|dualsense|dualshock|wireless controller/i.test(e.gamepad.id) ? 'Comando PlayStation' : 'Comando de jogos';
  toast('🎮 ' + padName + ' ligado'); const st = $('#v3padst'); if (st) st.textContent = '🎮 Ligado: ' + padName;
  if (!padLoop) padLoop = requestAnimationFrame(padTick);
});
window.addEventListener('gamepaddisconnected', () => { padName = ''; toast('Comando de jogos desligado'); });

/* =================== 8. cópia de segurança automática =================== */
const PD_KEYS = ['badges', 'flags', 'notes', 'remind', 'homeRows', 'cats', 'intros', 'ratings', 'lists', 'stats'];
const BKK = 'vinovim.backup';
const bkState = (() => { try { return JSON.parse(localStorage.getItem(BKK)) || {}; } catch (e) { return {}; } })();
const saveBk = () => { try { localStorage.setItem(BKK, JSON.stringify(bkState)); } catch (e) {} };
function backupData() {
  return { v: 1, at: Date.now(), prefs: S.prefs, accent: S.accent, addonsOff: S.addonsOff || [], colab: colabs(), profiles: S.profiles.map(p => ({ id: p.id, emoji: p.emoji, photo: p.photo, kids: p.kids, pin: p.pin })),
    pdata: Object.fromEntries(S.profiles.map(p => [p.id, Object.fromEntries(PD_KEYS.map(k => [k, (S.pdata[p.id] || {})[k]]).filter(([, v]) => v !== undefined))])) };
}
const bhash = o => { const s = JSON.stringify(Object.assign({}, o, { at: 0 })); let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0; return h + ':' + s.length; };
async function bapi(method, body) {
  const a = auth(); if (!a.token) throw new Error('Sem sessão');
  const r = await fetch(API + '/api/account?a=backup', { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.token }, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) {} if (!r.ok) throw new Error(j.error || ('Erro ' + r.status)); return j;
}
let bkT = null, bkBusy = false;
function scheduleBackup() { if (!auth().token) return; clearTimeout(bkT); bkT = setTimeout(() => backupNow(false), 15000); }
async function backupNow(manual) {
  if (bkBusy || !auth().token) return; const data = backupData(), h = bhash(data);
  if (!manual && h === bkState.hash) return;
  bkBusy = true;
  try { await bapi('PUT', { backup: data }); bkState.hash = h; bkState.last = Date.now(); saveBk(); if (manual) toast('Cópia de segurança guardada'); paintBk(); }
  catch (e) { if (manual) toast('Não foi possível guardar: ' + e.message); }
  bkBusy = false;
}
function applyBackup(b) {
  if (!b) return false;
  Object.keys(b.prefs || {}).forEach(k => { if (S.prefs[k] === undefined || bkState.force) S.prefs[k] = b.prefs[k]; });
  if (b.addonsOff && !(S.addonsOff || []).length) S.addonsOff = b.addonsOff;
  const l = colabs(); (b.colab || []).forEach(c => { if (!l.some(x => x.id === c.id)) l.push(c); }); try { localStorage.setItem(CK, JSON.stringify(l)); } catch (e) {}
  (b.profiles || []).forEach(rp => { const p = S.profiles.find(x => x.id === rp.id); if (!p) return; ['emoji', 'photo', 'kids', 'pin'].forEach(k => { if (p[k] === undefined && rp[k] !== undefined) p[k] = rp[k]; }); });
  Object.entries(b.pdata || {}).forEach(([pid, rd]) => {
    const L = S.pdata[pid]; if (!L) return;
    Object.entries(rd).forEach(([k, v]) => {
      if (v == null) return;
      if (['notes', 'remind', 'badges', 'ratings', 'intros'].includes(k)) L[k] = Object.assign({}, v, L[k] || {});
      else if (L[k] === undefined) L[k] = v;
    });
  });
  save(); applyAccent(); return true;
}
async function restoreBackup(manual) {
  try { const j = await bapi('GET'); if (!j.backup) { if (manual) toast('Ainda não há nenhuma cópia nesta conta'); return; } bkState.force = !!manual; applyBackup(j.backup); bkState.force = false; bkState.restored = Date.now(); saveBk(); if (manual) { toast('Cópia restaurada'); setTimeout(() => location.reload(), 900); } }
  catch (e) { if (manual) toast('Não foi possível restaurar: ' + e.message); }
}
function paintBk() { const e = $('#v3bkst'); if (e) e.textContent = bkState.last ? 'Última cópia: ' + new Date(bkState.last).toLocaleString() : 'Ainda não foi feita nenhuma cópia neste aparelho'; }
setInterval(() => { if (!document.hidden) backupNow(false); }, 10 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (document.hidden) backupNow(false); });

/* =================== 9. página de ator =================== */
const PCACHE = new Map();
async function wikidata(name) {
  const n = name.replace(/["\\]/g, '');
  const q = `SELECT ?p ?imdb ?w ?wl ?y ?ser ?img ?born ?desc WHERE {
    VALUES ?lab { "${n}"@en "${n}"@pt "${n}"@es } ?p rdfs:label ?lab; wdt:P31 wd:Q5.
    OPTIONAL { ?p wdt:P18 ?img } OPTIONAL { ?p wdt:P569 ?born } OPTIONAL { ?p schema:description ?desc FILTER(LANG(?desc) = "pt") }
    { ?w wdt:P161 ?p } UNION { ?w wdt:P725 ?p } UNION { ?w wdt:P57 ?p }
    ?w wdt:P345 ?imdb. FILTER(STRSTARTS(?imdb, "tt"))
    OPTIONAL { ?w wdt:P577 ?d } BIND(YEAR(?d) AS ?y)
    BIND(EXISTS { VALUES ?sc { wd:Q5398426 wd:Q1259759 wd:Q581714 wd:Q117467246 wd:Q15416 wd:Q63952888 } ?w wdt:P31 ?sc } AS ?ser)
    OPTIONAL { ?w rdfs:label ?wl FILTER(LANG(?wl) = "en") } } LIMIT 1500`;
  const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q), { headers: { Accept: 'application/sparql-results+json' } });
  if (!r.ok) throw new Error('wikidata ' + r.status);
  const rows = (await r.json()).results.bindings; if (!rows.length) return null;
  const counts = {}; rows.forEach(b => counts[b.p.value] = (counts[b.p.value] || 0) + 1);
  const pid = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const works = new Map(); let info = {};
  rows.filter(b => b.p.value === pid).forEach(b => {
    if (b.img && !info.img) info.img = b.img.value.replace(/^http:/, 'https:') + '?width=400';
    if (b.born && !info.born) info.born = b.born.value; if (b.desc && !info.desc) info.desc = b.desc.value;
    const id = b.imdb.value, y = b.y ? +b.y.value : 0, ex = works.get(id);
    if (!ex) works.set(id, { id, type: b.ser && b.ser.value === 'true' ? 'series' : 'movie', name: b.wl ? b.wl.value : id, year: y });
    else if (y && (!ex.year || y < ex.year)) ex.year = y;
  });
  return { info, works: [...works.values()].sort((a, b) => (b.year || 0) - (a.year || 0)) };
}
async function filmography(name) {
  if (PCACHE.has(name)) return PCACHE.get(name);
  let res = null;
  try { res = await wikidata(name); } catch (e) {}
  if (!res || !res.works.length) {
    const [mv, sr] = await Promise.all(['movie', 'series'].map(t => catalog(cinemeta(), t, 'top', { search: name }).catch(() => [])));
    res = { info: {}, works: [...mv, ...sr].map(m => ({ id: m.id, type: m.type, name: m.name, poster: m.poster, year: parseInt(m.releaseInfo, 10) || 0 })).sort((a, b) => b.year - a.year), approx: true };
  }
  PCACHE.set(name, res); return res;
}
VIEWS.person = async function () {
  app.className = '';
  const p = VIEWS._person || { name: '' }; if (!p.name) { location.hash = 'home'; return; }
  app.innerHTML = `<div class="view">${topbar('Ator')}<div class="pad"><div class="vvperson"><div class="ph" id="v3ph">${p.photo ? `<img src="${esc(p.photo)}" alt="" onerror="this.remove()">` : esc(initials(p.name))}</div><div><h1>${esc(p.name)}</h1><p id="v3pinfo">A carregar a filmografia…</p><div class="inrow" style="margin:8px 0 0"><button class="btn sm gho" id="v3psearch">${I.search}Pesquisar pelo nome</button></div></div></div><div id="v3pbody"><span class="spin"></span></div></div></div>`;
  $('#v3psearch').onclick = () => { VIEWS._pendingQ = p.name; location.hash = 'search'; };
  const res = await filmography(p.name); if (location.hash !== '#person' || !$('#v3pbody')) return;
  const { info, works } = res;
  if (info.img && !p.photo) $('#v3ph').innerHTML = `<img src="${esc(info.img)}" alt="" onerror="this.remove()">`;
  $('#v3pinfo').textContent = [info.desc, info.born ? 'Nasceu em ' + fmtDate(info.born) : '', `${works.length} títulos${res.approx ? ' (resultados da pesquisa)' : ''}`].filter(Boolean).join(' · ');
  const mk = list => list.map(w => card({ id: w.id, type: w.type, name: w.name, poster: w.poster || IMG.poster(w.id), releaseInfo: w.year ? String(w.year) : '' })).join('');
  const mv = works.filter(w => w.type === 'movie'), sr = works.filter(w => w.type === 'series');
  $('#v3pbody').innerHTML = (works.length ? '' : emptyHTML(I.search, 'Sem filmografia', 'Não encontrei títulos para este nome.')) +
    (mv.length ? `<h3 class="sec">Filmes · ${mv.length}</h3><div class="grid" style="margin-bottom:28px">${mk(mv)}</div>` : '') +
    (sr.length ? `<h3 class="sec">Séries · ${sr.length}</h3><div class="grid">${mk(sr)}</div>` : '');
};
document.addEventListener('click', e => {
  const ps = e.target.closest('[data-person]'); if (!ps) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const img = ps.querySelector('img');
  VIEWS._person = { name: ps.dataset.person, photo: img && img.complete && img.naturalWidth ? img.src : '' };
  if ($('#detail').classList.contains('open')) closeDetail();
  if (location.hash === '#person') route(); else location.hash = 'person';
}, true);
Object.assign(VIEW_TXT, { person: 'A ver a filmografia de um ator', colab: 'Numa lista partilhada' });

/* =================== definições, biblioteca e barra =================== */
const _settings = VIEWS.settings;
VIEWS.settings = function () {
  bindCats();
  const r = _settings.apply(VIEWS, arguments);
  const pad = document.querySelector('#app .pad'); if (!pad) return r;
  decorateAvatars();
  if (isKidsNow()) return r;
  const cat = $('#catl'); if (cat) { const panel = cat.closest('.panel'); panel.querySelector('h3').textContent = 'Início deste perfil'; panel.querySelector('.m').textContent = `Cada perfil tem o seu início. Escolhe as filas que o perfil “${curProfile().name}” vê e a ordem.`;
    const hr = homeRows(); cat.insertAdjacentHTML('beforebegin', SPECIAL.map(([k, l]) => `<div class="srow"><div class="tx"><b>${l}</b><small>Fila especial</small></div><button class="tg ${hr[k] === false ? '' : 'on'}" data-v3row="${k}"></button></div>`).join(''));
    panel.querySelectorAll('[data-v3row]').forEach(b => b.onclick = () => { hr[b.dataset.v3row] = hr[b.dataset.v3row] === false; b.classList.toggle('on', hr[b.dataset.v3row] !== false); save(); scheduleBackup(); }); }
  const play = [...pad.querySelectorAll('.panel')].find(p => p.querySelector('[data-pref="autoplay"]'));
  if (play) play.querySelector('[data-pref="autoplay"]').closest('.srow').insertAdjacentHTML('afterend', `<div class="srow"><div class="tx"><b>Próximo episódio automático</b><small>Começa sozinho 10 segundos antes do fim, com botão para cancelar</small></div><button class="tg ${S.prefs.autoNext === false ? '' : 'on'}" id="v3an"></button></div>`);
  const an = $('#v3an'); if (an) an.onclick = () => { S.prefs.autoNext = S.prefs.autoNext === false; an.classList.toggle('on', S.prefs.autoNext !== false); save(); scheduleBackup(); };
  const shortcuts = [...pad.querySelectorAll('.panel')].find(p => /Atalhos no leitor/.test(p.textContent));
  const html = keysPanel();
  if (shortcuts) shortcuts.outerHTML = html; else pad.insertAdjacentHTML('beforeend', html);
  bindKeys(pad);
  const acct = pad.querySelector('.panel'); const logged = !!auth().token;
  acct && acct.insertAdjacentHTML('afterend', `<div class="panel"><h3>Cópia de segurança automática</h3><p class="m">${logged ? 'Os temas, as conquistas, as notas, os lembretes, os avatares, os atalhos e as definições do leitor ficam guardados na tua conta, de 10 em 10 minutos.' : 'Entra na tua conta vinovim (acima) para guardar automaticamente os temas, as conquistas, as notas, os lembretes e as definições.'}</p>
    ${logged ? `<p class="m" id="v3bkst" style="color:var(--tx)"></p><div class="inrow"><button class="btn gho" id="v3bkn">${XI.cloud}Guardar agora</button><button class="btn gho" id="v3bkr">Restaurar da conta</button></div>` : ''}</div>`);
  paintBk();
  const bn = $('#v3bkn'), br = $('#v3bkr'); if (bn) bn.onclick = () => backupNow(true); if (br) br.onclick = () => restoreBackup(true);
  return r;
};
const isKidsNow = () => !!(curProfile() || {}).kids;
const _library = VIEWS.library;
VIEWS.library = function () {
  const r = _library.apply(VIEWS, arguments);
  const pad = document.querySelector('#app .pad'); if (!pad) return r;
  const row = pad.querySelector('.inrow');
  const nts = Object.entries(notes()).sort((a, b) => b[1].updated - a[1].updated);
  const html = colabSection() + (nts.length ? `<h3 class="sec">As tuas notas</h3><div class="vvnotes" style="margin-bottom:22px">${nts.map(([id, n]) => `<div class="vvn" data-open="${esc(n.type || 'movie')}|${esc(id)}"><b>${esc(n.name || id)}</b><small>${esc(n.text)}</small></div>`).join('')}</div>` : '');
  if (row) row.insertAdjacentHTML('afterend', html); else pad.insertAdjacentHTML('afterbegin', html);
  pad.querySelector('[data-v3newc]').onclick = newColab;
  pad.querySelector('[data-v3join]').onclick = joinDialog;
  pad.querySelectorAll('[data-v3open]').forEach(b => b.onclick = () => { VIEWS._colab = b.dataset.v3open; if (location.hash === '#colab') route(); else location.hash = 'colab'; });
  return r;
};
function decorateTop() {
  const tb = document.querySelector('#app .topbar'); if (!tb || tb.querySelector('[data-v3mood]')) return;
  const sur = tb.querySelector('[data-surprise]'); if (sur) sur.insertAdjacentHTML('beforebegin', `<button class="qbtn" data-v3mood title="Não sei o que ver">${XI.target}<span>Não sei o que ver</span></button>`);
}
document.addEventListener('click', e => { if (e.target.closest('[data-v3mood]')) moodDialog(); });
function after() { fixNav(); decorateTop(); setTimeout(() => { decorateTop(); decorateAvatars(); fixNav(); }, 60); }
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h.startsWith('colab=')) joinColab(h.slice(6)); after(); });
const _route = window.route;
window.route = function () { const h = location.hash.slice(1); if (h.startsWith('colab=')) { joinColab(h.slice(6)); return; } bindCats(); const r = _route.apply(this, arguments); after(); return r; };
const _sw = window.switchProfile; window.switchProfile = function () { const r = _sw.apply(this, arguments); bindCats(); decorateAvatars(); return r; };
const _save = window.save; window.save = function () { const r = _save.apply(this, arguments); scheduleBackup(); return r; };

/* =================== arranque =================== */
bindCats(); after();
const _afterBoot = window.afterBoot;
window.afterBoot = function () {
  _afterBoot(); decorateAvatars(); after();
  const h = location.hash.slice(1); if (h.startsWith('colab=')) joinColab(h.slice(6));
  setTimeout(() => checkReminders().catch(() => {}), 9000);
  if (auth().token) setTimeout(() => { if (!bkState.restored) restoreBackup(false).then(() => backupNow(false)); else backupNow(false); }, 6000);
};
})();
