"use client";

import { motion } from "framer-motion";
import { Play, Info, Star, Clock, Tv } from "lucide-react";
import type { MediaItem } from "@/lib/mock-data";

interface HeroShowcaseProps {
  item: MediaItem;
  onSelect?: (item: MediaItem) => void;
}

export function HeroShowcase({ item, onSelect }: HeroShowcaseProps) {
  return (
    <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden">
      {/* Background image with blur */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-gradient-to-br opacity-40"
          style={{
            backgroundImage: `url(/streamex/hero-bg.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-end pb-16 px-8 md:px-12">
        <div className="max-w-xl page-transition">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-streamex-accent rounded text-xs font-bold text-white uppercase tracking-wider">
              Featured
            </span>
            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded text-xs font-medium text-white/80">
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

          {/* Meta info */}
          <motion.div
            className="flex items-center gap-3 text-sm text-streamex-text-secondary mb-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="flex items-center gap-1">
              <Star className="fill-yellow-500 text-yellow-500" size={14} />
              <span className="text-white font-semibold">{item.rating}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
            <span>{item.year}</span>
            {item.runtime && (
              <>
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {item.runtime}
                </span>
              </>
            )}
            {item.seasons && (
              <>
                <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                <span className="flex items-center gap-1">
                  <Tv size={12} />
                  {item.seasons} Season{item.seasons > 1 ? "s" : ""}
                </span>
              </>
            )}
          </motion.div>

          {/* Genres */}
          <motion.div
            className="flex gap-2 mb-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            {item.genres.map((genre) => (
              <span
                key={genre}
                className="px-2 py-0.5 border border-streamex-border rounded text-xs text-streamex-text-secondary"
              >
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
            <button onClick={() => onSelect?.(item)} className="flex items-center gap-2 px-6 py-2.5 bg-streamex-accent hover:bg-streamex-accent-hover text-white rounded-lg font-semibold text-sm transition-colors duration-200 cursor-pointer">
              <Play size={16} fill="white" />
              Play Now
            </button>
            <button onClick={() => onSelect?.(item)} className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold text-sm transition-colors duration-200 cursor-pointer">
              <Info size={16} />
              More Info
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
