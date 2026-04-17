import { NextResponse } from "next/server";
import { getTrendingAnime, toAnimeMediaItem } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const results = await getTrendingAnime(page);
    const items = await Promise.all(results.slice(0, 20).map(toAnimeMediaItem));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Anime API error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch anime" }, { status: 500 });
  }
}
