import { NextResponse } from "next/server";
import { searchMulti, toMediaItem } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = searchParams.get("page") || "1";

    if (!query.trim()) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const results = await searchMulti(query.trim(), parseInt(page));
    const items = await Promise.all(results.slice(0, 20).map(toMediaItem));

    return NextResponse.json({ items, total: results.length });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ items: [], total: 0, error: "Search failed" }, { status: 500 });
  }
}
