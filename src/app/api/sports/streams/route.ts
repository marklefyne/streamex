import { NextResponse } from "next/server";

/**
 * Sports Streams API
 *
 * Parses the JSON-LD structured data from sportsurge.lol to find matching
 * events, then returns the direct watch page URL so the user lands on the
 * specific game page with its built-in player.
 */

interface StreamSource {
  server: string;
  url: string;
  type: "iframe";
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
  name: string;
  team1: string;
  team2: string;
  sport: string;
  isLive: boolean;
}

let homepageCache: { events: SportsurgeEvent[]; timestamp: number } | null = null;
const HOMEPAGE_CACHE_TTL = 300_000; // 5 minutes

/* ------------------------------------------------------------------ */
/*  Sportsurge JSON-LD parser                                          */
/* ------------------------------------------------------------------ */

/**
 * Scrape sportsurge.lol homepage and parse JSON-LD structured data
 * to extract all current/upcoming events with their watch page URLs.
 */
async function scrapeSportsurgeEvents(): Promise<SportsurgeEvent[]> {
  if (homepageCache && Date.now() - homepageCache.timestamp < HOMEPAGE_CACHE_TTL) {
    return homepageCache.events;
  }

  try {
    const res = await fetch("https://sportsurge.lol", {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      console.error(`[Sportsurge] Homepage returned ${res.status}`);
      return homepageCache?.events || [];
    }

    const html = await res.text();
    const events: SportsurgeEvent[] = [];

    // Parse JSON-LD script tags for structured event data
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const json = JSON.parse(jsonStr);

        // Handle both single object and array of objects
        const items: any[] = Array.isArray(json) ? json : [json];

        for (const item of items) {
          // Look for ItemList with SportsEvent items
          if (item["@type"] === "ItemList" && Array.isArray(item.itemListElement)) {
            for (const element of item.itemListElement) {
              const sportEvent = element.item || element;
              if (sportEvent["@type"] === "SportsEvent" && sportEvent.url) {
                const homeTeam = sportEvent.homeTeam?.name || "";
                const awayTeam = sportEvent.awayTeam?.name || "";
                const eventName = sportEvent.name || "";
                const eventUrl = sportEvent.url || "";
                const isLive = sportEvent.eventStatus?.includes("Live") || false;
                const sport = sportEvent.sport || "unknown";

                // Extract team names from event name if not in structured fields
                let team1 = awayTeam || "";
                let team2 = homeTeam || "";

                if (!team1 && !team2 && eventName) {
                  const vsMatch = eventName.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
                  if (vsMatch) {
                    team1 = vsMatch[1].trim();
                    team2 = vsMatch[2].trim();
                  }
                }

                if (team1 && team2 && eventUrl) {
                  events.push({
                    url: eventUrl,
                    name: eventName,
                    team1,
                    team2,
                    sport,
                    isLive,
                  });
                }
              }
            }
          }

          // Also handle standalone SportsEvent objects
          if (item["@type"] === "SportsEvent" && item.url) {
            const homeTeam = item.homeTeam?.name || "";
            const awayTeam = item.awayTeam?.name || "";
            const eventName = item.name || "";
            const eventUrl = item.url || "";
            const isLive = item.eventStatus?.includes("Live") || false;
            const sport = item.sport || "unknown";

            let team1 = awayTeam || "";
            let team2 = homeTeam || "";

            if (!team1 && !team2 && eventName) {
              const vsMatch = eventName.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
              if (vsMatch) {
                team1 = vsMatch[1].trim();
                team2 = vsMatch[2].trim();
              }
            }

            if (team1 && team2 && eventUrl) {
              events.push({
                url: eventUrl,
                name: eventName,
                team1,
                team2,
                sport,
                isLive,
              });
            }
          }
        }
      } catch {
        // Invalid JSON, skip this script block
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const uniqueEvents = events.filter(e => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });

    homepageCache = { events: uniqueEvents, timestamp: Date.now() };
    console.log(`[Sportsurge] Parsed ${uniqueEvents.length} events from JSON-LD`);
    return uniqueEvents;
  } catch (err) {
    console.error("[Sportsurge] Failed to scrape homepage:", err);
    return homepageCache?.events || [];
  }
}

/**
 * Fuzzy match team names. Handles abbreviations, common variations,
 * and partial matches (e.g. "Man City" vs "Manchester City").
 */
function teamsMatch(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return true;
  if (na.length < 2 || nb.length < 2) return false;

  // Exact includes
  if (na.includes(nb) || nb.includes(na)) return true;

  // Check first 4+ chars prefix match
  if (na.length >= 3 && nb.length >= 3) {
    if (na.startsWith(nb.substring(0, 4)) || nb.startsWith(na.substring(0, 4))) return true;
  }

  // Common abbreviation mappings
  const abbreviations: Record<string, string[]> = {
    "manchesterunited": ["manutd", "manunited", "mufc"],
    "manchestercity": ["mancity", "mcfc"],
    "tottenhamhotspur": ["spurs", "thfc", "tottenham"],
    "liverpool": ["lfc"],
    "arsenal": ["afc"],
    "chelsea": ["cfc"],
    "westham": ["whufc", "westhamunited"],
    "newcastle": ["nufc", "newcastleunited"],
    "astonvilla": ["avfc"],
    "brighton": ["bha", "brightonandhove"],
    "nottinghamforest": ["nffc", "nottmforest"],
    "wolverhampton": ["wolves", "wfc"],
    "bournemouth": ["afcb"],
    "bayerleverkusen": ["leverkusen", "bayer04"],
    "borussiadortmund": ["dortmund", "bvb"],
    "bayernmunich": ["bayern", "fcb", "bayernmunchen"],
    "borussiamonchengladbach": ["monchengladbach", "gladbach"],
    "intersanmillan": ["inter", "intermilan"],
    "acmilan": ["milan", "acm"],
    "parissaintgermain": ["psg", "parissg", "paris"],
    "philadelphia76ers": ["76ers", "philly", "sixers"],
    "bostonceltics": ["celtics"],
    "losangeleslakers": ["lakers"],
    "losangelesclippers": ["clippers"],
    "goldenstatewarriors": ["warriors", "gs"],
    "brooklynnets": ["nets"],
    "newyorkknicks": ["knicks"],
  };

  for (const [full, abbrevs] of Object.entries(abbreviations)) {
    const allForms = [full, ...abbrevs];
    const aMatches = allForms.some(form => na.includes(form));
    const bMatches = allForms.some(form => nb.includes(form));
    if (aMatches && bMatches) return true;
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
    // Check if both teams match (in either order)
    const t1Match =
      teamsMatch(team1, event.team1) || teamsMatch(team1, event.team2);
    const t2Match =
      teamsMatch(team2, event.team1) || teamsMatch(team2, event.team2);

    if (t1Match && t2Match) {
      matches.push(event);
    }
  }

  // Sort: prefer live events first
  matches.sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0));

  return matches;
}

/* ------------------------------------------------------------------ */
/*  Alternative domains for fallback                                    */
/* ------------------------------------------------------------------ */

function buildAlternativeServers(
  team1: string,
  team2: string,
  sport: string,
): StreamSource[] {
  const sportCategory: Record<string, string> = {
    Football: "soccer",
    Basketball: "nba",
    Hockey: "nhl",
    Fighting: "mma",
    Cricket: "cricket",
    Esports: "esports",
  };
  const category = sportCategory[sport] || "soccer";

  return [
    {
      server: "server-2",
      url: `https://sportsurge.bz/${category}-streams/`,
      type: "iframe",
      quality: "HD",
      title: `Sportsurge Alt (${category})`,
    },
    {
      server: "server-3",
      url: `https://sportsurge.com.de/${category}-streams/`,
      type: "iframe",
      quality: "HD",
      title: `Sportsurge EU (${category})`,
    },
    {
      server: "server-4",
      url: `https://sportshd.me/${category === "soccer" ? "football" : category}/`,
      type: "iframe",
      quality: "HD",
      title: `SportHD (${category})`,
    },
  ];
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

    // ── Primary: Find matching events on sportsurge.lol via JSON-LD ──
    let matchingEvents: SportsurgeEvent[] = [];
    try {
      matchingEvents = await findMatchingEvents(team1, team2);
      console.log(
        `[Sports Streams] Found ${matchingEvents.length} JSON-LD events for ${team1} vs ${team2}`
      );
    } catch (err) {
      console.error("[Sports Streams] Sportsurge scrape failed:", err);
    }

    // ── Build stream list from matched events ──
    if (matchingEvents.length > 0) {
      // Server 1: Best match (prefer live) - direct watch URL from sportsurge.lol
      const bestMatch = matchingEvents[0];
      streams.push({
        server: "server-1",
        url: bestMatch.url,
        type: "iframe",
        quality: bestMatch.isLive ? "HD" : "HD",
        title: `Sportsurge — ${bestMatch.name}`,
      });

      // Server 2+: Additional matches from sportsurge.lol (if different URLs)
      const seenUrls = new Set([bestMatch.url]);
      for (let i = 1; i < matchingEvents.length; i++) {
        const event = matchingEvents[i];
        if (!seenUrls.has(event.url) && streams.length < 4) {
          seenUrls.add(event.url);
          streams.push({
            server: `server-${streams.length + 1}`,
            url: event.url,
            type: "iframe",
            quality: "HD",
            title: `Sportsurge — ${event.name}`,
          });
        }
      }
    }

    // ── Fallback: Add alternative servers for remaining slots ──
    const altServers = buildAlternativeServers(team1, team2, sport);
    for (const alt of altServers) {
      if (!streams.find((s) => s.server === alt.server) && streams.length < 5) {
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
