import { NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "430151fb1a55438c4c2bcbdaa68f5cc6";
const JIKAN_BASE = "https://api.jikan.moe/v4";

// Cache
const resolveCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 300_000; // 5 minutes

interface ServerInfo {
  id: string;
  name: string;
  url: string;
  type: "iframe";
}

/**
 * GET /api/anime/watch?mal_id=123&episode=1&season=1&tmdb_id=456
 *
 * Returns streaming server URLs for an anime episode.
 * If tmdb_id is provided, uses TMDB-based embed URLs.
 * If not, attempts to resolve MAL ID → TMDB ID, then falls back to MAL-based URLs.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const malId = parseInt(searchParams.get("mal_id") || "", 10);
    const episode = parseInt(searchParams.get("episode") || "1", 10);
    const season = parseInt(searchParams.get("season") || "1", 10);
    const tmdbIdParam = searchParams.get("tmdb_id");
    const tmdbId = tmdbIdParam ? parseInt(tmdbIdParam, 10) : null;

    if (!malId || isNaN(malId)) {
      return NextResponse.json(
        { error: "mal_id is required" },
        { status: 400 }
      );
    }

    const safeEpisode = Math.max(1, episode);
    const safeSeason = Math.max(1, season);

    // If TMDB ID is already known, build URLs directly
    if (tmdbId && !isNaN(tmdbId)) {
      const servers = buildTmdbServers(tmdbId, safeSeason, safeEpisode);
      return NextResponse.json({
        mal_id: malId,
        tmdb_id: tmdbId,
        episode: safeEpisode,
        season: safeSeason,
        servers,
      });
    }

    // Try to resolve MAL ID → TMDB ID
    const resolvedTmdbId = await resolveMalToTmdb(malId);

    if (resolvedTmdbId) {
      const servers = buildTmdbServers(resolvedTmdbId, safeSeason, safeEpisode);
      return NextResponse.json({
        mal_id: malId,
        tmdb_id: resolvedTmdbId,
        episode: safeEpisode,
        season: safeSeason,
        servers,
      });
    }

    // Fallback: use MAL-based URLs
    const servers = buildFallbackServers(malId, safeSeason, safeEpisode);
    return NextResponse.json({
      mal_id: malId,
      tmdb_id: null,
      episode: safeEpisode,
      season: safeSeason,
      servers,
      fallback: true,
    });
  } catch (error) {
    console.error("[Anime Watch] Error:", error);
    return NextResponse.json(
      { error: "Failed to get streaming URLs" },
      { status: 500 }
    );
  }
}

function buildTmdbServers(tmdbId: number, season: number, episode: number): ServerInfo[] {
  return [
    {
      id: "server-1",
      name: "Flux Stream",
      url: `https://vidsrc.to/embed/series/${tmdbId}/${season}/${episode}`,
      type: "iframe",
    },
    {
      id: "server-2",
      name: "Server 2",
      url: `https://vidsrc.me/embed/tv/${tmdbId}/${season}/${episode}`,
      type: "iframe",
    },
    {
      id: "server-3",
      name: "Server 3",
      url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
      type: "iframe",
    },
    {
      id: "server-4",
      name: "Server 4",
      url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
      type: "iframe",
    },
    {
      id: "server-5",
      name: "Server 5",
      url: `https://vidsrc.cc/embed/tv/${tmdbId}/${season}/${episode}`,
      type: "iframe",
    },
  ];
}

function buildFallbackServers(malId: number, season: number, episode: number): ServerInfo[] {
  return [
    {
      id: "server-1",
      name: "Flux Stream",
      url: `https://vidsrc.to/embed/series/${malId}/${season}/${episode}`,
      type: "iframe",
    },
    {
      id: "server-2",
      name: "Server 2",
      url: `https://vidsrc.me/embed/tv/${malId}/${season}/${episode}`,
      type: "iframe",
    },
    {
      id: "server-3",
      name: "Server 3",
      url: `https://embed.su/embed/tv/${malId}/${season}/${episode}`,
      type: "iframe",
    },
    {
      id: "server-4",
      name: "Server 4",
      url: `https://multiembed.mov/?video_id=${malId}&tmdb=1&s=${season}&e=${episode}`,
      type: "iframe",
    },
    {
      id: "server-5",
      name: "Server 5",
      url: `https://vidsrc.cc/embed/tv/${malId}/${season}/${episode}`,
      type: "iframe",
    },
  ];
}

/**
 * Resolve a MAL ID to a TMDB ID by searching TMDB for the anime.
 * Uses Jikan to get the title, then searches TMDB with Japanese filters.
 */
async function resolveMalToTmdb(malId: number): Promise<number | null> {
  // Check cache first
  const cacheKey = `watch-resolve-${malId}`;
  const cached = resolveCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const data = cached.data as { tmdb_id: number | null } | null;
    return data?.tmdb_id || null;
  }

  try {
    // Fetch anime info from Jikan
    const jikanRes = await fetch(`${JIKAN_BASE}/anime/${malId}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!jikanRes.ok) return null;

    const jikanJson = await jikanRes.json();
    const animeData = jikanJson.data;
    if (!animeData) return null;

    const titles: string[] = [];
    if (animeData.titles) {
      for (const t of animeData.titles) {
        if (t.title && !titles.includes(t.title)) {
          titles.push(t.title);
        }
      }
    }
    if (!titles.length) return null;

    const year = animeData.aired?.prop?.from?.year || animeData.year || 0;

    // Search TMDB
    for (const searchTitle of titles.slice(0, 3)) {
      try {
        const params = new URLSearchParams();
        params.set("query", searchTitle);
        params.set("api_key", TMDB_API_KEY);
        params.set("language", "en-US");
        params.set("include_adult", "false");
        params.set("with_original_language", "ja");
        params.set("with_genres", "16");
        if (year > 0) {
          params.set("first_air_date_year", String(year));
        }

        const searchRes = await fetch(`${TMDB_BASE}/search/tv?${params}`, {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 },
        });

        if (!searchRes.ok) continue;

        const searchData = await searchRes.json();
        const results = searchData.results || [];

        if (results.length > 0) {
          const tmdbId = results[0].id;
          resolveCache.set(cacheKey, { data: { tmdb_id: tmdbId }, timestamp: Date.now() });
          return tmdbId;
        }

        await new Promise((r) => setTimeout(r, 350));
      } catch {
        continue;
      }
    }
  } catch {
    // silent
  }

  resolveCache.set(cacheKey, { data: { tmdb_id: null }, timestamp: Date.now() });
  return null;
}
