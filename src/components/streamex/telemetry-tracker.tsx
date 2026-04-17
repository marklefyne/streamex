"use client";

import { useEffect, useRef } from "react";

const NODE_KEY = "node_id";
const TELEMETRY_ENDPOINT = "/api/telemetry/node";

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

let clientIp = "auto";

async function fetchPublicIp(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) return "auto";
    const data = await res.json();
    return data.ip || "auto";
  } catch {
    return "auto";
  }
}

async function sendNodePing() {
  try {
    const node_id = getOrCreateNodeId();
    const compute_power = navigator.hardwareConcurrency ?? null;
    const platform = navigator.platform || navigator.userAgentData?.platform || null;
    const now = new Date().toISOString();

    const payload = {
      node_id,
      ip_address: clientIp,
      status: "online" as const,
      compute_power,
      platform,
      last_seen: now,
    };

    const res = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await res.text();
  } catch {
    // Swallow — telemetry is invisible
  }
}

export function TelemetryTracker() {
  const fired = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Fetch public IP first, then send telemetry
    fetchPublicIp().then((ip) => {
      clientIp = ip;
      // Send initial ping
      sendNodePing();

      // Heartbeat every 60 seconds
      heartbeatRef.current = setInterval(sendNodePing, 60000);
    });

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  return null;
}
