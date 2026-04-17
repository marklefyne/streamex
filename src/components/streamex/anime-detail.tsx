"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Star,
  Calendar,
  Tv,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
  SkipForward,
  ExternalLink,
  Zap,
  Shield,
  RefreshCw,
  Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AnimeItem {
  id: string;
  malId: number;
  title: string;
  japaneseTitle: string;
  posterImage: string;
  bannerImage: string;
  description: string;
  rating: number;
  year: number;
  episodes: number;
  status: string;
  type: string;
  genres: string[];
  studios: string[];
  hasSub: boolean;
  hasDub: boolean;
}

interface EpisodeInfo {
  number: number;
  title: string;
  titleJapanese: string;
  aired: string | null;
  isFiller: boolean;
  isRecap: boolean;
  malId: number;
}

interface ServerInfo {
  id: string;
  name: string;
  url: string;
  type: "iframe";
}

interface AnimeDetailProps {
  anime: AnimeItem;
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ANIME_ACCENT = "#22C55E";
const IFRAME_TIMEOUT = 8000; // 8 seconds

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const pageTransition = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

/* ------------------------------------------------------------------ */
/*  Custom scrollbar styles                                            */
/* ------------------------------------------------------------------ */

function ScrollbarStyles() {
  return (
    <style jsx global>{`
      .anime-episode-scroll::-webkit-scrollbar {
        width: 5px;
      }
      .anime-episode-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .anime-episode-scroll::-webkit-scrollbar-thumb {
        background: rgba(34, 197, 94, 0.25);
        border-radius: 10px;
      }
      .anime-episode-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(34, 197, 94, 0.4);
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/*  Main AnimeDetail Component                                         */
/* ------------------------------------------------------------------ */

export function AnimeDetail({ anime, onBack }: AnimeDetailProps) {
  /* ---- Episode state ---- */
  const [episodes, setEpisodes] = useState<EpisodeInfo[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [episodesError, setEpisodesError] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [currentSeason, setCurrentSeason] = useState(1);

  /* ---- Server state ---- */
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [activeServer, setActiveServer] = useState(0);
  const [serversLoading, setServersLoading] = useState(true);
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  /* ---- Player state ---- */
  const [playerKey, setPlayerKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [triedServers, setTriedServers] = useState<Set<number>>(new Set());
  const [allServersFailed, setAllServersFailed] = useState(false);
  const [failingMessage, setFailingMessage] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const episodeListRef = useRef<HTMLDivElement>(null);

  /* ---- Fetch episode list from Jikan ---- */
  useEffect(() => {
    let cancelled = false;

    async function fetchEpisodes() {
      setEpisodesLoading(true);
      setEpisodesError(null);
      try {
        const res = await fetch(`/api/anime/info/${anime.malId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const epList = data.episodes || [];
        setEpisodes(epList);
        if (epList.length > 0) {
          setCurrentEpisode(1);
        }
      } catch (err) {
        if (!cancelled) {
          setEpisodesError(err instanceof Error ? err.message : "Failed to load episodes");
        }
      } finally {
        if (!cancelled) setEpisodesLoading(false);
      }
    }

    fetchEpisodes();
    return () => { cancelled = true; };
  }, [anime.malId]);

  /* ---- Fetch server URLs ---- */
  const fetchServers = useCallback(async (ep: number, season: number) => {
    setServersLoading(true);
    setIframeLoading(true);
    setIframeError(false);
    setAllServersFailed(false);
    setTriedServers(new Set());
    setFailingMessage("");
    setUseCustomUrl(false);

    try {
      const res = await fetch(
        `/api/anime/watch?mal_id=${anime.malId}&episode=${ep}&season=${season}&tmdb_id=${tmdbId ?? ""}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const serverList = data.servers || [];
      setServers(serverList);
      setTmdbId(data.tmdb_id || null);
      setIsFallback(data.fallback || false);
      setActiveServer(0);
      setPlayerKey((k) => k + 1);
    } catch {
      setServers([]);
      setIframeError(true);
    } finally {
      setServersLoading(false);
    }
  }, [anime.malId, tmdbId]);

  /* ---- Load servers when episode changes ---- */
  useEffect(() => {
    fetchServers(currentEpisode, currentSeason);
  }, [currentEpisode, currentSeason, fetchServers]);

  /* ---- Iframe load/error handling with auto-failover ---- */
  const handleIframeLoad = useCallback(() => {
    // Clear any pending timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    setIframeLoading(false);
    setIframeError(false);
    setFailingMessage("");
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeLoading(false);
    setIframeError(true);
    triggerFailover();
  }, []);

  /* ---- Auto-failover logic ---- */
  const triggerFailover = useCallback(() => {
    setTriedServers((prev) => {
      const next = new Set(prev);
      next.add(activeServer);
      return next;
    });
    setFailingMessage(`Server ${activeServer + 1} failed, trying next...`);
  }, [activeServer]);

  /* ---- Watch for triedServers changes to switch server ---- */
  useEffect(() => {
    if (triedServers.size === 0) return;

    const nextServerIdx = servers.findIndex((_, idx) => !triedServers.has(idx));

    if (nextServerIdx === -1) {
      // All servers tried and failed
      setAllServersFailed(true);
      setFailingMessage("All servers failed to load this episode.");
      return;
    }

    // Auto-switch to next server after a brief delay
    const timer = setTimeout(() => {
      setActiveServer(nextServerIdx);
      setIframeLoading(true);
      setIframeError(false);
      setPlayerKey((k) => k + 1);
      setFailingMessage("");
    }, 1200);

    return () => clearTimeout(timer);
  }, [triedServers, servers]);

  /* ---- Iframe timeout: if iframe doesn't fire load within 8s, try next ---- */
  useEffect(() => {
    if (!iframeLoading || servers.length === 0) return;

    loadingTimeoutRef.current = setTimeout(() => {
      setIframeLoading(false);
      setIframeError(true);
      triggerFailover();
    }, IFRAME_TIMEOUT);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [iframeLoading, playerKey, servers.length, triggerFailover]);

  /* ---- Episode selection ---- */
  const handleSelectEpisode = useCallback((epNum: number) => {
    setCurrentEpisode(epNum);
    setTmdbId(null); // Let fetchServers resolve fresh
  }, []);

  /* ---- Server manual switch ---- */
  const handleServerSwitch = useCallback((idx: number) => {
    setActiveServer(idx);
    setIframeLoading(true);
    setIframeError(false);
    setAllServersFailed(false);
    setFailingMessage("");
    setTriedServers(new Set());
    setUseCustomUrl(false);
    setPlayerKey((k) => k + 1);
  }, []);

  /* ---- Next episode ---- */
  const handleNextEpisode = useCallback(() => {
    if (currentEpisode < (episodes.length || anime.episodes)) {
      handleSelectEpisode(currentEpisode + 1);
      if (episodeListRef.current) {
        const nextEl = episodeListRef.current.querySelector(
          `[data-episode="${currentEpisode + 1}"]`
        );
        nextEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentEpisode, episodes.length, anime.episodes, handleSelectEpisode]);

  /* ---- Retry all servers ---- */
  const handleRetryAll = useCallback(() => {
    setTriedServers(new Set());
    setAllServersFailed(false);
    setActiveServer(0);
    setIframeLoading(true);
    setIframeError(false);
    setFailingMessage("");
    setUseCustomUrl(false);
    setPlayerKey((k) => k + 1);
  }, []);

  /* ---- Play custom URL ---- */
  const handlePlayCustom = useCallback(() => {
    if (!customUrl.trim()) return;
    setUseCustomUrl(true);
    setActiveServer(-1);
    setIframeLoading(true);
    setIframeError(false);
    setAllServersFailed(false);
    setFailingMessage("");
    setPlayerKey((k) => k + 1);
  }, [customUrl]);

  /* ---- Current player URL ---- */
  const currentPlayerUrl = useCustomUrl
    ? customUrl
    : servers[activeServer]?.url || "";

  /* ---- Derived ---- */
  const hasMoreEpisodes = currentEpisode < (episodes.length || anime.episodes);
  const statusColor =
    anime.status === "Currently Airing"
      ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20"
      : anime.status === "Finished Airing"
        ? "bg-blue-500/15 text-blue-400 ring-blue-500/20"
        : anime.status === "Not yet aired"
          ? "bg-amber-500/15 text-amber-400 ring-amber-500/20"
          : "bg-white/10 text-gray-400 ring-white/10";

  return (
    <div className="min-h-screen bg-[#080808]">
      <ScrollbarStyles />

      {/* ---- Top Bar ---- */}
      <div className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </motion.button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white truncate">
              {anime.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-500">
                Episode {currentEpisode} / {episodes.length || anime.episodes || "?"}
              </span>
              {isFallback && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20 font-medium">
                  Fallback Mode
                </span>
              )}
            </div>
          </div>

          <span
            className={`hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ring-1 ${statusColor}`}
          >
            {anime.status}
          </span>

          {hasMoreEpisodes && (
            <button
              onClick={handleNextEpisode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all cursor-pointer"
            >
              Next Ep
              <SkipForward size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ---- Main Content ---- */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* ---- Left: Player Area ---- */}
          <div className="flex-1 min-w-0">
            {/* Player Container */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/[0.06]">
              {serversLoading ? (
                /* Loading state */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-emerald-400" size={32} />
                  <span className="text-sm text-gray-400">Loading servers...</span>
                </div>
              ) : currentPlayerUrl ? (
                /* Iframe player */
                <>
                  <iframe
                    key={`player-${playerKey}-${activeServer}`}
                    ref={iframeRef}
                    src={currentPlayerUrl}
                    title={`${anime.title} - Episode ${currentEpisode}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    style={{ border: "none" }}
                  />

                  {/* Loading overlay */}
                  {iframeLoading && (
                    <motion.div
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <Play
                          size={16}
                          className="absolute inset-0 m-auto text-emerald-400"
                        />
                      </div>
                      <span className="text-xs text-gray-400">
                        Loading {servers[activeServer]?.name || "player"}...
                      </span>
                    </motion.div>
                  )}

                  {/* Failover message */}
                  {failingMessage && !allServersFailed && (
                    <motion.div
                      className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/20 backdrop-blur-sm"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <RefreshCw size={12} className="text-amber-400 animate-spin" />
                      <span className="text-xs text-amber-300 font-medium">
                        {failingMessage}
                      </span>
                    </motion.div>
                  )}

                  {/* All servers failed */}
                  {allServersFailed && (
                    <motion.div
                      className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20 p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                        <AlertCircle size={28} className="text-red-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white font-medium mb-1">
                          All servers failed
                        </p>
                        <p className="text-xs text-gray-500 max-w-xs">
                          Try the next episode or enter a custom streaming URL below.
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {hasMoreEpisodes && (
                          <button
                            onClick={handleNextEpisode}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                          >
                            <SkipForward size={12} />
                            Next Episode
                          </button>
                        )}
                        <button
                          onClick={handleRetryAll}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          <RefreshCw size={12} />
                          Retry All
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                /* No servers available */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <AlertCircle size={28} className="text-gray-600" />
                  <span className="text-sm text-gray-500">No servers available</span>
                  <button
                    onClick={() => fetchServers(currentEpisode, currentSeason)}
                    className="flex items-center gap-1.5 px-4 py-2 mt-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* ---- Server Switch Buttons ---- */}
            {!serversLoading && servers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={12} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white">Servers</span>
                  <span className="text-[10px] text-gray-600">
                    Auto-failover enabled
                  </span>
                  {triedServers.size > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                      Tried {triedServers.size}/{servers.length}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {servers.map((server, idx) => (
                    <button
                      key={server.id}
                      onClick={() => handleServerSwitch(idx)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                        idx === activeServer && !useCustomUrl
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : triedServers.has(idx)
                            ? "bg-red-500/5 border-red-500/20 text-red-400/60 line-through"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {idx === activeServer && !useCustomUrl && (
                        <Play size={10} className="fill-current" />
                      )}
                      {triedServers.has(idx) && idx !== activeServer && (
                        <AlertCircle size={10} />
                      )}
                      <Shield size={10} className="opacity-40" />
                      {server.name}
                    </button>
                  ))}
                  {/* Custom URL button */}
                  <button
                    onClick={() => {
                      setUseCustomUrl(true);
                      setActiveServer(-1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                      useCustomUrl
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <ExternalLink size={10} />
                    Custom URL
                  </button>
                </div>

                {/* Custom URL input */}
                <AnimatePresence>
                  {useCustomUrl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePlayCustom()}
                          placeholder="Paste embed URL (e.g. https://vidsrc.to/embed/...)"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                        />
                        <button
                          onClick={handlePlayCustom}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                        >
                          <Play size={10} className="fill-current" />
                          Play
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ---- Anime Info (below player, mobile-friendly) ---- */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
            >
              <div className="flex gap-4">
                {/* Poster */}
                <div className="hidden sm:block flex-shrink-0">
                  <div className="w-20 h-28 rounded-lg overflow-hidden ring-1 ring-white/[0.08]">
                    {anime.posterImage ? (
                      <img
                        src={anime.posterImage}
                        alt={anime.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-950/40 to-gray-900 flex items-center justify-center">
                        <Tv size={20} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-white truncate mb-1">
                    {anime.title}
                  </h2>
                  {anime.japaneseTitle && (
                    <p className="text-[11px] text-gray-500 truncate mb-2">
                      {anime.japaneseTitle}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                    {anime.rating > 0 && (
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Star size={10} className="fill-current" />
                        {anime.rating.toFixed(1)}
                      </span>
                    )}
                    {anime.year > 0 && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {anime.year}
                      </span>
                    )}
                    {anime.type && (
                      <span className="flex items-center gap-1">
                        <Tv size={10} />
                        {anime.type}
                      </span>
                    )}
                    {anime.episodes > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {anime.episodes} episodes
                      </span>
                    )}
                    {anime.studios.length > 0 && (
                      <span className="text-gray-600">
                        {anime.studios[0]}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {anime.genres.map((g) => (
                      <span
                        key={g}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/[0.04]"
                      >
                        {g}
                      </span>
                    ))}
                    {anime.hasSub && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase">
                        Sub
                      </span>
                    )}
                    {anime.hasDub && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase">
                        Dub
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description (expandable) */}
              {anime.description && (
                <p className="mt-3 text-[11px] text-gray-500 leading-relaxed line-clamp-3">
                  {anime.description}
                </p>
              )}
            </motion.div>
          </div>

          {/* ---- Right: Episode List ---- */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Info size={13} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Episodes</h3>
              {episodes.length > 0 && (
                <span className="text-[10px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md">
                  {episodes.length}
                </span>
              )}
            </div>

            <div
              ref={episodeListRef}
              className="anime-episode-scroll max-h-[70vh] overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              {episodesLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="animate-spin text-emerald-400" size={24} />
                  <span className="text-xs text-gray-500">Loading episodes...</span>
                </div>
              ) : episodesError ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <AlertCircle size={24} className="text-red-400/60" />
                  <span className="text-xs text-gray-500">{episodesError}</span>
                  <button
                    onClick={() => {
                      setEpisodesLoading(true);
                      setEpisodesError(null);
                      // Trigger a re-fetch by changing a temp state
                      fetch(`/api/anime/info/${anime.malId}`)
                        .then((r) => r.json())
                        .then((data) => setEpisodes(data.episodes || []))
                        .catch(() => setEpisodesError("Failed to load"))
                        .finally(() => setEpisodesLoading(false));
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : episodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Info size={24} className="text-gray-600" />
                  <span className="text-xs text-gray-500">
                    No episode data available
                  </span>
                  <span className="text-[10px] text-gray-700">
                    Try selecting a server to start playing
                  </span>
                </div>
              ) : (
                <AnimatePresence>
                  {episodes.map((ep) => {
                    const isActive = ep.number === currentEpisode;
                    return (
                      <motion.button
                        key={ep.number}
                        data-episode={ep.number}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(ep.number * 0.01, 0.3) }}
                        onClick={() => handleSelectEpisode(ep.number)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-all cursor-pointer border-b border-white/[0.04] last:border-b-0 ${
                          isActive
                            ? "bg-emerald-500/10 border-l-2 border-l-emerald-500"
                            : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                        }`}
                      >
                        {/* Episode number */}
                        <div
                          className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold ${
                            isActive
                              ? "bg-emerald-500 text-black"
                              : "bg-white/5 text-gray-500"
                          }`}
                        >
                          {isActive ? (
                            <Play size={10} className="fill-current" />
                          ) : (
                            ep.number
                          )}
                        </div>

                        {/* Episode info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-medium truncate ${
                              isActive ? "text-emerald-400" : "text-white/80"
                            }`}
                          >
                            {ep.title || `Episode ${ep.number}`}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {ep.aired && (
                              <span className="text-[9px] text-gray-600">
                                {new Date(ep.aired).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {ep.isFiller && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold uppercase tracking-wide">
                                Filler
                              </span>
                            )}
                            {ep.isRecap && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold uppercase tracking-wide">
                                Recap
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chevron for active */}
                        {isActive && (
                          <ChevronRight
                            size={14}
                            className="flex-shrink-0 text-emerald-400 mt-1"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
