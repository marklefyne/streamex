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
    // VidSrc.me — uses TMDB path params, most widely supported
    case "vidsrc-me":
      return mediaType === "movie"
        ? `https://vidsrc.me/embed/movie/${tmdbId}`
        : `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`;

    // VidSrc.to — uses TMDB path params, subtitle support built-in
    case "vidsrc-to":
      return mediaType === "movie"
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`;

    // 2Embed.cc — uses TMDB path params, fast and reliable
    case "2embed-cc":
      return mediaType === "movie"
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embed/${tmdbId}/${s}/${e}`;

    // Embed.su — uses TMDB path params, subtitle support
    case "embed-su":
      return mediaType === "movie"
        ? `https://embed.su/embed/movie/${tmdbId}`
        : `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`;

    // SuperEmbed.stream (multiembed.mov) — uses TMDB query params, multi-source
    case "superembed":
      return mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;

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
  hasSubtitles?: boolean;
  tier: "primary" | "fallback";
}

export const SERVERS: ServerOption[] = [
  { id: "vidsrc-me",   name: "VidSrc",       description: "vidsrc.me",       tier: "primary" },
  { id: "vidsrc-to",   name: "VidSrc",       description: "vidsrc.to",       hasSubtitles: true, tier: "primary" },
  { id: "2embed-cc",   name: "2Embed",       description: "2embed.cc",       tier: "primary" },
  { id: "embed-su",    name: "Embed",        description: "embed.su",        hasSubtitles: true, tier: "primary" },
  { id: "superembed",  name: "SuperEmbed",   description: "superembed.stream", tier: "fallback" },
];
