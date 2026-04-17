"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard, type CardItem } from "./media-card";

interface MediaRowProps {
  title: string;
  items: CardItem[];
  startIndex?: number;
  onSelect?: (item: CardItem) => void;
  showSubDub?: boolean;
  icon?: React.ReactNode;
}

export function MediaRow({ title, items, startIndex = 0, onSelect, showSubDub, icon }: MediaRowProps) {
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
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Row title */}
      <div className="flex items-center gap-2.5 mb-3 px-8">
        {icon && (
          <span className="text-streamex-accent">{icon}</span>
        )}
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        <span className="text-[11px] text-streamex-text-secondary/40 font-medium">{items.length} titles</span>
        <div className="flex-1" />
        <button className="text-xs text-streamex-text-secondary/50 hover:text-white transition-colors duration-200 font-medium">
          See all →
        </button>
      </div>

      {/* Scroll container */}
      <div className="relative group/row">
        {/* Left arrow */}
        {canScrollLeft && isHovering && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 w-14 z-20 flex items-center justify-center bg-gradient-to-r from-black via-black/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
            aria-label="Scroll left"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <ChevronLeft className="text-white" size={18} />
            </div>
          </button>
        )}

        {/* Media cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar px-8 pb-4"
        >
          {items.map((item, i) => (
            <MediaCard
              key={item.id}
              item={item}
              index={startIndex + i}
              onSelect={onSelect}
              showSubDub={showSubDub}
            />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && isHovering && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 w-14 z-20 flex items-center justify-center bg-gradient-to-l from-black via-black/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
            aria-label="Scroll right"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <ChevronRight className="text-white" size={18} />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
