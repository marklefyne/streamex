import { NextResponse } from "next/server";
import { getMovieDetails, getTVDetails, toMediaItem } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = parseInt(searchParams.get("tmdb_id") || "0");
    const mediaType = searchParams.get("type") || "movie";

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdb_id is required" }, { status: 400 });
    }

    const raw = mediaType === "tv" ? await getTVDetails(tmdbId) : await getMovieDetails(tmdbId);
    // Override media_type for proper type detection in toMediaItem
    raw.media_type = mediaType === "tv" ? "tv" : "movie";
    const item = await toMediaItem(raw);

    // For TV shows, also extract season episode counts
    let seasonEpisodes: Record<number, number> | undefined;
    if (mediaType === "tv" && (raw as any).seasons) {
      seasonEpisodes = {};
      for (const season of (raw as any).seasons) {
        if (season.season_number > 0) {
          seasonEpisodes[season.season_number] = season.episode_count;
        }
      }
    }

    return NextResponse.json({ item, seasonEpisodes });
  } catch (error) {
    console.error("Details API error:", error);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
