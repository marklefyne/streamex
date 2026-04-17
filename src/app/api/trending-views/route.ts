import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tmdb_id, title, type, posterImage } = body;

    if (!tmdb_id || !title) {
      return NextResponse.json({ error: "tmdb_id and title are required" }, { status: 400 });
    }

    // Check if the row already exists
    const { data: existing } = await supabase
      .from("content_views")
      .select("view_count")
      .eq("tmdb_id", tmdb_id)
      .single();

    if (existing) {
      // Update existing row: increment view_count and refresh metadata
      await supabase
        .from("content_views")
        .update({
          view_count: (existing.view_count || 0) + 1,
          last_viewed: new Date().toISOString(),
          title,
          type: type || "Movie",
          poster_image: posterImage || "",
        })
        .eq("tmdb_id", tmdb_id);
    } else {
      // Insert new row
      await supabase.from("content_views").insert({
        tmdb_id,
        title,
        type: type || "Movie",
        poster_image: posterImage || "",
        view_count: 1,
        last_viewed: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[TrendingViews] POST error:", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("content_views")
      .select("*")
      .order("last_viewed", { ascending: false })
      .limit(10);

    if (error) {
      // Table doesn't exist or other error — return empty gracefully
      console.error("[TrendingViews] GET error:", error.message);
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const items = (data || []).map((row: Record<string, unknown>) => ({
      tmdb_id: row.tmdb_id as number,
      title: row.title as string,
      type: row.type as string,
      posterImage: row.poster_image as string,
      view_count: row.view_count as number,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error("[TrendingViews] GET error:", err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
