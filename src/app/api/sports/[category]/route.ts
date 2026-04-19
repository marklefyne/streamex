import { NextResponse } from "next/server";

/**
 * Sports Matches API — proxy to streamed.pk
 *
 * GET /api/sports/football     → football matches
 * GET /api/sports/basketball   → basketball matches
 * GET /api/sports/baseball     → baseball matches
 * GET /api/sports/hockey       → hockey matches
 * GET /api/sports/motor-sports → motor sports matches
 * GET /api/sports/fight        → UFC/Boxing matches
 * GET /api/sports/tennis       → tennis matches
 * GET /api/sports/cricket      → cricket matches
 * GET /api/sports/rugby        → rugby matches
 * GET /api/sports/other        → other sports
 */

const CACHE_TTL = 120_000; // 2 minutes
const matchesCache = new Map<string, { data: any[]; timestamp: number }>();

const VALID_CATEGORIES = [
  "football",
  "basketball",
  "baseball",
  "hockey",
  "motor-sports",
  "fight",
  "tennis",
  "rugby",
  "golf",
  "cricket",
  "other",
  "american-football",
  "billiards",
  "afl",
  "darts",
  "all",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid sport category", valid: VALID_CATEGORIES },
        { status: 400 }
      );
    }

    // Check cache
    const cached = matchesCache.get(category);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        category,
        matches: cached.data,
        cached: true,
        count: cached.data.length,
      });
    }

    const apiUrl = category === "all"
      ? "https://streamed.pk/api/matches"
      : `https://streamed.pk/api/matches/${category}`;

    const res = await fetch(apiUrl, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(
        `[Sports Matches] streamed.pk returned ${res.status} for ${category}`
      );
      if (cached) {
        return NextResponse.json({
          category,
          matches: cached.data,
          cached: true,
          stale: true,
          count: cached.data.length,
        });
      }
      return NextResponse.json(
        { category, matches: [], error: "Failed to fetch matches" },
        { status: 502 }
      );
    }

    const matches = await res.json();

    // Process matches — add computed fields
    const now = Date.now();
    const processed = (Array.isArray(matches) ? matches : []).map((m: any) => {
      const isLive = m.date && Math.abs(m.date - now) < 7200000; // within 2 hours
      return {
        ...m,
        isLive,
        homeTeam: m.teams?.home?.name || "",
        awayTeam: m.teams?.away?.name || "",
        homeBadge: m.teams?.home?.badge
          ? `https://streamed.pk/api/images/badge/${m.teams.home.badge}.webp`
          : null,
        awayBadge: m.teams?.away?.badge
          ? `https://streamed.pk/api/images/badge/${m.teams.away.badge}.webp`
          : null,
        poster: m.poster
          ? `https://streamed.pk${m.poster}`
          : null,
        matchTime: m.date ? new Date(m.date).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) : "",
        matchDate: m.date ? new Date(m.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) : "",
        streamCount: m.sources?.length || 0,
      };
    });

    // Update cache
    matchesCache.set(category, { data: processed, timestamp: Date.now() });

    return NextResponse.json({
      category,
      matches: processed,
      cached: false,
      count: processed.length,
    });
  } catch (error) {
    console.error("[Sports Matches] Error:", error);
    return NextResponse.json(
      { matches: [], error: "Internal error" },
      { status: 500 }
    );
  }
}
