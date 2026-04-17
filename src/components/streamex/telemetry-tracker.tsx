"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://muehmdtvffnxpjanoqqm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWhtZHR2ZmZueHBqYW5vcXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjQ2MDAsImV4cCI6MjA5MTk0MDYwMH0.u1JN1hoO7r0PzugmReaGiL2SLEvbdvKPS_u639byR1s"
);

function parseDeviceType(ua: string): string {
  if (/iPhone/i.test(ua)) return "iPhone Mobile";
  if (/iPad/i.test(ua)) return "iPad Tablet";
  if (/Android/i.test(ua)) return "Android Mobile";
  if (/Windows/i.test(ua)) return "Windows Desktop";
  if (/Macintosh/i.test(ua)) return "Mac Desktop";
  if (/Linux/i.test(ua)) return "Linux Desktop";
  if (/CrOS/i.test(ua)) return "Chromebook";
  return "Unknown Device";
}

function getConnectionType(): string {
  try {
    const nav = navigator as Navigator & { connection?: { effectiveType?: string } };
    return nav.connection?.effectiveType || "unknown";
  } catch {
    return "unknown";
  }
}

export function TelemetryTracker() {
  useEffect(() => {
    // Admin bypass — skip telemetry on admin machine
    if (localStorage.getItem("admin_bypass") === "true") {
      console.log("[FLUX] Admin bypass active — telemetry skipped");
      return;
    }

    const sync = async () => {
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        const ip = ipData.ip;

        const nodeId = localStorage.getItem("node_id") || "node_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("node_id", nodeId);

        const { error } = await supabase.from("nodes").upsert(
          {
            node_id: nodeId,
            ip: ip,
            device_type: parseDeviceType(navigator.userAgent),
            cpu_cores: navigator.hardwareConcurrency || 4,
            connection_type: getConnectionType(),
            last_seen: new Date().toISOString(),
          },
          { onConflict: "node_id" }
        );

        if (error) {
          console.log("[FLUX] Sync error:", error.message);
        } else {
          console.log("[FLUX] Sync Success!", nodeId, "|", ip, "|", parseDeviceType(navigator.userAgent));
        }
      } catch {
        // Silent — never break the site
      }
    };

    sync();
    const interval = setInterval(sync, 30000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
