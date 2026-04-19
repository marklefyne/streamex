import { NextResponse } from "next/server";

/**
 * ESPN Sports API Route
 * Fetches REAL match data from ESPN's free public API endpoints
 * and transforms it to match our SportMatch interface.
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
}

interface ESPNCompetitor {
  team: {
    displayName: string;
    abbreviation: string;
    logo?: string;
    color?: string;
    alternateColor?: string;
  };
  score?: string;
  homeAway: "home" | "away";
  records?: Array<{ summary: string }>;
}

interface ESPNStatus {
  type: {
    name: string;
    completed: boolean;
    description: string;
    detail?: string;
    shortDetail?: string;
  };
  displayClock?: string;
  period?: number;
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
  venue?: {
    fullName?: string;
    address?: { city?: string; country?: string };
  };
}

interface ESPNEvent {
  id: string;
  name: string;
  date: string;
  competitions: ESPNCompetition[];
  season?: { slug?: string };
}

interface ESPNResponse {
  events?: ESPNEvent[];
  leagues?: Array<{ name: string }>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

// No default stream URLs — real sports streams cannot be freely embedded.
// Users provide their own stream URLs via the custom URL input.

const ESPN_LEAGUES: Array<{
  path: string;
  league: string;
  sport: string;
}> = [
  { path: "soccer/eng.1", league: "English Premier League", sport: "Football" },
  { path: "soccer/esp.1", league: "Spanish La Liga", sport: "Football" },
  { path: "soccer/ita.1", league: "Italian Serie A", sport: "Football" },
  { path: "soccer/ger.1", league: "German Bundesliga", sport: "Football" },
  { path: "soccer/fra.1", league: "French Ligue 1", sport: "Football" },
  { path: "soccer/uefa.champions", league: "UEFA Champions League", sport: "Football" },
  { path: "basketball/nba", league: "NBA", sport: "Basketball" },
  { path: "ice-hockey/nhl", league: "NHL", sport: "Hockey" },
  { path: "football/nfl", league: "NFL", sport: "Football" },
  { path: "mma/ufc", league: "UFC", sport: "Fighting" },
];

// Statuses that indicate a match is currently live/in-progress
const LIVE_STATUSES = new Set([
  "STATUS_IN_PROGRESS",
  "STATUS_HALFTIME",
  "STATUS_1ST_PERIOD",
  "STATUS_2ND_PERIOD",
  "STATUS_3RD_PERIOD",
  "STATUS_4TH_PERIOD",
  "STATUS_1ST_QUARTER",
  "STATUS_2ND_QUARTER",
  "STATUS_3RD_QUARTER",
  "STATUS_4TH_QUARTER",
  "STATUS_END_PERIOD",
  "STATUS_PERIOD_ENDED",
  "STATUS_HALF_TIME",
  "STATUS_SECOND_HALF",
  "STATUS_FIRST_HALF",
  "STATUS_OT",
  "STATUS_OVERTIME",
  "STATUS_IN_PROGRESS_PERIOD",
  "STATUS_IN_PROGRESS_OVERTIME",
  "STATUS_POSTPONED",
]);

/* ------------------------------------------------------------------ */
/*  Cache                                                              */
/* ------------------------------------------------------------------ */

const cache = new Map<string, { data: SportMatch[]; timestamp: number }>();
const CACHE_TTL = 120_000; // 2 minutes

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Parse ESPN date string into a human-readable time string.
 */
function parseMatchTime(dateStr: string, statusName: string, shortDetail?: string): string {
  if (LIVE_STATUSES.has(statusName)) {
    return shortDetail || "Live";
  }
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return `Today ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    }
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    }
    // Otherwise show the date
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return shortDetail || "Scheduled";
  }
}

/**
 * Transform a single ESPN event into our SportMatch interface.
 */
function transformEvent(event: ESPNEvent, league: string, sport: string): SportMatch {
  const competition = event.competitions?.[0];
  if (!competition) {
    return {
      id: parseInt(event.id, 10) || 0,
      team1: event.name || "TBD",
      team2: "TBD",
      sport,
      status: "scheduled",
      time: "TBD",
      league,
      color1: "#555555",
      color2: "#555555",
      stream_urls: {},
    };
  }

  const home = competition.competitors?.find((c) => c.homeAway === "home");
  const away = competition.competitors?.find((c) => c.homeAway === "away");

  const statusName = competition.status?.type?.name || "STATUS_SCHEDULED";
  const isLive = LIVE_STATUSES.has(statusName);
  const shortDetail = competition.status?.type?.shortDetail || competition.status?.type?.detail;
  const displayClock = competition.status?.displayClock;

  let score: string | undefined;
  if (home?.score && away?.score) {
    score = `${away.score} - ${home.score}`;
  }

  // Build time display
  let time: string;
  if (isLive) {
    time = shortDetail || displayClock || "Live";
  } else if (statusName === "STATUS_SCHEDULED") {
    time = parseMatchTime(event.date, statusName, shortDetail);
  } else {
    // Completed match
    time = shortDetail || "FT";
  }

  return {
    id: parseInt(event.id, 10) || 0,
    team1: away?.team?.displayName || event.name || "TBD",
    team2: home?.team?.displayName || "TBD",
    sport,
    status: isLive ? "live" : "scheduled",
    time,
    score,
    league,
    color1: away?.team?.color ? `#${away.team.color}` : "#555555",
    color2: home?.team?.color ? `#${home.team.color}` : "#555555",
    stream_urls: {},
    team1_logo: away?.team?.logo || undefined,
    team2_logo: home?.team?.logo || undefined,
    str_status: statusName,
  };
}

/**
 * Fetch scoreboard from a single ESPN endpoint.
 */
async function fetchLeague(
  leagueConfig: (typeof ESPN_LEAGUES)[number],
): Promise<SportMatch[]> {
  const url = `http://site.api.espn.com/apis/site/v2/sports/${leagueConfig.path}/scoreboard`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 120 }, // 2 minutes ISR cache
      signal: AbortSignal.timeout(8000), // 8s timeout per league
    });

    if (!res.ok) {
      console.error(`[ESPN API] ${leagueConfig.path} returned ${res.status}`);
      return [];
    }

    const data: ESPNResponse = await res.json();
    const events = data.events || [];

    return events.map((event) =>
      transformEvent(event, leagueConfig.league, leagueConfig.sport),
    );
  } catch (err) {
    console.error(`[ESPN API] Error fetching ${leagueConfig.path}:`, err);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  GET Handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET() {
  // Check cache
  const cached = cache.get("espn-all-matches");
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({
      matches: cached.data,
      cached: true,
      fetched_at: new Date(cached.timestamp).toISOString(),
    });
  }

  // Fetch all leagues in parallel with Promise.allSettled
  const results = await Promise.allSettled(
    ESPN_LEAGUES.map(fetchLeague),
  );

  // Collect all matches, filtering out failed leagues
  const allMatches: SportMatch[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allMatches.push(...result.value);
    }
  }

  // Update cache
  cache.set("espn-all-matches", { data: allMatches, timestamp: Date.now() });

  return NextResponse.json({
    matches: allMatches,
    cached: false,
    fetched_at: new Date().toISOString(),
    total: allMatches.length,
    leagues: ESPN_LEAGUES.length,
  });
}
