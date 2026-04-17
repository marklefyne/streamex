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
    // Primary providers
    case "vidsrc-to":
      return mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`;
    case "vidsrc-me":
      return mediaType === "movie"
        ? `https://vidsrc.me/embed/movie/${tmdbId}`
        : `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`;
    case "2embed":
      return mediaType === "movie"
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embed/${tmdbId}/${s}/${e}`;
    // Backup providers
    case "vidsrc-cc":
      return mediaType === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`;
    case "autoembed":
      return mediaType === "movie"
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;
    case "embed-su":
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
  { id: "vidsrc-to", name: "Server 1", description: "VidSrc.to" },
  { id: "vidsrc-me", name: "Server 2", description: "VidSrc.me" },
  { id: "2embed", name: "Server 3", description: "2Embed.cc" },
  { id: "vidsrc-cc", name: "Server 4", description: "VidSrc.cc" },
  { id: "autoembed", name: "Server 5", description: "AutoEmbed" },
  { id: "embed-su", name: "Server 6", description: "Embed.su" },
];
