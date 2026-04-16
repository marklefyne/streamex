"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Star,
  Clock,
  Tv,
  Calendar,
  ChevronLeft,
  Bookmark,
  Heart,
  Share2,
  ListPlus,
} from "lucide-react";
import type { MediaItem } from "@/lib/mock-data";
import { VideoPlayer } from "./video-player";
import { MediaCard } from "./media-card";

interface MovieDetailProps {
  item: MediaItem;
  similarItems: MediaItem[];
  onBack: () => void;
}

export function MovieDetail({ item, similarItems, onBack }: MovieDetailProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const mediaType = item.type === "TV Series" || item.type === "Anime" ? "tv" : "movie";

  const handlePlay = useCallback(() => {
    setShowPlayer(true);
  }, []);

  if (showPlayer) {
    return <VideoPlayer item={item} onClose={() => setShowPlayer(false)} />;
  }

  return (
    <div className="min-h-full">
      {/* ── Backdrop Hero ── */}
      <div className="relative w-full h-[55vh] min-h-[380px] max-h-[520px] overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(/streamex/hero-bg.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br opacity-50" />
        {/* Vertical gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black to-transparent" />

        {/* Back button */}
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

        {/* Content */}
        <div className="relative z-10 flex items-end h-full px-6 sm:px-8 pb-10">
          <motion.div
            className="flex gap-6 max-w-4xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Poster */}
            <div className="hidden sm:block flex-shrink-0 w-40 md:w-48">
              <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-black/60">
                <div
                  className={`w-full h-full bg-gradient-to-br ${item.posterGradient} flex items-center justify-center p-3`}
                >
                  {item.posterImage ? (
                    <img
                      src={item.posterImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white/70 text-xs font-medium text-center leading-tight">
                      {item.title}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 leading-tight tracking-tight">
                {item.title}
              </h1>

              {/* Meta */}
              <div className="flex items-center gap-3 text-sm text-streamex-text-secondary mb-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Star className="fill-yellow-500 text-yellow-500" size={15} />
                  <span className="text-white font-bold text-base">{item.rating}</span>
                  <span className="text-yellow-500/70">/10</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {item.year}
                </span>
                {item.runtime && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {item.runtime}
                    </span>
                  </>
                )}
                {item.seasons && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                    <span className="flex items-center gap-1">
                      <Tv size={13} />
                      {item.seasons} Season{item.seasons > 1 ? "s" : ""}
                    </span>
                  </>
                )}
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                <span className="px-2 py-0.5 border border-white/20 rounded text-xs">
                  {item.type}
                </span>
              </div>

              {/* Genres */}
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

              {/* Description */}
              <p className="text-sm text-streamex-text-secondary leading-relaxed mb-5 max-w-xl">
                {item.description}
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-2 px-7 py-3 bg-streamex-accent hover:bg-streamex-accent-hover text-white rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-streamex-accent/25 hover:shadow-streamex-accent/40 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Play size={18} fill="white" />
                  Play Now
                </button>
                <button
                  onClick={() => setIsInList(!isInList)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer border ${
                    isInList
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white/5 border-streamex-border text-streamex-text-secondary hover:text-white hover:border-white/20"
                  }`}
                >
                  <ListPlus size={16} />
                  {isInList ? "In My List" : "Add to List"}
                </button>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-3 rounded-lg transition-all duration-200 cursor-pointer border ${
                    isLiked
                      ? "bg-red-500/10 border-red-500/30 text-red-500"
                      : "bg-white/5 border-streamex-border text-streamex-text-secondary hover:text-white hover:border-white/20"
                  }`}
                >
                  <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button className="p-3 rounded-lg bg-white/5 border border-streamex-border text-streamex-text-secondary hover:text-white hover:border-white/20 transition-all duration-200 cursor-pointer">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Server Quick-Select ── */}
      <div className="px-6 sm:px-8 py-6 border-b border-streamex-border">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-bold text-white mb-3">
            Choose a Server to Play
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { name: "Server 1", sub: "VidSrc", id: "vidsrc" },
              { name: "Server 2", sub: "VidSrc CC", id: "vidsrc2" },
              { name: "Server 3", sub: "AutoEmbed", id: "autoembed" },
              { name: "Server 4", sub: "MoviesAPI", id: "movieapi" },
              { name: "Server 5", sub: "VidSrc XYZ", id: "vidsrcxyz" },
              { name: "Server 6", sub: "Embed.su", id: "embedsu" },
            ].map((server, i) => (
              <button
                key={server.id}
                onClick={handlePlay}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg bg-streamex-surface hover:bg-streamex-surface-hover border border-streamex-border hover:border-streamex-accent/50 text-white transition-all duration-200 cursor-pointer group"
              >
                <Play
                  size={16}
                  className="text-streamex-text-secondary group-hover:text-streamex-accent transition-colors"
                />
                <span className="text-xs font-semibold">{server.name}</span>
                <span className="text-[10px] text-streamex-text-secondary">
                  {server.sub}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Similar Titles ── */}
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
              <MediaCard key={simItem.id} item={simItem} index={i} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-streamex-border px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
          <p>&copy; 2025 StreameX. All rights reserved.</p>
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
