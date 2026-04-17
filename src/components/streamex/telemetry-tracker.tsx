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
    const now = new Date().toISOString();

    const payload = {
      node_id,
      ip: clientIp,
      device_type: navigator.platform || null,
      cpu_cores: navigator.hardwareConcurrency || 4,
      last_seen: now,
    };

    await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Swallow
  }
}

export function TelemetryTracker() {
  const fired = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    fetchPublicIp().then((ip) => {
      clientIp = ip;
      sendNodePing();
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
