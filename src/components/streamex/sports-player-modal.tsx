"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MonitorPlay, Zap, Shield, HardDrive, Check, Link, ExternalLink, AlertCircle, Info, RefreshCw } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SportMatch {
  id: number;
  team1: string;
  team2: string;
  sport: string;
  status: "live" | "scheduled";
  time: string;
  score?: string;
  league: string;
  color1: string;
  color2: string;
  viewers?: string;
  /** Per-server stream URLs — keyed by "server-1", "server-2", "server-3" */
  stream_urls?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Sport streaming servers with quality labels                         */
/* ------------------------------------------------------------------ */

const SPORT_SERVERS = [
  { id: "server-1", name: "Server 1", quality: "HD", icon: Zap, desc: "Primary — Fastest" },
  { id: "server-2", name: "Server 2", quality: "HD", icon: Shield, desc: "Backup — Stable" },
  { id: "server-3", name: "Server 3", quality: "SD", icon: HardDrive, desc: "Low bandwidth" },
];

/**
 * Resolve the embed URL for a match + server combo.
 * Priority:
 *   1. match.stream_urls[serverId]   — manual / CMS-linked URL
 *   2. match.stream_urls["server-1"] — fallback to first configured URL
 *   3. null (shows "no stream" placeholder)
 */
function resolveStreamUrl(match: SportMatch, serverId: string): string | null {
  if (match.stream_urls) {
    if (match.stream_urls[serverId]) return match.stream_urls[serverId];
    // Fallback to whichever server has a URL
    for (const sid of Object.keys(match.stream_urls)) {
      if (match.stream_urls[sid]) return match.stream_urls[sid];
    }
  }
  return null;
}

/**
 * Validate a URL format — returns true if it looks like a valid URL.
 */
function isValidUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return !!parsed.hostname && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Convert a pasted URL to an embed-compatible URL.
 * - YouTube watch / short links → embed
 * - Twitch channels → player embed
 * - M3U8 / HLS links → hlsplayer.net embed
 * - Dailymotion → embed
 * - Everything else → returned as-is
 */
function convertToEmbedUrl(raw: string): string {
  const trimmed = raw.trim();

  // YouTube watch URL
  if (trimmed.includes("youtube.com/watch")) {
    const vid = new URL(trimmed).searchParams.get("v");
    if (vid) return `https://www.youtube.com/embed/${vid}`;
  }
  // YouTube short URL
  if (trimmed.includes("youtu.be/")) {
    const vid = trimmed.split("youtu.be/")[1]?.split("?")[0];
    if (vid) return `https://www.youtube.com/embed/${vid}`;
  }
  // YouTube embed URL (already embedded)
  if (trimmed.includes("youtube.com/embed/")) {
    return trimmed;
  }
  // Twitch
  if (trimmed.includes("twitch.tv/")) {
    const channel = trimmed.split("twitch.tv/")[1]?.split("?")[0];
    if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}`;
  }
  // Dailymotion
  if (trimmed.includes("dailymotion.com/video/")) {
    const vid = trimmed.split("dailymotion.com/video/")[1]?.split("_")[0];
    if (vid) return `https://www.dailymotion.com/embed/video/${vid}`;
  }
  // M3U8 / HLS
  if (trimmed.endsWith(".m3u8") || trimmed.includes(".m3u8?") || trimmed.includes("/hls/") || trimmed.includes("format=m3u8")) {
    return `https://hlsplayer.net/?url=${encodeURIComponent(trimmed)}`;
  }
  // Direct MP4 / video link
  if (trimmed.endsWith(".mp4") || trimmed.endsWith(".webm")) {
    return `https://hlsplayer.net/?url=${encodeURIComponent(trimmed)}`;
  }

  // Return as-is for embed URLs and other valid links
  return trimmed;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface SportsPlayerModalProps {
  match: SportMatch | null;
  onClose: () => void;
}

export function SportsPlayerModal({ match, onClose }: SportsPlayerModalProps) {
  const [activeServer, setActiveServer] = useState("server-1");
  const [customUrl, setCustomUrl] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeCustomUrl, setActiveCustomUrl] = useState<string | null>(null);
  const [urlTestResult, setUrlTestResult] = useState<"idle" | "valid" | "invalid">("idle");
  const [streamWarning, setStreamWarning] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine which URL to show
  const serverUrl = resolveStreamUrl(match!, activeServer);
  const currentUrl = activeCustomUrl || serverUrl;

  // Derived: auto-show custom input when no stream is available
  const shouldShowCustomInput = showCustomInput || !currentUrl;

  // Derived: iframe load state
  const iframeLoadState: "loading" | "loaded" | "timeout" = streamWarning ? "timeout" : (currentUrl ? (iframeLoaded ? "loaded" : "loading") : "loading");

  // Set up iframe load timeout
  useEffect(() => {
    if (!currentUrl) return;

    // Clear any existing timeout
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

    // After 8 seconds, if still loading, show warning
    loadTimeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) {
        setStreamWarning(true);
      }
    }, 8000);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [currentUrl, iframeLoaded]);

  // Focus custom input when shown
  useEffect(() => {
    if (shouldShowCustomInput && customInputRef.current) {
      // Small delay to let animation complete
      const t = setTimeout(() => customInputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [shouldShowCustomInput]);

  const handleIframeLoad = useCallback(() => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setIframeLoaded(true);
    setStreamWarning(false);
  }, []);

  const handleServerChange = useCallback((serverId: string) => {
    setActiveServer(serverId);
    setActiveCustomUrl(null);
    setUrlTestResult("idle");
    setIframeLoaded(false);
    setStreamWarning(false);
  }, []);

  const handleCustomPlay = useCallback(() => {
    const trimmed = customUrl.trim();
    if (trimmed) {
      const embedUrl = convertToEmbedUrl(trimmed);
      setActiveCustomUrl(embedUrl);
      setStreamWarning(false);
      setUrlTestResult("idle");
      setIframeLoaded(false);
    }
  }, [customUrl]);

  const handleTestUrl = useCallback(() => {
    const trimmed = customUrl.trim();
    if (!trimmed) {
      setUrlTestResult("invalid");
      return;
    }
    if (isValidUrl(trimmed)) {
      setUrlTestResult("valid");
    } else {
      setUrlTestResult("invalid");
    }
    // Auto-reset after 3 seconds
    setTimeout(() => setUrlTestResult("idle"), 3000);
  }, [customUrl]);

  const handleRetryStream = useCallback(() => {
    setActiveCustomUrl(null);
    setStreamWarning(false);
    setIframeLoaded(false);
    setShowCustomInput(true);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!match) return null;

  const isLive = match.status === "live";

  // Check which servers have URLs configured
  const serverUrlStatus = SPORT_SERVERS.map((s) => ({
    ...s,
    hasUrl: !!(match.stream_urls && match.stream_urls[s.id]),
  }));

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          key="sports-player-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
          onClick={handleBackdropClick}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, rotateX: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40, rotateX: 2 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[960px] max-h-[92vh] flex flex-col rounded-2xl overflow-hidden z-10 sport-modal-shadow"
          >
            {/* ===== MATCH INFO HEADER ===== */}
            <div className="relative flex items-center justify-between px-5 sm:px-7 py-4 sport-modal-header border-b border-emerald-500/10">
              <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
                {/* Team 1 */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs sm:text-sm font-black shadow-lg sport-team-logo"
                    style={{ backgroundColor: match.color1 }}
                  >
                    {match.team1.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-bold text-white truncate block leading-tight">
                      {match.team1}
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/40 truncate block mt-0.5">
                      {match.league}
                    </span>
                  </div>
                </div>

                {/* Score / Status */}
                <div className="flex flex-col items-center px-3 sm:px-5 flex-shrink-0">
                  {isLive ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="relative flex h-2 w-2">
                          <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live</span>
                      </div>
                      {match.score ? (
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight sport-score-text">
                          {match.score}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-emerald-400">{match.time}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Scheduled</span>
                      <span className="text-lg font-bold text-white mt-1">{match.time}</span>
                    </>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
                  <div className="min-w-0 text-right">
                    <span className="text-sm sm:text-base font-bold text-white truncate block leading-tight">
                      {match.team2}
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/40 truncate block mt-0.5">
                      {match.sport}
                    </span>
                  </div>
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs sm:text-sm font-black shadow-lg sport-team-logo"
                    style={{ backgroundColor: match.color2 }}
                  >
                    {match.team2.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white transition-all duration-200 flex-shrink-0 ml-3 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ===== VIDEO PLAYER ===== */}
            <div className="relative w-full bg-black sport-player-area">
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                {currentUrl ? (
                  <>
                    <iframe
                      key={`${match.id}-${activeServer}-${activeCustomUrl || ""}`}
                      src={currentUrl}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; fullscreen; encrypted-media"
                      allowFullScreen
                      referrerPolicy="origin"
                      onLoad={handleIframeLoad}
                      title={`${match.team1} vs ${match.team2} — Live Stream`}
                    />
                    {/* Loading spinner overlay */}
                    {iframeLoadState === "loading" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                      </div>
                    )}

                    {/* Stream timeout warning banner */}
                    <AnimatePresence>
                      {streamWarning && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="absolute inset-x-0 top-0 z-10"
                        >
                          <div className="mx-3 mt-3 px-4 py-3 rounded-xl bg-amber-500/10 backdrop-blur-md border border-amber-500/20">
                            <div className="flex items-start gap-3">
                              <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-300 mb-1">Stream may not be available</p>
                                <p className="text-[10px] text-amber-200/60">
                                  The embedded source is taking too long to load. It may be blocked or offline. Try switching servers or paste a custom URL below.
                                </p>
                              </div>
                              <button
                                onClick={handleRetryStream}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-all cursor-pointer flex-shrink-0 border border-amber-500/20"
                              >
                                <RefreshCw size={10} />
                                Use Custom URL
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  /* No stream available — prominent placeholder with custom URL input */
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#111]">
                    <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-5 border border-white/[0.06]">
                      <MonitorPlay size={32} className="text-white/10" />
                    </div>
                    <p className="text-base font-bold text-white/50 mb-1">No Stream Available</p>
                    <p className="text-xs text-white/25 mb-1 text-center max-w-[280px]">
                      This stream source is currently unavailable. Paste a custom stream URL below to watch.
                    </p>
                    <div className="flex items-center gap-1.5 mb-5">
                      <Info size={10} className="text-emerald-400/50" />
                      <span className="text-[10px] text-emerald-400/50">
                        Supports YouTube, Twitch, M3U8/HLS, and embed URLs
                      </span>
                    </div>

                    {/* Inline custom URL input right in the placeholder */}
                    <div className="w-full max-w-[420px] px-6">
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              ref={customInputRef}
                              type="url"
                              value={customUrl}
                              onChange={(e) => { setCustomUrl(e.target.value); setUrlTestResult("idle"); }}
                              onKeyDown={(e) => { if (e.key === "Enter") handleCustomPlay(); }}
                              placeholder="https://youtube.com/watch?v=... or .m3u8 URL"
                              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg pl-3 pr-8 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                            />
                            {/* URL test result indicator */}
                            {urlTestResult !== "idle" && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                {urlTestResult === "valid" ? (
                                  <Check size={14} className="text-emerald-400" />
                                ) : (
                                  <AlertCircle size={14} className="text-red-400" />
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={handleTestUrl}
                            disabled={!customUrl.trim()}
                            className={`flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                              customUrl.trim()
                                ? "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white border-white/[0.08]"
                                : "bg-white/[0.02] text-white/15 cursor-not-allowed border-white/[0.04]"
                            }`}
                            title="Test URL format"
                          >
                            <Zap size={11} />
                            Test
                          </button>
                          <button
                            onClick={handleCustomPlay}
                            disabled={!customUrl.trim()}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              customUrl.trim()
                                ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                                : "bg-white/[0.04] text-white/20 cursor-not-allowed"
                            }`}
                          >
                            <Play size={12} fill="currentColor" />
                            Play
                          </button>
                        </div>
                        {/* URL validation feedback */}
                        <AnimatePresence>
                          {urlTestResult === "invalid" && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="text-[9px] text-red-400/80 mt-1.5 pl-1"
                            >
                              Invalid URL format. Please enter a valid URL (e.g. https://...)
                            </motion.p>
                          )}
                          {urlTestResult === "valid" && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="text-[9px] text-emerald-400/80 mt-1.5 pl-1"
                            >
                              URL format looks valid. Click Play to start streaming.
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                      <p className="text-[9px] text-white/15 mt-2 text-center">
                        Paste any streaming URL — YouTube links are auto-converted to embeds. M3U8/HLS streams are supported.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Currently playing indicator */}
              {currentUrl && activeCustomUrl && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-sm z-20">
                  <ExternalLink size={10} className="text-white" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Custom Stream</span>
                </div>
              )}
              {currentUrl && !activeCustomUrl && iframeLoadState === "loaded" && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/[0.06]">
                  <MonitorPlay size={10} className="text-emerald-400" />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                    {serverUrlStatus.find((s) => s.id === activeServer)?.desc || "Streaming"}
                  </span>
                </div>
              )}
            </div>

            {/* ===== CUSTOM STREAM URL INPUT (for when stream IS available) ===== */}
            <AnimatePresence>
              {shouldShowCustomInput && currentUrl && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-emerald-500/10 bg-[#0c0c0c]"
                >
                  <div className="px-5 sm:px-7 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Link size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        Custom Stream URL
                      </span>
                      <button
                        onClick={() => { setShowCustomInput(false); setCustomUrl(""); setActiveCustomUrl(null); setUrlTestResult("idle"); }}
                        className="ml-auto text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          ref={customInputRef}
                          type="url"
                          value={customUrl}
                          onChange={(e) => { setCustomUrl(e.target.value); setUrlTestResult("idle"); }}
                          onKeyDown={(e) => { if (e.key === "Enter") handleCustomPlay(); }}
                          placeholder="Paste YouTube, Twitch, M3U8/HLS, or any embed URL..."
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-3 pr-8 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                        />
                        {urlTestResult !== "idle" && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            {urlTestResult === "valid" ? (
                              <Check size={14} className="text-emerald-400" />
                            ) : (
                              <AlertCircle size={14} className="text-red-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleTestUrl}
                        disabled={!customUrl.trim()}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                          customUrl.trim()
                            ? "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white border-white/[0.08]"
                            : "bg-white/[0.02] text-white/15 cursor-not-allowed border-white/[0.04]"
                        }`}
                        title="Test URL format"
                      >
                        <Zap size={11} />
                        Test
                      </button>
                      <button
                        onClick={handleCustomPlay}
                        disabled={!customUrl.trim()}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          customUrl.trim()
                            ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                            : "bg-white/[0.04] text-white/20 cursor-not-allowed"
                        }`}
                      >
                        <Play size={12} fill="currentColor" />
                        Play
                      </button>
                    </div>
                    {/* URL validation feedback */}
                    <AnimatePresence>
                      {urlTestResult === "invalid" && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-[9px] text-red-400/80 mt-1.5"
                        >
                          Invalid URL format. Please enter a valid URL (e.g. https://...)
                        </motion.p>
                      )}
                      {urlTestResult === "valid" && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-[9px] text-emerald-400/80 mt-1.5"
                        >
                          URL format looks valid. Click Play to start streaming.
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <p className="text-[9px] text-white/15 mt-1.5">
                      Supports YouTube, Twitch, Dailymotion, M3U8/HLS streams, or any direct embed URL. YouTube watch links are auto-converted to embeds.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== STREAM SERVER SELECTOR ===== */}
            <div className="px-5 sm:px-7 py-4 sport-modal-footer border-t border-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <MonitorPlay size={14} className="text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Select Stream</span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                {serverUrlStatus.map((server) => {
                  const ServerIcon = server.icon;
                  const isActuallyActive = activeServer === server.id && !activeCustomUrl;

                  return (
                    <button
                      key={server.id}
                      onClick={() => { setActiveServer(server.id); setActiveCustomUrl(null); setShowCustomInput(false); setUrlTestResult("idle"); }}
                      className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActuallyActive
                          ? "bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                          : server.hasUrl
                            ? "bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/80 border border-white/[0.06] hover:border-white/[0.12]"
                            : "bg-white/[0.02] text-white/20 border border-white/[0.04] opacity-60"
                      }`}
                    >
                      {/* Quality badge */}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded absolute -top-2 right-1 tracking-wider ${
                        isActuallyActive
                          ? "bg-emerald-500 text-white"
                          : server.quality === "HD"
                            ? "bg-white/10 text-white/40"
                            : "bg-white/5 text-white/30"
                      }`}>
                        {server.quality}
                      </span>

                      <ServerIcon size={18} strokeWidth={isActuallyActive ? 2.5 : 1.5} />

                      <div className="text-center">
                        <span className="font-semibold block">{server.name}</span>
                        <span className="text-[9px] text-white/25 block mt-0.5">
                          {server.hasUrl ? server.desc : "No source"}
                        </span>
                      </div>

                      {isActuallyActive && (
                        <div className="absolute top-1.5 left-1.5">
                          <Check size={10} className="text-emerald-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom URL toggle (only when stream IS available and input is hidden) */}
              {!shouldShowCustomInput && currentUrl && (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/[0.02] border border-dashed border-white/[0.08] hover:border-emerald-500/30 hover:bg-emerald-500/5 text-white/30 hover:text-emerald-400 text-xs font-medium transition-all cursor-pointer"
                >
                  <Link size={12} />
                  <span>Paste Custom Stream URL</span>
                  <span className="text-[9px] text-white/15 ml-1">(YouTube, Twitch, M3U8, etc.)</span>
                </button>
              )}

              {/* Show "stream unavailable" hint when no URL */}
              {!currentUrl && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/10">
                  <Info size={12} className="text-amber-400/60 flex-shrink-0" />
                  <span className="text-[10px] text-amber-400/50">
                    No pre-configured streams available for this match. Use the custom URL input above to watch.
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Need Play icon for custom URL input */
function Play({ size, fill, className }: { size: number; fill?: string; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}
