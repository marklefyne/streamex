import { NextResponse } from "next/server";

/**
 * Sports Matches API — proxy to streamed.pk (same as sports.gorny.uk)
 *
 * Returns match data transformed to our SportMatch interface
 * so the original UI design works without changes.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SportMatch {
  id: number;
  team1: string;
  team2: string;
  sport: string;
  status: "live" | "scheduled";
  time: string;
  score?: string;
  league: string;
  color1: string;
  color2: string;
  viewers?: string;
  stream_urls?: Record<string, string>;
  team1_logo?: string;
  team2_logo?: string;
  str_status?: string;
  // Extra fields for streamed.pk sources
  gorny_sources?: { source: string; id: string }[];
}

interface StreamedPKMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  poster: string | null;
  popular: boolean;
  teams: {
    home: { name: string; badge: string };
    away: { name: string; badge: string };
  };
  sources: { source: string; id: string }[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CACHE_TTL = 120_000; // 2 minutes
const matchesCache = new Map<string, { data: SportMatch[]; timestamp: number }>();

const VALID_CATEGORIES = [
  "all-today",
  "football",
  "basketball",
  "baseball",
  "hockey",
  "motor-sports",
  "fight",
  "tennis",
  "cricket",
  "rugby",
  "golf",
  "other",
  "american-football",
  "billiards",
  "afl",
  "darts",
  "all",
];

const CATEGORY_LABELS: Record<string, string> = {
  football: "Football",
  basketball: "Basketball",
  baseball: "Baseball",
  hockey: "Hockey",
  "motor-sports": "Motor Sports",
  fight: "Boxing & UFC",
  tennis: "Tennis",
  cricket: "Cricket",
  rugby: "Rugby",
  golf: "Golf",
  other: "Other",
  "american-football": "American Football",
  billiards: "Billiards",
  afl: "AFL",
  darts: "Darts",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Determine if a match is live based on date proximity.
 */
function isLiveMatch(date: number): boolean {
  const now = Date.now();
  const matchDate = new Date(date);
  const diffMs = Math.abs(now - date);
  // Consider live if within 2 hours of the scheduled time
  return diffMs < 2 * 60 * 60 * 1000;
}

/**
 * Format date into readable time string.
 */
function formatMatchTime(date: number): string {
  const matchDate = new Date(date);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (matchDate.toDateString() === now.toDateString()) {
    return `Today ${matchDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  if (matchDate.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow ${matchDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  if (matchDate < now) {
    return "FT";
  }
  return matchDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Generate a consistent color from a team name.
 */
function teamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#1e3a5f", "#5f1e3a", "#3a5f1e", "#5f3a1e", "#1e5f3a",
    "#3a1e5f", "#5f5f1e", "#1e5f5f", "#5f1e5f", "#3a3a3a",
  ];
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Transform a streamed.pk match to our SportMatch interface.
 */
function transformMatch(match: StreamedPKMatch, index: number): SportMatch {
  const live = isLiveMatch(match.date);
  const time = live ? "Live" : formatMatchTime(match.date);

  return {
    id: index + 1, // numeric ID for our UI
    team1: match.teams?.away?.name || match.title?.split(" vs ")[0] || "TBD",
    team2: match.teams?.home?.name || match.title?.split(" vs ")[1] || "TBD",
    sport: CATEGORY_LABELS[match.category] || match.category || "Sports",
    status: live ? "live" : "scheduled",
    time,
    league: CATEGORY_LABELS[match.category] || match.category || "Sports",
    color1: teamColor(match.teams?.away?.name || ""),
    color2: teamColor(match.teams?.home?.name || ""),
    stream_urls: {},
    team1_logo: match.teams?.away?.badge
      ? `https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`
      : undefined,
    team2_logo: match.teams?.home?.badge
      ? `https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`
      : undefined,
    gorny_sources: match.sources || [],
  };
}

/* ------------------------------------------------------------------ */
/*  GET Handler                                                        */
/* ------------------------------------------------------------------ */

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
    const processed: SportMatch[] = (Array.isArray(matches) ? matches : []).map(
      (m: StreamedPKMatch, i: number) => transformMatch(m, i)
    );

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
