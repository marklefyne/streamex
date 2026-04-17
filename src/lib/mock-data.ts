// Live media item interface (used with TMDB data)
export interface LiveMediaItem {
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
}

// Legacy mock data interface (backward compat)
export interface MediaItem {
  id: string;
  title: string;
  year: number;
  type: "Movie" | "TV Series" | "Documentary" | "Anime";
  rating: number;
  genres: string[];
  description: string;
  posterGradient: string;
  posterImage?: string;
  runtime?: string;
  seasons?: number;
  tmdb_id: number;
}

/** Build an embed URL for a given media item and server. */
export function getEmbedUrl(
  tmdbId: number,
  mediaType: "movie" | "tv",
  serverId: string,
  season?: number,
  episode?: number
): string {
  const s = season ?? 1;
  const e = episode ?? 1;

  switch (serverId) {
    // Server 1: vidsrc.me → redirects to vidsrcme.ru (most reliable)
    case "vidsrc-me":
      return mediaType === "movie"
        ? `https://vidsrc.me/embed/movie/${tmdbId}`
        : `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 2: moviesapi.to (shows correct title)
    case "moviesapi":
      return mediaType === "movie"
        ? `https://moviesapi.to/movie/${tmdbId}`
        : `https://moviesapi.to/tv/${tmdbId}-${s}-${e}`;

    // Server 3: vidsrc.pm (proxy-based player)
    case "vidsrc-pm":
      return mediaType === "movie"
        ? `https://vidsrc.pm/embed/movie/${tmdbId}`
        : `https://vidsrc.pm/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 4: vidsrc.dev
    case "vidsrc-dev":
      return mediaType === "movie"
        ? `https://vidsrc.dev/embed/movie/${tmdbId}`
        : `https://vidsrc.dev/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 5: vidsrc.to (may 403 in some regions)
    case "vidsrc-to":
      return mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 6: autoembed (fallback)
    case "autoembed":
      return mediaType === "movie"
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;

    default:
      return mediaType === "movie"
        ? `https://vidsrc.me/embed/movie/${tmdbId}`
        : `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`;
  }
}

export interface ServerOption {
  id: string;
  name: string;
  description: string;
}

export const SERVERS: ServerOption[] = [
  { id: "vidsrc-me", name: "Server 1", description: "VidSrc.me" },
  { id: "moviesapi", name: "Server 2", description: "MoviesAPI" },
  { id: "vidsrc-pm", name: "Server 3", description: "VidSrc.pm" },
  { id: "vidsrc-dev", name: "Server 4", description: "VidSrc.dev" },
  { id: "vidsrc-to", name: "Server 5", description: "VidSrc.to" },
  { id: "autoembed", name: "Server 6", description: "AutoEmbed" },
];
