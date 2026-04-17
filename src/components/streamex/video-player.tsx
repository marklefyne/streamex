"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Clock,
  Tv,
  ChevronLeft,
  Loader2,
  Minimize2,
  MonitorUp,
  RefreshCw,
  Subtitles,
  Zap,
  CheckCircle2,
  XCircle,
  PictureInPicture2,
} from "lucide-react";
import type { CardItem, LiveMediaItem, MediaItem } from "@/lib/mock-data";
import { getEmbedUrl, SERVERS } from "@/lib/mock-data";
import { useHistoryStore } from "@/lib/history-store";

function isLegacyItem(item: CardItem): item is MediaItem {
  return "posterGradient" in item;
}

function isLiveItem(item: CardItem): item is LiveMediaItem {
  return "backdropImage" in item;
}

interface VideoPlayerProps {
  item: CardItem;
  onClose: () => void;
  onMiniPlayer?: (serverIndex: number, season: number, episode: number) => void;
  initialServerIndex?: number;
}

// Smart fallback: auto-try next server if current one doesn't load within timeout
const LOAD_TIMEOUT_MS = 10000; // 10 seconds

export function VideoPlayer({ item, onClose, onMiniPlayer, initialServerIndex = 0 }: VideoPlayerProps) {
  const [activeServerIndex, setActiveServerIndex] = useState(initialServerIndex);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [playerState, setPlayerState] = useState<"loading" | "playing" | "error" | "all-exhausted">("loading");
  const [iframeKey, setIframeKey] = useState(0);
  const [triedServers, setTriedServers] = useState<Set<number>>(new Set());
  const [fallbackInProgress, setFallbackInProgress] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyTrackedRef = useRef<string>("");
  const pipWindowRef = useRef<Window | null>(null);

  const addToHistory = useHistoryStore((s) => s.addToHistory);

  const tmdbId = item.tmdb_id;
  const isTV =
    item.type === "TV Series" ||
    item.type === "tv" ||
    item.type === "Anime" ||
    item.id.startsWith("tv-");
  const mediaType: "movie" | "tv" = isTV ? "tv" : "movie";

  const activeServer = SERVERS[activeServerIndex] || SERVERS[0];
  const embedUrl = getEmbedUrl(tmdbId, mediaType, activeServer.id, season, episode);

  // Season/episode counts
  const seasonsCount = isLegacyItem(item)
    ? item.seasons || 1
    : isLiveItem(item) && item.numberOfSeasons
      ? item.numberOfSeasons
      : 10;

  const seasonEpisodesData = isLiveItem(item) ? item.seasonEpisodes : undefined;
  const currentSeasonEpisodes = seasonEpisodesData?.[season] || 30;

  // Track watch history when player starts playing
  const trackHistory = useCallback((s: number, e: number) => {
    const trackKey = `${tmdbId}-${s}-${e}`;
    if (historyTrackedRef.current === trackKey) return;
    historyTrackedRef.current = trackKey;

    addToHistory(
      {
        tmdb_id: tmdbId,
        title: item.title,
        type: item.type,
        posterImage: item.posterImage || "",
      },
      isTV ? s : undefined,
      isTV ? e : undefined
    );

    // Content sync to Supabase (fire-and-forget)
    try {
      const nodeId = localStorage.getItem("node_id");
      if (nodeId) {
        fetch("/api/telemetry/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            node_id: nodeId,
            content_type: item.type === "Anime" ? "anime" : mediaType,
            content_id: tmdbId,
            title: item.title,
            poster_url: item.posterImage || "",
          }),
        }).catch(() => {});
      }
    } catch { /* silent */ }
  }, [tmdbId, item.title, item.type, item.posterImage, isTV, addToHistory, mediaType]);

  // Smart fallback: auto-try next server on timeout
  const tryNextServer = useCallback(() => {
    setTriedServers((prev) => {
      const next = new Set(prev);
      next.add(activeServerIndex);

      // Find next untried server
      let found = false;
      for (let i = 0; i < SERVERS.length; i++) {
        if (!next.has(i)) {
          setActiveServerIndex(i);
          setPlayerState("loading");
          setFallbackInProgress(true);
          setIframeKey((k) => k + 1);
          found = true;
          break;
        }
      }

      if (!found) {
        // All servers exhausted
        setPlayerState("all-exhausted");
      }

      return next;
    });
  }, [activeServerIndex]);

  // Clear load timer and set new one when server changes
  useEffect(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
    }

    if (playerState === "loading") {
      loadTimerRef.current = setTimeout(() => {
        // Timeout — try next server
        setPlayerState("error");
      }, LOAD_TIMEOUT_MS);
    }

    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current);
      }
    };
  }, [playerState, iframeKey]);

  const handleServerChange = useCallback((index: number) => {
    setActiveServerIndex(index);
    setTriedServers(new Set([index]));
    setPlayerState("loading");
    setFallbackInProgress(false);
    setIframeKey((k) => k + 1);
  }, []);

  const handleEpisodeChange = useCallback((s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
    setTriedServers(new Set());
    setPlayerState("loading");
    setFallbackInProgress(false);
    setIframeKey((k) => k + 1);
  }, []);

  const handleIframeLoad = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
    }
    setPlayerState("playing");
    setFallbackInProgress(false);
    trackHistory(season, episode);
  }, [season, episode, trackHistory]);

  const handleIframeError = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current);
    }
    setPlayerState("error");
  }, []);

  // Toggle Picture-in-Picture
  const togglePip = useCallback(async () => {
    if (isPipActive && pipWindowRef.current) {
      pipWindowRef.current.close();
      return;
    }

    try {
      // @ts-expect-error Document Picture-in-Picture API (Chrome 116+)
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: 854,
        height: 480,
      });

      pipWindowRef.current = pipWindow;
      setIsPipActive(true);

      // Style the PiP window to match our dark theme
      const styleEl = pipWindow.document.createElement('style');
      styleEl.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000; overflow: hidden; width: 100vw; height: 100vh; }
        iframe { width: 100%; height: 100%; border: none; }
      `;
      pipWindow.document.head.appendChild(styleEl);

      // Create a new iframe with the current embed URL
      const pipIframe = pipWindow.document.createElement('iframe');
      pipIframe.src = embedUrl;
      pipIframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      pipIframe.allowFullscreen = true;
      pipIframe.title = `${item.title} - PiP`;
      pipWindow.document.body.appendChild(pipIframe);

      // Listen for PiP window close
      pipWindow.addEventListener('pagehide', () => {
        setIsPipActive(false);
        pipWindowRef.current = null;
      });

    } catch (err) {
      console.error('Picture-in-Picture failed:', err);
      setIsPipActive(false);
      pipWindowRef.current = null;
    }
  }, [isPipActive, embedUrl, item.title]);

  // Clean up PiP window on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
  }, []);

  // Auto-advance on error
  useEffect(() => {
    if (playerState === "error") {
      const timer = setTimeout(() => {
        tryNextServer();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [playerState, tryNextServer]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/90 backdrop-blur-md border-b border-streamex-border z-10 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Back</span>
        </button>
        {/* PiP button */}
        {isPipSupported && playerState === 'playing' && (
          <button
            onClick={togglePip}
            className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
              isPipActive
                ? 'text-streamex-accent'
                : 'text-streamex-text-secondary hover:text-white'
            }`}
            title={isPipActive ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
          >
            <PictureInPicture2 size={16} className={isPipActive ? 'fill-streamex-accent' : ''} />
            <span className="hidden sm:inline">{isPipActive ? 'PiP On' : 'PiP'}</span>
          </button>
        )}
        {onMiniPlayer && (
          <button
            onClick={() => onMiniPlayer(activeServerIndex, season, episode)}
            className="flex items-center gap-1.5 text-sm text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
            title="Mini Player"
          >
            <Minimize2 size={16} />
            <span className="hidden sm:inline">Mini Player</span>
          </button>
        )}
        <h3 className="text-sm font-medium text-white truncate px-4">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-streamex-text-secondary">
          <MonitorUp size={14} />
          <span className="hidden sm:inline">{activeServer.description}</span>
          {activeServer.hasSubtitles && (
            <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-bold uppercase bg-emerald-400/10 px-1.5 py-0.5 rounded">
              <Subtitles size={10} />
              CC
            </span>
          )}
        </div>
      </div>

      {/* Player area */}
      <div className="relative flex-1 bg-black min-h-0">
        {/* Loading overlay */}
        <AnimatePresence>
          {playerState === "loading" && (
            <motion.div
              key={`loader-${iframeKey}`}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
            >
              <Loader2 className="animate-spin text-streamex-accent mb-3" size={40} />
              <p className="text-sm text-streamex-text-secondary mb-1">
                {fallbackInProgress ? `Trying ${activeServer.description}…` : `Loading from ${activeServer.description}…`}
              </p>
              {fallbackInProgress && (
                <p className="text-[10px] text-streamex-text-secondary/60">
                  Auto-switching to next available server
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error overlay — brief flash before auto-fallback */}
        <AnimatePresence>
          {playerState === "error" && (
            <motion.div
              key="error-flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
            >
              <RefreshCw className="animate-spin text-streamex-accent mb-2" size={24} />
              <p className="text-xs text-streamex-text-secondary">
                {activeServer.description} unavailable — switching…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All servers exhausted */}
        <AnimatePresence>
          {playerState === "all-exhausted" && (
            <motion.div
              key="all-exhausted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
            >
              <XCircle className="text-red-500 mb-3" size={40} />
              <p className="text-sm text-white mb-1">No servers available</p>
              <p className="text-xs text-streamex-text-secondary mb-4">
                All {SERVERS.length} servers were tried for this title
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTriedServers(new Set());
                    setPlayerState("loading");
                    setFallbackInProgress(false);
                    setIframeKey((k) => k + 1);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-streamex-accent hover:bg-streamex-accent-hover text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Retry All
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          key={iframeKey}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          referrerPolicy="origin"
          title={`${item.title} - ${activeServer.description}`}
        />
      </div>

      {/* Bottom panel */}
      <div className="bg-[#0a0a0a] border-t border-streamex-border flex-shrink-0 overflow-y-auto max-h-[45vh] custom-scrollbar">
        {/* Server switcher */}
        <div className="px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-2.5">
            <Zap size={12} className="text-streamex-accent" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-streamex-text-secondary">
              Stream Source
            </span>
            {playerState === "playing" && (
              <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded uppercase font-bold">
                <CheckCircle2 size={8} />
                Connected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVERS.map((server, idx) => {
              const isActive = idx === activeServerIndex;
              const wasTried = triedServers.has(idx);
              const isPlaying = isActive && playerState === "playing";

              return (
                <button
                  key={server.id}
                  onClick={() => handleServerChange(idx)}
                  className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer group ${
                    isPlaying
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                      : isActive
                        ? "bg-streamex-accent text-white shadow-lg shadow-streamex-accent/20"
                        : wasTried
                          ? "bg-white/3 text-streamex-text-secondary/40 border border-streamex-border/30 opacity-60"
                          : "bg-white/5 text-streamex-text-secondary hover:text-white hover:bg-white/10 border border-streamex-border"
                  }`}
                >
                  {isPlaying && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                  <span className="font-bold">{server.name}</span>
                  {server.hasSubtitles && (
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">CC</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Episode selector (TV Series only) */}
        {isTV && (
          <div className="px-4 sm:px-6 py-3 border-t border-streamex-border">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-streamex-text-secondary whitespace-nowrap">
                  Season
                </label>
                <select
                  value={season}
                  onChange={(e) => handleEpisodeChange(Number(e.target.value), 1)}
                  className="bg-[#1a1a1a] border border-streamex-border rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-streamex-accent cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                >
                  {Array.from({ length: seasonsCount }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Season {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-streamex-text-secondary whitespace-nowrap">
                  Episode
                </label>
                <select
                  value={episode}
                  onChange={(e) => handleEpisodeChange(season, Number(e.target.value))}
                  className="bg-[#1a1a1a] border border-streamex-border rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-streamex-accent cursor-pointer [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                >
                  {Array.from({ length: currentSeasonEpisodes }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Episode {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Media info bar */}
        <div className="px-4 sm:px-6 py-3 border-t border-streamex-border">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-bold text-white">{item.title}</h2>
            <span className="flex items-center gap-1 text-sm">
              <Star className="fill-yellow-500 text-yellow-500" size={13} />
              <span className="text-white font-semibold">{item.rating.toFixed(1)}</span>
            </span>
            <span className="text-sm text-streamex-text-secondary">{item.year || "—"}</span>
            {isLegacyItem(item) && item.runtime && (
              <span className="flex items-center gap-1 text-sm text-streamex-text-secondary">
                <Clock size={12} />
                {item.runtime}
              </span>
            )}
            {isTV && (
              <span className="flex items-center gap-1 text-sm text-streamex-text-secondary">
                <Tv size={12} />
                {seasonsCount} Season{seasonsCount > 1 ? "s" : ""}
              </span>
            )}
            {isTV && (
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white">
                S{String(season).padStart(2, "0")}E{String(episode).padStart(2, "0")}
              </span>
            )}
            {item.genres.length > 0 && (
              <div className="flex gap-1.5 ml-1">
                {item.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-streamex-text-secondary"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
