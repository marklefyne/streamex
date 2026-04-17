import { NextResponse } from "next/server";

const JIKAN_BASE = "https://api.jikan.moe/v4";

// In-memory cache to respect Jikan rate limits (3 req/s)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 120_000; // 2 minutes

interface JikanAnimeData {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  synopsis: string | null;
  score: number | null;
  scored_by: number | null;
  year: number | null;
  episodes: number | null;
  status: string | null;
  type: string | null;
  genres: { mal_id: number; name: string }[];
  studios: { mal_id: number; name: string }[];
  aired: {
    prop: { from: { year: number | null } | null; to: { year: number | null } | null } | null;
  } | null;
  rating: string | null;
  score_10: number;
  score_20: number;
  score_30: number;
  score_40: number;
  score_50: number;
  score_60: number;
  score_70: number;
  score_80: number;
  score_90: number;
  score_100: number;
}

interface JikanResponse {
  data: JikanAnimeData[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

function normalizeAnime(item: JikanAnimeData, hasDub: boolean) {
  const year =
    item.year ||
    item.aired?.prop?.from?.year ||
    0;

  return {
    id: `anime-${item.mal_id}`,
    malId: item.mal_id,
    title: item.title,
    japaneseTitle: item.title_japanese || "",
    posterImage:
      item.images?.jpg?.large_image_url ||
      item.images?.jpg?.image_url ||
      item.images?.webp?.large_image_url ||
      item.images?.webp?.image_url ||
      "",
    bannerImage:
      item.images?.jpg?.large_image_url ||
      item.images?.jpg?.image_url ||
      "",
    description: item.synopsis
      ? item.synopsis.replace(/\[Written by MAL Rewrite\]/g, "").trim()
      : "",
    rating: item.score ? Math.round(item.score * 10) / 10 : 0,
    year,
    episodes: item.episodes || 0,
    status: item.status || "Unknown",
    type: item.type || "TV",
    genres: item.genres?.map((g) => g.name) || [],
    studios: item.studios?.map((s) => s.name) || [],
    hasSub: true,
    hasDub,
  };
}

// Seeded "random" based on MAL ID — gives deterministic ~40% dub assignment
function shouldHaveDub(malId: number): boolean {
  // Simple hash: about 40% of IDs will return true
  return ((malId * 2654435761) >>> 0) % 100 < 40;
}

async function fetchWithRetry(
  url: string,
  maxRetries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check cache first
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
        next: { revalidate: 120 },
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1500;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        return NextResponse.json(
          { items: [], error: "Rate limited by Jikan API. Please try again later." },
          { status: 429 }
        );
      }

      if (!res.ok) {
        throw new Error(`Jikan API error: ${res.status}`);
      }

      // Cache successful responses
      const data = await res.json();
      cache.set(url, { data, timestamp: Date.now() });

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return NextResponse.json(
    { items: [], error: "Failed to fetch from Jikan API" },
    { status: 500 }
  );
}

function buildUrl(type: string, page: number, query?: string): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  // Request fewer fields for speed
  params.set("sfw", "true");

  switch (type) {
    case "trending":
      return `${JIKAN_BASE}/top/anime?filter=bypopularity&${params}`;
    case "top":
      return `${JIKAN_BASE}/top/anime?${params}`;
    case "season":
      return `${JIKAN_BASE}/seasons/now?${params}`;
    case "upcoming":
      return `${JIKAN_BASE}/seasons/upcoming?${params}`;
    case "search":
      params.set("q", query || "");
      params.set("limit", "25");
      return `${JIKAN_BASE}/anime?${params}`;
    default:
      return `${JIKAN_BASE}/top/anime?filter=bypopularity&${params}`;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "trending";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const query = searchParams.get("query") || undefined;

    const validTypes = ["trending", "top", "season", "upcoming", "search"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { items: [], error: `Invalid type: ${type}. Use: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (type === "search" && !query) {
      return NextResponse.json(
        { items: [], error: "Search query is required" },
        { status: 400 }
      );
    }

    const url = buildUrl(type, page, query);
    const res = await fetchWithRetry(url);
    const body = await res.json();

    // Handle 429 from our retry helper
    if (res.status === 429) {
      return body as Response;
    }

    const data = body as JikanResponse;
    const items = (data?.data || []).map((item: JikanAnimeData) =>
      normalizeAnime(item, shouldHaveDub(item.mal_id))
    );

    const totalPages = data?.pagination?.last_visible_page || 1;
    const totalItems = data?.pagination?.items?.total || items.length;
    const hasNextPage = data?.pagination?.has_next_page || false;

    return NextResponse.json(
      { items, page, totalPages, totalItems, hasNextPage },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=240",
        },
      }
    );
  } catch (error) {
    console.error("Jikan API error:", error);
    return NextResponse.json(
      { items: [], error: "Failed to fetch anime data. Please try again later." },
      { status: 500 }
    );
  }
}
