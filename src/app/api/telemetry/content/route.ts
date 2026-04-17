import { NextResponse } from "next/server";

/**
 * Content Sync API
 * Updates the Supabase `nodes` table with the current content being played.
 * Called by video player, manga reader, and sports player when content starts.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { node_id, content_type, content_id, title, poster_url } = body;

    if (!node_id || !content_type) {
      return NextResponse.json(
        { error: "node_id and content_type are required" },
        { status: 400 }
      );
    }

    // Validate content_type
    const validTypes = ["movie", "tv", "anime", "manga", "sport", "music"];
    if (!validTypes.includes(content_type)) {
      return NextResponse.json(
        { error: `Invalid content_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Update Supabase nodes table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log("[Content Sync] Supabase not configured, skipping sync");
      return NextResponse.json({ success: true, synced: false, reason: "supabase_not_configured" });
    }

    try {
      const updateData: Record<string, string | null> = {
        current_content: title || content_id?.toString() || "Unknown",
        content_type: content_type,
        content_id: content_id?.toString() || null,
        poster_url: poster_url || null,
        last_active: new Date().toISOString(),
      };

      const res = await fetch(
        `${supabaseUrl}/rest/v1/nodes?id=eq.${encodeURIComponent(node_id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[Content Sync] Supabase update failed: ${res.status} ${errText}`);
        return NextResponse.json(
          { success: true, synced: false, error: "supabase_update_failed" },
          { status: 200 }
        );
      }

      console.log(`[Content Sync] Updated node ${node_id}: ${content_type} - ${title || content_id}`);
      return NextResponse.json({ success: true, synced: true });
    } catch (supabaseError) {
      console.error("[Content Sync] Supabase error:", supabaseError);
      return NextResponse.json(
        { success: true, synced: false, error: "supabase_error" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[Content Sync] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync content" },
      { status: 500 }
    );
  }
}
