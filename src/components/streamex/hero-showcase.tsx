"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Info, Star, Clock, Tv, Plus, Check } from "lucide-react";
import type { LiveMediaItem, CardItem } from "@/lib/mock-data";
import { useFavoritesStore } from "@/lib/favorites-store";

interface HeroShowcaseProps {
  item: CardItem;
  onSelect?: (item: CardItem) => void;
}

function isLiveItem(item: CardItem): item is LiveMediaItem {
  return "backdropImage" in item;
}

export function HeroShowcase({ item, onSelect }: HeroShowcaseProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const backdropSrc = isLiveItem(item) ? item.backdropImage : "/streamex/hero-bg.png";
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const nodeId = typeof window !== 'undefined' ? localStorage.getItem("node_id") || "" : "";
  const favorited = isFavorite(item.tmdb_id);

  const handleToggleWatchlist = () => {
    toggleFavorite(
      {
        tmdb_id: item.tmdb_id,
        title: item.title,
        type: item.type,
        year: item.year,
        rating: item.rating,
        posterImage: item.posterImage,
      },
      nodeId
    );
  };

  return (
    <div className="relative w-full h-[65vh] min-h-[450px] max-h-[650px] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-red-900/30 to-slate-900/60" />
        {backdropSrc && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
              style={{ backgroundImage: `url(${backdropSrc})`, opacity: imgLoaded ? 0.5 : 0 }}
            />
            <img
              src={backdropSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-0"
              onLoad={() => setImgLoaded(true)}
              aria-hidden="true"
            />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-end pb-16 px-8 md:px-12">
        <div className="max-w-xl page-transition">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-streamex-accent rounded text-[10px] font-bold text-white uppercase tracking-wider">
              Featured
            </span>
            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded text-[10px] font-medium text-white/80 uppercase tracking-wide">
              {item.type}
            </span>
          </div>

          {/* Title */}
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {item.title}
          </motion.h1>

          {/* Meta */}
          <motion.div
            className="flex items-center gap-3 text-sm text-streamex-text-secondary mb-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="flex items-center gap-1">
              <Star className="fill-yellow-500 text-yellow-500" size={14} />
              <span className="text-white font-semibold">{item.rating.toFixed(1)}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-streamex-text-secondary/40" />
            <span>{item.year || "—"}</span>
            {"runtime" in item && item.runtime && (
              <>
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary/40" />
                <span className="flex items-center gap-1"><Clock size={12} />{item.runtime}</span>
              </>
            )}
            {"seasons" in item && item.seasons && (
              <>
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary/40" />
                <span className="flex items-center gap-1"><Tv size={12} />{item.seasons} Season{item.seasons > 1 ? "s" : ""}</span>
              </>
            )}
          </motion.div>

          {/* Genres */}
          <motion.div
            className="flex gap-2 mb-4 flex-wrap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            {item.genres.slice(0, 4).map((genre) => (
              <span key={genre} className="px-2 py-0.5 border border-white/[0.06] rounded text-[11px] text-streamex-text-secondary/70">
                {genre}
              </span>
            ))}
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-sm text-streamex-text-secondary leading-relaxed mb-6 line-clamp-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {item.description}
          </motion.p>

          {/* Action buttons */}
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <button
              onClick={() => onSelect?.(item)}
              className="flex items-center gap-2 px-7 py-3 bg-streamex-accent hover:bg-streamex-accent-hover text-white rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-streamex-accent/20"
            >
              <Play size={16} fill="white" />
              Play Now
            </button>
            <button
              onClick={handleToggleWatchlist}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 cursor-pointer backdrop-blur-sm border ${
                favorited
                  ? "bg-white/10 border-white/20 text-white hover:bg-white/15"
                  : "bg-white/[0.06] border-white/[0.08] text-white/80 hover:bg-white/15 hover:text-white"
              }`}
            >
              {favorited ? (
                <>
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-emerald-400">In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Watchlist</span>
                </>
              )}
            </button>
            <button
              onClick={() => onSelect?.(item)}
              className="flex items-center gap-2 px-5 py-3 bg-white/[0.04] hover:bg-white/10 text-white/60 hover:text-white rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer"
            >
              <Info size={16} />
              <span className="hidden sm:inline">More Info</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
