import { NextResponse } from "next/server";
import { getTopRatedTV, toMediaItem } from "@/lib/tmdb";

export async function GET() {
  try {
    const results = await getTopRatedTV(1);
    const items = await Promise.all(results.slice(0, 20).map(toMediaItem));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Top Rated TV API error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch top rated TV" }, { status: 500 });
  }
}
