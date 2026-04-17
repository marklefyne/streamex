"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PosterImageProps {
  src?: string;
  alt: string;
  gradient?: string;
  title: string;
  aspectRatio?: "poster" | "landscape";
  priority?: boolean;
}

export function PosterImage({
  src,
  alt,
  gradient = "from-gray-800 via-slate-900 to-black",
  title,
  aspectRatio = "poster",
  priority = false,
}: PosterImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const hasValidSrc = src && !errored;
  const aspectClass = aspectRatio === "poster" ? "aspect-[2/3]" : "aspect-video";

  return (
    <div
      className={`relative w-full ${aspectClass} rounded-lg overflow-hidden bg-streamex-surface`}
    >
      {/* Gradient fallback */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center p-3`}
      >
        {(!hasValidSrc || !loaded) && (
          <span className="text-white/80 text-xs font-medium text-center leading-tight line-clamp-3">
            {title}
          </span>
        )}
      </div>

      {/* Actual image - use img tag for external URLs */}
      {hasValidSrc && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        </motion.div>
      )}
    </div>
  );
}
