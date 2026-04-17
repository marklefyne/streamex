import { NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

// In-memory cache to avoid rate limiting
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60_000; // 1 minute

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 2
): Promise<Response> {
  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(JSON.stringify(cached.data), {
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
    });
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "FluxStream/1.0 (https://fluxstream.app)",
          ...options.headers,
        },
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
        if (attempt < maxRetries) {
          console.log(`[Manga API] Rate limited, waiting ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        return NextResponse.json(
          { chapters: [], error: "Rate limited by MangaDex. Please try again." },
          { status: 429 }
        );
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Manga API] Error ${res.status}: ${errText.substring(0, 200)}`);
        throw new Error(`MangaDex API error: ${res.status}`);
      }

      // Cache successful responses
      const data = await res.json();
      cache.set(url, { data, timestamp: Date.now() });

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return NextResponse.json(
    { chapters: [], error: "Failed to fetch" },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get("manga_id");
    const chapterId = searchParams.get("chapter_id");
    const limit = parseInt(searchParams.get("limit") || "100");

    // ========== GET CHAPTER PAGES ==========
    if (chapterId) {
      // Try primary at-home/server endpoint
      let data: any = null;
      let success = false;

      try {
        const res = await fetchWithRetry(
          `${MANGADEX_BASE}/at-home/server/${chapterId}`
        );
        data = await res.json();
        if (data.baseUrl && data.chapter) {
          success = true;
        }
      } catch (err) {
        console.error("[Manga API] at-home/server failed:", err);
      }

      // Fallback: try without base URL (direct MangaDex CDN)
      if (!success || !data?.baseUrl) {
        console.log("[Manga API] Primary failed, trying fallback...");
        try {
          const res = await fetchWithRetry(
            `${MANGADEX_BASE}/at-home/server/${chapterId}?forcePort443=true`
          );
          data = await res.json();
          if (data.baseUrl && data.chapter) {
            success = true;
          }
        } catch (err2) {
          console.error("[Manga API] Fallback also failed:", err2);
        }
      }

      if (!success || !data?.chapter) {
        return NextResponse.json(
          { pages: [], error: "Failed to fetch chapter pages. The chapter may be unavailable." },
          { status: 500 }
        );
      }

      const baseUrl = data.baseUrl;
      const hash = data.chapter.hash || "";
      const pageFiles = data.chapter.data || [];
      const lowResFiles = data.chapter.dataSaver || [];

      const pages = pageFiles.map((file: string, i: number) => ({
        index: i,
        url: `${baseUrl}/data/${hash}/${file}`,
        lowResUrl: `${baseUrl}/data-saver/${hash}/${lowResFiles[i] || file}`,
      }));

      return NextResponse.json({ pages, hash, baseUrl, chapterId });
    }

    // ========== GET CHAPTER LIST FOR MANGA ==========
    if (mangaId) {
      let chapterList: any[] = [];
      let total = 0;

      // Try with English first
      try {
        const url = `${MANGADEX_BASE}/manga/${mangaId}/feed?limit=${limit}&order[chapter]=desc&includes[]=scanlation_group&translatedLanguage[]=en&order[readableAt]=desc`;
        const res = await fetchWithRetry(url);
        const data = await res.json();
        chapterList = data.data || [];
        total = data.total || 0;
      } catch (err) {
        console.error("[Manga API] English chapters fetch failed:", err);
      }

      // Fallback: if no English chapters, try without language filter
      if (chapterList.length === 0) {
        console.log("[Manga API] No English chapters, trying all languages...");
        try {
          const url = `${MANGADEX_BASE}/manga/${mangaId}/feed?limit=${limit}&order[chapter]=desc&includes[]=scanlation_group&order[readableAt]=desc`;
          const res = await fetchWithRetry(url);
          const data = await res.json();
          const allChapters = data.data || [];
          total = data.total || 0;

          // Deduplicate by chapter number, prefer English
          const seen = new Map<string, any>();
          for (const ch of allChapters) {
            const attrs = ch.attributes || {};
            const chNum = attrs.chapter || "?";
            const lang = attrs.translatedLanguage || ["en"];
            const existing = seen.get(chNum);
            if (!existing || lang.includes("en")) {
              seen.set(chNum, ch);
            }
          }
          chapterList = Array.from(seen.values()).sort((a, b) => {
            const aNum = parseFloat(a.attributes?.chapter || "0");
            const bNum = parseFloat(b.attributes?.chapter || "0");
            return bNum - aNum;
          });
        } catch (err2) {
          console.error("[Manga API] All-language fetch also failed:", err2);
        }
      }

      // Parse chapters
      const parsed = chapterList.map((ch: any) => {
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
          lang: Array.isArray(attrs.translatedLanguage)
            ? attrs.translatedLanguage[0] || "en"
            : "en",
        };
      });

      return NextResponse.json({ chapters: parsed, total });
    }

    return NextResponse.json(
      { error: "manga_id or chapter_id is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Manga chapters API error:", error);
    return NextResponse.json(
      { chapters: [], error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
