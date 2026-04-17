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
    case "vidsrc":
      return mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`;
    case "vidsrc2":
      return mediaType === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`;
    case "autoembed":
      return mediaType === "movie"
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;
    case "movieapi":
      return mediaType === "movie"
        ? `https://moviesapi.club/movie/${tmdbId}`
        : `https://moviesapi.club/tv/${tmdbId}-${s}-${e}`;
    case "vidsrcxyz":
      return mediaType === "movie"
        ? `https://vidsrc.xyz/embed/movie/${tmdbId}`
        : `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`;
    case "embedsu":
      return mediaType === "movie"
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`;
    default:
      return mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`;
  }
}

export interface ServerOption {
  id: string;
  name: string;
  description: string;
}

export const SERVERS: ServerOption[] = [
  { id: "vidsrc", name: "Server 1", description: "VidSrc" },
  { id: "vidsrc2", name: "Server 2", description: "VidSrc CC" },
  { id: "autoembed", name: "Server 3", description: "AutoEmbed" },
  { id: "movieapi", name: "Server 4", description: "MoviesAPI" },
  { id: "vidsrcxyz", name: "Server 5", description: "VidSrc XYZ" },
  { id: "embedsu", name: "Server 6", description: "Embed.su" },
];
