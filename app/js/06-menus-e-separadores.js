/* Vinovim — organização estilo Netflix
   Barra de navegação no topo · menu “Mais” · página do título arrumada · definições e biblioteca por separadores */
(() => {
'use strict';
const XI = {
  more: sv('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'),
  grid: sv('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  down: sv('<path d="m6 9 6 6 6-6"/>'),
  cal: sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  stats: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  dl: sv('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
  people: sv('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 6 5.5"/>'),
  target: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  film: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
  tv: sv('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m8 3 4 4 4-4"/>')
};

/* =================== estilos =================== */
document.head.insertAdjacentHTML('beforeend', `<style>
/* ---- PC: barra de navegação no topo, como a Netflix ---- */
@media (min-width:821px){
  html:not(.tv){--side:0px}
  html:not(.tv) #nav{inset:0 0 auto 0;width:auto;height:68px;flex-direction:row;align-items:center;padding:0 4%;gap:2px;border:0;overflow:visible;background:linear-gradient(180deg,rgba(6,5,9,.95) 0%,rgba(6,5,9,.6) 55%,rgba(6,5,9,0));transition:background .35s,box-shadow .35s}
  html.scrolled:not(.tv) #nav,html.v6solid:not(.tv) #nav{background:rgba(9,8,13,.97);box-shadow:0 1px 0 var(--line),0 10px 30px rgba(0,0,0,.35)}
  html:not(.tv) #nav .brand{flex-direction:row;margin:0 28px 0 0;gap:9px;order:0}
  html:not(.tv) #nav .brand svg{width:30px;height:30px}
  html:not(.tv) #nav .brand span{display:block;font-size:21px;color:var(--tx);letter-spacing:-.02em}
  html:not(.tv) #nav .nv{width:auto;height:40px;flex-direction:row;padding:0 11px;font-size:14px;font-weight:600;color:#cbc6d3;background:none;border-radius:8px;gap:0;flex:none}
  html:not(.tv) #nav .nv svg{display:none}
  html:not(.tv) #nav .nv:hover{color:#fff;background:none}
  html:not(.tv) #nav .nv.on{color:#fff;font-weight:800;background:none}
  html:not(.tv) #nav .nv.on::before{display:block;left:11px;right:11px;top:auto;bottom:2px;width:auto;height:2px}
  html:not(.tv) #nav .nv[data-v="home"]{order:1}html:not(.tv) #nav .nv[data-v="series"]{order:2}html:not(.tv) #nav .nv[data-v="movies"]{order:3}
  html:not(.tv) #nav .nv[data-v="novidades"]{order:4}html:not(.tv) #nav .nv[data-v="library"]{order:5}
  html:not(.tv) #nav .nvsp{order:6;flex:1}
  html:not(.tv) #nav .nv[data-v="search"]{order:7;width:42px;padding:0;justify-content:center;font-size:0}
  html:not(.tv) #nav .nv[data-v="search"] svg{display:block;width:22px;height:22px;color:#fff}
  html:not(.tv) #nav .nv[data-v="search"].on::before{display:none}
  html:not(.tv) #nav .v6more{order:8}
  html:not(.tv) #nav .v6more svg{display:block;width:14px;height:14px;margin-left:4px}
  html:not(.tv) #nav #profBtn{order:9;padding:0 0 0 8px;height:40px}
  html:not(.tv) #nav #profBtn span:last-child{display:none}
  html:not(.tv) #nav #profBtn .pav{width:32px!important;height:32px!important;border-radius:8px;font-size:14px}
  html:not(.tv) #nav .nv[data-v="calendar"],html:not(.tv) #nav .nv[data-v="stats"],html:not(.tv) #nav .nv[data-v="downloads"],html:not(.tv) #nav .nv[data-v="addons"],html:not(.tv) #nav .nv[data-v="settings"]{display:none}
  html:not(.tv) main{margin-left:0}
  html:not(.tv) .topbar{position:relative;padding:92px 4% 6px;background:none;border:0;backdrop-filter:none}
  html:not(.tv) .topbar h1{font-size:34px}
  html:not(.tv) .topbar .qbtn,html:not(.tv) .topbar .seg{display:none!important}
  html:not(.tv) .home .topbar{display:none}
  html:not(.tv) .pad{padding:18px 4% 40px}
  html:not(.tv) .rowh,html:not(.tv) .track{padding-left:4%;padding-right:4%}
  html:not(.tv) .track{scroll-padding-inline:4%}
  html:not(.tv) .hcon{left:4%}html:not(.tv) .hdots{right:4%}html:not(.tv) .hmute{right:4%}
  html:not(.tv) .hero{height:min(88vh,860px)}
  html:not(.tv) .vvwrapbanner{margin-left:4%;margin-right:4%;width:92%}
}
/* nomes de fonte (“Cinemeta”) e explicações nas filas: fora, para ficar limpo */
.rowh small{display:none}
.rowh h2{font-size:20px}
/* ---- telemóvel: barra de baixo com 5 separadores ---- */
@media (max-width:820px){
  #nav .nv[data-v="addons"],#nav .nv[data-v="settings"]{display:none}
  #nav .v6more{display:flex!important}
  .topbar .qbtn{display:none!important}
  #nav .nv{font-size:10px}
  .hmute{right:18px!important;bottom:auto!important;top:calc(70px + env(safe-area-inset-top))}
}
#nav .v6more{cursor:pointer}
/* ---- menu “Mais” ---- */
#v6menu{position:fixed;z-index:95;min-width:250px;padding:8px;border-radius:14px;background:rgba(20,18,26,.98);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 70px rgba(0,0,0,.6);display:none;backdrop-filter:blur(14px)}
#v6menu.open{display:block;animation:fade .18s}
#v6menu a,#v6menu button{display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;border-radius:9px;font-size:14px;font-weight:600;color:#ddd8e4;text-decoration:none;text-align:left}
#v6menu a:hover,#v6menu button:hover,#v6menu a:focus-visible,#v6menu button:focus-visible{background:rgba(255,255,255,.07);color:#fff;outline:none}
#v6menu svg{width:19px;height:19px;color:var(--mu)}
#v6menu hr{border:0;border-top:1px solid rgba(255,255,255,.08);margin:6px 4px}
#v6menu .mo{display:none}
@media (max-width:820px){#v6menu{left:10px!important;right:10px;top:auto!important;bottom:calc(76px + env(safe-area-inset-bottom));min-width:0}#v6menu .mo{display:flex}}
/* ---- página do título ---- */
#detail .hbtns{align-items:center}
#detail .hbtns .btn.ico,#detail .v6dots{width:46px;height:46px;border-radius:50%}
#detail .v6dots{display:inline-grid;place-items:center;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);position:relative}
#detail .v6dots svg{width:20px;height:20px}
#detail .v6dm{position:absolute;z-index:20;top:54px;left:0;min-width:230px;padding:8px;border-radius:14px;background:rgba(20,18,26,.98);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 70px rgba(0,0,0,.6);display:none;text-align:left}
#detail .v6dm.open{display:block;animation:fade .15s}
#detail .v6dm .btn{display:flex;width:100%;height:42px;justify-content:flex-start;border-radius:9px;background:none;border:0;padding:0 12px;font-size:14px;backdrop-filter:none;color:#ddd8e4}
#detail .v6dm .btn:hover{background:rgba(255,255,255,.07)}
#detail .v6dm .btn.ico{width:100%;border-radius:9px}
#detail .v6dm .btn.on{color:#ff9fb6}
#detail .v6dm .btn .v6l{margin-left:2px}
#detail .dmeta{flex-wrap:wrap}
/* ---- separadores (definições e biblioteca) ---- */
.v6tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 0 16px;margin-bottom:6px;position:sticky;top:68px;z-index:20;background:linear-gradient(180deg,var(--bg) 75%,rgba(9,8,13,0))}
.v6tabs::-webkit-scrollbar{display:none}
.v6tabs button{flex:none;height:38px;padding:0 18px;border-radius:999px;font-size:14px;font-weight:700;color:var(--mu);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
.v6tabs button.on{background:var(--tx);color:#0b0a10;border-color:var(--tx)}
@media (max-width:820px){.v6tabs{top:0}}
html.tv .v6tabs{top:0}
.v6grp{display:none}.v6grp.on{display:block;animation:fade .25s}
.v6grp .panel{max-width:900px}
</style>`);

/* =================== barra de navegação =================== */
window.addEventListener('scroll', () => document.documentElement.classList.toggle('scrolled', scrollY > 30), { passive: true });
function solidNav() { const h = (location.hash.slice(1) || 'home'); document.documentElement.classList.toggle('v6solid', h !== 'home' && h !== ''); }
function setLabel(el, txt) { if (!el) return; const n = [...el.childNodes].reverse().find(x => x.nodeType === 3 && x.textContent.trim()); if (n) n.textContent = txt; else el.append(txt); }
const menu = document.createElement('div'); menu.id = 'v6menu'; document.body.appendChild(menu);
function menuHTML() {
  return `<a class="mo" href="#movies">${XI.film}Filmes</a><a class="mo" href="#series">${XI.tv}Séries</a><hr class="mo">
    <a href="#calendar">${XI.cal}Calendário de estreias</a><a href="#stats">${XI.stats}Estatísticas e o teu ano</a><a href="#downloads">${XI.dl}Transferências (offline)</a>
    <hr><button data-v3mood>${XI.target}Não sei o que ver</button><button data-surprise>${I.dice}Surpreende-me</button><button data-xjoin>${XI.people}Ver em conjunto</button>
    <hr><a href="#addons">${I.puzzle}Addons</a><a href="#settings">${sv('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>')}Definições</a>`;
}
function openMenu(btn) {
  if (menu.classList.contains('open')) return closeMenu();
  menu.innerHTML = menuHTML();
  const r = btn.getBoundingClientRect();
  menu.style.top = (r.bottom + 8) + 'px'; menu.style.left = Math.max(10, Math.min(innerWidth - 270, r.right - 250)) + 'px';
  menu.classList.add('open'); setTimeout(() => menu.querySelector('a,button')?.focus({ preventScroll: true }), 30);
}
function closeMenu() { menu.classList.remove('open'); }
menu.addEventListener('click', e => { if (e.target.closest('a,button')) setTimeout(closeMenu, 0); });
document.addEventListener('click', e => { if (!menu.classList.contains('open')) return; if (!e.target.closest('#v6menu') && !e.target.closest('.v6more')) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { e.stopImmediatePropagation(); closeMenu(); } }, true);
function arrangeNav() {
  const nav = $('#nav'); if (!nav) return;
  setLabel(nav.querySelector('.nv[data-v="library"]'), 'A minha lista');
  if (!nav.querySelector('.v6more')) {
    const b = document.createElement('button'); b.className = 'nv v6more'; b.type = 'button'; b.title = 'Mais';
    b.innerHTML = `${XI.grid}<span>Mais</span>`; b.onclick = e => { e.stopPropagation(); openMenu(b); };
    const sp = nav.querySelector('.nvsp'); nav.insertBefore(b, nav.querySelector('#profBtn') || null);
    if (sp && matchMedia('(min-width:821px)').matches) b.innerHTML = `<span>Mais</span>${XI.down}`;
  }
  // ordem no telemóvel: Início, Pesquisar, Novidades, A minha lista, Mais
  const mob = matchMedia('(max-width:820px)').matches, b = nav.querySelector('.v6more');
  if (b) b.innerHTML = mob ? `${XI.grid}<span>Mais</span>` : `<span>Mais</span>${XI.down}`;
  const lib = nav.querySelector('.nv[data-v="library"]'), nov = nav.querySelector('.nv[data-v="novidades"]');
  if (mob && lib && nov && nov.nextElementSibling !== lib) nov.after(lib);
}
addEventListener('resize', () => { clearTimeout(arrangeNav._t); arrangeNav._t = setTimeout(arrangeNav, 150); });

/* =================== início: sem filas repetidas =================== */
function dedupeRows() {
  const rows = $('#rows'); if (!rows) return;
  const t10 = [...rows.querySelectorAll('.t10row h2')].map(h => h.textContent);
  rows.querySelectorAll('.row:not(.t10row)').forEach(r => {
    const t = (r.querySelector('h2')?.textContent || '').trim();
    if ((/^(Filmes em alta|Trending movies|Películas populares)$/i.test(t) && t10.some(x => /filmes|movies|películas/i.test(x))) ||
        (/^(Séries em alta|Trending series|Series populares)$/i.test(t) && t10.some(x => /séries|series/i.test(x)))) r.style.display = 'none';
  });
}
let rowsObs = null;
const _home = VIEWS.home;
VIEWS.home = async function () {
  const r = await _home.apply(VIEWS, arguments);
  const rows = $('#rows'); if (rows) { if (rowsObs) rowsObs.disconnect(); rowsObs = new MutationObserver(dedupeRows); rowsObs.observe(rows, { childList: true }); dedupeRows(); }
  return r;
};

/* =================== página do título: ações principais à vista, o resto em “⋯” =================== */
function tidyDetail() {
  const box = document.querySelector('#detail .hbtns'); if (!box) return;
  let dots = box.querySelector('.v6dots');
  const extras = [...box.children].filter(el => el.matches('.xdx:not([data-xrate="1"]), .v3dx:not([data-v3rem])'));
  if (!extras.length) return;
  if (!dots) {
    dots = document.createElement('div'); dots.className = 'v6dots'; dots.tabIndex = 0; dots.title = 'Mais ações';
    dots.innerHTML = `${XI.more}<div class="v6dm"></div>`; box.appendChild(dots);
    dots.addEventListener('click', e => { if (e.target.closest('.v6dm')) { setTimeout(() => dots.querySelector('.v6dm').classList.remove('open'), 0); return; } e.stopPropagation(); dots.querySelector('.v6dm').classList.toggle('open'); });
    dots.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === dots) dots.querySelector('.v6dm').classList.toggle('open'); });
  }
  const dm = dots.querySelector('.v6dm');
  const LBL = { 'data-xrate': 'Não gosto', 'data-v3note': null, 'data-v3col': null, 'data-xlists': null };
  extras.forEach(el => {
    if (el.dataset.xrate === '-1' && !el.querySelector('.v6l')) el.insertAdjacentHTML('beforeend', '<span class="v6l">Não gosto</span>');
    dm.appendChild(el);
  });
  box.appendChild(dots);
}
document.addEventListener('click', e => { if (!e.target.closest('.v6dots')) document.querySelectorAll('.v6dm.open').forEach(x => x.classList.remove('open')); });
new MutationObserver(() => { const box = document.querySelector('#detail .hbtns'); if (box && [...box.children].some(el => el.matches('.xdx:not([data-xrate="1"]), .v3dx:not([data-v3rem])'))) tidyDetail(); })
  .observe($('#detail'), { childList: true, subtree: true });

/* =================== separadores =================== */
function makeTabs(pad, groups, key) {
  const names = groups.filter(g => g.els.length).map(g => g.name); if (names.length < 2) return;
  let cur = sessionStorage.getItem(key); if (!names.includes(cur)) cur = names[0];
  const bar = document.createElement('div'); bar.className = 'v6tabs';
  bar.innerHTML = names.map(n => `<button data-v6t="${esc(n)}" class="${n === cur ? 'on' : ''}">${esc(n)}</button>`).join('');
  const wraps = {};
  groups.forEach(g => { if (!g.els.length) return; const w = document.createElement('div'); w.className = 'v6grp' + (g.name === cur ? ' on' : ''); w.dataset.g = g.name; g.els.forEach(el => w.appendChild(el)); wraps[g.name] = w; });
  const first = pad.firstChild; pad.insertBefore(bar, first);
  names.forEach(n => pad.insertBefore(wraps[n], first));
  bar.onclick = e => { const b = e.target.closest('[data-v6t]'); if (!b) return; const n = b.dataset.v6t; sessionStorage.setItem(key, n); bar.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); Object.values(wraps).forEach(w => w.classList.toggle('on', w.dataset.g === n)); scrollTo({ top: 0 }); };
}
const SET_GROUPS = [
  ['Geral', /idioma|language|notifica|discord|atualiza|update|actualiza|sobre/i],
  ['Conta', /conta|account|cuenta|cópia de segurança|backup|copia de seguridad/i],
  ['Perfis', /^perfi|^profile|^perfil/i],
  ['Aparência', /aparência|appearance|apariencia|experiência|experience|experiencia|tema|theme/i],
  ['Reprodução', /reprodu|playback|legendas|subtitles|subtítulos|diretamente|directly/i],
  ['Início', /início|inicio|home|catálogos|catalog/i],
  ['Controlo', /comando|atalhos|shortcut|gamepad|jogos|remote|control/i],
  ['Dados', /dados|data|datos|importar|import|transfer|download/i]
];
const _settings = VIEWS.settings;
VIEWS.settings = function () {
  const r = _settings.apply(VIEWS, arguments);
  const pad = document.querySelector('#app .pad'); if (!pad || (curProfile() || {}).kids) return r;
  const groups = SET_GROUPS.map(([name]) => ({ name, els: [] })), other = { name: 'Outros', els: [] };
  [...pad.children].forEach(el => {
    if (!el.classList.contains('panel')) { if (el.classList.contains('legal')) groups[0].els.push(el); return; }
    const t = (el.querySelector('h3')?.textContent || '').trim();
    const i = /aparência das legendas|subtitle appearance|apariencia de los subtítulos/i.test(t) ? 4 : SET_GROUPS.findIndex(([, re]) => re.test(t));
    (i >= 0 ? groups[i] : other).els.push(el);
  });
  if (other.els.length) groups[0].els.push(...other.els);
  makeTabs(pad, groups, 'v6set');
  return r;
};
const _library = VIEWS.library;
VIEWS.library = function () {
  const r = _library.apply(VIEWS, arguments);
  const pad = document.querySelector('#app .pad'); if (!pad) return r;
  const g = { lista: { name: 'A minha lista', els: [] }, cont: { name: 'Continuar a ver', els: [] }, listas: { name: 'Listas', els: [] }, notas: { name: 'Notas', els: [] } };
  let cur = null;
  [...pad.children].forEach(el => {
    if (el.matches('.inrow') && !cur && el.querySelector('[href="#calendar"],[href="#stats"]')) { el.remove(); return; }
    if (el.id === 'lchips' || el.id === 'lgrid' || (el.classList.contains('empty') && !el.closest('.v6grp'))) { g.lista.els.push(el); return; }
    if (el.matches('h3.sec')) { const t = el.textContent; cur = /continuar|continue|seguir/i.test(t) ? 'cont' : /nota|note/i.test(t) ? 'notas' : /lista|list/i.test(t) ? 'listas' : 'listas'; }
    (g[cur || 'listas']).els.push(el);
  });
  if (!g.lista.els.length) g.lista.els.push(Object.assign(document.createElement('div'), { innerHTML: emptyHTML(I.book, 'A tua lista está vazia', 'Carrega no + em qualquer filme ou série para o guardar aqui.') }));
  makeTabs(pad, [g.lista, g.cont, g.listas, g.notas], 'v6lib');
  return r;
};

/* =================== arranque =================== */
arrangeNav(); solidNav();
window.addEventListener('hashchange', () => { arrangeNav(); solidNav(); closeMenu(); });
const _afterBoot = window.afterBoot; window.afterBoot = function () { _afterBoot(); arrangeNav(); solidNav(); };
})();
