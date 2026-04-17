"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Volume2, VolumeX, GripVertical } from "lucide-react";
import type { CardItem } from "./media-card";
import { getEmbedUrl, SERVERS } from "@/lib/mock-data";

interface MiniPlayerProps {
  item: CardItem;
  serverIndex: number;
  season?: number;
  episode?: number;
  onExpand: () => void;
  onClose: () => void;
}

function getItemMediaType(item: CardItem): "movie" | "tv" {
  return item.type === "TV Series" || item.type === "tv" || item.type === "Anime" || item.id.startsWith("tv-")
    ? "tv"
    : "movie";
}

export function MiniPlayer({ item, serverIndex, season, episode, onExpand, onClose }: MiniPlayerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const mediaType = getItemMediaType(item);
  const tmdbId = item.tmdb_id;
  const server = SERVERS[serverIndex] || SERVERS[0];
  const embedUrl = getEmbedUrl(tmdbId, mediaType, server.id, season, episode);

  const isTV = mediaType === "tv";
  const episodeLabel = isTV
    ? ` S${String(season ?? 1).padStart(2, "0")}E${String(episode ?? 1).padStart(2, "0")}`
    : "";

  // Calculate initial position based on window size
  useEffect(() => {
    const updatePosition = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const playerW = w < 640 ? w - 48 : 400;
      const playerH = w < 640 ? (w - 48) * 9 / 16 : 225;
      setPosition({ x: w - playerW - 24, y: h - playerH - 24 });
      setIsPositioned(true);
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
    setIsDragging(true);
  }, [position]);

  // Handle drag move and end
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      setPosition({ x: clientX - dragOffset.current.x, y: clientY - dragOffset.current.y });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  if (!isPositioned) return null;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const playerWidth = isMobile ? window.innerWidth - 48 : 400;
  const playerHeight = isMobile ? (window.innerWidth - 48) * 9 / 16 : 225;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed z-[60] rounded-xl shadow-2xl border border-streamex-border overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          width: playerWidth,
          height: playerHeight,
          userSelect: isDragging ? "none" : "auto",
        }}
      >
        {/* Title bar / drag handle */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/90 backdrop-blur-sm cursor-grab active:cursor-grabbing"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <GripVertical size={12} className="text-streamex-text-secondary flex-shrink-0" />
          <span className="text-xs font-medium text-white truncate flex-1">
            {item.title}{episodeLabel}
          </span>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Mute / Unmute */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsMuted((m) => !m); }}
              className="p-1 rounded text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            {/* Expand back */}
            <button
              onClick={(e) => { e.stopPropagation(); onExpand(); }}
              className="p-1 rounded text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
              title="Expand"
            >
              <Maximize2 size={13} />
            </button>
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1 rounded text-streamex-text-secondary hover:text-red-400 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* iframe */}
        <iframe
          src={embedUrl}
          className="w-full border-0"
          style={{
            height: playerHeight - 36, // subtract title bar height
            filter: isMuted ? "brightness(0.7)" : "none",
            transition: "filter 0.2s ease",
          }}
          allow="autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="origin"
          title={`${item.title} — Mini Player`}
        />
      </motion.div>
    </AnimatePresence>
  );
}
