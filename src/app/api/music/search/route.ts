import { NextResponse } from "next/server";

const ITUNES_BASE = "https://itunes.apple.com/search";

export interface ITunesTrack {
  id: string;
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  durationMs: number;
  primaryGenreName: string;
  releaseDate: string;
}

export interface ITunesAlbum {
  id: string;
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100: string;
  trackCount: number;
  releaseDate: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const entity = searchParams.get("entity") || "song"; // song, album, musicVideo

    if (!query.trim()) {
      return NextResponse.json({ tracks: [], albums: [] });
    }

    // Search tracks
    const trackRes = await fetch(
      `${ITUNES_BASE}?term=${encodeURIComponent(query)}&entity=song&limit=${limit}&country=US`
    );
    const trackData = await trackRes.json();

    // Search albums if requested
    const albums: ITunesAlbum[] = [];
    if (entity === "album" || entity === "song") {
      const albumRes = await fetch(
        `${ITUNES_BASE}?term=${encodeURIComponent(query)}&entity=album&limit=10&country=US`
      );
      const albumData = await albumRes.json();
      if (albumData.results) {
        for (const a of albumData.results) {
          albums.push({
            id: `album-${a.collectionId}`,
            collectionId: a.collectionId,
            collectionName: a.collectionName || "Unknown Album",
            artistName: a.artistName || "Unknown Artist",
            artworkUrl100: (a.artworkUrl100 || "").replace("100x100", "300x300"),
            trackCount: a.trackCount || 0,
            releaseDate: a.releaseDate || "",
          });
        }
      }
    }

    const tracks: ITunesTrack[] = (trackData.results || []).map((t: any) => ({
      id: `track-${t.trackId}`,
      trackId: t.trackId,
      trackName: t.trackName || "Unknown",
      artistName: t.artistName || "Unknown Artist",
      collectionName: t.collectionName || "",
      artworkUrl100: (t.artworkUrl100 || "").replace("100x100", "300x300"),
      previewUrl: t.previewUrl || "",
      durationMs: t.trackTimeMillis || 0,
      primaryGenreName: t.primaryGenreName || "Unknown",
      releaseDate: t.releaseDate || "",
    }));

    return NextResponse.json({ tracks, albums });
  } catch (error) {
    console.error("Music search API error:", error);
    return NextResponse.json({ tracks: [], albums: [], error: "Search failed" }, { status: 500 });
  }
}
