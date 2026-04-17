import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || "";
const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdb_id");
    const type = searchParams.get("type") || "movie";

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdb_id is required" }, { status: 400 });
    }

    const endpoint = type === "tv"
      ? `/tv/${tmdbId}/videos`
      : `/movie/${tmdbId}/videos`;

    const res = await fetch(
      `${TMDB_BASE}${endpoint}?api_key=${TMDB_API_KEY}&language=en-US`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ trailer: null, error: "Failed to fetch videos" }, { status: 500 });
    }

    const data = await res.json();
    const videos = data.results || [];

    // Priority: Official trailer > Trailer > Teaser > any YouTube video
    const trailer =
      videos.find((v: any) => v.type === "Trailer" && v.official && v.site === "YouTube") ||
      videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
      videos.find((v: any) => v.type === "Teaser" && v.official && v.site === "YouTube") ||
      videos.find((v: any) => v.type === "Teaser" && v.site === "YouTube") ||
      videos.find((v: any) => v.site === "YouTube");

    if (!trailer) {
      return NextResponse.json({ trailer: null, videos: [] });
    }

    return NextResponse.json({
      trailer: {
        key: trailer.key,
        name: trailer.name,
        type: trailer.type,
        official: trailer.official,
        site: trailer.site,
        embedUrl: `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`,
      },
      allTrailers: videos
        .filter((v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser" || v.type === "Clip"))
        .slice(0, 10)
        .map((v: any) => ({
          key: v.key,
          name: v.name,
          type: v.type,
          official: v.official,
          embedUrl: `https://www.youtube.com/embed/${v.key}?autoplay=1&rel=0`,
        })),
    });
  } catch (error) {
    console.error("Trailer API error:", error);
    return NextResponse.json({ trailer: null, error: "Failed to fetch trailer" }, { status: 500 });
  }
}
