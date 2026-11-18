/* ---------- vistas (uma por endereço: #home, #movies, #settings…) ---------- */
const app = $('#app');
let heroTimer;
const VIEWS = {
  async home() {
    app.className = 'home';
    app.innerHTML = `<div class="view">${topbar('', false, true)}<div class="hero" id="hero"><div class="hbg sk"></div></div><div class="rows" id="rows">${skRow()}${skRow()}</div></div>`;
    const cm = cinemeta();
    const [mov, ser] = await Promise.all([
      catalog(cm, 'movie', 'top').catch(() => []),
      catalog(cm, 'series', 'top').catch(() => [])
    ]);
    if (!$('#rows')) return;
    if (!mov.length && !ser.length) {
      $('#hero').remove();
      $('#rows').innerHTML = offlineHTML();
      return;
    }
    hero([...mov.slice(0, 5), ...ser.slice(0, 3)].filter(Boolean));
    let h = '';
    const cont = Object.values(S.progress).sort((a, b) => b.updated - a.updated);
    if (cont.length) h += rowHTML('Continuar a ver', cont.map(wideCard).join(''));
    const lib = Object.values(S.library).sort((a, b) => b.added - a.added);
    if (lib.length) h += rowHTML('A tua biblioteca', lib.slice(0, 30).map(card).join(''));
    const cats = homeCats().filter(c => c.on);
    h += cats.map((c, i) => `<div id="hc${i}">${skRow()}</div>`).join('');
    $('#rows').innerHTML = h;
    cats.forEach((c, i) =>
      catalog(c.a, c.type, c.id, c.extra)
        .then(x => {
          const el = $('#hc' + i);
          if (el) el.outerHTML = x.length ? rowHTML(c.name, x.slice(0, 30).map(card).join(''), c.sub) : '';
        })
        .catch(() => $('#hc' + i)?.remove())
    );
  },
  movies() {
    return browse('movie', 'Filmes');
  },
  series() {
    return browse('series', 'Séries');
  },
  search() {
    app.className = '';
    app.innerHTML = `<div class="view">${topbar('Pesquisar')}<div class="pad"><div class="sbox">${I.search}<input id="q" placeholder="Filmes, séries, atores…" autocomplete="off" enterkeyhint="search"><button class="sclr" id="qclr" aria-label="Limpar pesquisa">${I.x}</button></div><div id="sres"></div></div></div>`;
    const q = $('#q'),
      clr = $('#qclr');
    q.value = '';
    VIEWS._lastQ = '';
    q.focus();
    let t;
    q.addEventListener('input', () => {
      clr.classList.toggle('show', !!q.value);
      clearTimeout(t);
      t = setTimeout(() => doSearch(q.value), 350);
    });
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        clearTimeout(t);
        addHistory(q.value);
        doSearch(q.value);
        q.blur();
      }
      if (e.key === 'Escape' && q.value) {
        e.stopPropagation();
        q.value = '';
        clr.classList.remove('show');
        doSearch('');
      }
    });
    clr.onclick = () => {
      q.value = '';
      clr.classList.remove('show');
      doSearch('');
      q.focus();
    };
    showSearchHints();
    if (VIEWS._pendingQ) {
      q.value = VIEWS._pendingQ;
      VIEWS._pendingQ = '';
      clr.classList.add('show');
      doSearch(q.value);
    }
  },
  library() {
    app.className = '';
    const lib = Object.values(S.library).sort((a, b) => b.added - a.added);
    const cont = Object.values(S.progress).sort((a, b) => b.updated - a.updated);
    app.innerHTML = `<div class="view">${topbar('A tua lista')}<div class="pad">
      ${cont.length ? `<h3 class="sec">Continuar a ver</h3><div class="track" style="padding-left:0;padding-right:0;margin-bottom:26px">${cont.map(wideCard).join('')}</div>` : ''}
      ${
        lib.length
          ? `<div class="chips" id="lchips"><button class="chip on" data-lf="all">Tudo (${lib.length})</button><button class="chip" data-lf="movie">Filmes</button><button class="chip" data-lf="series">Séries</button></div><div class="grid" id="lgrid">${lib.map(card).join('')}</div>`
          : emptyHTML(
              I.book,
              'A tua lista está vazia',
              'Carrega no botão + em qualquer filme ou série para o guardar aqui.',
              '<a class="btn pri" href="#home">Explorar</a>'
            )
      }
    </div></div>`;
    $('#lchips')?.addEventListener('click', e => {
      const b = e.target.closest('[data-lf]');
      if (!b) return;
      [...$('#lchips').children].forEach(c => c.classList.toggle('on', c === b));
      const f = b.dataset.lf;
      $('#lgrid').innerHTML = lib
        .filter(x => f === 'all' || x.type === f)
        .map(card)
        .join('');
    });
  },
  addons() {
    app.className = '';
    app.innerHTML = `<div class="view">${topbar('Addons')}<div class="pad" style="max-width:980px">
      <div class="panel"><h3>Instalar addon</h3><p class="m">O Vinovim usa o protocolo de addons do Stremio. Cola o link do <b>manifest.json</b> de um addon (catálogos, metadados, fontes ou legendas). Links <code>stremio://</code> também funcionam.</p>
      <form class="inrow" id="addF"><input class="inp" id="addU" placeholder="https://exemplo.com/manifest.json" required><button class="btn acc">${I.plus}Instalar</button></form></div>
      <h3 class="sec">Instalados</h3><div id="alist">${ADDONS.map(addonRow).join('')}</div>
      <p class="legal" style="margin-top:20px">O Vinovim não aloja, guarda nem distribui conteúdo. Tudo o que aparece vem dos addons que instalas, e és responsável por usar apenas fontes a que tenhas direito de aceder.</p>
    </div></div>`;
    $('#addF').addEventListener('submit', async e => {
      e.preventDefault();
      const u = normUrl($('#addU').value);
      if (!/^https?:\/\/.+/i.test(u)) return toast('Link inválido');
      if (ADDONS.some(a => normUrl(a.url) === u)) return toast('Esse addon já está instalado');
      try {
        const m = await getJSON(u);
        if (!m.id || !m.resources) throw new Error();
        S.addons.push(u);
        save();
        ADDONS.push({ url: u, base: baseOf(u), m });
        toast(`${m.name || 'Addon'} instalado`);
        VIEWS.addons();
      } catch (err) {
        toast('Não foi possível ler esse manifest');
      }
    });
  },
  settings() {
    app.className = '';
    app.innerHTML = `<div class="view">${topbar('Definições')}<div class="pad" style="max-width:980px">
      <div class="panel"><h3>Perfis</h3><p class="m">Cada perfil tem a sua lista, o seu progresso e o seu histórico de pesquisas. Estás a usar o perfil <b style="color:var(--tx)">${esc(curProfile().name)}</b>.</p>
        <div class="plinks">${S.profiles.map(p => `<button class="pcard ${p.id === S.activeProfile ? 'on' : ''}" data-prof="${p.id}">${avatar(p, 34)}<b>${esc(p.name)}</b></button>`).join('')}</div>
        <div class="inrow"><button class="btn gho" data-prof-manage>Gerir perfis</button></div></div>
      <div class="panel"><h3>Aparência</h3><p class="m">Dá ao Vinovim a tua cara.</p><div class="swatches" style="margin-bottom:14px">${ACCENTS.map((c, i) => `<button class="sw ${i == S.accent ? 'on' : ''}" data-acc="${i}" style="background:linear-gradient(135deg,${c[0]},${c[1]})"></button>`).join('')}</div>
        <div class="srow"><div class="tx"><b>Modo TV</b><small>Interface maior e navegação pelo comando (liga-se sozinho nas TVs)</small></div><button class="tg ${(S.prefs.tv ?? IS_TV) ? 'on' : ''}" data-pref="tv"></button></div>
        <div class="srow"><div class="tx"><b>Preto AMOLED</b><small>Fundo totalmente preto, ideal para ecrãs OLED</small></div><button class="tg ${S.prefs.amoled ? 'on' : ''}" data-pref="amoled"></button></div>
        <div class="srow"><div class="tx"><b>Menu à esquerda</b><small>No computador, o menu passa do topo para uma barra lateral com ícones e nomes</small></div><button class="tg ${S.prefs.sideNav ? 'on' : ''}" data-pref="sideNav"></button></div></div>
      <div class="panel"><h3>Reprodução</h3>
        <div class="srow"><div class="tx"><b>Ordenar fontes por qualidade</b><small>4K e 1080p primeiro</small></div><button class="tg ${S.prefs.sortQ ? 'on' : ''}" data-pref="sortQ"></button></div>
        <div class="srow"><div class="tx"><b>Reproduzir automaticamente</b><small>Começa logo com a primeira fonte disponível</small></div><button class="tg ${S.prefs.autoplay ? 'on' : ''}" data-pref="autoplay"></button></div>
        <div class="srow"><div class="tx"><b>Esconder torrents</b><small>Não podem ser reproduzidos nesta app</small></div><button class="tg ${S.prefs.hideTorrent ? 'on' : ''}" data-pref="hideTorrent"></button></div>
        <div class="srow"><div class="tx"><b>Idioma das legendas</b><small>Ativadas automaticamente quando um addon as fornece</small></div><select class="sel" id="subLang">${Object.entries(
          SUBLANGS
        )
          .map(([k, [n]]) => `<option value="${k}" ${S.prefs.subLang === k ? 'selected' : ''}>${n}</option>`)
          .join('')}</select></div></div>
      <div class="panel"><h3>Aparência das legendas</h3><p class="m">Também podes mudar isto durante o vídeo, no botão de legendas, e arrastar um ficheiro .srt ou .vtt para cima do vídeo.</p>
        <div class="subprev"><span id="subPrev">Assim ficam as tuas legendas.</span></div>
        ${Object.entries(SUBOPTS)
          .map(
            ([k, [lbl, opts]]) =>
              `<div class="srow"><div class="tx"><b>${lbl}</b></div><select class="sel" data-sp="${k}">${opts.map(([v, l]) => `<option value="${v}" ${S.prefs[k] === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`
          )
          .join('')}</div>
      <div class="panel"><h3>Catálogos do início</h3><p class="m">Escolhe que filas aparecem no início e em que ordem. Os catálogos dos addons que instalares também aparecem aqui.</p><div id="catl" style="max-height:420px;overflow:auto">${catListHTML()}</div></div>
      ${
        NATIVE && NATIVE.rpc
          ? `<div class="panel"><h3>Discord</h3><p class="m">Mostra no teu perfil do Discord o que estás a ver no Vinovim. O Discord tem de estar aberto neste PC.</p>
        <div class="srow"><div class="tx"><b>Rich Presence</b><small>Mostrar a tua atividade no Discord</small></div><button class="tg ${S.prefs.rpc ? 'on' : ''}" data-pref="rpc"></button></div>
        <div class="srow"><div class="tx"><b>Modo discreto</b><small>Mostra só “A ver um filme / uma série”, sem o título</small></div><button class="tg ${S.prefs.rpcPrivate ? 'on' : ''}" data-pref="rpcPrivate"></button></div></div>`
          : ''
      }
      <div class="panel"><h3>Atualizações</h3><p class="m">Estás na versão <b style="color:var(--tx)">${APP_VERSION}</b>${NATIVE ? ` · app ${esc(NATIVE.platform)} ${esc(NATIVE.version)}` : ''}. O Vinovim procura novidades sozinho e avisa-te aqui dentro.</p><div class="inrow"><button class="btn gho" id="chkUpd">Procurar atualizações</button><button class="btn gho" id="seeNews">Ver novidades</button></div></div>
      <div class="panel"><h3>Reproduzir diretamente</h3><p class="m">Abre um vídeo do teu computador ou um link direto (MP4, WebM, HLS .m3u8).</p>
        <div class="inrow" style="margin-bottom:10px"><input class="inp" id="dUrl" placeholder="https://…/video.mp4"><button class="btn gho" id="dGo">${I.link}Abrir link</button></div>
        <button class="btn gho" id="dFile">${I.folder}Escolher ficheiro local</button></div>
      <div class="panel"><h3>Os teus dados</h3><p class="m">A lista, o progresso e os addons ficam guardados neste browser. ${Object.keys(S.library).length} na lista · ${Object.keys(S.progress).length} em curso · ${S.addons.length} addons extra.</p>
        <div class="inrow"><button class="btn gho" id="exp">Exportar cópia</button><button class="btn gho" id="imp">Importar cópia</button><button class="btn gho" id="clrP">Limpar progresso</button><button class="btn gho" id="clrA" style="color:#ff8fa8">Apagar tudo</button></div></div>
      <div class="panel"><h3>Atalhos no leitor</h3><p class="m" style="margin:0">Espaço/K reproduzir · ←/→ 10 s · ↑/↓ volume · F ecrã inteiro · M som · N próximo episódio · Esc sair</p></div>
      <p class="legal">Vinovim · informação dos títulos do Cinemeta (IMDb). Esta app não aloja nenhum conteúdo.</p>
    </div></div>`;
    app.querySelectorAll('[data-acc]').forEach(
      b =>
        (b.onclick = () => {
          S.accent = +b.dataset.acc;
          save();
          applyAccent();
          app.querySelectorAll('[data-acc]').forEach(x => x.classList.toggle('on', x === b));
        })
    );
    app.querySelectorAll('[data-pref]').forEach(
      b =>
        (b.onclick = () => {
          const k = b.dataset.pref;
          S.prefs[k] = k === 'tv' ? !(S.prefs.tv ?? IS_TV) : !S.prefs[k];
          save();
          b.classList.toggle('on', !!S.prefs[k]);
          applyAccent();
          refreshPresence();
        })
    );
    $('#subLang').onchange = e => {
      S.prefs.subLang = e.target.value;
      save();
    };
    $('#chkUpd').onclick = () => checkUpdates(true);
    app.querySelectorAll('[data-sp]').forEach(
      s =>
        (s.onchange = () => {
          S.prefs[s.dataset.sp] = s.value;
          save();
          applySubStyle();
        })
    );
    applySubStyle();
    $('#seeNews').onclick = showNews;
    $('#catl').onclick = e => {
      const tg = e.target.closest('[data-cattg]'),
        mv = e.target.closest('[data-catmv]');
      if (tg) {
        const L = homeCats(),
          c = L.find(x => x.key === tg.dataset.cattg);
        S.cats.on[c.key] = !c.on;
      } else if (mv) {
        const [i, d] = mv.dataset.catmv.split('|').map(Number),
          keys = homeCats().map(c => c.key);
        [keys[i], keys[i + d]] = [keys[i + d], keys[i]];
        S.cats.order = keys;
      } else return;
      save();
      const sc = $('#catl').scrollTop;
      $('#catl').innerHTML = catListHTML();
      $('#catl').scrollTop = sc;
    };
    $('#dGo').onclick = () => {
      const u = $('#dUrl').value.trim();
      if (u) play({ url: u, name: 'Link direto' }, { title: u.split('/').pop() || 'Vídeo' });
    };
    $('#dFile').onclick = () => $('#fileVideo').click();
    $('#exp').onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
      a.download = 'vinovim-backup.json';
      a.click();
    };
    $('#imp').onclick = () => $('#fileImport').click();
    $('#clrP').onclick = () => {
      S.progress = {};
      S.watched = {};
      save();
      toast('Progresso limpo');
      VIEWS.settings();
    };
    $('#clrA').onclick = function () {
      if (this.dataset.c) {
        localStorage.removeItem(KEY);
        location.reload();
      } else {
        this.dataset.c = 1;
        this.textContent = 'Carrega outra vez para confirmar';
      }
    };
  }
};

/* Cada vista passa por aqui: as funcionalidades podem tomar conta dela antes
   ('view:<nome>:before', devolvendo false) e acrescentar o que é seu depois de
   desenhada ('view:<nome>'). As vistas novas registam-se com defineView. */
function defineView(name, draw) {
  VIEWS[name] = function (...args) {
    if (!hooks.allow(`view:${name}:before`)) return;
    const finish = () => hooks.emitAsync(`view:${name}`);
    const r = draw.apply(VIEWS, args);
    return r && typeof r.then === 'function' ? r.then(finish) : finish();
  };
}
for (const [name, draw] of Object.entries(VIEWS)) defineView(name, draw);

/* catálogos do início (configuráveis) */
const DEFAULT_ON = [
  'cm|movie|top',
  'cm|series|top',
  'cm|movie|imdbRating',
  'cm|movie|top|Animation',
  'cm|movie|top|Comedy',
  'cm|movie|top|Horror',
  'cm|movie|top|Sci-Fi'
];
function allCats() {
  const cm = cinemeta(),
    L = [];
  if (cm) {
    L.push({ key: 'cm|movie|top', name: 'Filmes em alta', sub: 'Cinemeta', a: cm, type: 'movie', id: 'top' });
    L.push({ key: 'cm|series|top', name: 'Séries em alta', sub: 'Cinemeta', a: cm, type: 'series', id: 'top' });
    L.push({
      key: 'cm|movie|imdbRating',
      name: 'Filmes mais bem avaliados',
      sub: 'Cinemeta',
      a: cm,
      type: 'movie',
      id: 'imdbRating'
    });
    L.push({
      key: 'cm|series|imdbRating',
      name: 'Séries mais bem avaliadas',
      sub: 'Cinemeta',
      a: cm,
      type: 'series',
      id: 'imdbRating'
    });
    GENRES.forEach(([g, p]) =>
      L.push({ key: 'cm|movie|top|' + g, name: p, sub: 'Filmes', a: cm, type: 'movie', id: 'top', extra: { genre: g } })
    );
    GENRES.forEach(([g, p]) =>
      L.push({
        key: 'cm|series|top|' + g,
        name: p,
        sub: 'Séries',
        a: cm,
        type: 'series',
        id: 'top',
        extra: { genre: g }
      })
    );
  }
  ADDONS.filter(a => a.url !== CINEMETA).forEach(a =>
    (a.m.catalogs || []).forEach(c => {
      if ((c.extra || []).some(e => e.isRequired) || (c.extraRequired || []).length) return;
      L.push({
        key: a.url + '|' + c.type + '|' + c.id,
        name: c.name || c.id,
        sub: a.m.name,
        a,
        type: c.type,
        id: c.id
      });
    })
  );
  return L;
}
function homeCats() {
  const all = allCats(),
    cfg = S.cats;
  const isOn = c => (c.key in cfg.on ? cfg.on[c.key] : DEFAULT_ON.includes(c.key) || !c.key.startsWith('cm|'));
  const ord = c => {
    const i = cfg.order.indexOf(c.key);
    return i < 0 ? 1000 + all.indexOf(c) : i;
  };
  return all.map(c => ({ ...c, on: isOn(c) })).sort((x, y) => ord(x) - ord(y));
}
function catListHTML() {
  const L = homeCats();
  return L.map(
    (c, i) => `<div class="srow"><div class="tx"><b>${esc(c.name)}</b><small>${esc(c.sub)}</small></div>
    <button class="arr" data-catmv="${i}|-1" ${i ? '' : 'disabled'} title="Subir">${sv('<path d="m6 15 6-6 6 6"/>')}</button>
    <button class="arr" data-catmv="${i}|1" ${i < L.length - 1 ? '' : 'disabled'} title="Descer">${sv('<path d="m6 9 6 6 6-6"/>')}</button>
    <button class="tg ${c.on ? 'on' : ''}" data-cattg="${esc(c.key)}" aria-label="Mostrar no início"></button></div>`
  ).join('');
}

function addonRow(a) {
  const m = a.m,
    res = (m.resources || []).map(r => (typeof r === 'string' ? r : r.name));
  const lbl = { catalog: 'Catálogos', meta: 'Metadados', stream: 'Fontes', subtitles: 'Legendas' };
  return `<div class="adn"><div class="lg">${m.logo ? `<img src="${esc(m.logo)}" alt="" onerror="this.remove()">` : ''}${esc((m.name || '?')[0])}</div>
    <div class="tx"><b>${esc(m.name || m.id)}</b><small>v${esc(m.version || '?')} · ${esc((m.types || []).map(t => ADDON_TYPES[t] || t).join(', '))}</small><p>${esc(m.description || '')}</p>
    <div class="tags">${res.map(r => `<span class="tag ${r === 'stream' ? 's' : ''}">${esc(lbl[r] || r)}</span>`).join('')}</div></div>
    ${a.url === CINEMETA ? '<span class="tag">Base</span>' : `<button class="btn ico gho" data-unaddon="${esc(a.url)}" title="Remover">${I.trash}</button>`}</div>`;
}

/* ---------- destaque ---------- */
function hero(list) {
  const el = $('#hero');
  if (!el || !list.length) return;
  let i = 0;
  const show = () => {
    const m = list[i];
    el.innerHTML = `<div class="hbg" style="background-image:url('${esc(m.background || IMG.bg(m.id))}')"></div>
      <div class="hcon"><div class="hkick"><i></i>${m.type === 'series' ? 'Série em destaque' : 'Filme em destaque'}</div>
      <img class="hlogo" src="${esc(m.logo || IMG.logo(m.id))}" alt="${esc(m.name)}" onerror="this.outerHTML='<h2 class=htitle>${esc(m.name).replace(/'/g, '&#39;')}</h2>'">
      <div class="hmeta">${m.imdbRating ? `<span class="rate">${I.star}${esc(m.imdbRating)}</span>` : ''}<span>${esc(m.releaseInfo || '')}</span>${(
        m.genres || []
      )
        .slice(0, 3)
        .map(g => `<span>${esc(GPT[g] || g)}</span>`)
        .join('')}${m.runtime ? `<span>${esc(m.runtime)}</span>` : ''}</div>
      <p class="hdesc">${esc(m.description || '')}</p>
      <div class="hbtns"><button class="btn pri" data-quickplay="${esc(m.type)}|${esc(m.id)}">${I.play}Ver agora</button><button class="btn gho" data-open="${esc(m.type)}|${esc(m.id)}">Mais info</button><button class="btn gho ico ${inLib(m.id) ? 'on' : ''}" data-lib="${esc(m.id)}" title="A minha lista">${inLib(m.id) ? I.check : I.plus}</button></div></div>
      <div class="hdots">${list.map((_, j) => `<button class="${j === i ? 'on' : ''}" data-hi="${j}"></button>`).join('')}</div>`;
    requestAnimationFrame(() => el.querySelector('.hbg')?.classList.add('show'));
    el.querySelectorAll('[data-hi]').forEach(
      b =>
        (b.onclick = () => {
          i = +b.dataset.hi;
          show();
          restart();
        })
    );
  };
  const restart = () => {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      if (!document.body.contains(el)) return clearInterval(heroTimer);
      if (el.contains(document.activeElement)) return;
      i = (i + 1) % list.length;
      show();
    }, 9000);
  };
  show();
  restart();
  hooks.emit('hero:shown', el);
}

/* ---------- filmes e séries ---------- */
async function browse(type, title) {
  app.className = '';
  const st = Object.assign({ genre: '', year: '', sort: 'top', min: 0 }, (VIEWS._bf || {})[type] || {}, {
    items: [],
    done: false,
    skip: 0
  });
  const thisYear = new Date().getFullYear(),
    years = Array.from({ length: thisYear - 1949 }, (_, i) => thisYear - i);
  app.innerHTML = `<div class="view">${topbar(title)}<div class="pad">
    <div class="filters">
      <div class="seg2" id="fsort"><button data-sort="top">Populares</button><button data-sort="imdbRating">Mais bem avaliados</button></div>
      <select class="sel" id="fyear"><option value="">Todos os anos</option>${years.map(y => `<option>${y}</option>`).join('')}</select>
      <select class="sel" id="fmin"><option value="0">Qualquer avaliação</option><option value="6">★ 6 ou mais</option><option value="7">★ 7 ou mais</option><option value="8">★ 8 ou mais</option></select>
      <button class="btn sm gho" id="freset">Limpar filtros</button>
    </div>
    <div class="chips" id="gch"><button class="chip" data-g="">Todos os géneros</button>${GENRES.map(([g, p]) => `<button class="chip" data-g="${g}">${p}</button>`).join('')}</div>
    <div class="grid" id="bgrid"></div><div class="more"><button class="btn gho" id="bmore">Carregar mais</button></div></div></div>`;
  const grid = $('#bgrid'),
    more = $('#bmore');
  const sync = () => {
    [...$('#fsort').children].forEach(x => x.classList.toggle('on', x.dataset.sort === st.sort));
    [...$('#gch').children].forEach(x => x.classList.toggle('on', x.dataset.g === st.genre));
    $('#fyear').value = st.year;
    $('#fmin').value = String(st.min);
    // “Limpar filtros” só aparece quando há algum filtro ligado
    $('#freset').hidden = !(st.genre || st.year || st.min || st.sort !== 'top');
    VIEWS._bf = Object.assign(VIEWS._bf || {}, {
      [type]: { genre: st.genre, year: st.year, sort: st.sort, min: st.min }
    });
  };
  const pass = m =>
    (!st.min || parseFloat(m.imdbRating) >= st.min) && (!st.year || !st.genre || (m.genres || []).includes(st.genre));
  let seq = 0;
  const rated = async () => {
    const k = 'vv_rated|' + type + '|' + (st.year || '') + '|' + (st.genre || '');
    try {
      const c = JSON.parse(sessionStorage.getItem(k) || 'null');
      if (c && c.length) return c;
    } catch (e) {}
    const cm = cinemeta(),
      jobs = [];
    for (let s = 0; s < (st.year ? 400 : 600); s += 50)
      jobs.push(
        st.year
          ? catalog(cm, type, 'year', { genre: st.year, skip: s || undefined }).catch(() => [])
          : catalog(cm, type, 'top', { genre: st.genre || undefined, skip: s || undefined }).catch(() => [])
      );
    const seen = new Set(),
      out = [];
    (await Promise.all(jobs)).flat().forEach(m => {
      const r = parseFloat(m && m.imdbRating);
      if (m && m.id && r > 0 && !seen.has(m.id)) {
        seen.add(m.id);
        out.push({
          id: m.id,
          type: m.type || type,
          name: m.name,
          poster: m.poster,
          background: m.background,
          releaseInfo: m.releaseInfo,
          imdbRating: m.imdbRating,
          genres: m.genres || []
        });
      }
    });
    out.sort(
      (a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating) || String(a.name).localeCompare(String(b.name))
    );
    try {
      if (out.length) sessionStorage.setItem(k, JSON.stringify(out));
    } catch (e) {}
    return out;
  };
  const load = async reset => {
    const my = reset ? ++seq : seq;
    if (reset) {
      st.items = [];
      st.skip = 0;
      st.done = false;
      st.pool = null;
      grid.innerHTML = Array.from({ length: 18 }, () => '<div class="card"><div class="pimg sk"></div></div>').join('');
    }
    more.disabled = true;
    more.innerHTML = '<span class="spin"></span>';
    if (st.sort === 'imdbRating') {
      try {
        if (!st.pool) {
          const p = await rated();
          if (my !== seq) return;
          st.pool = p.filter(pass);
          grid.innerHTML = '';
        }
        const next = st.pool.slice(st.items.length, st.items.length + 42);
        st.items.push(...next);
        grid.insertAdjacentHTML('beforeend', next.map(card).join(''));
        st.done = st.items.length >= st.pool.length;
        if (!st.items.length)
          grid.innerHTML = emptyHTML(
            I.search,
            'Nada com estes filtros',
            'Experimenta outro ano, outro género ou uma avaliação mais baixa.'
          );
      } catch (e) {
        if (reset && my === seq) grid.innerHTML = offlineHTML();
      }
      if (my !== seq) return;
      more.disabled = false;
      more.textContent = 'Carregar mais';
      more.parentNode.classList.toggle('hidden', st.done);
      return;
    }
    try {
      let added = 0,
        tries = 0,
        first = reset;
      while (added < 12 && !st.done && tries < 5) {
        tries++;
        const x = st.year
          ? await catalog(cinemeta(), type, 'year', { genre: st.year, skip: st.skip || undefined })
          : await catalog(cinemeta(), type, st.sort, { genre: st.genre || undefined, skip: st.skip || undefined });
        if (my !== seq) return;
        if (first) {
          grid.innerHTML = '';
          first = false;
        }
        if (!x.length) {
          st.done = true;
          break;
        }
        st.skip += x.length;
        const fresh = x.filter(n => !st.items.some(o => o.id === n.id)).filter(pass);
        st.items.push(...fresh);
        grid.insertAdjacentHTML('beforeend', fresh.map(card).join(''));
        added += fresh.length;
      }
      if (!st.items.length)
        grid.innerHTML = emptyHTML(
          I.search,
          'Nada com estes filtros',
          'Experimenta outro ano, outro género ou uma avaliação mais baixa.'
        );
    } catch (e) {
      if (reset && my === seq) grid.innerHTML = offlineHTML();
    }
    if (my !== seq) return;
    more.disabled = false;
    more.textContent = 'Carregar mais';
    more.parentNode.classList.toggle('hidden', st.done);
  };
  const apply = () => {
    sync();
    load(true);
  };
  $('#gch').onclick = e => {
    const x = e.target.closest('[data-g]');
    if (!x) return;
    st.genre = x.dataset.g;
    apply();
  };
  $('#fsort').onclick = e => {
    const x = e.target.closest('[data-sort]');
    if (!x) return;
    st.sort = x.dataset.sort;
    apply();
  };
  $('#fyear').onchange = e => {
    st.year = e.target.value;
    apply();
  };
  $('#fmin').onchange = e => {
    st.min = +e.target.value;
    apply();
  };
  $('#freset').onclick = () => {
    Object.assign(st, { genre: '', year: '', sort: 'top', min: 0 });
    apply();
  };
  more.onclick = () => load(false);
  sync();
  load(true);
}

/* search */
function addHistory(q) {
  q = String(q || '').trim();
  if (q.length < 2) return;
  const h = (S.searchHistory || []).filter(x => x.toLowerCase() !== q.toLowerCase());
  h.unshift(q);
  S.searchHistory = h.slice(0, 10);
  save();
}
function histHTML() {
  const h = S.searchHistory || [];
  if (!h.length) return '';
  return `<div class="hist"><div class="histh"><h3 class="sec">Pesquisas recentes</h3><button class="chip" data-hclear>Limpar</button></div>
    <div class="hlist">${h.map((s, i) => `<div class="hitem" tabindex="0" data-hq="${esc(s)}">${I.clock}<span>${esc(s)}</span><button data-hdel="${i}" title="Remover do histórico">${I.x}</button></div>`).join('')}</div></div>`;
}
function showSearchHints() {
  if (!$('#sres')) return;
  $('#sres').innerHTML =
    histHTML() +
    `<h3 class="sec">Explora por género</h3><div class="chips">${GENRES.map(([g, p]) => `<a class="chip" style="display:inline-flex;align-items:center;text-decoration:none" href="#movies" data-pickg="${g}">${p}</a>`).join('')}</div>`;
}
let searchSeq = 0;
async function doSearch(q) {
  VIEWS._lastQ = q;
  q = q.trim();
  const box = $('#sres');
  if (!box) return;
  if (q.length < 2) return showSearchHints();
  const seq = ++searchSeq;
  box.innerHTML = '<div style="padding:30px;text-align:center"><span class="spin"></span></div>';
  const jobs = [];
  ADDONS.forEach(a =>
    (a.m.catalogs || []).forEach(c => {
      const ex = (c.extra || []).map(e => e.name).concat(c.extraSupported || []);
      if (ex.includes('search'))
        jobs.push(
          catalog(a, c.type, c.id, { search: q })
            .then(items => ({
              title: c.type === 'series' ? 'Séries' : c.type === 'movie' ? 'Filmes' : c.name || c.type,
              src: a.m.name,
              items
            }))
            .catch(() => null)
        );
    })
  );
  const res = (await Promise.all(jobs)).filter(r => r && r.items.length);
  if (seq !== searchSeq || !$('#sres')) return;
  box.innerHTML = res.length
    ? res
        .map(
          r =>
            `<h3 class="sec">${esc(r.title)} <small style="color:var(--mu2);font-family:var(--fb);font-size:12px;font-weight:500">· ${esc(r.src)}</small></h3><div class="grid" style="margin-bottom:36px">${r.items.slice(0, 24).map(card).join('')}</div>`
        )
        .join('')
    : emptyHTML(
        I.search,
        'Nada encontrado',
        `Não encontrámos resultados para “${esc(q)}”. Tenta outro título ou nome.`
      );
}
