import { NextResponse } from "next/server";

/**
 * Sports Streams API
 *
 * Scrapes real sports streaming sites (sportsurge.lol, etc.) to find
 * matching events and returns their embed URLs as stream servers.
 * No YouTube — only real sports streaming sources.
 */

interface StreamSource {
  server: string;
  url: string;
  type: "iframe" | "hls";
  quality: string;
  title?: string;
}

/* ------------------------------------------------------------------ */
/*  Cache                                                              */
/* ------------------------------------------------------------------ */

const streamCache = new Map<string, { data: StreamSource[]; timestamp: number }>();
const CACHE_TTL = 180_000; // 3 minutes

interface SportsurgeEvent {
  url: string;
  team1: string;
  team2: string;
  sport: string;
}

let homepageCache: { events: SportsurgeEvent[]; timestamp: number } | null = null;
const HOMEPAGE_CACHE_TTL = 300_000; // 5 minutes

/* ------------------------------------------------------------------ */
/*  Sportsurge scraper                                                 */
/* ------------------------------------------------------------------ */

/**
 * Scrape sportsurge.lol homepage to get all current event URLs.
 * The page lists events like:
 *   https://sportsurge.lol/watch/?informations=boston-celtics-vs-philadelphia-76ers-30768ffc
 */
async function scrapeSportsurgeEvents(): Promise<SportsurgeEvent[]> {
  // Check cache
  if (homepageCache && Date.now() - homepageCache.timestamp < HOMEPAGE_CACHE_TTL) {
    return homepageCache.events;
  }

  try {
    const res = await fetch("https://sportsurge.lol", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();

    // Extract all watch URLs with their text content (team names)
    const events: SportsurgeEvent[] = [];
    const urlRegex = /href="(https:\/\/sportsurge\.lol\/watch\/\?informations=[^"]+)"/g;
    let match;

    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[1];

      // Extract team names from the slug
      // Format: .../informations/team1-vs-team2-HASH
      const info = url.match(/informations=(.+)/);
      if (!info) continue;

      const slug = info[1];
      // Remove the trailing 8-char hex hash
      const slugWithoutHash = slug.replace(/-[a-f0-9]{8}$/, "");
      const parts = slugWithoutHash.split("-vs-");

      if (parts.length === 2) {
        const team1 = parts[0].replace(/-/g, " ").trim();
        const team2 = parts[1].replace(/-/g, " ").trim();

        // Skip very short or generic names
        if (team1.length > 2 && team2.length > 2) {
          events.push({ url, team1, team2, sport: "unknown" });
        }
      }
    }

    homepageCache = { events, timestamp: Date.now() };
    console.log(`[Sportsurge] Scraped ${events.length} events`);
    return events;
  } catch (err) {
    console.error("[Sportsurge] Failed to scrape:", err);
    return homepageCache?.events || [];
  }
}

/**
 * Fuzzy match team names. Handles abbreviations, common variations.
 */
function teamsMatch(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;

  // Check abbreviations (first 3+ chars)
  if (na.length >= 3 && nb.length >= 3) {
    if (na.startsWith(nb.substring(0, 4)) || nb.startsWith(na.substring(0, 4))) return true;
  }

  return false;
}

/**
 * Find matching events on sportsurge for a given match.
 */
async function findMatchingEvents(
  team1: string,
  team2: string,
): Promise<SportsurgeEvent[]> {
  const events = await scrapeSportsurgeEvents();
  const matches: SportsurgeEvent[] = [];

  for (const event of events) {
    const t1Match =
      teamsMatch(team1, event.team1) || teamsMatch(team1, event.team2);
    const t2Match =
      teamsMatch(team2, event.team1) || teamsMatch(team2, event.team2);

    if (t1Match && t2Match) {
      matches.push(event);
    }
  }

  return matches;
}

/* ------------------------------------------------------------------ */
/*  Alternative sports streaming sites                                  */
/* ------------------------------------------------------------------ */

function getAlternativeServers(
  team1: string,
  team2: string,
  sport: string,
): StreamSource[] {
  const servers: StreamSource[] = [];
  const slug = `${team1.replace(/\s+/g, "-").toLowerCase()}-vs-${team2.replace(/\s+/g, "-").toLowerCase()}`;

  // Sport category mapping
  const sportCategory: Record<string, string> = {
    Football: "soccer",
    Basketball: "nba",
    Hockey: "nhl",
    Fighting: "mma",
  };
  const category = sportCategory[sport] || "soccer";

  // Server 2: sportsurge.bz alternative domain
  servers.push({
    server: "server-2",
    url: `https://sportsurge.bz/${category}-streams/`,
    type: "iframe",
    quality: "HD",
    title: `Sportsurge (Alt) - ${team1} vs ${team2}`,
  });

  // Server 3: sportsurge.com.de another domain
  servers.push({
    server: "server-3",
    url: `https://sportsurge.com.de/${category}-streams/`,
    type: "iframe",
    quality: "HD",
    title: `Sportsurge (DE) - ${team1} vs ${team2}`,
  });

  // Server 4: sportshd alternative
  servers.push({
    server: "server-4",
    url: `https://sportshd.me/${category === "soccer" ? "football" : category}/`,
    type: "iframe",
    quality: "HD",
    title: `SportHD - ${team1} vs ${team2}`,
  });

  // Server 5: sportsurge.lol category page
  servers.push({
    server: "server-5",
    url: `https://sportsurge.lol/${category}-streams/`,
    type: "iframe",
    quality: "HD",
    title: `Sportsurge Browse - ${sport}`,
  });

  return servers;
}

/* ------------------------------------------------------------------ */
/*  GET Handler                                                        */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport") || "";
    const team1 = searchParams.get("team1") || "";
    const team2 = searchParams.get("team2") || "";
    const league = searchParams.get("league") || "";

    if (!team1 || !team2) {
      return NextResponse.json({
        match_id: searchParams.get("match_id"),
        sport,
        team1,
        team2,
        streams: [] as StreamSource[],
        message: "Missing team information.",
        updated_at: new Date().toISOString(),
      });
    }

    // Check cache
    const cacheKey = `${team1}|${team2}|${league}`.toLowerCase();
    const cached = streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        match_id: searchParams.get("match_id"),
        sport,
        team1,
        team2,
        league,
        streams: cached.data,
        cached: true,
        updated_at: new Date(cached.timestamp).toISOString(),
      });
    }

    const streams: StreamSource[] = [];

    // Primary: Find exact match on sportsurge.lol
    try {
      const matchingEvents = await findMatchingEvents(team1, team2);

      if (matchingEvents.length > 0) {
        // Use the first matching event URL as Server 1
        streams.push({
          server: "server-1",
          url: matchingEvents[0].url,
          type: "iframe",
          quality: "HD",
          title: `Sportsurge - ${matchingEvents[0].team1} vs ${matchingEvents[0].team2}`,
        });

        // If there are multiple matches (e.g., different streams), add them too
        for (let i = 1; i < Math.min(matchingEvents.length, 3); i++) {
          streams.push({
            server: `server-${i + 1}`,
            url: matchingEvents[i].url,
            type: "iframe",
            quality: "HD",
            title: `Sportsurge Stream ${i + 1} - ${matchingEvents[i].team1} vs ${matchingEvents[i].team2}`,
          });
        }
      }

      console.log(
        `[Sports Streams] Found ${matchingEvents.length} events for ${team1} vs ${team2}`
      );
    } catch (err) {
      console.error("[Sports Streams] Sportsurge scrape failed:", err);
    }

    // Add alternative servers (category pages from other streaming sites)
    const altServers = getAlternativeServers(team1, team2, sport);
    for (const alt of altServers) {
      // Only add if we haven't already used this server slot
      if (!streams.find((s) => s.server === alt.server)) {
        streams.push(alt);
      }
    }

    // Update cache
    if (streams.length > 0) {
      streamCache.set(cacheKey, { data: streams, timestamp: Date.now() });
    }

    return NextResponse.json({
      match_id: searchParams.get("match_id"),
      sport,
      team1,
      team2,
      league,
      streams,
      cached: false,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Sports Streams] Error:", error);
    return NextResponse.json({
      streams: [] as StreamSource[],
      message: "Stream lookup failed.",
      updated_at: new Date().toISOString(),
    });
  }
}
