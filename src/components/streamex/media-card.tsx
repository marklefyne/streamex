"use client";

import { motion } from "framer-motion";
import { PosterImage } from "./poster-image";
import { RatingBadge } from "./rating-badge";
import type { MediaItem } from "@/lib/mock-data";

interface MediaCardProps {
  item: MediaItem;
  index?: number;
  variant?: "default" | "large";
  onSelect?: (item: MediaItem) => void;
}

export function MediaCard({ item, index = 0, variant = "default", onSelect }: MediaCardProps) {
  const staggerDelay = index * 0.05;

  return (
    <motion.div
      className="group relative flex-shrink-0 cursor-pointer stagger-item"
      style={{ animationDelay: `${staggerDelay}s` }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onSelect?.(item)}
    >
      <div
        className={`relative rounded-lg overflow-hidden ${
          variant === "large" ? "w-44 sm:w-48 md:w-52" : "w-36 sm:w-40 md:w-44"
        }`}
      >
        <PosterImage
          src={item.posterImage}
          alt={item.title}
          gradient={item.posterGradient}
          title={item.title}
          priority={index < 3}
        />
        <RatingBadge rating={item.rating} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-streamex-text-secondary">
              <span>{item.year}</span>
              <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
              <span>{item.type}</span>
              {item.runtime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-streamex-text-secondary" />
                  <span>{item.runtime}</span>
                </>
              )}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {item.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80"
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
        <h3 className="text-sm font-medium text-white truncate group-hover:text-streamex-accent transition-colors duration-200">
          {item.title}
        </h3>
        <p className="text-xs text-streamex-text-secondary mt-0.5">
          {item.year} · {item.type}
        </p>
      </div>
    </motion.div>
  );
}
