"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const NODE_KEY = "node_id";

function getOrCreateNodeId(): string {
  try {
    const existing = localStorage.getItem(NODE_KEY);
    if (existing) return existing;
    const fresh = "node_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(NODE_KEY, fresh);
    return fresh;
  } catch {
    return "node_" + Math.random().toString(36).substr(2, 9);
  }
}

async function reportNode() {
  try {
    // 1. Get public IP
    const ipRes = await fetch("https://api.ipify.org?format=json");
    if (!ipRes.ok) {
      console.error("[Flux Telemetry] Failed to fetch IP:", ipRes.status);
      return;
    }
    const { ip } = await ipRes.json();

    // 2. Get or create node ID
    const nodeId = getOrCreateNodeId();
    localStorage.setItem("node_id", nodeId);

    // 3. Upsert to Supabase nodes table
    const { error } = await supabase.from("nodes").upsert(
      {
        node_id: nodeId,
        ip: ip,
        device_type: navigator.userAgent,
        cpu_cores: navigator.hardwareConcurrency || 4,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "node_id" }
    );

    if (error) {
      console.error("[Flux Telemetry] Supabase Sync Error:", error.message);
      console.error("[Flux Telemetry] Full error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("[Flux Telemetry] Node Synced Successfully:", nodeId, "| IP:", ip);
    }
  } catch (err) {
    console.error("[Flux Telemetry] Network/Script Error:", err);
  }
}

export function TelemetryTracker() {
  const fired = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    console.log("[Flux Telemetry] Tracker initializing...");
    console.log("[Flux Telemetry] Supabase URL:", supabaseUrl);

    // Fire immediately
    reportNode();

    // Heartbeat every 60 seconds
    heartbeatRef.current = setInterval(() => {
      console.log("[Flux Telemetry] Heartbeat ping...");
      reportNode();
    }, 60000);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  return null;
}
