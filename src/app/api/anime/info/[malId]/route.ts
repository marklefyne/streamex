import { NextResponse } from "next/server";

const JIKAN_BASE = "https://api.jikan.moe/v4";

// Cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 300_000; // 5 minutes

interface JikanEpisode {
  mal_id: number;
  title: string | null;
  title_japanese: string | null;
  aired: string | null;
  filler: boolean;
  recap: boolean;
  score: number | null;
}

interface JikanAnimeFull {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  episodes: number | null;
  status: string | null;
  rating: string | null;
  score: number | null;
  synopsis: string | null;
  genres: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
  aired: {
    prop: {
      from: { year: number | null; month: number | null; day: number | null } | null;
      to: { year: number | null; month: number | null; day: number | null } | null;
    } | null;
    string: string | null;
  } | null;
  season: string | null;
  year: number | null;
  type: string | null;
  source: string | null;
  themes: { mal_id: number; name: string }[];
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ malId: string }> }
) {
  try {
    const { malId } = await params;
    const id = parseInt(malId, 10);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid mal_id" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `anime-info-${id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data as object);
    }

    // Fetch full anime details from Jikan
    const [animeRes, episodesRes] = await Promise.all([
      fetchWithRetry(`${JIKAN_BASE}/anime/${id}/full`),
      fetchWithRetry(`${JIKAN_BASE}/anime/${id}/episodes`),
    ]);

    const animeData: JikanAnimeFull = animeRes ? await animeRes.json().then((j) => j.data) : null;
    const episodesData = episodesRes ? await episodesRes.json().then((j) => j.data) : [];

    if (!animeData) {
      return NextResponse.json(
        { error: "Anime not found on Jikan" },
        { status: 404 }
      );
    }

    // Build episode list from Jikan data
    const episodes: {
      number: number;
      title: string;
      titleJapanese: string;
      aired: string | null;
      isFiller: boolean;
      isRecap: boolean;
      malId: number;
    }[] = (episodesData || []).map((ep: JikanEpisode) => ({
      number: ep.mal_id ? 0 : 0, // Jikan episodes don't have explicit number, use array index
      title: ep.title || `Episode ${ep.mal_id}`,
      titleJapanese: ep.title_japanese || "",
      aired: ep.aired || null,
      isFiller: ep.filler || false,
      isRecap: ep.recap || false,
      malId: ep.mal_id,
    }));

    // Jikan episodes endpoint returns episodes but numbering comes from the array order
    const numberedEpisodes = episodes.map((ep, idx) => ({
      ...ep,
      number: idx + 1,
      title: ep.title || `Episode ${idx + 1}`,
    }));

    const response = {
      mal_id: id,
      title: animeData.title,
      title_english: animeData.title_english,
      title_japanese: animeData.title_japanese,
      episodes_count: animeData.episodes || numberedEpisodes.length,
      status: animeData.status,
      type: animeData.type,
      rating: animeData.rating,
      score: animeData.score,
      synopsis: animeData.synopsis,
      genres: animeData.genres?.map((g) => g.name) || [],
      studios: animeData.studios?.map((s) => s.name) || [],
      themes: animeData.themes?.map((t) => t.name) || [],
      source: animeData.source,
      aired: {
        from: animeData.aired?.prop?.from || null,
        to: animeData.aired?.prop?.to || null,
        string: animeData.aired?.string || null,
      },
      season: animeData.season,
      year: animeData.year,
      episodes: numberedEpisodes,
      posterImage: animeData.images?.jpg?.large_image_url || animeData.images?.jpg?.image_url || "",
      backdropImage: animeData.images?.jpg?.large_image_url || "",
    };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[Anime Info] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch anime info" },
      { status: 500 }
    );
  }
}

async function fetchWithRetry(url: string, maxRetries = 2): Promise<Response | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 300 },
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1500;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        return null;
      }

      if (!res.ok) {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        return null;
      }

      return res;
    } catch (error) {
      if (attempt === maxRetries) return null;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return null;
}
