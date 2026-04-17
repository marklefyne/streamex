import { NextResponse } from "next/server";
import { getTopRated, toMediaItem } from "@/lib/tmdb";

export async function GET() {
  try {
    const results = await getTopRated(1);
    const items = await Promise.all(results.slice(0, 20).map(toMediaItem));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Top Rated API error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch top rated" }, { status: 500 });
  }
}
