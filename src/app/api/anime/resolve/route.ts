import { NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = "430151fb1a55438c4c2bcbdaa68f5cc6";
const JIKAN_BASE = "https://api.jikan.moe/v4";

// Cache to avoid repeated lookups
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 300_000; // 5 minutes

interface ResolveRequest {
  mal_id: number;
  title: string;
  japanese_title?: string;
  year?: number;
  episodes?: number;
  studios?: string[];
}

export async function POST(request: Request) {
  try {
    const body: ResolveRequest = await request.json();
    const { mal_id, title, japanese_title, year, episodes, studios } = body;

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

    // Step 1: Fetch detailed info from Jikan to get all titles and metadata
    let jikanData: {
      titles: { type: string; title: string }[];
      episodes: number | null;
      aired: { prop: { from: { year: number | null } | null } | null } | null;
      studios: { name: string }[];
      genres: { mal_id: number; name: string }[];
    } | null = null;

    try {
      const jikanRes = await fetch(`${JIKAN_BASE}/anime/${mal_id}`, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });
      if (jikanRes.ok) {
        const jikanJson = await jikanRes.json();
        jikanData = jikanJson.data || null;
      }
    } catch {
      // Jikan detail fetch failed — continue with what we have
    }

    // Build list of titles to try (in priority order)
    const titleVariants: string[] = [];
    if (jikanData?.titles) {
      // Prefer English and Japanese titles from Jikan
      const sortedTitles = [...jikanData.titles].sort((a, b) => {
        const priority: Record<string, number> = {
          "English": 0, "Japanese": 1, "Default": 2,
        };
        return (priority[a.type] ?? 3) - (priority[b.type] ?? 3);
      });
      for (const t of sortedTitles) {
        if (t.title && !titleVariants.includes(t.title)) {
          titleVariants.push(t.title);
        }
      }
    }
    // Ensure the original title is included
    if (!titleVariants.includes(title)) titleVariants.push(title);
    if (japanese_title && !titleVariants.includes(japanese_title)) titleVariants.push(japanese_title);

    // Get more precise year from Jikan
    const preciseYear = jikanData?.aired?.prop?.from?.year || year || 0;
    const preciseEpisodes = jikanData?.episodes || episodes || 0;

    // Step 2: Search TMDB with strict filters
    const bestMatch = await findBestTmdbMatch(titleVariants, preciseYear, preciseEpisodes, studios || jikanData?.studios?.map((s) => s.name) || []);

    if (!bestMatch) {
      const response = { error: "No precise TMDB match found", tmdb_id: null, mal_id };
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return NextResponse.json(response);
    }

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

/**
 * Search TMDB with each title variant and find the best match.
 * Uses with_original_language=ja and first_air_date_year for precision.
 */
async function findBestTmdbMatch(
  titles: string[],
  year: number,
  episodes: number,
  studios: string[]
): Promise<any | null> {
  let bestResult: any = null;
  let bestScore = 0;

  for (const searchTitle of titles.slice(0, 5)) {
    try {
      const params = new URLSearchParams();
      params.set("query", searchTitle);
      params.set("api_key", TMDB_API_KEY);
      params.set("language", "en-US");
      params.set("page", "1");
      params.set("include_adult", "false");

      // CRITICAL: Filter for Japanese original language
      params.set("with_original_language", "ja");

      // Filter by year if we have one
      if (year > 0) {
        params.set("first_air_date_year", String(year));
      }

      // Filter by Animation genre (16)
      params.set("with_genres", "16");

      const searchUrl = `${TMDB_BASE}/search/tv?${params}`;
      const searchRes = await fetch(searchUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });

      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const results = searchData.results || [];

      for (const item of results) {
        const score = scoreTmdbResult(item, titles, year, episodes, studios);
        if (score > bestScore) {
          bestScore = score;
          bestResult = item;
        }
      }

      // If we got a very high confidence match, stop early
      if (bestScore >= 150) break;
    } catch {
      continue;
    }

    // Small delay between Jikan-compliant requests
    await new Promise((r) => setTimeout(r, 350));
  }

  // If we couldn't find with strict Japanese filter, try one more time without it
  if (!bestResult || bestScore < 60) {
    try {
      const params = new URLSearchParams();
      params.set("query", titles[0]);
      params.set("api_key", TMDB_API_KEY);
      params.set("language", "en-US");
      params.set("page", "1");
      params.set("include_adult", "false");
      if (year > 0) {
        params.set("first_air_date_year", String(year));
      }
      params.set("with_genres", "16");

      const searchUrl = `${TMDB_BASE}/search/tv?${params}`;
      const searchRes = await fetch(searchUrl, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = searchData.results || [];
        for (const item of results) {
          const score = scoreTmdbResult(item, titles, year, episodes, studios);
          if (score > bestScore) {
            bestScore = score;
            bestResult = item;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Reject low-confidence matches to prevent wrong content
  if (bestScore < 40) {
    console.log(`[Anime Resolve] Low confidence (${bestScore}) for "${titles[0]}", rejecting`);
    return null;
  }

  return bestResult;
}

/**
 * Score a TMDB result against our known anime data.
 * Much stricter scoring than before.
 */
function scoreTmdbResult(
  item: any,
  searchTitles: string[],
  year: number,
  episodes: number,
  studios: string[]
): number {
  let score = 0;

  const itemTitle = (item.name || "").toLowerCase().trim();
  const itemOriginalTitle = (item.original_name || "").toLowerCase().trim();
  const itemYear = item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : 0;
  const itemEpisodes = item.number_of_episodes || 0;
  const genreIds = item.genre_ids || [];
  const originCountries = item.origin_country || [];

  // Normalize title for comparison (remove special chars, lower case)
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizedItemTitle = normalize(itemTitle);
  const normalizedOriginalTitle = normalize(itemOriginalTitle);

  // Check against all search title variants
  for (const searchTitle of searchTitles) {
    const normalizedSearch = normalize(searchTitle);

    // EXACT match on either name field — very strong signal
    if (normalizedItemTitle === normalizedSearch) score += 100;
    if (normalizedOriginalTitle === normalizedSearch) score += 100;

    // Without special chars normalization
    if (normalize(itemTitle) === normalize(searchTitle)) score += 80;
    if (normalize(itemOriginalTitle) === normalize(searchTitle)) score += 80;

    // Contains match (title contains search or vice versa)
    if (normalizedItemTitle.includes(normalizedSearch) || normalizedSearch.includes(normalizedItemTitle)) score += 35;
    if (normalizedOriginalTitle.includes(normalizedSearch) || normalizedSearch.includes(normalizedOriginalTitle)) score += 35;
  }

  // Original language is Japanese (STRONG signal for anime)
  if (item.original_language === "ja") score += 30;

  // Origin country includes Japan
  if (originCountries.includes("JP")) score += 20;

  // Animation genre
  if (genreIds.includes(16)) score += 20;

  // Year match
  if (year > 0 && itemYear > 0) {
    if (year === itemYear) score += 25;
    else if (Math.abs(year - itemYear) === 1) score += 10;
    else score -= 20; // Penalize year mismatch
  }

  // Episode count match
  if (episodes > 0 && itemEpisodes > 0) {
    if (episodes === itemEpisodes) score += 15;
    else if (Math.abs(episodes - itemEpisodes) <= 2) score += 5;
  }

  // Studio match bonus
  if (studios.length > 0 && item.production_companies) {
    for (const company of item.production_companies) {
      const companyName = (company.name || "").toLowerCase();
      for (const studio of studios) {
        if (companyName.includes(studio.toLowerCase()) || studio.toLowerCase().includes(companyName)) {
          score += 10;
          break;
        }
      }
    }
  }

  // Popularity boost (minor)
  score += Math.min(item.vote_count || 0, 30);

  // Name in Japanese (strong signal)
  if (itemOriginalTitle && /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uffef]/.test(item.original_name)) {
    score += 10;
  }

  return score;
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
