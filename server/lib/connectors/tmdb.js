// Conector de metadados TMDB. Requer TMDB_READ_ACCESS_TOKEN ou TMDB_API_KEY.
const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const cache = new Map();
const TTL = 5 * 60 * 1000;

const cacheGet = key => {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  cache.delete(key);
  return null;
};
const cacheSet = (key, value) => {
  cache.set(key, { value, until: Date.now() + TTL });
  if (cache.size > 250) cache.delete(cache.keys().next().value);
  return value;
};

async function tmdb(path, params = {}) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const key = process.env.TMDB_API_KEY;
  if (!token && !key) throw new Error("Falta configurar TMDB_READ_ACCESS_TOKEN ou TMDB_API_KEY");
  const url = new URL(API + path);
  for (const [k, v] of Object.entries({ language: "pt-PT", ...params })) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  if (!token) url.searchParams.set("api_key", key);
  const cacheKey = url.toString();
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const response = await fetch(cacheKey, {
    headers: token ? { Authorization: `Bearer ${token}`, accept: "application/json" } : { accept: "application/json" },
    signal: AbortSignal.timeout(4000)
  });
  if (!response.ok) throw new Error(`TMDB respondeu HTTP ${response.status}`);
  return cacheSet(cacheKey, await response.json());
}

const isMovie = type => type === "movie";
const tmdbType = type => isMovie(type) ? "movie" : "tv";
const itemName = item => item.title || item.name || "";
const itemDate = item => item.release_date || item.first_air_date || "";
const image = (path, size) => path ? `${IMG}/${size}${path}` : undefined;
const toMeta = (item, type) => ({
  id: `tmdb:${type}:${item.id}`,
  type,
  name: itemName(item),
  ...(image(item.poster_path, "w500") ? { poster: image(item.poster_path, "w500") } : {}),
  ...(image(item.backdrop_path, "w1280") ? { background: image(item.backdrop_path, "w1280") } : {}),
  ...(item.overview ? { description: item.overview } : {}),
  ...(itemDate(item) ? { releaseInfo: itemDate(item).slice(0, 4) } : {}),
  ...(Array.isArray(item.genre_ids) ? { genres: item.genre_ids.map(String) } : {}),
  ...(item.vote_average ? { imdbRating: Number(item.vote_average).toFixed(1) } : {})
});

const catalogs = [
  { id: "movie-trending", name: "Filmes em tendência", types: ["movie"] },
  { id: "movie-popular", name: "Filmes populares", types: ["movie"] },
  { id: "movie-search", name: "Pesquisar filmes", types: ["movie"], extra: [{ name: "search", isRequired: true }] },
  { id: "movie-animation", name: "Animação", types: ["movie"] },
  { id: "movie-documentary", name: "Documentários", types: ["movie"] },
  { id: "movie-family", name: "Filmes para a família", types: ["movie"] },
  { id: "series-trending", name: "Séries em tendência", types: ["series"] },
  { id: "series-popular", name: "Séries populares", types: ["series"] },
  { id: "series-search", name: "Pesquisar séries", types: ["series"], extra: [{ name: "search", isRequired: true }] },
  { id: "series-anime", name: "Anime", types: ["series"] },
  { id: "series-documentary", name: "Documentários", types: ["series"] },
  { id: "series-kids", name: "Conteúdo infantil", types: ["series"] }
];

const DISCOVERY = {
  "movie-animation": { with_genres: 16 },
  "movie-documentary": { with_genres: 99 },
  "movie-family": { with_genres: 10751 },
  "series-anime": { with_genres: 16, with_original_language: "ja" },
  "series-documentary": { with_genres: 99 },
  "series-kids": { with_genres: 10762 }
};

async function getCatalog({ type, catalog, extra = {} }) {
  const tv = tmdbType(type);
  const search = String(extra.search || "").trim().slice(0, 100);
  const skip = Number(extra.skip || 0);
  const page = Number.isFinite(skip) && skip >= 0 ? Math.max(1, Math.min(50, Math.floor(skip / 20) + 1)) : 1;
  let path, params = { page };
  if (catalog.endsWith("-search")) {
    if (!search) return [];
    path = `/search/${tv}`;
    params = { ...params, query: search, include_adult: false, region: "PT" };
  } else if (catalog.endsWith("-trending")) {
    path = `/trending/${tv}/week`;
  } else if (DISCOVERY[catalog]) {
    path = `/discover/${tv}`;
    params = {
      ...params,
      ...DISCOVERY[catalog],
      sort_by: "popularity.desc",
      include_adult: false,
      region: "PT"
    };
  } else {
    path = `/${tv}/popular`;
    params.region = "PT";
  }
  const data = await tmdb(path, params);
  return (data.results || []).map(item => toMeta(item, type)).filter(item => item.name);
}

function parseId(id, expectedType) {
  const match = /^tmdb:(movie|series):(\d+)$/.exec(String(id || ""));
  if (!match || match[1] !== expectedType) return null;
  return match[2];
}

async function getMeta({ type, id }) {
  const numericId = parseId(id, type);
  if (!numericId) return null;
  const tv = tmdbType(type);
  const data = await tmdb(`/${tv}/${numericId}`, {
    append_to_response: "credits,external_ids,videos",
    region: "PT"
  });
  const credits = data.credits || {};
  const base = toMeta(data, type);
  const videos = (data.videos?.results || []).filter(v => v.site === "YouTube" && v.type === "Trailer");
  const meta = {
    ...base,
    ...(data.imdb_id || data.external_ids?.imdb_id ? { imdb_id: data.imdb_id || data.external_ids.imdb_id } : {}),
    ...(data.genres?.length ? { genres: data.genres.map(g => g.name) } : {}),
    ...(credits.cast?.length ? { cast: credits.cast.slice(0, 12).map(p => p.name) } : {}),
    ...(credits.crew?.some(p => p.job === "Director") ? { director: credits.crew.filter(p => p.job === "Director").map(p => p.name) } : {}),
    ...(data.runtime ? { runtime: `${data.runtime} min` } : data.episode_run_time?.[0] ? { runtime: `${data.episode_run_time[0]} min` } : {}),
    ...(videos.length ? { trailerStreams: videos.slice(0, 3).map(v => ({ ytId: v.key, title: v.name })) } : {})
  };
  if (type === "series" && Array.isArray(data.seasons)) {
    meta.videos = [];
    const seasons = data.seasons.filter(s => s.season_number > 0).slice(0, 20);
    // Cada chamada tem timeout individual; 20 temporadas em paralelo mantêm
    // a ficha dentro do limite normal da função serverless.
    const results = await Promise.allSettled(seasons.map(season =>
      tmdb(`/tv/${numericId}/season/${season.season_number}`)
    ));
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const ep of result.value.episodes || []) {
        meta.videos.push({
          id: `${id}:${ep.season_number}:${ep.episode_number}`,
          title: ep.name || `Episódio ${ep.episode_number}`,
          season: ep.season_number,
          episode: ep.episode_number,
          ...(ep.air_date ? { released: ep.air_date } : {}),
          ...(ep.overview ? { overview: ep.overview } : {}),
          ...(image(ep.still_path, "w500") ? { thumbnail: image(ep.still_path, "w500") } : {}),
          ...(ep.runtime ? { runtime: ep.runtime * 60 } : {})
        });
      }
    }
  }
  return meta;
}

export const tmdbConnector = {
  id: "tmdb",
  catalogs,
  getCatalog,
  getMeta,
  health: async () => Boolean(process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY)
};
