import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/history?node_id=xxx
export async function GET(req: NextRequest) {
  try {
    const node_id = req.nextUrl.searchParams.get("node_id");
    if (!node_id) {
      return NextResponse.json({ items: [] });
    }

    const { data, error } = await supabase
      .from("watch_history")
      .select("tmdb_id, title, type, poster_image, season, episode, watched_at")
      .eq("node_id", node_id)
      .order("watched_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ items: [] });
    }

    const items = (data || []).map((row) => ({
      tmdb_id: row.tmdb_id,
      title: row.title,
      type: row.type || "",
      posterImage: row.poster_image || "",
      season: row.season ?? undefined,
      episode: row.episode ?? undefined,
      watched_at: row.watched_at,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

// POST /api/history — insert a watch history entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { node_id, tmdb_id, title, type, posterImage, season, episode, watched_at } = body;

    if (!node_id || !tmdb_id) {
      return NextResponse.json({ ok: true });
    }

    await supabase.from("watch_history").insert({
      node_id,
      tmdb_id,
      title: title || "",
      type: type || "",
      poster_image: posterImage || "",
      season: season ?? null,
      episode: episode ?? null,
      watched_at: watched_at || new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

// DELETE /api/history — clear all history for a node_id
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { node_id } = body;

    if (!node_id) {
      return NextResponse.json({ ok: true });
    }

    await supabase
      .from("watch_history")
      .delete()
      .eq("node_id", node_id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
