import { NextResponse } from "next/server";
import { getPopularTV, getTopRatedTV, toMediaItem } from "@/lib/tmdb";

export async function GET() {
  try {
    const [popular, topRated] = await Promise.all([
      getPopularTV(1),
      getTopRatedTV(1),
    ]);

    const seen = new Set<number>();
    const rawItems: typeof popular = [];

    for (const item of [...popular, ...topRated]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        rawItems.push(item);
      }
    }

    const items = await Promise.all(rawItems.slice(0, 20).map(toMediaItem));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Popular TV API error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch TV shows" }, { status: 500 });
  }
}
