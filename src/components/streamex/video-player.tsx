"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Star,
  Clock,
  Tv,
  ChevronLeft,
  Loader2,
  MonitorUp,
} from "lucide-react";
import type { CardItem, LiveMediaItem, MediaItem } from "@/lib/mock-data";
import { getEmbedUrl, SERVERS } from "@/lib/mock-data";

function isLegacyItem(item: CardItem): item is MediaItem {
  return "posterGradient" in item;
}

interface VideoPlayerProps {
  item: CardItem;
  onClose: () => void;
}

export function VideoPlayer({ item, onClose }: VideoPlayerProps) {
  const [activeServer, setActiveServer] = useState(SERVERS[0].id);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const tmdbId = item.tmdb_id;
  const isTV = item.type === "TV Series" || item.type === "tv" || item.type === "Anime";
  const mediaType = isTV ? "tv" : "movie";
  const embedUrl = getEmbedUrl(tmdbId, mediaType, activeServer, season, episode);
  const seasonsCount = isLegacyItem(item) ? (item.seasons || 1) : 1;

  const handleServerChange = useCallback((serverId: string) => {
    setActiveServer(serverId);
    setIsLoading(true);
    setIframeKey((k) => k + 1);
  }, []);

  const handleEpisodeChange = useCallback((s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
    setIsLoading(true);
    setIframeKey((k) => k + 1);
  }, []);

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
        <h3 className="text-sm font-medium text-white truncate px-4">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-streamex-text-secondary">
          <MonitorUp size={14} />
          <span className="hidden sm:inline">
            {SERVERS.find((s) => s.id === activeServer)?.description}
          </span>
        </div>
      </div>

      {/* Player area */}
      <div className="relative flex-1 bg-black min-h-0">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black"
            >
              <Loader2 className="animate-spin text-streamex-accent mb-3" size={40} />
              <p className="text-sm text-streamex-text-secondary">
                Loading stream from {SERVERS.find((s) => s.id === activeServer)?.name}…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          key={iframeKey}
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
          title={`${item.title} - ${SERVERS.find((s) => s.id === activeServer)?.name}`}
        />
      </div>

      {/* Bottom panel */}
      <div className="bg-[#0a0a0a] border-t border-streamex-border flex-shrink-0">
        {/* Server switcher */}
        <div className="px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-streamex-text-secondary">
              Stream Server
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVERS.map((server) => (
              <button
                key={server.id}
                onClick={() => handleServerChange(server.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer group ${
                  activeServer === server.id
                    ? "bg-streamex-accent text-white shadow-lg shadow-streamex-accent/20"
                    : "bg-white/5 text-streamex-text-secondary hover:text-white hover:bg-white/10 border border-streamex-border"
                }`}
              >
                {activeServer === server.id && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                )}
                <span>{server.name}</span>
                <span
                  className={`text-[10px] ${
                    activeServer === server.id
                      ? "text-white/70"
                      : "text-streamex-text-secondary/60"
                  }`}
                >
                  {server.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Episode selector (TV Series only) */}
        {isTV && (
          <div className="px-4 sm:px-6 py-3 border-t border-streamex-border">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-streamex-text-secondary">
                  Season
                </label>
                <select
                  value={season}
                  onChange={(e) => handleEpisodeChange(Number(e.target.value), 1)}
                  className="bg-white/5 border border-streamex-border rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-streamex-accent cursor-pointer"
                >
                  {Array.from({ length: Math.max(seasonsCount, 5) }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Season {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-streamex-text-secondary">
                  Episode
                </label>
                <select
                  value={episode}
                  onChange={(e) => handleEpisodeChange(season, Number(e.target.value))}
                  className="bg-white/5 border border-streamex-border rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-streamex-accent cursor-pointer"
                >
                  {Array.from({ length: 10 }, (_, i) => (
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
            {isLegacyItem(item) && item.seasons && (
              <span className="flex items-center gap-1 text-sm text-streamex-text-secondary">
                <Tv size={12} />
                {item.seasons} Season{item.seasons > 1 ? "s" : ""}
              </span>
            )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
