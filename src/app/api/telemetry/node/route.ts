import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ ok: true, reason: "no supabase" });

    const body = await req.json();
    const { node_id, ip, device_type, cpu_cores, last_seen } = body;

    if (!node_id) {
      return NextResponse.json({ ok: true, reason: "no node_id" });
    }

    const now = last_seen || new Date().toISOString();

    const { error } = await supabase
      .from("nodes")
      .upsert(
        {
          node_id,
          ip: ip || null,
          device_type: device_type || null,
          cpu_cores: cpu_cores ?? null,
          last_seen: now,
        },
        {
          onConflict: "node_id",
        }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({ ok: true, node_id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
