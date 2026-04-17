import { NextResponse } from "next/server";
import { getNowPlaying, getUpcoming, toMediaItem } from "@/lib/tmdb";

export async function GET() {
  try {
    const [nowPlaying, upcoming] = await Promise.all([
      getNowPlaying(1),
      getUpcoming(1),
    ]);

    const seen = new Set<number>();
    const items: ReturnType<typeof toMediaItem>[] = [];

    for (const item of [...nowPlaying, ...upcoming]) {
      if (!seen.has(item.id) && items.length < 20) {
        seen.add(item.id);
        items.push(toMediaItem(item));
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Now Playing API error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch new releases" }, { status: 500 });
  }
}
