import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/favorites?node_id=xxx
export async function GET(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ items: [] });

    const node_id = req.nextUrl.searchParams.get("node_id");
    if (!node_id) {
      return NextResponse.json({ items: [] });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("tmdb_id, title, type, poster_image, year, rating, created_at")
      .eq("node_id", node_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ items: [] });
    }

    const items = (data || []).map((row) => ({
      tmdb_id: row.tmdb_id,
      title: row.title,
      type: row.type || "",
      posterImage: row.poster_image || "",
      year: row.year || 0,
      rating: row.rating || 0,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

// POST /api/favorites — upsert a favorite
export async function POST(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ ok: true });

    const body = await req.json();
    const { node_id, tmdb_id, title, type, posterImage, year, rating } = body;

    if (!node_id || !tmdb_id) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from("favorites")
      .upsert(
        {
          node_id,
          tmdb_id,
          title: title || "",
          type: type || "",
          poster_image: posterImage || "",
          year: year || null,
          rating: rating || null,
        },
        {
          onConflict: "node_id,tmdb_id",
        }
      );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

// DELETE /api/favorites — remove a favorite
export async function DELETE(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ ok: true });

    const body = await req.json();
    const { node_id, tmdb_id } = body;

    if (!node_id || !tmdb_id) {
      return NextResponse.json({ ok: true });
    }

    await supabase
      .from("favorites")
      .delete()
      .eq("node_id", node_id)
      .eq("tmdb_id", tmdb_id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
