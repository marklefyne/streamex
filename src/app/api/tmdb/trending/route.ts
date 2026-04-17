import { NextResponse } from "next/server";
import { getTrending, toMediaItem } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get("type") || "all";
    const timeWindow = searchParams.get("window") || "week";

    const results = await getTrending(mediaType, timeWindow);
    const items = results.slice(0, 20).map(toMediaItem);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch trending" }, { status: 500 });
  }
}
