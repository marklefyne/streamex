import { NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get("manga_id");
    const chapterId = searchParams.get("chapter_id");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get chapter pages
    if (chapterId) {
      const res = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`, {
        headers: { "User-Agent": "FluxStream/1.0 (https://fluxstream.app)" },
        next: { revalidate: 300 },
      });

      if (!res.ok) {
        return NextResponse.json({ pages: [], error: "Failed to fetch chapter pages" }, { status: 500 });
      }

      const data = await res.json();
      const baseUrl = data.baseUrl;
      const hash = data.chapter?.hash || "";
      const pageFiles = data.chapter?.data || [];
      const lowResFiles = data.chapter?.dataSaver || [];

      const pages = pageFiles.map((file: string, i: number) => ({
        index: i,
        url: `${baseUrl}/data/${hash}/${file}`,
        lowResUrl: `${baseUrl}/data-saver/${hash}/${lowResFiles[i] || file}`,
        width: 0,
        height: 0,
      }));

      return NextResponse.json({ pages, hash, baseUrl, chapterId });
    }

    // Get chapter list for a manga
    if (mangaId) {
      const res = await fetch(
        `${MANGADEX_BASE}/manga/${mangaId}/feed?limit=${limit}&order[chapter]=desc&includes[]=scanlation_group&translatedLanguage[]=en`,
        {
          headers: { "User-Agent": "FluxStream/1.0 (https://fluxstream.app)" },
          next: { revalidate: 600 },
        }
      );

      if (!res.ok) {
        return NextResponse.json({ chapters: [], error: "Failed to fetch chapters" }, { status: 500 });
      }

      const data = await res.json();
      const chapterList = (data.data || []).map((ch: any) => {
        const attrs = ch.attributes || {};
        const groupRel = ch.relationships?.find((r: any) => r.type === "scanlation_group");

        return {
          id: ch.id,
          chapter: attrs.chapter || "?",
          title: attrs.title || `Chapter ${attrs.chapter || "?"}`,
          volume: attrs.volume || null,
          pages: attrs.pages || 0,
          publishedAt: attrs.publishAt || attrs.readableAt || "",
          group: groupRel?.attributes?.name || "Unknown",
          lang: attrs.translatedLanguage?.[0] || "en",
        };
      });

      return NextResponse.json({ chapters: chapterList, total: data.total || 0 });
    }

    return NextResponse.json({ error: "manga_id or chapter_id is required" }, { status: 400 });
  } catch (error) {
    console.error("Manga chapters API error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
