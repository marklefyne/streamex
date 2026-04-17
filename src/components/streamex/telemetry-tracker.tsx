"use client";

import { useEffect, useRef } from "react";

const NODE_KEY = "flux_node_id";
const TELEMETRY_ENDPOINT = "/api/telemetry/node";

function getOrCreateNodeId(): string {
  try {
    const existing = localStorage.getItem(NODE_KEY);
    if (existing) return existing;
    const fresh =
      "n_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);
    localStorage.setItem(NODE_KEY, fresh);
    return fresh;
  } catch {
    return "n_fallback_" + Math.random().toString(36).slice(2, 10);
  }
}

function detectDeviceType(): string {
  try {
    const ua = navigator.userAgent;
    if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return "mobile";
    if (/Tablet|iPad|Android(?!.*Mobile)/i.test(ua)) return "tablet";
    return "desktop";
  } catch {
    return "unknown";
  }
}

async function sendNodePing() {
  try {
    const node_id = getOrCreateNodeId();
    const device_type = detectDeviceType();
    const cpu_cores = navigator.hardwareConcurrency ?? null;

    const res = await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node_id,
        ip: "auto",
        device_type,
        cpu_cores,
      }),
    });
    await res.text();
  } catch {
    // Swallow — telemetry is invisible
  }
}

export function TelemetryTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const t = setTimeout(sendNodePing, 1200);
    return () => clearTimeout(t);
  }, []);

  return null;
}
