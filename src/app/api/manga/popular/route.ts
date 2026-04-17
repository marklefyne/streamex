import { NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    // Fetch popular manga from MangaDex
    const res = await fetch(`${MANGADEX_BASE}/manga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        limit,
        offset: (page - 1) * limit,
        includes: ["author", "cover_art"],
        hasAvailableChapters: true,
        contentRating: ["safe", "suggestive"],
        publicationDemographic: ["shounen", "shoujo", "seinen", "josei"],
        order: { followedCount: "desc" },
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [], total: 0, page, error: "Failed to fetch" }, { status: 500 });
    }

    const data = await res.json();
    const mangaList = data.data || [];

    const results = await Promise.all(
      mangaList.map(async (m: any) => {
        const titles = m.attributes?.title || {};
        const title = titles.en || titles["ja-ro"] || titles["ja"] || Object.values(titles)[0] || "Unknown";
        const descriptions = m.attributes?.description || {};
        const description = descriptions.en || Object.values(descriptions)[0] || "";

        const artistRel = m.relationships?.find((r: any) => r.type === "author");
        const artist = artistRel?.attributes?.name || "Unknown";

        const tags = (m.attributes?.tags || []).map((t: any) => t.attributes?.name?.en || "").filter(Boolean).slice(0, 5);
        const year = m.attributes?.year || 0;
        const status = m.attributes?.status || "unknown";

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
          contentRating: m.attributes?.contentRating || "safe",
        };
      })
    );

    return NextResponse.json({
      results,
      total: data.total || 0,
      page,
      totalPages: Math.ceil((data.total || 0) / limit),
    });
  } catch (error) {
    console.error("Manga popular API error:", error);
    return NextResponse.json({ results: [], total: 0, page: 1, error: "Failed to fetch" }, { status: 500 });
  }
}
