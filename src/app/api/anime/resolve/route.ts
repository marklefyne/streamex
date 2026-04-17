import { NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "430151fb1a55438c4c2bcbdaa68f5cc6";

// Cache to avoid repeated TMDB searches
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 300_000; // 5 minutes

interface ResolveRequest {
  mal_id: number;
  title: string;
  year?: number;
  episodes?: number;
}

export async function POST(request: Request) {
  try {
    const body: ResolveRequest = await request.json();
    const { mal_id, title, year, episodes } = body;

    if (!title || !mal_id) {
      return NextResponse.json(
        { error: "title and mal_id are required" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `resolve-${mal_id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data as object);
    }

    // Search TMDB for the anime
    const searchUrl = `${TMDB_BASE}/search/tv?query=${encodeURIComponent(title)}&api_key=${TMDB_API_KEY}&language=en-US&page=1&include_adult=false`;
    const searchRes = await fetch(searchUrl, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 },
    });

    if (!searchRes.ok) {
      console.error("[Anime Resolve] TMDB search failed:", searchRes.status);
      return NextResponse.json(
        { error: "TMDB search failed" },
        { status: 500 }
      );
    }

    const searchData = await searchRes.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      // Try with Japanese-style title (remove English words)
      const altUrl = `${TMDB_BASE}/search/tv?query=${encodeURIComponent(title.replace(/\s*\(.*?\)\s*/g, "").trim())}&api_key=${TMDB_API_KEY}&language=en-US&page=1`;
      const altRes = await fetch(altUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });
      if (altRes.ok) {
        const altData = await altRes.json();
        const altResults = altData.results || [];
        if (altResults.length === 0) {
          return NextResponse.json({ error: "No TMDB match found", tmdb_id: null });
        }
        const bestMatch = findBestMatch(altResults, title, year, episodes);
        const response = buildResponse(bestMatch, mal_id);
        cache.set(cacheKey, { data: response, timestamp: Date.now() });
        return NextResponse.json(response);
      }
      return NextResponse.json({ error: "No TMDB match found", tmdb_id: null });
    }

    // Find best match
    const bestMatch = findBestMatch(results, title, year, episodes);
    const response = buildResponse(bestMatch, mal_id);

    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[Anime Resolve] Error:", error);
    return NextResponse.json(
      { error: "Failed to resolve anime" },
      { status: 500 }
    );
  }
}

function findBestMatch(
  results: any[],
  title: string,
  year?: number,
  episodes?: number
): any {
  // Score each result
  const scored = results.map((item: any) => {
    let score = 0;
    const itemTitle = (item.name || "").toLowerCase();
    const origTitle = (item.original_name || "").toLowerCase();
    const searchTitle = title.toLowerCase();

    // Exact title match
    if (itemTitle === searchTitle || origTitle === searchTitle) score += 50;

    // Contains match
    if (itemTitle.includes(searchTitle) || searchTitle.includes(itemTitle)) score += 30;
    if (origTitle.includes(searchTitle) || searchTitle.includes(origTitle)) score += 30;

    // Year match
    const itemYear = item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : 0;
    if (year && itemYear && Math.abs(year - itemYear) <= 1) score += 20;
    if (year && itemYear && year === itemYear) score += 10; // Extra for exact year

    // Genre: anime-related keywords boost score
    const genreIds = item.genre_ids || [];
    if (genreIds.includes(16)) score += 15; // Animation genre

    // Vote count boost (popular = more likely correct)
    score += Math.min(item.vote_count || 0, 50);

    // Episode count bonus
    if (episodes && item.number_of_episodes && Math.abs(episodes - item.number_of_episodes) <= 2) {
      score += 10;
    }

    // Origin country: Japan boost
    if (item.origin_country?.includes("JP")) score += 15;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item || results[0];
}

function buildResponse(tmdbItem: any, malId: number) {
  const seasons = tmdbItem.seasons?.length || 1;
  const seasonEpisodes: Record<number, number> = {};
  const tmdbSeasons = tmdbItem.seasons || [];

  for (const s of tmdbSeasons) {
    if (s.season_number && s.season_number > 0) {
      seasonEpisodes[s.season_number] = s.episode_count || 0;
    }
  }

  return {
    tmdb_id: tmdbItem.id,
    mal_id: malId,
    title: tmdbItem.name || "Unknown",
    original_title: tmdbItem.original_name || "",
    description: tmdbItem.overview || "",
    posterImage: tmdbItem.poster_path
      ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}`
      : "",
    backdropImage: tmdbItem.backdrop_path
      ? `https://image.tmdb.org/t/p/original${tmdbItem.backdrop_path}`
      : "",
    rating: tmdbItem.vote_average ? Math.round(tmdbItem.vote_average * 10) / 10 : 0,
    year: tmdbItem.first_air_date ? parseInt(tmdbItem.first_air_date.substring(0, 4)) : 0,
    type: "TV Series",
    genres: [],
    numberOfSeasons: seasons,
    numberOfEpisodes: tmdbItem.number_of_episodes || 0,
    seasonEpisodes,
  };
}
