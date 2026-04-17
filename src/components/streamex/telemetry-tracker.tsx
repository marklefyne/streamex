"use client";

import { useEffect, useRef } from "react";

export function TelemetryTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;
    hasTracked.current = true;

    const trackVisit = async () => {
      try {
        await fetch("/api/v1/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAgent: navigator.userAgent,
            path: window.location.pathname,
          }),
        });
      } catch {
        // Silent fail - telemetry should never affect UX
      }
    };

    // Small delay to avoid blocking page load
    const timer = setTimeout(trackVisit, 1500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
