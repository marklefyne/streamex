import { NextResponse } from "next/server";

const ITUNES_BASE = "https://itunes.apple.com";

// Genre IDs for iTunes top charts
const GENRE_CHARTS: { id: string; name: string; genreId: number }[] = [
  { id: "all", name: "Top Charts", genreId: 0 },
  { id: "pop", name: "Pop", genreId: 14 },
  { id: "hip-hop", name: "Hip-Hop/Rap", genreId: 18 },
  { id: "rock", name: "Rock", genreId: 21 },
  { id: "electronic", name: "Electronic", genreId: 7 },
  { id: "rnb", name: "R&B/Soul", genreId: 15 },
  { id: "latin", name: "Latin", genreId: 12 },
  { id: "country", name: "Country", genreId: 6 },
  { id: "jazz", name: "Jazz", genreId: 11 },
  { id: "classical", name: "Classical", genreId: 9 },
  { id: "anime", name: "Anime", genreId: 27 },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get("genre") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");

    const genreChart = GENRE_CHARTS.find((g) => g.id === genre) || GENRE_CHARTS[0];

    const url = genreChart.genreId === 0
      ? `${ITUNES_BASE}/us/rss/topsongs/limit=${limit}/json`
      : `${ITUNES_BASE}/us/rss/topsongs/limit=${limit}/genre=${genreChart.genreId}/json`;

    const res = await fetch(url, { next: { revalidate: 1800 } });

    if (!res.ok) {
      return NextResponse.json({ tracks: [], genre: genreChart });
    }

    const data = await res.json();
    const entries = data.feed?.entry || [];

    const tracks = entries.map((entry: any) => ({
      id: `track-${entry.id.attributes?.["im:id"] || Math.random()}`,
      trackId: parseInt(entry.id.attributes?.["im:id"] || "0"),
      trackName: entry["im:name"]?.label || "Unknown",
      artistName: entry["im:artist"]?.label || "Unknown Artist",
      collectionName: entry["im:collection"]?.label || "",
      artworkUrl100: (entry["im:image"]?.[2]?.label || "").replace("170x170", "300x300"),
      previewUrl: entry.link?.[1]?.attributes?.href || entry.link?.[0]?.attributes?.href || "",
      durationMs: 30000, // iTunes RSS doesn't provide duration
      primaryGenreName: entry.category?.attributes?.label || genreChart.name,
      releaseDate: entry["im:releaseDate"]?.attributes?.label || "",
    }));

    return NextResponse.json({ tracks, genre: genreChart, availableGenres: GENRE_CHARTS });
  } catch (error) {
    console.error("Music trending API error:", error);
    return NextResponse.json({ tracks: [], genre: GENRE_CHARTS[0], availableGenres: GENRE_CHARTS, error: "Failed to fetch trending" }, { status: 500 });
  }
}
