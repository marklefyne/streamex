"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://muehmdtvffnxpjanoqqm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11ZWhtZHR2ZmZueHBqYW5vcXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MzEyMTR9.X_v6_XqZ2X8Xz_v6_XqZ2X8Xz_v6_XqZ2X8"
);

export function TelemetryTracker() {
  useEffect(() => {
    const sync = async () => {
      alert("Syncing...");

      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const { ip } = await res.json();

        let nodeId = localStorage.getItem("node_id") || "node_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("node_id", nodeId);

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
          console.log("[FLUX] Error:", error.message);
          alert("[FLUX] Error: " + error.message);
        } else {
          console.log("[FLUX] Node Captured:", ip);
          alert("Success! IP: " + ip);
        }
      } catch (e) {
        console.log("[FLUX] Fatal Connection Error");
        alert("[FLUX] Fatal Connection Error");
      }
    };
    sync();
  }, []);

  return null;
}
