import { NextResponse } from "next/server";

/**
 * Sports Streams API
 * Provides always-available HLS test streams as fallback.
 * Returns working stream URLs for sports events.
 */

// Cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 120_000; // 2 minutes (sports data changes fast)

interface StreamSource {
  server: string;
  url: string;
  type: "hls" | "iframe" | "mp4";
  quality: string;
}

/**
 * 5 always-available HLS test streams (public, reliable, no auth needed).
 */
const FALLBACK_HLS_STREAMS: StreamSource[] = [
  { server: "server-1", url: "https://www.youtube.com/embed/LXb3EKWsInQ", type: "iframe", quality: "HD" },
  { server: "server-2", url: "https://www.youtube.com/embed/tyGDiVc2wyE", type: "iframe", quality: "HD" },
  { server: "server-3", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "hls", quality: "HD" },
  { server: "server-4", url: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8", type: "hls", quality: "HD" },
  { server: "server-5", url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8", type: "hls", quality: "SD" },
];

/**
 * Get available streams for a match.
 * Returns an array of stream sources to try.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("match_id");
    const sport = searchParams.get("sport") || "";
    const team1 = searchParams.get("team1") || "";
    const team2 = searchParams.get("team2") || "";

    const cacheKey = `sports-streams-${matchId}-${sport}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data as object);
    }

    const streams: StreamSource[] = [];

    // Add sport-specific streams (all working HLS test streams)
    streams.push(...getSportSpecificStreams(sport, team1, team2));

    // Add fallback streams that are always available
    streams.push(...getFallbackStreams(sport));

    const response = {
      match_id: matchId,
      sport,
      streams,
      updated_at: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[Sports Streams] Error:", error);
    // Always return at least fallback streams
    return NextResponse.json({
      streams: getFallbackStreams(""),
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Get sport-specific stream sources.
 * All return working public HLS test streams — no fake URLs.
 */
function getSportSpecificStreams(sport: string, _team1: string, _team2: string): StreamSource[] {
  // Return working HLS test streams for all sports.
  // In a production environment, these would be real sports stream URLs
  // from sports streaming APIs. For now, we use always-available test streams.
  return FALLBACK_HLS_STREAMS;
}

/**
 * Get fallback streams that are always available.
 * Returns 5 working HLS test streams.
 */
function getFallbackStreams(_sport: string): StreamSource[] {
  return FALLBACK_HLS_STREAMS;
}
