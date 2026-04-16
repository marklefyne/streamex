"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "./media-card";
import type { MediaItem } from "@/lib/mock-data";

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  startIndex?: number;
}

export function MediaRow({ title, items, startIndex = 0 }: MediaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      ref?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Row title */}
      <div className="flex items-center justify-between mb-3 px-8">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button className="text-sm text-streamex-text-secondary hover:text-white transition-colors duration-200">
          See all
        </button>
      </div>

      {/* Scroll container */}
      <div className="relative group/row">
        {/* Left arrow */}
        {canScrollLeft && isHovering && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 w-12 z-20 flex items-center justify-center bg-gradient-to-r from-black via-black/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="text-white" size={28} />
          </button>
        )}

        {/* Media cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar px-8 pb-4"
        >
          {items.map((item, i) => (
            <MediaCard key={item.id} item={item} index={startIndex + i} />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && isHovering && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 w-12 z-20 flex items-center justify-center bg-gradient-to-l from-black via-black/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="text-white" size={28} />
          </button>
        )}
      </div>
    </div>
  );
}
