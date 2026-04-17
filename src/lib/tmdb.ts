const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: "movie" | "tv";
  popularity: number;
  adult: boolean;
  original_language: string;
  original_title?: string;
  original_name?: string;
  number_of_seasons?: number;
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

// Genre name cache - populated on first use
let genreCache: Map<number, string> | null = null;
let genreFetchPromise: Promise<Map<number, string>> | null = null;

async function ensureGenreCache(): Promise<Map<number, string>> {
  if (genreCache) return genreCache;
  if (genreFetchPromise) return genreFetchPromise;

  genreFetchPromise = (async () => {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        tmdbFetch<{ genres: TMDBGenre[] }>("/genre/movie/list"),
        tmdbFetch<{ genres: TMDBGenre[] }>("/genre/tv/list"),
      ]);
      const map = new Map<number, string>();
      for (const g of [...movieGenres.genres, ...tvGenres.genres]) {
        if (!map.has(g.id)) map.set(g.id, g.name);
      }
      genreCache = map;
      return map;
    } catch {
      return new Map();
    }
  })();

  return genreFetchPromise;
}

/** Resolve genre IDs to human-readable names */
async function resolveGenreNames(
  genreIds: number[] | undefined,
  genreObjects: { id: number; name: string }[] | undefined
): Promise<string[]> {
  // If we already have genre objects, use them directly
  if (genreObjects && genreObjects.length > 0) {
    return genreObjects.map((g) => g.name).slice(0, 4);
  }

  // Resolve IDs to names using cache
  if (genreIds && genreIds.length > 0) {
    const cache = await ensureGenreCache();
    const names = genreIds
      .map((id) => cache.get(id))
      .filter(Boolean) as string[];
    return names.slice(0, 4);
  }

  return [];
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getTrending(mediaType: string = "all", timeWindow: string = "week"): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>(`/trending/${mediaType}/${timeWindow}`);
  return data.results.filter((item) => item.poster_path);
}

export async function getTopRated(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/movie/top_rated", { page: String(page) });
  return data.results.filter((item) => item.poster_path);
}

export async function getNowPlaying(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/movie/now_playing", { page: String(page) });
  return data.results.filter((item) => item.poster_path);
}

export async function getUpcoming(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/movie/upcoming", { page: String(page) });
  return data.results.filter((item) => item.poster_path);
}

export async function getPopularTV(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/tv/popular", { page: String(page) });
  return data.results.filter((item) => item.poster_path);
}

export async function getTopRatedTV(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/tv/top_rated", { page: String(page) });
  return data.results.filter((item) => item.poster_path);
}

export async function getAiringTodayTV(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/tv/airing_today", { page: String(page) });
  return data.results.filter((item) => item.poster_path);
}

export async function searchMulti(query: string, page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/search/multi", {
    query,
    page: String(page),
  });
  return data.results.filter((item) => item.poster_path && (item.media_type === "movie" || item.media_type === "tv"));
}

export async function searchMovies(query: string, page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/search/movie", {
    query,
    page: String(page),
  });
  return data.results.filter((item) => item.poster_path);
}

export async function searchTV(query: string, page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>("/search/tv", {
    query,
    page: String(page),
  });
  return data.results.filter((item) => item.poster_path);
}

export async function getGenres(): Promise<TMDBGenre[]> {
  const [movieGenres, tvGenres] = await Promise.all([
    tmdbFetch<{ genres: TMDBGenre[] }>("/genre/movie/list"),
    tmdbFetch<{ genres: TMDBGenre[] }>("/genre/tv/list"),
  ]);
  const allGenres = new Map<number, TMDBGenre>();
  for (const g of [...movieGenres.genres, ...tvGenres.genres]) {
    if (!allGenres.has(g.id)) allGenres.set(g.id, g);
  }
  return Array.from(allGenres.values());
}

export async function getByGenre(genreId: number, mediaType: string = "movie", page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>(`/discover/${mediaType}`, {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
    page: String(page),
  });
  return data.results.filter((item) => item.poster_path);
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovie> {
  return tmdbFetch<TMDBMovie>(`/movie/${movieId}`);
}

export async function getTVDetails(tvId: number): Promise<TMDBMovie> {
  return tmdbFetch<TMDBMovie>(`/tv/${tvId}`);
}

export async function getSimilarMovies(movieId: number): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>(`/movie/${movieId}/similar`);
  return data.results.filter((item) => item.poster_path).slice(0, 12);
}

export async function getSimilarTV(tvId: number): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<TMDBResponse>(`/tv/${tvId}/similar`);
  return data.results.filter((item) => item.poster_path).slice(0, 12);
}

export function getImageUrl(path: string | null, size: string = "w500"): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: string = "original"): string {
  if (!path) return "";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/** Convert a TMDB movie/show to our MediaItem format */
export async function toMediaItem(item: TMDBMovie): Promise<{
  id: string;
  tmdb_id: number;
  title: string;
  year: number;
  type: string;
  rating: number;
  genres: string[];
  description: string;
  posterImage: string;
  backdropImage: string;
  numberOfSeasons?: number;
}> {
  const title = item.title || item.name || "Unknown";
  const dateStr = item.release_date || item.first_air_date || "";
  const year = dateStr ? parseInt(dateStr.substring(0, 4)) : 0;
  const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
  const type = mediaType === "tv" ? "TV Series" : "Movie";
  const genres = await resolveGenreNames(item.genre_ids, item.genres);

  return {
    id: `${mediaType}-${item.id}`,
    tmdb_id: item.id,
    title,
    year,
    type,
    rating: Math.round(item.vote_average * 10) / 10,
    genres,
    description: item.overview || "No description available.",
    posterImage: getImageUrl(item.poster_path),
    backdropImage: getBackdropUrl(item.backdrop_path),
    ...(mediaType === "tv" && item.number_of_seasons ? { numberOfSeasons: item.number_of_seasons } : {}),
  };
}
