"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Star,
  Clock,
  Tv,
  Calendar,
  ChevronLeft,
  ChevronDown,
  Heart,
  Share2,
  Subtitles,
  Zap,
  Clapperboard,
  X,
} from "lucide-react";
import type { CardItem, LiveMediaItem, MediaItem } from "@/lib/mock-data";
import { VideoPlayer } from "./video-player";
import { MediaCard } from "./media-card";
import { SERVERS } from "@/lib/mock-data";
import { useFavoritesStore, type FavoriteItem } from "@/lib/favorites-store";

function isLegacyItem(item: CardItem): item is MediaItem {
  return "posterGradient" in item;
}

function isLiveItem(item: CardItem): item is LiveMediaItem {
  return "backdropImage" in item;
}

interface MovieDetailProps {
  item: CardItem;
  similarItems: CardItem[];
  onBack: () => void;
  onMiniPlayer?: (item: CardItem, serverIndex: number, season: number, episode: number) => void;
}

interface TrailerItem {
  key: string;
  name: string;
  embedUrl: string;
}

export function MovieDetail({ item, similarItems, onBack, onMiniPlayer }: MovieDetailProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [initialServerIndex, setInitialServerIndex] = useState(0);

  // Trailer state
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerName, setTrailerName] = useState("");
  const [allTrailers, setAllTrailers] = useState<TrailerItem[]>([]);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [showTrailerDropdown, setShowTrailerDropdown] = useState(false);
  const trailerDropdownRef = useRef<HTMLDivElement>(null);

  const isFav = useFavoritesStore((s) => s.isFavorite(item.tmdb_id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

  // Record view event for trending analytics
  const viewRecordedRef = useRef(false);
  useEffect(() => {
    if (viewRecordedRef.current || !item.tmdb_id) return;
    viewRecordedRef.current = true;
    try {
      fetch("/api/trending-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: item.tmdb_id,
          title: item.title,
          type: item.type,
          posterImage: item.posterImage || "",
        }),
      });
    } catch {
      // silent — never crash the UI for analytics
    }
  }, [item.tmdb_id, item.title, item.type, item.posterImage]);

  const handlePlay = useCallback((serverIndex: number = 0) => {
    setInitialServerIndex(serverIndex);
    setShowPlayer(true);
  }, []);

  const handleToggleFavorite = useCallback(() => {
    const favItem: FavoriteItem = {
      tmdb_id: item.tmdb_id,
      title: item.title,
      type: item.type,
      posterImage: item.posterImage || "",
      year: item.year || 0,
      rating: item.rating || 0,
    };
    toggleFavorite(favItem);
  }, [item, toggleFavorite]);

  // Fetch trailer when modal opens
  useEffect(() => {
    if (!showTrailer) return;
    const mediaType = (item.type === "TV Series" || item.type === "tv" || item.type === "Anime") ? "tv" : "movie";
    const tmdbId = item.tmdb_id;

    (async () => {
      try {
        const res = await fetch(`/api/tmdb/trailer?tmdb_id=${tmdbId}&type=${mediaType}`);
        const data = await res.json();
        const trailer = data?.trailer;
        const trailers: TrailerItem[] = data?.allTrailers || [];
        if (trailer) {
          setTrailerUrl(trailer.embedUrl || `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`);
          setTrailerName(trailer.name || "Trailer");
          setAllTrailers(trailers);
        } else if (trailers.length > 0) {
          setTrailerUrl(trailers[0].embedUrl || `https://www.youtube.com/embed/${trailers[0].key}?autoplay=1&rel=0`);
          setTrailerName(trailers[0].name || "Trailer");
          setAllTrailers(trailers);
        }
      } catch {
        // silent fail
      }
      setTrailerLoading(false);
    })();
  }, [showTrailer, item.tmdb_id, item.type]);

  // Close trailer dropdown on outside click
  useEffect(() => {
    if (!showTrailerDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (trailerDropdownRef.current && !trailerDropdownRef.current.contains(e.target as Node)) {
        setShowTrailerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTrailerDropdown]);

  const handleSwitchTrailer = useCallback((trailer: TrailerItem) => {
    setTrailerUrl(trailer.embedUrl || `https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`);
    setTrailerName(trailer.name || "Trailer");
    setShowTrailerDropdown(false);
  }, []);

  if (showPlayer) {
    return (
      <VideoPlayer
        item={item}
        onClose={() => setShowPlayer(false)}
        onMiniPlayer={
          onMiniPlayer
            ? (serverIndex, season, episode) => onMiniPlayer(item, serverIndex, season, episode)
            : undefined
        }
        initialServerIndex={initialServerIndex}
      />
    );
  }

  const isTV = item.type === "TV Series" || item.type === "tv" || item.type === "Anime";
  const backdropSrc = isLiveItem(item) ? item.backdropImage : "/streamex/hero-bg.png";
  const runtime = isLegacyItem(item) ? item.runtime : undefined;
  const legacySeasons = isLegacyItem(item) ? item.seasons : undefined;
  const liveSeasons = isLiveItem(item) ? item.numberOfSeasons : undefined;
  const seasonsCount = legacySeasons || liveSeasons;

  const ccServers = SERVERS.filter(s => s.hasSubtitles).map(s => s.description).join(", ");

  return (
    <div className="min-h-full">
      {/* Backdrop Hero */}
      <div className="relative w-full h-[55vh] min-h-[380px] max-h-[520px] overflow-hidden">
        {backdropSrc && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${backdropSrc})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br opacity-50 from-red-950/40 via-black to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent h-48 bottom-0 left-0 right-0" />

        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={onBack}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm hover:bg-black/70 transition-colors cursor-pointer border border-white/10"
        >
          <ChevronLeft size={16} />
          Back
        </motion.button>

        <div className="relative z-10 flex items-end h-full px-6 sm:px-8 pb-10">
          <motion.div
            className="flex gap-6 max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="hidden sm:block flex-shrink-0 w-40 md:w-48">
              <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-black/60">
                <img
                  src={item.posterImage || ""}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>

            <div className="flex-1 pb-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
                {item.title}
              </h1>

              <div className="flex items-center gap-3 text-sm text-streamex-text-secondary mb-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Star className="fill-yellow-500 text-yellow-500" size={15} />
                  <span className="text-white font-bold text-base">{item.rating.toFixed(1)}</span>
                  <span className="text-yellow-500/70">/10</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {item.year || "—"}
                </span>
                {runtime && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {runtime}
                    </span>
                  </>
                )}
                {seasonsCount && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                    <span className="flex items-center gap-1">
                      <Tv size={13} />
                      {seasonsCount} Season{seasonsCount > 1 ? "s" : ""}
                    </span>
                  </>
                )}
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                <span className="px-2 py-0.5 border border-white/20 rounded text-xs">
                  {item.type}
                </span>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                {item.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-2.5 py-1 border border-streamex-border rounded-md text-xs text-streamex-text-secondary hover:text-white hover:border-white/30 transition-colors cursor-pointer"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p className="text-sm text-streamex-text-secondary leading-relaxed mb-5 max-w-xl">
                {item.description}
              </p>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handlePlay(0)}
                  className="flex items-center gap-2 px-7 py-3 bg-streamex-accent hover:bg-streamex-accent-hover text-white rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-streamex-accent/25 hover:shadow-streamex-accent/40 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Play size={18} fill="white" />
                  Play Now
                </button>
                <button
                  onClick={() => { setTrailerUrl(""); setTrailerName(""); setAllTrailers([]); setTrailerLoading(true); setShowTrailer(true); }}
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer backdrop-blur-sm hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Clapperboard size={16} />
                  Trailer
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer border ${
                    isFav
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-white/5 border-streamex-border text-streamex-text-secondary hover:text-white hover:border-white/20"
                  }`}
                >
                  <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                  {isFav ? "Favorited" : "Favorite"}
                </button>
                <button className="p-3 rounded-lg bg-white/5 border border-streamex-border text-streamex-text-secondary hover:text-white hover:border-white/20 transition-all duration-200 cursor-pointer">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Server Quick-Select */}
      <div className="px-6 sm:px-8 py-6 border-b border-streamex-border">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap size={14} className="text-streamex-accent" />
            <h3 className="text-sm font-bold text-white">Choose a Server</h3>
            <span className="text-[10px] text-streamex-text-secondary px-2 py-0.5 rounded bg-white/5">
              {SERVERS.length} sources · Auto-fallback enabled
            </span>
            {ccServers && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400/80 bg-emerald-400/10 px-2 py-0.5 rounded">
                <Subtitles size={10} />
                {ccServers} have subtitles
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {SERVERS.map((server, idx) => (
              <button
                key={server.id}
                onClick={() => handlePlay(idx)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-streamex-surface hover:bg-streamex-surface-hover border border-streamex-border hover:border-streamex-accent/50 text-white transition-all duration-200 cursor-pointer group relative"
              >
                {server.hasSubtitles && (
                  <span className="absolute top-2 right-2 text-[8px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-bold uppercase">
                    CC
                  </span>
                )}
                <Play
                  size={18}
                  className="text-streamex-text-secondary group-hover:text-streamex-accent transition-colors flex-shrink-0"
                />
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold truncate">{server.name}</p>
                  <p className="text-[10px] text-streamex-text-secondary truncate">{server.description}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-streamex-text-secondary/50 mt-3">
            If a server doesn&apos;t load, the player automatically switches to the next available source.
          </p>
        </motion.div>
      </div>

      {/* Similar Titles */}
      {similarItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-6 sm:px-8 py-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">You May Also Like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {similarItems.slice(0, 12).map((simItem, i) => (
              <MediaCard key={simItem.id} item={simItem} index={i} onSelect={handlePlay} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Dark overlay */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowTrailer(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal content */}
            <motion.div
              className="relative z-10 w-full max-w-3xl bg-streamex-surface rounded-xl border border-streamex-border shadow-2xl shadow-black/60 overflow-hidden"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-streamex-border">
                <div className="flex items-center gap-3 min-w-0">
                  <Clapperboard size={16} className="text-streamex-accent flex-shrink-0" />
                  <h3 className="text-sm font-bold text-white truncate">{trailerName || "Loading trailer..."}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Switch Trailer Dropdown */}
                  {allTrailers.length > 1 && (
                    <div className="relative" ref={trailerDropdownRef}>
                      <button
                        onClick={() => setShowTrailerDropdown(!showTrailerDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-streamex-border text-xs text-streamex-text-secondary hover:text-white hover:border-white/20 transition-all cursor-pointer"
                      >
                        Switch Trailer
                        <ChevronDown size={12} className={`transition-transform duration-200 ${showTrailerDropdown ? "rotate-180" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {showTrailerDropdown && (
                          <motion.div
                            className="absolute right-0 top-full mt-1 w-64 max-h-60 overflow-y-auto bg-streamex-surface border border-streamex-border rounded-lg shadow-xl shadow-black/50 z-50"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            {allTrailers.map((t, idx) => (
                              <button
                                key={t.key}
                                onClick={() => handleSwitchTrailer(t)}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                                  trailerUrl.includes(t.key)
                                    ? "bg-streamex-accent/10 text-streamex-accent"
                                    : "text-streamex-text-secondary hover:text-white hover:bg-white/5"
                                } ${idx < allTrailers.length - 1 ? "border-b border-streamex-border/50" : ""}`}
                              >
                                <Play size={10} className="flex-shrink-0" />
                                <span className="truncate">{t.name}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {/* Close button */}
                  <button
                    onClick={() => setShowTrailer(false)}
                    className="p-2 rounded-lg bg-white/5 border border-streamex-border text-streamex-text-secondary hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Video iframe */}
              <div className="relative w-full aspect-video bg-black">
                {trailerLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-streamex-accent/30 border-t-streamex-accent rounded-full animate-spin" />
                    <span className="text-xs text-streamex-text-secondary">Loading trailer...</span>
                  </div>
                ) : trailerUrl ? (
                  <iframe
                    src={trailerUrl}
                    title={trailerName}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Clapperboard size={32} className="text-streamex-text-secondary/40" />
                    <span className="text-sm text-streamex-text-secondary">No trailer available</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-streamex-border px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
          <p>&copy; 2025 Flux Stream. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
