import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function parseUserAgent(ua: string) {
  let device = "Unknown";
  let os = "Unknown";
  let browser = "Unknown";

  if (/mobile|android|iphone|ipod/i.test(ua)) {
    device = "Mobile";
  } else if (/tablet|ipad/i.test(ua)) {
    device = "Tablet";
  } else {
    device = "Desktop";
  }

  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";

  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Opera|OPR/i.test(ua)) browser = "Opera";

  return { device, os, browser };
}

async function getGeoInfo(ip: string) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        return {
          country: data.country || null,
          region: data.regionName || null,
          city: data.city || null,
        };
      }
    }
  } catch {
    // Silently fail
  }
  return { country: null, region: null, city: null };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0]?.trim() || realIp || body.ip || "unknown";
    const userAgent = body.userAgent || request.headers.get("user-agent") || "unknown";
    const path = body.path || "/";

    const parsed = parseUserAgent(userAgent);
    const geo = await getGeoInfo(ip === "unknown" || ip === "::1" ? "" : ip);

    const session = await db.telemetrySession.create({
      data: {
        ip,
        userAgent,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        device: parsed.device,
        os: parsed.os,
        browser: parsed.browser,
        path,
      },
    });

    return NextResponse.json({ success: true, id: session.id });
  } catch (error) {
    console.error("Telemetry POST error:", error);
    return NextResponse.json({ success: false, error: "Telemetry failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sessions = await db.telemetrySession.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const totalVisits = await db.telemetrySession.count();
    const uniqueIps = await db.telemetrySession.groupBy({
      by: ["ip"],
      _count: true,
    });

    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const os: Record<string, number> = {};
    const countries: Record<string, number> = {};

    for (const s of sessions) {
      if (s.device) devices[s.device] = (devices[s.device] || 0) + 1;
      if (s.browser) browsers[s.browser] = (browsers[s.browser] || 0) + 1;
      if (s.os) os[s.os] = (os[s.os] || 0) + 1;
      if (s.country) countries[s.country] = (countries[s.country] || 0) + 1;
    }

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const activeSessions = await db.telemetrySession.findMany({
      where: { createdAt: { gte: thirtyMinAgo } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      sessions,
      stats: {
        totalVisits,
        uniqueVisitors: uniqueIps.length,
        activeNow: activeSessions.length,
        devices,
        browsers,
        os,
        countries,
      },
    });
  } catch (error) {
    console.error("Telemetry GET error:", error);
    return NextResponse.json({ sessions: [], stats: {} }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.telemetrySession.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telemetry DELETE error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
