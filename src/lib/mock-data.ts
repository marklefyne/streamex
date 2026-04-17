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
  numberOfEpisodes?: number;
  seasonEpisodes?: Record<number, number>;
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
  seasonEpisodes?: Record<number, number>;
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
    // Server 1: vidsrc.icu (reliable, TMDB-based, has subtitles)
    case "vidsrc-icu":
      return mediaType === "movie"
        ? `https://vidsrc.icu/embed/movie/${tmdbId}`
        : `https://vidsrc.icu/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 2: vidsrc.xyz (reliable, fast)
    case "vidsrc-xyz":
      return mediaType === "movie"
        ? `https://vidsrc.xyz/embed/movie/${tmdbId}`
        : `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 3: embed.su (reliable, built-in subtitle support)
    case "embed-su":
      return mediaType === "movie"
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 4: vidsrc.rip
    case "vidsrc-rip":
      return mediaType === "movie"
        ? `https://vidsrc.rip/embed/movie/${tmdbId}`
        : `https://vidsrc.rip/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 5: vidsrc.in
    case "vidsrc-in":
      return mediaType === "movie"
        ? `https://vidsrc.in/embed/movie/${tmdbId}`
        : `https://vidsrc.in/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 6: autoembed (fallback)
    case "autoembed":
      return mediaType === "movie"
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 7: vidsrc.la (extra fallback)
    case "vidsrc-la":
      return mediaType === "movie"
        ? `https://vidsrc.la/embed/movie/${tmdbId}`
        : `https://vidsrc.la/embed/tv/${tmdbId}/${s}/${e}`;

    // Server 8: vidsrc.cc (extra fallback)
    case "vidsrc-cc":
      return mediaType === "movie"
        ? `https://vidsrc.cc/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/embed/tv/${tmdbId}/${s}/${e}`;

    default:
      return mediaType === "movie"
        ? `https://vidsrc.icu/embed/movie/${tmdbId}`
        : `https://vidsrc.icu/embed/tv/${tmdbId}/${s}/${e}`;
  }
}

export interface ServerOption {
  id: string;
  name: string;
  description: string;
  hasSubtitles?: boolean;
}

export const SERVERS: ServerOption[] = [
  { id: "vidsrc-icu", name: "Server 1", description: "VidSrc.icu", hasSubtitles: true },
  { id: "vidsrc-xyz", name: "Server 2", description: "VidSrc.xyz" },
  { id: "embed-su", name: "Server 3", description: "Embed.su", hasSubtitles: true },
  { id: "vidsrc-rip", name: "Server 4", description: "VidSrc.rip" },
  { id: "vidsrc-in", name: "Server 5", description: "VidSrc.in" },
  { id: "autoembed", name: "Server 6", description: "AutoEmbed" },
  { id: "vidsrc-la", name: "Server 7", description: "VidSrc.la" },
  { id: "vidsrc-cc", name: "Server 8", description: "VidSrc.cc" },
];
