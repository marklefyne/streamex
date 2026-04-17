"use client";

import { motion } from "framer-motion";
import { PosterImage } from "./poster-image";
import { RatingBadge } from "./rating-badge";
import type { LiveMediaItem, MediaItem } from "@/lib/mock-data";

// Unified card item type
export type CardItem = LiveMediaItem | MediaItem;

interface MediaCardProps {
  item: CardItem;
  index?: number;
  variant?: "default" | "large";
  onSelect?: (item: CardItem) => void;
  showSubDub?: boolean;
}

function isLegacyItem(item: CardItem): item is MediaItem {
  return "posterGradient" in item;
}

export function MediaCard({ item, index = 0, variant = "default", onSelect, showSubDub = false }: MediaCardProps) {
  const staggerDelay = index * 0.04;

  const title = item.title;
  const year = item.year;
  const type = item.type;
  const rating = item.rating;
  const genres = item.genres;
  const src = item.posterImage;
  const gradient = isLegacyItem(item) ? item.posterGradient : undefined;

  const isAnime = type === "Anime";

  return (
    <motion.div
      className="group relative flex-shrink-0 cursor-pointer"
      style={{ animationDelay: `${staggerDelay}s` }}
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onSelect?.(item)}
    >
      <div
        className={`relative rounded-lg overflow-hidden ${
          variant === "large" ? "w-44 sm:w-48 md:w-52" : "w-36 sm:w-40 md:w-44"
        }`}
      >
        <PosterImage
          src={src}
          alt={title}
          gradient={gradient}
          title={title}
          priority={index < 3}
        />

        {/* Rating badge — top left */}
        {rating > 0 && (
          <RatingBadge rating={rating} />
        )}

        {/* Sub/Dub badges — top right (anime only) */}
        {showSubDub && isAnime && (
          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <span className="px-1.5 py-0.5 bg-emerald-500/90 rounded text-[9px] font-bold text-white uppercase tracking-wide">
              SUB
            </span>
            <span className="px-1.5 py-0.5 bg-amber-500/90 rounded text-[9px] font-bold text-white uppercase tracking-wide">
              DUB
            </span>
          </div>
        )}

        {/* Type badge for non-anime */}
        {!showSubDub && (
          <div className="absolute top-2 right-2 z-10">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm ${
              type === "Movie" ? "bg-blue-500/80 text-white" :
              isAnime ? "bg-emerald-500/80 text-white" :
              "bg-purple-500/80 text-white"
            }`}>
              {type === "TV Series" ? "TV" : type}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1.5">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-streamex-text-secondary">
              <span>{year || "—"}</span>
              <span className="w-1 h-1 rounded-full bg-streamex-text-secondary/50" />
              <span>{type}</span>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Title below card */}
      <div className="mt-2 px-0.5">
        <h3 className="text-[13px] font-medium text-white truncate group-hover:text-streamex-accent transition-colors duration-200">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          {rating > 0 && (
            <span className="text-[11px] text-yellow-500 font-medium">
              ⭐ {rating.toFixed(1)}
            </span>
          )}
          {year > 0 && (
            <>
              {rating > 0 && <span className="text-[10px] text-streamex-text-secondary/30">·</span>}
              <span className="text-[11px] text-streamex-text-secondary">{year}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
