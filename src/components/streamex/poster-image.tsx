"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { RatingBadge } from "./rating-badge";

interface PosterImageProps {
  src?: string;
  alt: string;
  gradient: string;
  title: string;
  aspectRatio?: "poster" | "landscape";
  priority?: boolean;
}

export function PosterImage({
  src,
  alt,
  gradient,
  title,
  aspectRatio = "poster",
  priority = false,
}: PosterImageProps) {
  const [loaded, setLoaded] = useState(!!src);
  const aspectClass =
    aspectRatio === "poster" ? "aspect-[2/3]" : "aspect-video";

  return (
    <div
      className={`relative w-full ${aspectClass} rounded-lg overflow-hidden bg-streamex-surface`}
    >
      {/* Gradient fallback */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center p-3`}
      >
        {!loaded && (
          <span className="text-white/80 text-xs font-medium text-center leading-tight line-clamp-3">
            {title}
          </span>
        )}
      </div>

      {/* Actual image */}
      {src && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            priority={priority}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
          />
        </motion.div>
      )}
    </div>
  );
}
