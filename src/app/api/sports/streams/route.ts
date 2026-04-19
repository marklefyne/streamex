import { NextResponse } from "next/server";

/**
 * Sports Streams API — proxy to streamed.pk
 *
 * GET /api/sports/streams?source=echo&id=fc-porto-vs-tondela-football-1396501
 *
 * Returns array of stream objects with embedUrl from embedsports.top
 */

const CACHE_TTL = 120_000; // 2 minutes
const streamCache = new Map<string, { data: any[]; timestamp: number }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "";
    const id = searchParams.get("id") || "";

    if (!source || !id) {
      return NextResponse.json(
        { streams: [], error: "Missing source or id parameter" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${source}/${id}`;
    const cached = streamCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        source,
        id,
        streams: cached.data,
        cached: true,
      });
    }

    const apiUrl = `https://streamed.pk/api/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`;

    const res = await fetch(apiUrl, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(
        `[Sports Streams] streamed.pk returned ${res.status} for ${cacheKey}`
      );
      if (cached) {
        return NextResponse.json({
          source,
          id,
          streams: cached.data,
          cached: true,
          stale: true,
        });
      }
      return NextResponse.json(
        { source, id, streams: [], error: "Failed to fetch streams" },
        { status: 502 }
      );
    }

    const streams = await res.json();
    const streamList = Array.isArray(streams) ? streams : [];

    // Update cache
    streamCache.set(cacheKey, { data: streamList, timestamp: Date.now() });

    return NextResponse.json({
      source,
      id,
      streams: streamList,
      count: streamList.length,
      cached: false,
    });
  } catch (error) {
    console.error("[Sports Streams] Error:", error);
    return NextResponse.json(
      { streams: [], error: "Internal error" },
      { status: 500 }
    );
  }
}
