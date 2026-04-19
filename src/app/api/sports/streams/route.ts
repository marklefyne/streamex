import { NextResponse } from "next/server";

/**
 * Sports Streams API
 *
 * Scrapes real sports streaming sites (sportsurge.lol, etc.) to find
 * matching events, then scrapes the watch page to extract actual stream
 * embed URLs instead of just returning the watch page URL.
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
/*  Sportsurge homepage scraper                                        */
/* ------------------------------------------------------------------ */

/**
 * Scrape sportsurge.lol homepage to get all current event URLs.
 */
async function scrapeSportsurgeEvents(): Promise<SportsurgeEvent[]> {
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
    const events: SportsurgeEvent[] = [];
    const urlRegex = /href="(https:\/\/sportsurge\.lol\/watch\/\?informations=[^"]+)"/g;
    let match;

    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[1];
      const info = url.match(/informations=(.+)/);
      if (!info) continue;

      const slug = info[1];
      const slugWithoutHash = slug.replace(/-[a-f0-9]{8}$/, "");
      const parts = slugWithoutHash.split("-vs-");

      if (parts.length === 2) {
        const team1 = parts[0].replace(/-/g, " ").trim();
        const team2 = parts[1].replace(/-/g, " ").trim();

        if (team1.length > 2 && team2.length > 2) {
          events.push({ url, team1, team2, sport: "unknown" });
        }
      }
    }

    homepageCache = { events, timestamp: Date.now() };
    console.log(`[Sportsurge] Scraped ${events.length} events from homepage`);
    return events;
  } catch (err) {
    console.error("[Sportsurge] Failed to scrape homepage:", err);
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
/*  Sportsurge watch page scraper — extract real stream embed URLs     */
/* ------------------------------------------------------------------ */

// Known streaming provider domains (for filtering)
const STREAM_PROVIDER_DOMAINS = [
  'methstreams', 'crackstreams', 'bilasport', 'stream2watch',
  'sportshd', 'sportsbay', 'v2sports', 'buffstream', 'strikeout',
  'gomango', 'nbatbite', 'nhlbitw', 'mlbstream', 'aboxing',
  'mmastreams', 'ufcstreams', 'boxingstreams', 'nbabite',
  'vevoll', 'dhupdate', 'score808', 'footybite', 'soccerstreams',
  'totalappex', 'streameast', 'markkystreams', 'sportsonline',
  'streamthread', 'thesportsgrail', 'freesport',
];

// Domains to skip (not actual streams)
const SKIP_DOMAINS = [
  'facebook.com', 'twitter.com', 'x.com', 'google.com', 'youtube.com',
  'doubleclick.net', 'googleapis.com', 'cloudflare.com', 'sportsurge',
  'disqus.com', 'reddit.com', 'instagram.com', 'tiktok.com',
];

/**
 * Check if a URL looks like it could be a stream embed.
 */
function isStreamUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    // Skip known non-stream domains
    for (const skip of SKIP_DOMAINS) {
      if (hostname.includes(skip)) return false;
    }

    // Check if it's a known streaming provider
    for (const provider of STREAM_PROVIDER_DOMAINS) {
      if (hostname.includes(provider)) return true;
    }

    // Check URL patterns that suggest streaming
    if (
      url.includes('/embed/') ||
      url.includes('/player/') ||
      url.includes('/live/') ||
      url.includes('.m3u8') ||
      url.includes('format=m3u8') ||
      url.includes('/hls/') ||
      url.includes('stream') ||
      (url.includes('cdn') && url.includes('video'))
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extract stream embed URLs from a Sportsurge watch page.
 * Tries multiple extraction strategies:
 * 1. <a href> links
 * 2. <iframe src> attributes
 * 3. JSON data embedded in <script> tags (Next.js __NEXT_DATA__)
 * 4. data-* attributes on elements
 */
async function scrapeWatchPageForEmbeds(watchUrl: string): Promise<string[]> {
  try {
    const res = await fetch(watchUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      console.error(`[Sports Streams] Watch page returned ${res.status}`);
      return [];
    }

    const html = await res.text();
    const embedUrls: string[] = [];
    const seen = new Set<string>();

    const addUnique = (url: string) => {
      try {
        // Normalize URL for dedup
        const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
        const normalized = `${parsed.hostname}${parsed.pathname}`;
        if (!seen.has(normalized) && isStreamUrl(url)) {
          seen.add(normalized);
          embedUrls.push(parsed.href);
          return true;
        }
      } catch { /* skip invalid URLs */ }
      return false;
    };

    // Strategy 1: Extract all <a href> links
    const linkRegex = /href=["'](https?:\/\/[^"']+)["']/g;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      addUnique(match[1]);
    }

    // Strategy 2: Extract all <iframe src> attributes
    const iframeRegex = /<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
    while ((match = iframeRegex.exec(html)) !== null) {
      addUnique(match[1]);
    }

    // Strategy 3: Extract URLs from data attributes
    const dataRegex = /data-(?:src|url|stream|embed|href|link)=["'](https?:\/\/[^"']+)["']/gi;
    while ((match = dataRegex.exec(html)) !== null) {
      addUnique(match[1]);
    }

    // Strategy 4: Extract URLs from JSON in script tags (Next.js __NEXT_DATA__, etc.)
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(html)) !== null) {
      const scriptContent = scriptMatch[1];
      // Look for URL-like patterns in JSON data
      const urlInScriptRegex = /https?:\/\/[^\s"'<>\\]+/g;
      let urlMatch;
      while ((urlMatch = urlInScriptRegex.exec(scriptContent)) !== null) {
        // Clean up the URL (remove trailing punctuation, etc.)
        let cleanUrl = urlMatch[0].replace(/[,;)\]}>"']+$/, "");
        addUnique(cleanUrl);
      }
    }

    // Strategy 5: Look for onClick handlers with URLs
    const onclickRegex = /(?:window\.open|location\.href|\.href)\s*[=(]\s*["'](https?:\/\/[^"']+)["']/gi;
    while ((match = onclickRegex.exec(html)) !== null) {
      addUnique(match[1]);
    }

    // Strategy 6: Look for any remaining URLs that match stream patterns
    const anyUrlRegex = /https?:\/\/[^\s"'<>\\]+/g;
    while ((match = anyUrlRegex.exec(html)) !== null) {
      let cleanUrl = match[0].replace(/[,;)\]}>"']+$/, "");
      addUnique(cleanUrl);
    }

    console.log(`[Sports Streams] Found ${embedUrls.length} potential stream embeds from watch page`);
    return embedUrls.slice(0, 8); // Return max 8 embed URLs
  } catch (err) {
    console.error("[Sports Streams] Failed to scrape watch page:", err);
    return [];
  }
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

  // Sport category mapping
  const sportCategory: Record<string, string> = {
    Football: "soccer",
    Basketball: "nba",
    Hockey: "nhl",
    Fighting: "mma",
    Cricket: "cricket",
    Esports: "esports",
  };
  const category = sportCategory[sport] || "soccer";

  // Build search slug for alternative domains
  const slug = `${team1.replace(/\s+/g, "-").toLowerCase()}-vs-${team2.replace(/\s+/g, "-").toLowerCase()}`;

  // Alternative Sportsurge domains - use their search/watch pages
  const altDomains = [
    { domain: "sportsurge.bz", server: "server-2", name: "Sportsurge Alt" },
    { domain: "sportsurge.com.de", server: "server-3", name: "Sportsurge EU" },
    { domain: "sportsurge.net", server: "server-4", name: "Sportsurge Net" },
  ];

  for (const alt of altDomains) {
    servers.push({
      server: alt.server,
      url: `https://${alt.domain}/${category}-streams/`,
      type: "iframe",
      quality: "HD",
      title: `${alt.name} - ${category}`,
    });
  }

  // sportshd alternative
  servers.push({
    server: "server-5",
    url: `https://sportshd.me/${category === "soccer" ? "football" : category}/`,
    type: "iframe",
    quality: "HD",
    title: `SportHD - ${category}`,
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

    // ── Primary: Find matching events on sportsurge.lol ──
    let matchingEvents: SportsurgeEvent[] = [];
    try {
      matchingEvents = await findMatchingEvents(team1, team2);
      console.log(
        `[Sports Streams] Found ${matchingEvents.length} events for ${team1} vs ${team2}`
      );
    } catch (err) {
      console.error("[Sports Streams] Sportsurge scrape failed:", err);
    }

    // ── Scrape watch pages for actual embed URLs ──
    if (matchingEvents.length > 0) {
      // Scrape up to 2 watch pages to find embed URLs
      const watchPagesToScrape = matchingEvents.slice(0, 2);
      const allEmbedUrls: string[] = [];
      let serverIdx = 1;

      for (const event of watchPagesToScrape) {
        try {
          const embeds = await scrapeWatchPageForEmbeds(event.url);

          if (embeds.length > 0) {
            console.log(`[Sports Streams] Got ${embeds.length} embeds from ${event.url}`);
            for (const embedUrl of embeds) {
              if (serverIdx > 5) break;
              const isHls = embedUrl.endsWith(".m3u8") || embedUrl.includes(".m3u8?") || embedUrl.includes("/hls/");

              // Try to determine quality from URL
              let quality = "HD";
              if (embedUrl.includes("1080") || embedUrl.includes("hd")) quality = "1080p";
              else if (embedUrl.includes("720")) quality = "720p";
              else if (embedUrl.includes("480") || embedUrl.includes("sd")) quality = "SD";

              // Get a short hostname for the title
              let providerName = "Stream";
              try {
                providerName = new URL(embedUrl).hostname.replace("www.", "").split(".")[0];
              } catch {}

              streams.push({
                server: `server-${serverIdx}`,
                url: embedUrl,
                type: isHls ? "hls" : "iframe",
                quality,
                title: `${providerName} - ${team1} vs ${team2}`,
              });
              allEmbedUrls.push(embedUrl);
              serverIdx++;
            }
          } else {
            // No embeds found — fall back to the watch page URL
            console.log(`[Sports Streams] No embeds found, using watch page URL: ${event.url}`);
            if (serverIdx <= 5) {
              streams.push({
                server: `server-${serverIdx}`,
                url: event.url,
                type: "iframe",
                quality: "HD",
                title: `Sportsurge - ${event.team1} vs ${event.team2}`,
              });
              serverIdx++;
            }
          }
        } catch (err) {
          console.error(`[Sports Streams] Failed to scrape ${event.url}:`, err);
          // Fall back to watch page URL
          if (serverIdx <= 5) {
            streams.push({
              server: `server-${serverIdx}`,
              url: event.url,
              type: "iframe",
              quality: "HD",
              title: `Sportsurge - ${event.team1} vs ${event.team2}`,
            });
            serverIdx++;
          }
        }
      }

      // If we still have extra matching events (not scraped), add their watch page URLs
      for (let i = watchPagesToScrape.length; i < matchingEvents.length && serverIdx <= 5; i++) {
        streams.push({
          server: `server-${serverIdx}`,
          url: matchingEvents[i].url,
          type: "iframe",
          quality: "HD",
          title: `Sportsurge - ${matchingEvents[i].team1} vs ${matchingEvents[i].team2}`,
        });
        serverIdx++;
      }
    }

    // ── Add alternative servers for remaining slots ──
    const altServers = getAlternativeServers(team1, team2, sport);
    for (const alt of altServers) {
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
