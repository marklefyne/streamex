import { NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

export interface MangaDexItem {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  artist: string;
  status: string;
  year: number;
  tags: string[];
  rating: number;
  contentRating: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    // Search manga on MangaDex
    const res = await fetch(`${MANGADEX_BASE}/manga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: query,
        limit,
        includes: ["author", "cover_art"],
        hasAvailableChapters: true,
        contentRating: ["safe", "suggestive"],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
    }

    const data = await res.json();
    const mangaList = data.data || [];

    // Batch fetch covers
    const coverIds = mangaList
      .map((m: any) => {
        const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
        return { mangaId: m.id, coverId: coverRel?.id };
      })
      .filter((c: any) => c.coverId);

    const results: MangaDexItem[] = await Promise.all(
      mangaList.map(async (m: any) => {
        const titles = m.attributes?.title || {};
        const title = titles.en || titles["ja-ro"] || titles["ja"] || Object.values(titles)[0] || "Unknown";
        const descriptions = m.attributes?.description || {};
        const description = descriptions.en || Object.values(descriptions)[0] || "No description available.";

        const artistRel = m.relationships?.find((r: any) => r.type === "author");
        const artist = artistRel?.attributes?.name || "Unknown";

        const tags = (m.attributes?.tags || []).map((t: any) => t.attributes?.name?.en || t.attributes?.name?.ja || "").filter(Boolean).slice(0, 5);
        const year = m.attributes?.year || 0;
        const status = m.attributes?.status || "unknown";
        const contentRating = m.attributes?.contentRating || "safe";

        // Get cover
        let coverUrl = "";
        const coverRel = m.relationships?.find((r: any) => r.type === "cover_art");
        if (coverRel?.id) {
          coverUrl = `https://uploads.mangadex.org/covers/${m.id}/${coverRel.attributes?.fileName || ""}.512.jpg`;
        }

        return {
          id: m.id,
          title,
          description: description.substring(0, 300),
          coverUrl,
          artist,
          status,
          year,
          tags,
          rating: 0,
          contentRating,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Manga search API error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
