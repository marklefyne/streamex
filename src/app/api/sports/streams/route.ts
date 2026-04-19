import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/**
 * Sports Streams API
 *
 * Uses web search to find live stream links for sports matches.
 * Searches YouTube and other sources for "[team1] vs [team2] live stream"
 * and returns embed-compatible URLs.
 */

interface StreamSource {
  server: string;
  url: string;
  type: "hls" | "iframe" | "mp4";
  quality: string;
  title?: string;
}

// In-memory cache for stream searches
const streamCache = new Map<
  string,
  { data: StreamSource[]; timestamp: number }
>();
const CACHE_TTL = 180_000; // 3 minutes

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function extractYouTubeId(url: string): string | null {
  // youtube.com/watch?v=...
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/...
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/embed/...
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // youtube.com/live/...
  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return liveMatch[1];

  // youtube.com/shorts/...
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

/**
 * Build a search query for finding live streams of a match
 */
function buildSearchQuery(
  team1: string,
  team2: string,
  sport: string,
  league: string
): string {
  // Build a targeted search query
  const cleanTeam1 = team1.split(" ").slice(0, 2).join(" ");
  const cleanTeam2 = team2.split(" ").slice(0, 2).join(" ");
  const cleanLeague = league.split(" ").slice(-2).join(" ");

  // Try multiple search strategies
  return `${cleanTeam1} vs ${cleanTeam2} ${cleanLeague} live stream site:youtube.com`;
}

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
        message: "Missing team information for stream search.",
        updated_at: new Date().toISOString(),
      });
    }

    // Check cache
    const cacheKey = `${team1}-${team2}-${league}`.toLowerCase();
    const cached = streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        match_id: searchParams.get("match_id"),
        sport,
        team1,
        team2,
        streams: cached.data,
        cached: true,
        updated_at: new Date(cached.timestamp).toISOString(),
      });
    }

    // Search for live streams using web search
    const query = buildSearchQuery(team1, team2, sport, league);
    console.log(`[Sports Streams] Searching: "${query}"`);

    let zai;
    try {
      zai = await ZAI.create();
    } catch (sdkErr) {
      console.error("[Sports Streams] Failed to init ZAI SDK:", sdkErr);
      return NextResponse.json({
        match_id: searchParams.get("match_id"),
        sport,
        team1,
        team2,
        streams: [] as StreamSource[],
        message: "Stream search service unavailable.",
        updated_at: new Date().toISOString(),
      });
    }

    // Primary search: YouTube streams
    let searchResults: Array<{ url: string; name: string; snippet: string }> = [];
    try {
      searchResults = (await zai.functions.invoke("web_search", {
        query,
        num: 8,
      })) || [];
    } catch (searchErr) {
      console.error("[Sports Streams] Web search failed:", searchErr);
    }

    // If no YouTube-specific results, try broader search
    if (searchResults.length < 2) {
      const broadQuery = `${team1} vs ${team2} ${sport} live stream`;
      try {
        const broadResults = (await zai.functions.invoke("web_search", {
          query: broadQuery,
          num: 8,
        })) || [];
        searchResults = [...searchResults, ...broadResults];
      } catch {
        // ignore
      }
    }

    // Process results into stream sources
    const streams: StreamSource[] = [];
    const seenIds = new Set<string>();

    for (const result of searchResults) {
      const url = result.url;
      const title = result.name || "";

      // Extract YouTube video ID
      const ytId = extractYouTubeId(url);
      if (ytId && !seenIds.has(ytId)) {
        seenIds.add(ytId);

        // Skip very short/unlikely matches
        if (ytId.length < 5) continue;

        // Check if title or snippet suggests it's a stream (not just news)
        const isLikelyStream =
          /live|stream|watch|highlights|full|extended|replay|goal|match/i.test(
            title + " " + (result.snippet || "")
          );

        streams.push({
          server: `server-${streams.length + 1}`,
          url: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`,
          type: "iframe",
          quality: "HD",
          title: title,
        });

        // If it's likely a stream, also add it with autoplay
        if (isLikelyStream && streams.length <= 5) {
          continue;
        }
      }

      // Also handle direct embed URLs (dailymotion, twitch, etc.)
      if (url.includes("dailymotion.com/video/")) {
        const vid = url.split("dailymotion.com/video/")[1]?.split("_")[0];
        if (vid && !seenIds.has(vid)) {
          seenIds.add(vid);
          streams.push({
            server: `server-${streams.length + 1}`,
            url: `https://www.dailymotion.com/embed/video/${vid}?autoplay=1`,
            type: "iframe",
            quality: "HD",
            title: title,
          });
        }
      }

      // Limit to 5 streams
      if (streams.length >= 5) break;
    }

    // If we found streams, sort them (put "live stream" results first)
    if (streams.length > 0) {
      streams.sort((a, b) => {
        const aScore = /live|stream/i.test(a.title || "") ? 0 : 1;
        const bScore = /live|stream/i.test(b.title || "") ? 0 : 1;
        return aScore - bScore;
      });

      // Update cache
      streamCache.set(cacheKey, { data: streams, timestamp: Date.now() });

      console.log(
        `[Sports Streams] Found ${streams.length} streams for ${team1} vs ${team2}`
      );
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
      message: "Stream search failed. Try a custom URL.",
      updated_at: new Date().toISOString(),
    });
  }
}
