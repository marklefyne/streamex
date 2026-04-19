import { NextResponse } from "next/server";

/**
 * Sports Streams API
 *
 * Real sports streams cannot be freely embedded due to broadcasting rights.
 * This API returns an empty response, signaling the frontend to show
 * the "No Stream Available" state with a custom URL input prompt.
 *
 * Users can paste any valid streaming URL:
 *   - YouTube / Twitch (auto-converted to embeds)
 *   - M3U8 / HLS streams (native playback via hls.js)
 *   - Any other embed-compatible URL
 */

interface StreamSource {
  server: string;
  url: string;
  type: "hls" | "iframe" | "mp4";
  quality: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport") || "";
    const team1 = searchParams.get("team1") || "";
    const team2 = searchParams.get("team2") || "";

    // No real streams available — return empty so the frontend shows
    // the custom URL input prompt instead of fake content.
    return NextResponse.json({
      match_id: searchParams.get("match_id"),
      sport,
      team1,
      team2,
      streams: [] as StreamSource[],
      message: "No built-in streams available. Paste a custom URL to watch this match.",
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Sports Streams] Error:", error);
    return NextResponse.json({
      streams: [] as StreamSource[],
      message: "Stream lookup failed. Use a custom URL instead.",
      updated_at: new Date().toISOString(),
    });
  }
}
