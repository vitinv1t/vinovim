/* Vinovim — conta e sincronização
   Conta e sincronização · Calendário · Saltar introdução · Estatísticas ·
   Ver em conjunto · Listas · Recomendações · Chromecast · Idiomas */
(() => {
  'use strict';
  const API = /^https?:$/.test(location.protocol)
    ? ''
    : (window.vinovimNative && window.vinovimNative.remote) || 'https://vinovim.vercel.app';
  const PD = () => S.pdata[S.activeProfile];
  const pdk = (k, def) => {
    const d = PD();
    if (d[k] === undefined) d[k] = def;
    return d[k];
  };
  const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);
  const XI = {
    cal: sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    stats: sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    people: sv(
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 6 5.5"/>'
    ),
    cast: sv(
      '<path d="M2 16a5 5 0 0 1 5 5M2 12a9 9 0 0 1 9 9M2 8.1V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><path d="M2 20h.01"/>'
    ),
    up: sv('<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 21H7"/>'),
    down: sv('<path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-3-2l1-5H5a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 6.4 3H17"/>'),
    list: sv('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    share: sv(
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'
    ),
    skip: sv('<path d="m5 4 10 8-10 8z"/><path d="M19 5v14"/>'),
    send: sv('<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>'),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    bell: sv('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>')
  };

  async function copyText(t) {
    try {
      await navigator.clipboard.writeText(t);
      toast(tr('Link copiado'));
    } catch (e) {
      openModal(
        `<h3>${tr('Copiar link')}</h3><input class="inp" value="${esc(t)}" readonly><button class="btn pri" data-close-modal>${tr('Fechar')}</button>`,
        m => {
          const i = m.querySelector('input');
          i.focus();
          i.select();
        }
      );
    }
  }

  /* =================== idiomas =================== */
  const LANGS = { 'pt-PT': 'Português (Portugal)', 'pt-BR': 'Português (Brasil)', en: 'English', es: 'Español' };
  const DICT = {
    Início: ['Início', 'Home', 'Inicio'],
    Pesquisar: ['Buscar', 'Search', 'Buscar'],
    Filmes: ['Filmes', 'Movies', 'Películas'],
    Séries: ['Séries', 'Series', 'Series'],
    Biblioteca: ['Biblioteca', 'Library', 'Biblioteca'],
    Addons: ['Addons', 'Add-ons', 'Complementos'],
    Definições: ['Configurações', 'Settings', 'Ajustes'],
    Calendário: ['Calendário', 'Calendar', 'Calendario'],
    Estatísticas: ['Estatísticas', 'Stats', 'Estadísticas'],
    'Surpreende-me': ['Me surpreenda', 'Surprise me', 'Sorpréndeme'],
    'Ver agora': ['Assistir agora', 'Watch now', 'Ver ahora'],
    'Mais info': ['Mais info', 'More info', 'Más info'],
    'Filme em destaque': ['Filme em destaque', 'Featured movie', 'Película destacada'],
    'Série em destaque': ['Série em destaque', 'Featured series', 'Serie destacada'],
    'Continuar a ver': ['Continuar assistindo', 'Continue watching', 'Seguir viendo'],
    'A tua biblioteca': ['Sua biblioteca', 'Your library', 'Tu biblioteca'],
    'A tua lista': ['Sua lista', 'Your list', 'Tu lista'],
    'Filmes em alta': ['Filmes em alta', 'Trending movies', 'Películas populares'],
    'Séries em alta': ['Séries em alta', 'Trending series', 'Series populares'],
    'Filmes mais bem avaliados': ['Filmes mais bem avaliados', 'Top rated movies', 'Películas mejor valoradas'],
    'Séries mais bem avaliadas': ['Séries mais bem avaliadas', 'Top rated series', 'Series mejor valoradas'],
    'Recomendado para ti': ['Recomendado para você', 'Recommended for you', 'Recomendado para ti'],
    'Novos episódios': ['Novos episódios', 'New episodes', 'Nuevos episodios'],
    'Mais como este': ['Mais como este', 'More like this', 'Más como este'],
    Episódios: ['Episódios', 'Episodes', 'Episodios'],
    Elenco: ['Elenco', 'Cast', 'Reparto'],
    'Avaliações e informação': ['Avaliações e informações', 'Ratings and info', 'Valoraciones e información'],
    Trailer: ['Trailer', 'Trailer', 'Tráiler'],
    'Pesquisas recentes': ['Pesquisas recentes', 'Recent searches', 'Búsquedas recientes'],
    'Explora por género': ['Explore por gênero', 'Browse by genre', 'Explora por género'],
    Limpar: ['Limpar', 'Clear', 'Borrar'],
    'Carregar mais': ['Carregar mais', 'Load more', 'Cargar más'],
    Populares: ['Populares', 'Popular', 'Populares'],
    'Mais bem avaliados': ['Mais bem avaliados', 'Top rated', 'Mejor valorados'],
    'Todos os anos': ['Todos os anos', 'All years', 'Todos los años'],
    'Qualquer avaliação': ['Qualquer avaliação', 'Any rating', 'Cualquier valoración'],
    'Limpar filtros': ['Limpar filtros', 'Clear filters', 'Quitar filtros'],
    'Todos os géneros': ['Todos os gêneros', 'All genres', 'Todos los géneros'],
    Ação: ['Ação', 'Action', 'Acción'],
    Aventura: ['Aventura', 'Adventure', 'Aventura'],
    Animação: ['Animação', 'Animation', 'Animación'],
    Comédia: ['Comédia', 'Comedy', 'Comedia'],
    Crime: ['Crime', 'Crime', 'Crimen'],
    Documentário: ['Documentário', 'Documentary', 'Documental'],
    Drama: ['Drama', 'Drama', 'Drama'],
    Família: ['Família', 'Family', 'Familia'],
    Fantasia: ['Fantasia', 'Fantasy', 'Fantasía'],
    História: ['História', 'History', 'Historia'],
    Terror: ['Terror', 'Horror', 'Terror'],
    Mistério: ['Mistério', 'Mystery', 'Misterio'],
    Romance: ['Romance', 'Romance', 'Romance'],
    'Ficção científica': ['Ficção científica', 'Sci-Fi', 'Ciencia ficción'],
    Suspense: ['Suspense', 'Thriller', 'Suspenso'],
    Guerra: ['Guerra', 'War', 'Guerra'],
    Western: ['Faroeste', 'Western', 'Western'],
    'Instalar addon': ['Instalar addon', 'Install add-on', 'Instalar complemento'],
    Instalados: ['Instalados', 'Installed', 'Instalados'],
    Instalar: ['Instalar', 'Install', 'Instalar'],
    Perfis: ['Perfis', 'Profiles', 'Perfiles'],
    'Gerir perfis': ['Gerenciar perfis', 'Manage profiles', 'Gestionar perfiles'],
    'Quem está a ver?': ['Quem está assistindo?', "Who's watching?", '¿Quién está viendo?'],
    Adicionar: ['Adicionar', 'Add', 'Añadir'],
    Concluído: ['Concluído', 'Done', 'Listo'],
    Guardar: ['Salvar', 'Save', 'Guardar'],
    Cancelar: ['Cancelar', 'Cancel', 'Cancelar'],
    Aparência: ['Aparência', 'Appearance', 'Apariencia'],
    Reprodução: ['Reprodução', 'Playback', 'Reproducción'],
    'Aparência das legendas': ['Aparência das legendas', 'Subtitle style', 'Estilo de subtítulos'],
    'Catálogos do início': ['Catálogos do início', 'Home catalogs', 'Catálogos de inicio'],
    Atualizações: ['Atualizações', 'Updates', 'Actualizaciones'],
    Discord: ['Discord', 'Discord', 'Discord'],
    'Reproduzir diretamente': ['Reproduzir diretamente', 'Play directly', 'Reproducir directamente'],
    'Os teus dados': ['Seus dados', 'Your data', 'Tus datos'],
    'Atalhos no leitor': ['Atalhos do player', 'Player shortcuts', 'Atajos del reproductor'],
    'Procurar atualizações': ['Procurar atualizações', 'Check for updates', 'Buscar actualizaciones'],
    'Ver novidades': ['Ver novidades', "What's new", 'Ver novedades'],
    'Exportar cópia': ['Exportar backup', 'Export backup', 'Exportar copia'],
    'Importar cópia': ['Importar backup', 'Import backup', 'Importar copia'],
    'Limpar progresso': ['Limpar progresso', 'Clear progress', 'Borrar progreso'],
    'Apagar tudo': ['Apagar tudo', 'Delete everything', 'Borrar todo'],
    'Preto AMOLED': ['Preto AMOLED', 'AMOLED black', 'Negro AMOLED'],
    'Modo TV': ['Modo TV', 'TV mode', 'Modo TV'],
    'Ordenar fontes por qualidade': [
      'Ordenar fontes por qualidade',
      'Sort sources by quality',
      'Ordenar fuentes por calidad'
    ],
    'Reproduzir automaticamente': ['Reproduzir automaticamente', 'Autoplay', 'Reproducción automática'],
    'Esconder torrents': ['Esconder torrents', 'Hide torrents', 'Ocultar torrents'],
    'Idioma das legendas': ['Idioma das legendas', 'Subtitle language', 'Idioma de subtítulos'],
    'Rich Presence': ['Rich Presence', 'Rich Presence', 'Rich Presence'],
    'Modo discreto': ['Modo discreto', 'Private mode', 'Modo discreto'],
    Tamanho: ['Tamanho', 'Size', 'Tamaño'],
    Cor: ['Cor', 'Color', 'Color'],
    Fundo: ['Fundo', 'Background', 'Fondo'],
    Velocidade: ['Velocidade', 'Speed', 'Velocidad'],
    Legendas: ['Legendas', 'Subtitles', 'Subtítulos'],
    Desligadas: ['Desligadas', 'Off', 'Desactivados'],
    Normal: ['Normal', 'Normal', 'Normal'],
    Pequeno: ['Pequeno', 'Small', 'Pequeño'],
    Médio: ['Médio', 'Medium', 'Mediano'],
    Grande: ['Grande', 'Large', 'Grande'],
    'Muito grande': ['Muito grande', 'Extra large', 'Muy grande'],
    Branco: ['Branco', 'White', 'Blanco'],
    Amarelo: ['Amarelo', 'Yellow', 'Amarillo'],
    Ciano: ['Ciano', 'Cyan', 'Cian'],
    'Sem fundo': ['Sem fundo', 'No background', 'Sin fondo'],
    'Fundo suave': ['Fundo suave', 'Soft background', 'Fondo suave'],
    'Fundo sólido': ['Fundo sólido', 'Solid background', 'Fondo sólido'],
    Nenhum: ['Nenhum', 'None', 'Ninguno'],
    Suave: ['Suave', 'Soft', 'Suave'],
    Sólido: ['Sólido', 'Solid', 'Sólido'],
    'Ver no IMDb': ['Ver no IMDb', 'View on IMDb', 'Ver en IMDb'],
    Estreia: ['Estreia', 'Release', 'Estreno'],
    Duração: ['Duração', 'Runtime', 'Duración'],
    País: ['País', 'Country', 'País'],
    Idioma: ['Idioma', 'Language', 'Idioma'],
    Realização: ['Direção', 'Director', 'Dirección'],
    Argumento: ['Roteiro', 'Writer', 'Guion'],
    Prémios: ['Prêmios', 'Awards', 'Premios'],
    'A seguir': ['A seguir', 'Up next', 'A continuación'],
    'Ver agora ': ['Assistir agora', 'Watch now', 'Ver ahora'],
    'Não foi possível reproduzir': ['Não foi possível reproduzir', "Couldn't play this", 'No se pudo reproducir'],
    'Abrir noutra app': ['Abrir em outro app', 'Open in another app', 'Abrir en otra app'],
    'Escolher outra fonte': ['Escolher outra fonte', 'Choose another source', 'Elegir otra fuente'],
    'Nada encontrado': ['Nada encontrado', 'Nothing found', 'Sin resultados'],
    'A tua lista está vazia': ['Sua lista está vazia', 'Your list is empty', 'Tu lista está vacía'],
    Explorar: ['Explorar', 'Explore', 'Explorar'],
    Tudo: ['Tudo', 'All', 'Todo'],
    'Sem ligação aos addons': ['Sem conexão com os addons', "Can't reach add-ons", 'Sin conexión con los complementos'],
    'Tentar de novo': ['Tentar de novo', 'Try again', 'Reintentar'],
    Retomar: ['Retomar', 'Resume', 'Reanudar'],
    Trailers: ['Trailers', 'Trailers', 'Tráileres'],
    'Gerir addons': ['Gerenciar addons', 'Manage add-ons', 'Gestionar complementos'],
    'Ficheiro local': ['Arquivo local', 'Local file', 'Archivo local'],
    'Usar no browser →': ['Usar no navegador →', 'Use in browser →', 'Usar en el navegador →'],
    'Saltar introdução': ['Pular abertura', 'Skip intro', 'Saltar intro'],
    'Saltar resumo': ['Pular recapitulação', 'Skip recap', 'Saltar resumen'],
    'Ver em conjunto': ['Assistir junto', 'Watch together', 'Ver juntos'],
    'Juntar a uma sessão': ['Entrar em uma sessão', 'Join a session', 'Unirse a una sesión'],
    'As tuas listas': ['Suas listas', 'Your lists', 'Tus listas'],
    'Nova lista': ['Nova lista', 'New list', 'Nueva lista'],
    Listas: ['Listas', 'Lists', 'Listas'],
    Partilhar: ['Compartilhar', 'Share', 'Compartir'],
    'Apagar lista': ['Excluir lista', 'Delete list', 'Borrar lista'],
    'Guardar na minha biblioteca': ['Salvar na minha biblioteca', 'Save to my library', 'Guardar en mi biblioteca'],
    'Conta e sincronização': ['Conta e sincronização', 'Account and sync', 'Cuenta y sincronización'],
    Entrar: ['Entrar', 'Sign in', 'Iniciar sesión'],
    'Criar conta': ['Criar conta', 'Create account', 'Crear cuenta'],
    'Sincronizar agora': ['Sincronizar agora', 'Sync now', 'Sincronizar ahora'],
    'Terminar sessão': ['Sair', 'Sign out', 'Cerrar sesión'],
    'Idioma da app': ['Idioma do app', 'App language', 'Idioma de la app'],
    Notificações: ['Notificações', 'Notifications', 'Notificaciones'],
    'Ativar notificações': ['Ativar notificações', 'Enable notifications', 'Activar notificaciones'],
    'O teu ano no Vinovim': ['Seu ano no Vinovim', 'Your year on Vinovim', 'Tu año en Vinovim'],
    'Géneros preferidos': ['Gêneros preferidos', 'Favorite genres', 'Géneros favoritos'],
    'Mais vistos': ['Mais assistidos', 'Most watched', 'Más vistos'],
    'Por mês': ['Por mês', 'By month', 'Por mes'],
    Fechar: ['Fechar', 'Close', 'Cerrar'],
    'Link copiado': ['Link copiado', 'Link copied', 'Enlace copiado'],
    'Copiar link': ['Copiar link', 'Copy link', 'Copiar enlace'],
    Gosto: ['Gostei', 'Like', 'Me gusta'],
    'Não gosto': ['Não gostei', 'Dislike', 'No me gusta'],
    'Os dados da tua conta antiga voltaram': [
      'Os dados da sua conta antiga voltaram',
      'Your old account data is back',
      'Los datos de tu cuenta antigua han vuelto'
    ]
  };
  const LIDX = { 'pt-BR': 0, en: 1, es: 2 };
  let LANG = 'pt-PT';
  function tr(s) {
    const i = LIDX[LANG];
    if (i === undefined) return s;
    const t = DICT[s.trim()];
    return t ? s.replace(s.trim(), t[i]) : s;
  }
  window.vvTr = tr;
  const PATTERNS = {
    'pt-BR': [
      [/^Continuar (T\d+·E\d+)$/, 'Continuar $1'],
      [/^Ver (T\d+·E\d+)$/, 'Assistir $1'],
      [/^Temporada (\d+)$/, 'Temporada $1'],
      [/(\d+) na temporada$/, '$1 na temporada'],
      [/^faltam /, 'faltam ']
    ],
    en: [
      [/^Continuar (T\d+·E\d+)$/, 'Resume $1'],
      [/^Continuar$/, 'Resume'],
      [/^Ver (T\d+·E\d+)$/, 'Watch $1'],
      [/^Temporada (\d+)$/, 'Season $1'],
      [/^(\d+) na temporada$/, '$1 this season'],
      [/^Extras$/, 'Extras'],
      [/^Série$/, 'Series'],
      [/^Filme$/, 'Movie']
    ],
    es: [
      [/^Continuar (T\d+·E\d+)$/, 'Seguir $1'],
      [/^Ver (T\d+·E\d+)$/, 'Ver $1'],
      [/^Temporada (\d+)$/, 'Temporada $1'],
      [/^(\d+) na temporada$/, '$1 en la temporada'],
      [/^Série$/, 'Serie'],
      [/^Filme$/, 'Película']
    ]
  };
  function trNode(n) {
    if (n.nodeType === 3) {
      const v = n.nodeValue,
        k = v.trim();
      if (!k || k.length > 80) return;
      let out = tr(v);
      if (out === v)
        for (const [re, rep] of PATTERNS[LANG] || []) {
          if (re.test(k)) {
            out = v.replace(k, k.replace(re, rep));
            break;
          }
        }
      if (out !== v) n.nodeValue = out;
      return;
    }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
    for (const a of ['placeholder', 'title', 'aria-label']) {
      const v = n.getAttribute && n.getAttribute(a);
      if (v) {
        const o = tr(v);
        if (o !== v) n.setAttribute(a, o);
      }
    }
    n.childNodes.forEach(trNode);
  }
  let mo = null;
  function applyLang() {
    LANG = S.prefs.lang || 'pt-PT';
    document.documentElement.lang = LANG === 'pt-PT' ? 'pt' : LANG;
    if (mo) {
      mo.disconnect();
      mo = null;
    }
    if (LANG === 'pt-PT') return;
    trNode(document.body);
    mo = new MutationObserver(ms => {
      mo.disconnect();
      ms.forEach(m => {
        m.addedNodes.forEach(trNode);
        if (m.type === 'characterData') trNode(m.target);
      });
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* =================== conta e sincronização =================== */
  const AUTH_KEY = 'vinovim.auth';
  const auth =
    (() => {
      try {
        return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
      } catch (e) {
        return null;
      }
    })() || {};
  function saveAuth() {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    } catch (e) {}
  }
  async function api(path, opts = {}) {
    const r = await fetch(
      API + '/api/account' + path,
      Object.assign(
        {
          headers: Object.assign(
            { 'Content-Type': 'application/json' },
            auth.token ? { Authorization: 'Bearer ' + auth.token } : {}
          )
        },
        opts
      )
    );
    let j = {};
    try {
      j = await r.json();
    } catch (e) {}
    if (!r.ok) {
      if (r.status === 401 && auth.token && !/a=(login|register)/.test(path)) {
        auth.token = null;
        saveAuth();
      }
      throw new Error(j.error || 'Erro ' + r.status);
    }
    return j;
  }
  const SYNC_KEYS = ['profiles', 'pdata', 'addons', 'cats', 'accent'];
  function mergeObj(a = {}, b = {}, newer) {
    const o = Object.assign({}, a);
    for (const k in b) {
      if (!(k in o) || newer(b[k], o[k])) o[k] = b[k];
    }
    return o;
  }
  function mergeState(remote) {
    if (!remote) return;
    hooks.emit('sync:remote', remote);
    const tomb = Object.assign({}, remote.tomb || {}, S.tomb || {});
    const byId = new Map(S.profiles.map(p => [p.id, p]));
    (remote.profiles || []).forEach(p => {
      if (!byId.has(p.id) && !tomb['profile:' + p.id]) byId.set(p.id, p);
    });
    S.profiles = [...byId.values()].filter(p => !tomb['profile:' + p.id]);
    S.addons = [...new Set([...(S.addons || []), ...(remote.addons || [])])].filter(u => !tomb['addon:' + u]);
    for (const p of S.profiles) {
      const L = S.pdata[p.id] || (S.pdata[p.id] = emptyPData()),
        R = (remote.pdata || {})[p.id] || {};
      L.library = mergeObj(L.library, R.library, (x, y) => (x.added || 0) > (y.added || 0));
      for (const id in L.library) {
        const t = tomb['lib:' + p.id + ':' + id];
        if (t && t > (L.library[id].added || 0)) delete L.library[id];
      }
      L.progress = mergeObj(L.progress, R.progress, (x, y) => (x.updated || 0) > (y.updated || 0));
      for (const id in L.progress) {
        const t = tomb['prog:' + p.id + ':' + id];
        if (t && t > (L.progress[id].updated || 0)) delete L.progress[id];
      }
      L.watched = Object.assign({}, R.watched || {}, L.watched || {});
      L.ratings = Object.assign({}, R.ratings || {}, L.ratings || {});
      L.intros = Object.assign({}, R.intros || {}, L.intros || {});
      L.searchHistory = [...new Set([...(L.searchHistory || []), ...(R.searchHistory || [])])].slice(0, 10);
      const lists = new Map((R.lists || []).map(l => [l.id, l]));
      (L.lists || []).forEach(l => {
        const o = lists.get(l.id);
        if (!o || (l.updated || 0) >= (o.updated || 0)) lists.set(l.id, l);
      });
      L.lists = [...lists.values()].filter(l => !tomb['list:' + l.id]);
      const st = L.stats || {},
        rs = R.stats || {};
      L.stats = {
        days: mergeObj(st.days, rs.days, (x, y) => x > y),
        titles: mergeObj(st.titles, rs.titles, (x, y) => (x.secs || 0) > (y.secs || 0))
      };
      if (R.calSeen && (!L.calSeen || R.calSeen > L.calSeen)) L.calSeen = R.calSeen;
    }
    S.tomb = tomb;
    hooks.emit('sync:merged');
  }
  /* A sincronização gasta o mínimo de escritas no servidor:
     - espera um pouco depois de cada alteração e nunca envia mais do que uma vez a cada 45 s;
     - com um vídeo a dar não envia nada (o progresso muda a cada 5 s): envia ao fechar o leitor;
     - não volta a enviar o que o servidor já tem. */
  let syncT = null,
    syncing = false,
    dirty = false,
    lastSync = 0;
  const watching = () => P.classList.contains('open');
  const fnv = s => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return (h >>> 0).toString(36) + '.' + s.length.toString(36);
  };
  function scheduleSync() {
    if (!auth.token) return;
    dirty = true;
    if (watching()) return;
    clearTimeout(syncT);
    syncT = setTimeout(() => syncNow(false), Math.max(10000, 45000 - (Date.now() - lastSync)));
  }
  async function syncNow(manual) {
    if (!auth.token || syncing) return;
    syncing = true;
    clearTimeout(syncT);
    dirty = false;
    try {
      const r = await api('?a=data');
      if (r && r.data) mergeState(r.data);
      // dados de uma conta antiga com o mesmo email: juntam-se aos desta e o servidor fica a saber
      const absorbed = [];
      ((r && r.old) || []).forEach(o => {
        mergeState(o.data);
        absorbed.push(o.uid);
      });
      const data = {};
      SYNC_KEYS.forEach(k => (data[k] = S[k]));
      data.tomb = S.tomb || {};
      save({ quiet: true });
      const body = JSON.stringify({ data }),
        h = fnv(body),
        who = auth.token.slice(-16),
        sent = auth.sent && auth.sent.who === who ? auth.sent : {};
      if (manual || absorbed.length || h !== sent.h || (r && r.updatedAt) !== sent.at) {
        const w = await api('?a=data', {
          method: 'PUT',
          body: absorbed.length ? JSON.stringify({ data, absorbed }) : body
        });
        auth.sent = { who, h, at: w.updatedAt };
      }
      if (absorbed.length) toast(tr('Os dados da tua conta antiga voltaram'));
      lastSync = auth.last = Date.now();
      saveAuth();
      if (manual) toast(tr('Sincronizado'));
      updateProfBtn();
      const st = document.getElementById('syncState');
      if (st) st.textContent = syncLabel();
    } catch (e) {
      dirty = true;
      if (manual) toast(e.message);
    }
    syncing = false;
    if (dirty) scheduleSync();
  }
  hooks.on('player:closed', () => dirty && syncNow(false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dirty && !watching()) syncNow(false);
  });
  const syncLabel = () =>
    auth.last
      ? 'Última sincronização: ' +
        new Date(auth.last).toLocaleString(LANG === 'pt-PT' ? 'pt-PT' : LANG, {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Ainda não sincronizado';
  hooks.on('save', scheduleSync);
  // ao tirar da lista fica uma marca para a sincronização não o voltar a trazer
  hooks.on('library:toggle', (m, wasIn) => {
    if (wasIn) {
      S.tomb = S.tomb || {};
      S.tomb['lib:' + S.activeProfile + ':' + m.id] = Date.now();
    } else {
      const g = (ITEMS.get(m.id) || m).genres;
      if (g) PD().genresById = Object.assign(PD().genresById || {}, { [m.id]: g });
    }
  });

  function accountPanel() {
    if (auth.token)
      return `<div class="panel"><h3>${tr('Conta e sincronização')}</h3><p class="m">A tua lista, progresso, perfis, listas e addons ficam iguais em todos os dispositivos onde entrares com esta conta.</p>
    <div class="acct"><span class="dot"></span><div style="flex:1"><b>${esc(auth.email || '')}</b><small id="syncState">${esc(syncLabel())}</small></div></div>
    <div class="inrow"><button class="btn gho" id="xSync">${tr('Sincronizar agora')}</button><button class="btn gho" id="xOut">${tr('Terminar sessão')}</button></div></div>`;
    return `<div class="panel"><h3>${tr('Conta e sincronização')}</h3><p class="m">Cria uma conta grátis para teres a mesma lista e o mesmo progresso no PC, no telemóvel e na TV.</p>
    <div class="acct off"><span class="dot"></span><div><b>Sem sessão iniciada</b><small>Os dados ficam só neste dispositivo</small></div></div>
    <div class="inrow"><button class="btn acc" id="xLogin">${tr('Entrar')}</button><button class="btn gho" id="xReg">${tr('Criar conta')}</button></div></div>`;
  }
  function authDialog(mode) {
    openModal(
      `<h3>${mode === 'register' ? tr('Criar conta') : tr('Entrar')}</h3><p class="m">${mode === 'register' ? 'Usa um email e uma palavra-passe com pelo menos 6 caracteres. Não uses a mesma palavra-passe de outros sites.' : 'Entra com a tua conta Vinovim.'}</p>
    <form id="xAuth"><input class="inp" name="email" type="email" placeholder="Email" autocomplete="email" required><input class="inp" name="password" type="password" placeholder="Palavra-passe" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" minlength="6" required>
    <div class="inrow"><button class="btn acc" type="submit">${mode === 'register' ? tr('Criar conta') : tr('Entrar')}</button><button class="btn gho" type="button" data-close-modal>${tr('Cancelar')}</button></div></form>`,
      m => {
        m.querySelector('#xAuth').onsubmit = async e => {
          e.preventDefault();
          const f = e.target,
            b = f.querySelector('[type=submit]');
          b.disabled = true;
          b.textContent = '…';
          try {
            const r = await api('?a=' + mode, {
              method: 'POST',
              body: JSON.stringify({ email: f.email.value, password: f.password.value })
            });
            auth.token = r.token;
            auth.email = r.email;
            saveAuth();
            closeModal();
            toast('Sessão iniciada: ' + r.email);
            await syncNow(false);
            route();
          } catch (err) {
            toast(err.message);
            b.disabled = false;
            b.textContent = mode === 'register' ? tr('Criar conta') : tr('Entrar');
          }
        };
      }
    );
  }

  /* =================== estatísticas (registo) =================== */
  let lastTick = 0;
  V.addEventListener('timeupdate', () => {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (!PC || !PC.meta || PC.stream.ytId || V.paused || dt <= 0 || dt > 5) return;
    const st = pdk('stats', { days: {}, titles: {} });
    st.days = st.days || {};
    st.titles = st.titles || {};
    const d = dayKey();
    st.days[d] = (st.days[d] || 0) + dt;
    const m = PC.meta,
      t =
        st.titles[m.id] ||
        (st.titles[m.id] = { name: m.name, type: m.type, poster: m.poster, genres: m.genres || [], secs: 0 });
    t.secs += dt;
    t.last = now;
    if (m.genres && m.genres.length) t.genres = m.genres;
  });

  /* =================== saltar introdução / resumo =================== */
  const skip = document.createElement('button');
  skip.className = 'skipbtn';
  P.appendChild(skip);
  let skipTo = 0,
    autoSkipped = {};
  function introFor() {
    if (!PC || !PC.meta || PC.meta.type !== 'series') return null;
    return pdk('intros', {})[PC.meta.id] || null;
  }
  V.addEventListener('timeupdate', () => {
    const it = introFor(),
      t = V.currentTime;
    let show = null;
    if (it) {
      if (it.recapEnd && t < it.recapEnd - 1 && t >= 0) show = ['Saltar resumo', it.recapEnd];
      else if (it.start != null && it.end && t >= it.start - 0.5 && t < it.end - 1)
        show = ['Saltar introdução', it.end];
      if (show && S.prefs.autoSkip && !autoSkipped[PC.videoId + show[0]]) {
        autoSkipped[PC.videoId + show[0]] = 1;
        V.currentTime = show[1];
        toast(tr(show[0]));
        return;
      }
    } else if (PC && PC.meta && PC.meta.type === 'series' && !PC.stream.ytId && t > 5 && t < 240)
      show = ['Saltar introdução', t + 85, '+1:25'];
    if (show) {
      skipTo = show[1];
      skip.innerHTML = `${XI.skip}${tr(show[0])}${show[2] ? ` <small style="opacity:.6;font-weight:600">${show[2]}</small>` : ''}`;
      skip.classList.add('show');
    } else skip.classList.remove('show');
  });
  skip.onclick = () => {
    V.currentTime = skipTo;
    skip.classList.remove('show');
    poke();
  };
  function markIntro(kind) {
    if (!PC || !PC.meta || PC.meta.type !== 'series') return toast('Só disponível em séries');
    const all = pdk('intros', {}),
      it = all[PC.meta.id] || (all[PC.meta.id] = {}),
      t = Math.round(V.currentTime);
    if (kind === 'start') it.start = t;
    else if (kind === 'end') it.end = t;
    else if (kind === 'recap') it.recapEnd = t;
    else delete all[PC.meta.id];
    save();
    renderMenu();
    toast(kind === 'clear' ? 'Marcações apagadas' : 'Marcado em ' + fmt(t) + ' para todos os episódios desta série');
  }

  /* =================== menu do leitor =================== */
  hooks.on('player:menu', menu => {
    const it = introFor();
    const isS = PC && PC.meta && PC.meta.type === 'series';
    menu.insertAdjacentHTML(
      'beforeend',
      `${
        isS
          ? `<h5>Introdução e resumo</h5><small class="phint">Marca uma vez e o Vinovim salta em todos os episódios desta série.</small>
    <div class="prow"><button data-xintro="start">Início da intro${it && it.start != null ? ' · ' + fmt(it.start) : ''}</button><button data-xintro="end">Fim da intro${it && it.end ? ' · ' + fmt(it.end) : ''}</button><button data-xintro="recap">Fim do resumo${it && it.recapEnd ? ' · ' + fmt(it.recapEnd) : ''}</button>${it ? '<button data-xintro="clear">Apagar</button>' : ''}</div>
    <div class="prow"><button class="${S.prefs.autoSkip ? 'on' : ''}" data-xautoskip>Saltar automaticamente</button></div>`
          : ''
      }
    <h5>${tr('Ver em conjunto')}</h5><div class="prow"><button data-xparty>${party.peer ? 'Abrir sessão' : 'Criar sessão'}</button></div>
    ${castReady ? `<h5>Chromecast</h5><div class="prow"><button data-xcast>Enviar para a TV</button></div>` : ''}`
    );
  });
  $('#pMenu').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.xintro) markIntro(b.dataset.xintro);
    else if ('xautoskip' in b.dataset) {
      S.prefs.autoSkip = !S.prefs.autoSkip;
      save();
      renderMenu();
    } else if ('xparty' in b.dataset) {
      $('#pMenu').classList.remove('open');
      party.peer ? togglePartyPanel(true) : hostParty();
    } else if ('xcast' in b.dataset) castNow();
  });

  /* =================== ver em conjunto (PeerJS, P2P) =================== */
  const party = { peer: null, conns: [], host: false, code: '', applying: false, hostConn: null };
  const pPanel = document.createElement('div');
  pPanel.id = 'party';
  P.appendChild(pPanel);
  const loadScript2 = src =>
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
      await loadScript2('https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js');
    } catch (e) {
      await loadScript2('https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js');
    }
  }
  const myName = () => (curProfile() || {}).name || 'Eu';
  function chatLine(html, sys) {
    const c = pPanel.querySelector('.pchat');
    if (!c) return;
    c.insertAdjacentHTML('beforeend', `<div class="pmsg ${sys ? 'sys' : ''}">${html}</div>`);
    c.scrollTop = c.scrollHeight;
  }
  function renderPartyPanel() {
    pPanel.innerHTML = `<div class="ph1"><div style="display:flex;align-items:center;gap:8px"><b style="flex:1">${tr('Ver em conjunto')}</b><button class="pb" data-pclose title="${tr('Fechar')}">${I.x}</button></div>
    <small>${party.host ? 'Partilha este código com quem vai ver contigo:' : 'Estás ligado à sessão:'}</small>
    <div class="pcode"><code>${esc(party.code)}</code>${party.host ? `<button class="btn sm gho" data-pcopy>Copiar</button>` : ''}</div>
    <small id="pcount">${party.host ? party.conns.length + ' ligado(s)' : 'Ligado ao anfitrião'}</small></div>
    <div class="pchat"></div>
    <form class="pform"><input placeholder="Escreve uma mensagem…" maxlength="300"><button type="submit">${XI.send}</button></form>
    <div style="padding:0 12px 12px"><button class="btn sm gho" data-pleave style="width:100%">Sair da sessão</button></div>`;
    pPanel.querySelector('.pform').onsubmit = e => {
      e.preventDefault();
      const i = e.target.querySelector('input'),
        txt = i.value.trim();
      if (!txt) return;
      i.value = '';
      const msg = { type: 'chat', name: myName(), text: txt };
      chatLine(`<b>${esc(msg.name)}</b>${esc(txt)}`);
      broadcast(msg);
    };
    pPanel.querySelector('[data-pclose]').onclick = () => togglePartyPanel(false);
    pPanel.querySelector('[data-pleave]').onclick = leaveParty;
    const cp = pPanel.querySelector('[data-pcopy]');
    if (cp) cp.onclick = () => copyText(party.code);
  }
  function togglePartyPanel(on) {
    pPanel.classList.toggle('open', on);
    if (on) poke();
  }
  function send(conn, msg) {
    try {
      conn.open && conn.send(msg);
    } catch (e) {}
  }
  function broadcast(msg, except) {
    if (party.host) party.conns.forEach(c => c !== except && send(c, msg));
    else if (party.hostConn) send(party.hostConn, msg);
  }
  function stateMsg() {
    return { type: 'state', t: V.currentTime, playing: !V.paused, videoId: PC && PC.videoId, at: Date.now() };
  }
  function loadMsg() {
    if (!PC || !PC.stream) return null;
    const m = PC.meta || {};
    return {
      type: 'load',
      stream: PC.stream._local ? null : PC.stream,
      meta: { id: m.id, type: m.type, name: m.name },
      videoId: PC.videoId,
      t: V.currentTime,
      playing: !V.paused,
      title: PC.title
    };
  }
  async function hostParty() {
    if (!PC || !PC.stream || PC.stream._local)
      return toast('Começa a ver um título (de um addon ou link) para criar uma sessão');
    await peerLib().catch(() => {});
    if (!window.Peer) return toast('Não foi possível carregar o serviço de sessões');
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const peer = new Peer('vinovim-' + code);
    party.peer = peer;
    party.host = true;
    party.code = code;
    party.conns = [];
    peer.on('open', () => {
      renderPartyPanel();
      togglePartyPanel(true);
      chatLine('Sessão criada. Partilha o código ' + esc(code) + '.', true);
    });
    peer.on('error', err => {
      toast('Sessão: ' + (err.type || err.message));
    });
    peer.on('connection', conn => {
      conn.on('open', () => {
        party.conns.push(conn);
        const lm = loadMsg();
        if (lm) send(conn, lm);
        const pc = pPanel.querySelector('#pcount');
        if (pc) pc.textContent = party.conns.length + ' ligado(s)';
      });
      conn.on('data', msg => handleMsg(msg, conn));
      conn.on('close', () => {
        party.conns = party.conns.filter(c => c !== conn);
        const pc = pPanel.querySelector('#pcount');
        if (pc) pc.textContent = party.conns.length + ' ligado(s)';
      });
    });
  }
  async function joinParty(code) {
    code = String(code || '')
      .trim()
      .toUpperCase();
    if (code.length < 4) return toast('Código inválido');
    await peerLib().catch(() => {});
    if (!window.Peer) return toast('Não foi possível carregar o serviço de sessões');
    const peer = new Peer();
    party.peer = peer;
    party.host = false;
    party.code = code;
    peer.on('open', () => {
      const conn = peer.connect('vinovim-' + code, { reliable: true });
      party.hostConn = conn;
      conn.on('open', () => {
        toast('Ligado à sessão ' + code);
        send(conn, { type: 'hello', name: myName() });
      });
      conn.on('data', msg => handleMsg(msg, conn));
      conn.on('close', () => {
        chatLine('O anfitrião terminou a sessão.', true);
        toast('A sessão terminou');
        party.hostConn = null;
      });
    });
    peer.on('error', err =>
      toast(err.type === 'peer-unavailable' ? 'Sessão não encontrada' : 'Sessão: ' + (err.type || err.message))
    );
  }
  function leaveParty() {
    try {
      party.peer && party.peer.destroy();
    } catch (e) {}
    Object.assign(party, { peer: null, conns: [], host: false, code: '', hostConn: null });
    togglePartyPanel(false);
    toast('Saíste da sessão');
  }
  async function handleMsg(msg, conn) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'chat') {
      chatLine(`<b>${esc(String(msg.name || '?').slice(0, 30))}</b>${esc(String(msg.text || '').slice(0, 300))}`);
      if (party.host) broadcast(msg, conn);
      if (!pPanel.classList.contains('open')) toast(String(msg.name) + ': ' + String(msg.text).slice(0, 60));
      return;
    }
    if (msg.type === 'hello') {
      chatLine(esc(String(msg.name || 'Alguém').slice(0, 30)) + ' entrou na sessão.', true);
      broadcast({ type: 'chat', name: '•', text: String(msg.name || 'Alguém').slice(0, 30) + ' entrou' }, conn);
      return;
    }
    if (msg.type === 'load' && !party.host) {
      if (!msg.stream) return toast('O anfitrião está a ver um ficheiro local, que não pode ser partilhado');
      let meta = null;
      try {
        if (msg.meta && msg.meta.id) meta = await getMeta(msg.meta.type, msg.meta.id);
      } catch (e) {}
      const video = meta && (meta.videos || []).find(v => v.id === msg.videoId);
      party.applying = true;
      play(
        msg.stream,
        meta ? { meta, video, type: meta.type, videoId: msg.videoId } : { title: msg.title || 'Sessão' }
      );
      const once = () => {
        V.currentTime = msg.t + (msg.playing ? 1 : 0);
        msg.playing ? V.play().catch(() => {}) : V.pause();
        setTimeout(() => (party.applying = false), 800);
      };
      V.addEventListener('loadedmetadata', once, { once: true });
      renderPartyPanel();
      togglePartyPanel(true);
      chatLine('Entraste na sessão. Bom filme!', true);
      return;
    }
    if (msg.type === 'state') {
      if (party.host && conn) {
        broadcast(msg, conn);
      }
      if (!P.classList.contains('open')) return;
      const target = msg.t + (msg.playing ? (Date.now() - msg.at) / 1000 : 0);
      party.applying = true;
      if (Math.abs(V.currentTime - target) > 1.5) V.currentTime = target;
      if (msg.playing && V.paused) V.play().catch(() => {});
      else if (!msg.playing && !V.paused) V.pause();
      setTimeout(() => (party.applying = false), 600);
    }
  }
  ['play', 'pause', 'seeked'].forEach(ev =>
    V.addEventListener(ev, () => {
      if (party.peer && !party.applying) broadcast(stateMsg());
    })
  );
  setInterval(() => {
    if (party.peer && party.host && P.classList.contains('open') && !V.paused) broadcast(stateMsg());
  }, 5000);
  function joinDialog() {
    openModal(
      `<h3>${tr('Juntar a uma sessão')}</h3><p class="m">Escreve o código que o teu amigo partilhou. O vídeo dele abre aqui, sincronizado, com chat.</p>
    <form id="xJoin"><input class="inp" name="code" placeholder="Código (ex.: K7Q2ZP)" maxlength="8" style="text-transform:uppercase;letter-spacing:.2em;font-weight:700" required>
    <div class="inrow"><button class="btn acc" type="submit">Entrar</button><button class="btn gho" type="button" data-close-modal>${tr('Cancelar')}</button></div></form>`,
      m => {
        m.querySelector('#xJoin').onsubmit = e => {
          e.preventDefault();
          closeModal();
          joinParty(e.target.code.value);
        };
      }
    );
  }

  // quem organiza a sessão avisa os outros quando muda de vídeo
  hooks.on('play:started', stream => {
    if (party.host && party.peer && stream && !stream.ytId)
      V.addEventListener(
        'loadedmetadata',
        () => {
          const lm = loadMsg();
          if (lm) broadcast(lm);
        },
        { once: true }
      );
  });

  /* =================== Chromecast (Chrome) =================== */
  let castReady = false;
  if (
    !window.vinovimNative &&
    !window.Capacitor &&
    /Chrome/.test(navigator.userAgent) &&
    !/; wv\)|Electron/.test(navigator.userAgent) &&
    /^https:$/.test(location.protocol)
  ) {
    window.__onGCastApiAvailable = ok => {
      if (!ok || !window.cast) return;
      try {
        cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
        castReady = true;
      } catch (e) {}
    };
    loadScript2('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1').catch(() => {});
  }
  async function castNow() {
    if (!castReady) return toast('O Chromecast só funciona no Chrome');
    if (!PC || !PC.stream || !PC.stream.url || PC.stream._local)
      return toast('Só dá para enviar vídeos com link (não ficheiros locais)');
    try {
      const ctx = cast.framework.CastContext.getInstance();
      await ctx.requestSession();
      const s = ctx.getCurrentSession();
      const url = PC.stream.url;
      const mi = new chrome.cast.media.MediaInfo(url, /\.m3u8/i.test(url) ? 'application/x-mpegURL' : 'video/mp4');
      mi.metadata = new chrome.cast.media.GenericMediaMetadata();
      mi.metadata.title = PC.meta ? PC.meta.name : PC.title || 'Vinovim';
      if (PC.meta && PC.meta.poster) mi.metadata.images = [new chrome.cast.Image(PC.meta.poster)];
      const req = new chrome.cast.media.LoadRequest(mi);
      req.currentTime = V.currentTime;
      V.pause();
      await s.loadMedia(req);
      toast('A reproduzir na TV');
    } catch (e) {
      if (e !== 'cancel') toast('Não foi possível enviar para a TV');
    }
  }

  /* =================== listas personalizadas =================== */
  const lists = () => pdk('lists', []);
  function listDialog(m) {
    const ls = lists();
    openModal(
      `<h3>${tr('Listas')}</h3><p class="m">${esc(m.name)}</p><div id="xLists">${
        ls
          .map(l => {
            const on = l.items.some(i => i.id === m.id);
            return `<div class="xrow" tabindex="0" data-xl="${l.id}"><span class="xchk ${on ? 'on' : ''}">${on ? I.check : ''}</span><b>${esc(l.name)}</b><small>${l.items.length}</small></div>`;
          })
          .join('') || '<p class="m">Ainda não tens listas.</p>'
      }</div>
    <form id="xNew" style="display:flex;gap:8px;margin-top:10px"><input class="inp" name="n" placeholder="${tr('Nova lista')}…" maxlength="40" style="margin:0"><button class="btn acc" type="submit">${I.plus}</button></form>
    <div class="inrow" style="margin-top:14px"><button class="btn pri" data-close-modal>${tr('Concluído')}</button></div>`,
      md => {
        md.querySelector('#xLists').onclick = e => {
          const r = e.target.closest('[data-xl]');
          if (!r) return;
          const l = ls.find(x => x.id === r.dataset.xl);
          const i = l.items.findIndex(x => x.id === m.id);
          if (i >= 0) l.items.splice(i, 1);
          else l.items.unshift({ id: m.id, type: m.type, name: m.name, poster: m.poster, genres: m.genres });
          l.updated = Date.now();
          save();
          listDialog(m);
        };
        md.querySelector('#xLists').onkeydown = e => {
          if (e.key === 'Enter') e.target.closest('[data-xl]')?.click();
        };
        md.querySelector('#xNew').onsubmit = e => {
          e.preventDefault();
          const n = e.target.n.value.trim();
          if (!n) return;
          ls.push({
            id: 'l' + Date.now().toString(36),
            name: n,
            items: [{ id: m.id, type: m.type, name: m.name, poster: m.poster, genres: m.genres }],
            updated: Date.now()
          });
          save();
          listDialog(m);
        };
      }
    );
  }
  const b64u = s =>
    btoa(unescape(encodeURIComponent(s)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  const unb64u = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function shareLink(l) {
    return (
      'https://vinovim.vercel.app/?web#lista=' +
      b64u(JSON.stringify({ n: l.name, i: l.items.slice(0, 80).map(x => [x.id, x.type, x.name]) }))
    );
  }
  function listsSection() {
    const ls = lists();
    return `<h3 class="sec" style="margin-top:8px">${tr('As tuas listas')}</h3><div class="lgrid">${ls
      .map(
        l =>
          `<button class="lcard" data-xopen="${l.id}"><span class="lpics">${l.items
            .slice(0, 4)
            .map(x => `<img src="${esc(x.poster || IMG.poster(x.id))}" alt="" onerror="this.remove()">`)
            .join('')}</span><b>${esc(l.name)}</b><small>${l.items.length} título(s)</small></button>`
      )
      .join('')}
    <button class="lcard new" data-xnewlist>${I.plus}<b style="font-size:15px">${tr('Nova lista')}</b></button></div>`;
  }
  defineView('list', function () {
    app.className = '';
    const l = lists().find(x => x.id === VIEWS._list);
    if (!l) {
      location.hash = 'library';
      return;
    }
    app.innerHTML = `<div class="view">${topbar(esc(l.name))}<div class="pad"><div class="inrow" style="margin-bottom:22px"><button class="btn acc" id="xShare">${XI.share}${tr('Partilhar')}</button><button class="btn gho" id="xRen">Mudar nome</button><button class="btn gho" id="xDel" style="color:#ff8fa8">${tr('Apagar lista')}</button></div>
    ${l.items.length ? `<div class="grid">${l.items.map(x => card(Object.assign({ poster: IMG.poster(x.id) }, x))).join('')}</div>` : emptyHTML(XI.list, 'Lista vazia', 'Abre um filme ou série e carrega em “Listas” para o adicionares aqui.')}</div></div>`;
    $('#xShare').onclick = () => copyText(shareLink(l));
    $('#xRen').onclick = () =>
      openModal(
        `<h3>Mudar nome</h3><form id="xR"><input class="inp" name="n" value="${esc(l.name)}" maxlength="40"><div class="inrow"><button class="btn acc">${tr('Guardar')}</button><button class="btn gho" type="button" data-close-modal>${tr('Cancelar')}</button></div></form>`,
        m =>
          (m.querySelector('#xR').onsubmit = e => {
            e.preventDefault();
            const n = e.target.n.value.trim();
            if (n) {
              l.name = n;
              l.updated = Date.now();
              save();
            }
            closeModal();
            VIEWS.list();
          })
      );
    $('#xDel').onclick = function () {
      if (!this.dataset.c) {
        this.dataset.c = 1;
        this.textContent = 'Carrega outra vez para apagar';
        return;
      }
      S.tomb = S.tomb || {};
      S.tomb['list:' + l.id] = Date.now();
      PD().lists = lists().filter(x => x.id !== l.id);
      save();
      location.hash = 'library';
    };
  });
  function showSharedList(code) {
    let d;
    try {
      d = JSON.parse(unb64u(code));
    } catch (e) {
      toast('Link de lista inválido');
      location.hash = 'home';
      return;
    }
    const items = (d.i || []).map(([id, type, name]) => ({ id, type, name, poster: IMG.poster(id) }));
    app.className = '';
    app.innerHTML = `<div class="view">${topbar(esc(d.n || 'Lista partilhada'))}<div class="pad"><p class="m" style="color:var(--mu);margin-bottom:16px">Alguém partilhou esta lista contigo · ${items.length} título(s)</p>
    <div class="inrow" style="margin-bottom:22px"><button class="btn acc" id="xKeep">${tr('Guardar na minha biblioteca')}</button></div><div class="grid">${items.map(card).join('')}</div></div></div>`;
    $('#xKeep').onclick = () => {
      lists().push({ id: 'l' + Date.now().toString(36), name: d.n || 'Lista partilhada', items, updated: Date.now() });
      save();
      toast('Lista guardada');
      location.hash = 'library';
    };
  }

  /* =================== avaliações e recomendações =================== */
  function rate(m, v) {
    const r = pdk('ratings', {});
    if (r[m.id] === v) delete r[m.id];
    else r[m.id] = v;
    PD().genresById = Object.assign(PD().genresById || {}, { [m.id]: m.genres || [] });
    save();
    detailExtras(m, true);
  }
  function taste() {
    const w = {},
      add = (gs, k) => (gs || []).forEach(g => (w[g] = (w[g] || 0) + k));
    const gb = PD().genresById || {},
      st = (PD().stats || {}).titles || {};
    Object.keys(S.library || {}).forEach(id => add(gb[id] || (ITEMS.get(id) || {}).genres, 1));
    Object.values(st).forEach(t => add(t.genres, Math.min(3, (t.secs || 0) / 1800)));
    Object.entries(PD().ratings || {}).forEach(([id, v]) => add(gb[id], v > 0 ? 3 : -3));
    lists().forEach(l => l.items.forEach(x => add(x.genres, 0.5)));
    return Object.entries(w)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  }
  async function recommendations() {
    const top = taste()
      .slice(0, 3)
      .map(x => x[0]);
    if (!top.length) return [];
    const seen = new Set([
      ...Object.keys(S.library || {}),
      ...Object.keys((PD().stats || {}).titles || {}),
      ...Object.keys(PD().ratings || {})
    ]);
    const jobs = [];
    top.forEach(g =>
      ['movie', 'series'].forEach(t =>
        jobs.push(
          catalog(cinemeta(), t, 'imdbRating', { genre: g }).catch(() => []),
          catalog(cinemeta(), t, 'top', { genre: g }).catch(() => [])
        )
      )
    );
    const all = (await Promise.all(jobs)).flat();
    const out = new Map();
    all.forEach(m => {
      if (!seen.has(m.id) && !out.has(m.id)) {
        const score = (parseFloat(m.imdbRating) || 6) + (m.genres || []).filter(g => top.includes(g)).length * 0.8;
        out.set(m.id, Object.assign({ _s: score }, m));
      }
    });
    return [...out.values()].sort((a, b) => b._s - a._s).slice(0, 24);
  }
  function detailExtras(m, re) {
    const box = document.querySelector('#detail .hbtns');
    if (!box) return;
    box.querySelectorAll('.xdx').forEach(x => x.remove());
    const r = (PD().ratings || {})[m.id];
    box.insertAdjacentHTML(
      'beforeend',
      `<button class="btn gho xdx" data-xlists>${XI.list}${tr('Listas')}</button><button class="btn gho ico xdx ${r === 1 ? 'on' : ''}" data-xrate="1" title="${tr('Gosto')}">${XI.up}</button><button class="btn gho ico xdx ${r === -1 ? 'on' : ''}" data-xrate="-1" title="${tr('Não gosto')}">${XI.down}</button>`
    );
    box.querySelector('[data-xlists]').onclick = () => listDialog(m);
    box.querySelectorAll('[data-xrate]').forEach(b => (b.onclick = () => rate(m, +b.dataset.xrate)));
  }
  hooks.on('detail:shown', detailExtras);

  /* =================== calendário de estreias =================== */
  async function upcoming() {
    const ids = new Map();
    Object.values(S.library || {}).forEach(x => x.type === 'series' && ids.set(x.id, x));
    Object.values(S.progress || {}).forEach(x => x.type === 'series' && ids.set(x.id, x));
    const list = [...ids.values()],
      out = [],
      now = Date.now(),
      from = now - 14 * 864e5,
      to = now + 90 * 864e5;
    for (let i = 0; i < list.length; i += 4) {
      const metas = await Promise.all(list.slice(i, i + 4).map(x => getMeta('series', x.id).catch(() => null)));
      metas.forEach(
        m =>
          m &&
          (m.videos || []).forEach(v => {
            const d = v.released ? new Date(v.released).getTime() : 0;
            if (d >= from && d <= to && v.season) out.push({ m, v, d });
          })
      );
    }
    return out.sort((a, b) => a.d - b.d);
  }
  defineView('calendar', async function () {
    app.className = '';
    app.innerHTML = `<div class="view">${topbar(tr('Calendário'))}<div class="pad" style="max-width:980px"><p class="m" style="color:var(--mu);margin-bottom:22px">Os episódios das séries que estão na tua biblioteca ou que estás a ver — das últimas duas semanas aos próximos três meses.</p><div id="calBody"><span class="spin"></span></div></div></div>`;
    const seenBefore = PD().calSeen || 0;
    const items = await upcoming();
    if (!$('#calBody')) return;
    PD().calSeen = Date.now();
    save();
    if (!items.length) {
      $('#calBody').innerHTML = emptyHTML(
        XI.cal,
        'Nada no calendário',
        'Adiciona séries à tua biblioteca para veres aqui os próximos episódios.',
        '<a class="btn pri" href="#series">Explorar séries</a>'
      );
      return;
    }
    const fmtDay = d =>
      new Date(d).toLocaleDateString(LANG === 'pt-PT' ? 'pt-PT' : LANG, {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    const groups = new Map();
    items.forEach(x => {
      const k = dayKey(new Date(x.d));
      (groups.get(k) || groups.set(k, []).get(k)).push(x);
    });
    const tk = dayKey();
    $('#calBody').innerHTML = [...groups.entries()]
      .map(
        ([
          k,
          xs
        ]) => `<div class="calday ${k === tk ? 'today' : ''}"><h3>${k === tk ? 'Hoje' : fmtDay(xs[0].d)}${k < tk ? ' <small>já saiu</small>' : ''}</h3>
    ${xs.map(({ m, v, d }) => `<button class="calitem" data-open="series|${esc(m.id)}"><img src="${esc(m.poster || IMG.poster(m.id))}" alt="" onerror="this.style.visibility='hidden'"><div><b>${esc(m.name)}${d <= Date.now() && d > seenBefore ? '<span class="newtag">NOVO</span>' : ''}</b><span>${epLabel(v)} · ${esc(v.name || v.title || 'Episódio ' + v.episode)}</span></div></button>`).join('')}</div>`
      )
      .join('');
  });
  async function checkNewEpisodes() {
    const seen = PD().calSeen;
    if (!seen) {
      PD().calSeen = Date.now();
      return;
    }
    const items = (await upcoming()).filter(x => x.d > seen && x.d <= Date.now());
    if (!items.length) return;
    const msg =
      items.length === 1
        ? `Novo episódio: ${items[0].m.name} ${epLabel(items[0].v)}`
        : `${items.length} episódios novos das tuas séries`;
    toast(msg);
    if (S.prefs.notify && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Vinovim', { body: msg, icon: 'icons/icon-192.png' });
      } catch (e) {}
    }
    const nv = document.querySelector('.nv[data-v="calendar"]');
    if (nv)
      nv.insertAdjacentHTML(
        'beforeend',
        '<span class="newtag" style="position:absolute;top:4px;right:4px;margin:0;padding:2px 6px">' +
          items.length +
          '</span>'
      );
  }

  /* =================== estatísticas =================== */
  defineView('stats', function () {
    app.className = '';
    const st = PD().stats || { days: {}, titles: {} },
      year = new Date().getFullYear();
    const days = Object.entries(st.days || {}).filter(([d]) => d.startsWith(String(year)));
    const secs = days.reduce((a, [, s]) => a + s, 0),
      hours = secs / 3600;
    const titles = Object.entries(st.titles || {})
      .map(([id, t]) => Object.assign({ id }, t))
      .filter(t => t.secs > 60)
      .sort((a, b) => b.secs - a.secs);
    const gw = {};
    titles.forEach(t => (t.genres || []).forEach(g => (gw[g] = (gw[g] || 0) + t.secs)));
    const genres = Object.entries(gw)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
      gmax = genres[0] ? genres[0][1] : 1;
    const months = Array(12).fill(0);
    days.forEach(([d, s]) => (months[+d.slice(5, 7) - 1] += s));
    const mmax = Math.max(...months, 1);
    let streak = 0;
    for (let d = new Date(); ; d.setDate(d.getDate() - 1)) {
      if ((st.days || {})[dayKey(d)] > 60) streak++;
      else if (streak || dayKey(d) !== dayKey()) break;
      if (streak > 3650) break;
    }
    const movies = titles.filter(t => t.type === 'movie').length,
      series = titles.filter(t => t.type === 'series').length;
    const fav = genres[0] ? GPT[genres[0][0]] || genres[0][0] : null;
    const mn = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    app.innerHTML = `<div class="view">${topbar(tr('Estatísticas'))}<div class="pad" style="max-width:1100px">
    <div class="wrapped"><h2>${tr('O teu ano no Vinovim')} ${year}</h2><p>${hours < 0.1 ? 'Ainda estás a começar! Vê qualquer coisa e as tuas estatísticas aparecem aqui.' : `Este ano já passaste <b>${hours.toFixed(1)} horas</b> a ver ${movies} filme(s) e ${series} série(s)${fav ? `. O teu género preferido é <b>${esc(fav)}</b>` : ''}${titles[0] ? ` e o título que mais viste foi <b>${esc(titles[0].name)}</b>` : ''}.`}</p></div>
    <div class="stgrid"><div class="stcard"><small>Horas vistas</small><b>${hours.toFixed(1).replace('.', ',')}</b><span>h</span></div><div class="stcard"><small>Filmes</small><b>${movies}</b></div><div class="stcard"><small>Séries</small><b>${series}</b></div><div class="stcard"><small>Dias seguidos</small><b>${streak}</b><span>${streak === 1 ? 'dia' : 'dias'}</span></div></div>
    ${genres.length ? `<h3 class="sec">${tr('Géneros preferidos')}</h3><div class="bars">${genres.map(([g, s]) => `<div class="barrow"><span>${esc(GPT[g] || g)}</span><i style="width:${Math.max(4, (s / gmax) * 100)}%"></i><em>${(s / 3600).toFixed(1)} h</em></div>`).join('')}</div>` : ''}
    <h3 class="sec">${tr('Por mês')}</h3><div class="months">${months.map(s => `<div style="height:${Math.max(2, (s / mmax) * 100)}%" title="${(s / 3600).toFixed(1)} h"></div>`).join('')}</div><div class="mlbl">${mn.map(x => `<span>${x}</span>`).join('')}</div>
    ${
      titles.length
        ? rowHTML(
            tr('Mais vistos'),
            titles
              .slice(0, 20)
              .map(t => card({ id: t.id, type: t.type, name: t.name, poster: t.poster }))
              .join(''),
            'por tempo visto'
          )
        : ''
    }
  </div></div>`;
  });

  /* =================== integração com as páginas =================== */
  Object.assign(VIEW_TXT, { calendar: 'A ver o calendário', stats: 'A ver as estatísticas', list: 'A ver uma lista' });
  const navAdd = () => {
    if (document.querySelector('.nv[data-v="calendar"]')) return;
    const sp = document.querySelector('#nav .nvsp');
    sp.insertAdjacentHTML(
      'beforebegin',
      `<a class="nv dk" data-v="calendar" href="#calendar" style="position:relative">${XI.cal}${tr('Calendário')}</a><a class="nv dk" data-v="stats" href="#stats">${XI.stats}${tr('Estatísticas')}</a>`
    );
  };
  navAdd();
  function decorateTopbar() {
    const tb = document.querySelector('#app .topbar');
    if (!tb || tb.querySelector('[data-xjoin]')) return;
    const sur = tb.querySelector('[data-surprise]');
    if (sur)
      sur.insertAdjacentHTML(
        'beforebegin',
        `<button class="qbtn" data-xjoin title="${tr('Juntar a uma sessão')}">${XI.people}<span>${tr('Ver em conjunto')}</span></button>`
      );
  }
  hooks.on('view:home', async () => {
    const rows = $('#rows');
    if (!rows) return;
    recommendations()
      .then(rec => {
        if (!rec.length || !$('#rows')) return;
        const h = rowHTML(tr('Recomendado para ti'), rec.map(card).join(''), 'com base no que vês e avalias').replace(
          '<section class="row"',
          '<section class="row xrec"'
        );
        const libs = [...rows.querySelectorAll('.row')].filter(r =>
          /Continuar a ver|A tua biblioteca|Continuar assistindo|Sua biblioteca|Continue watching|Your library|Seguir viendo|Tu biblioteca/.test(
            r.querySelector('h2')?.textContent || ''
          )
        );
        const after = libs[libs.length - 1];
        if (after) after.insertAdjacentHTML('afterend', h);
        else rows.insertAdjacentHTML('afterbegin', h);
      })
      .catch(() => {});
    upcoming()
      .then(items => {
        const recent = items.filter(x => x.d <= Date.now() && x.d > Date.now() - 7 * 864e5).reverse();
        if (!recent.length || !$('#rows')) return;
        const seenIds = new Set();
        const cards = recent
          .filter(x => !seenIds.has(x.m.id) && seenIds.add(x.m.id))
          .map(x => card(Object.assign({}, x.m, { releaseInfo: epLabel(x.v) })))
          .join('');
        rows.insertAdjacentHTML('afterbegin', rowHTML(tr('Novos episódios'), cards, 'das tuas séries, últimos 7 dias'));
      })
      .catch(() => {});
  });
  hooks.on('view:library', () => {
    const pad = document.querySelector('#app .pad');
    if (!pad) return;
    pad.insertAdjacentHTML(
      'afterbegin',
      `<div class="inrow" style="margin-bottom:18px"><a class="btn sm gho" href="#calendar">${XI.cal}${tr('Calendário')}</a><a class="btn sm gho" href="#stats">${XI.stats}${tr('Estatísticas')}</a></div>` +
        listsSection()
    );
    pad.querySelector('[data-xnewlist]').onclick = () =>
      openModal(
        `<h3>${tr('Nova lista')}</h3><form id="xN"><input class="inp" name="n" placeholder="Ex.: Para ver no fim de semana" maxlength="40" required><div class="inrow"><button class="btn acc">Criar</button><button class="btn gho" type="button" data-close-modal>${tr('Cancelar')}</button></div></form>`,
        m =>
          (m.querySelector('#xN').onsubmit = e => {
            e.preventDefault();
            lists().push({
              id: 'l' + Date.now().toString(36),
              name: e.target.n.value.trim(),
              items: [],
              updated: Date.now()
            });
            save();
            closeModal();
            VIEWS.library();
          })
      );
    pad.querySelectorAll('[data-xopen]').forEach(
      b =>
        (b.onclick = () => {
          VIEWS._list = b.dataset.xopen;
          if (location.hash === '#list') route();
          else location.hash = 'list';
        })
    );
  });
  hooks.on('view:settings', () => {
    const pad = document.querySelector('#app .pad');
    if (!pad) return;
    pad.insertAdjacentHTML(
      'afterbegin',
      accountPanel() +
        `<div class="panel"><h3>${tr('Idioma da app')}</h3><p class="m">Os títulos e as sinopses vêm do catálogo e podem continuar em inglês.</p><select class="sel" id="xLang">${Object.entries(
          LANGS
        )
          .map(([k, n]) => `<option value="${k}" ${(S.prefs.lang || 'pt-PT') === k ? 'selected' : ''}>${n}</option>`)
          .join('')}</select></div>
    <div class="panel"><h3>${tr('Notificações')}</h3><p class="m">Avisa quando sai um episódio novo de uma série da tua biblioteca.</p><div class="srow"><div class="tx"><b>Avisos de novos episódios</b><small>${'Notification' in window ? 'Também no sistema (quando permitido)' : 'Aparecem dentro da app'}</small></div><button class="tg ${S.prefs.notify ? 'on' : ''}" id="xNotify"></button></div></div>`
    );
    $('#xLang').onchange = e => {
      S.prefs.lang = e.target.value;
      save();
      location.reload();
    };
    $('#xNotify').onclick = async function () {
      S.prefs.notify = !S.prefs.notify;
      if (S.prefs.notify && 'Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {}
      }
      save();
      this.classList.toggle('on', S.prefs.notify);
    };
    const L = $('#xLogin'),
      R = $('#xReg'),
      Y = $('#xSync'),
      O = $('#xOut');
    // o ecrã de entrada completo (com Google); se não existir, o diálogo de email
    if (L) L.onclick = () => (window.vvShowLogin ? window.vvShowLogin() : authDialog('login'));
    if (R) R.onclick = () => authDialog('register');
    if (Y) Y.onclick = () => syncNow(true);
    if (O)
      O.onclick = () => {
        auth.token = null;
        auth.email = null;
        auth.last = 0;
        saveAuth();
        toast('Sessão terminada');
        VIEWS.settings();
      };
  });
  document.addEventListener(
    'click',
    e => {
      if (e.target.closest('[data-xjoin]')) joinDialog();
    },
    true
  );
  function afterRoute() {
    navAdd();
    decorateTopbar();
    setTimeout(decorateTopbar, 50);
    document
      .querySelectorAll('.nv')
      .forEach(a => a.classList.toggle('on', a.dataset.v === (location.hash.slice(1) || 'home')));
  }
  // #lista=… abre uma lista que alguém partilhou
  hooks.on('route:done', hash => {
    if (hash.startsWith('lista=')) showSharedList(hash.slice(6));
    afterRoute();
  });

  /* =================== arranque =================== */
  applyLang();
  hooks.on('boot', () => {
    if (auth.token) syncNow(false);
    setTimeout(() => checkNewEpisodes().catch(() => {}), 7000);
    setInterval(
      () => {
        if (auth.token && !document.hidden && !watching()) syncNow(false);
      },
      5 * 60 * 1000
    );
  });
})();
