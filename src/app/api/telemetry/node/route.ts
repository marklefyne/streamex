import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function resolveIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return req.headers.get("cf-connecting-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { node_id, device_type, cpu_cores } = body;

    if (!node_id) {
      return NextResponse.json({ ok: true });
    }

    const ip = resolveIp(req);
    const now = new Date().toISOString();

    // Upsert: if node_id exists → update last_seen + device info; if not → insert new row
    const { error } = await supabase
      .from("nodes")
      .upsert(
        {
          node_id,
          ip,
          device_type: device_type || null,
          cpu_cores: cpu_cores ?? null,
          last_seen: now,
          first_seen: now,
        },
        {
          onConflict: "node_id",
        }
      );

    if (error) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
