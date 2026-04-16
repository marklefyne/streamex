"use client";

import { Star } from "lucide-react";

interface RatingBadgeProps {
  rating: number;
  size?: "sm" | "md";
}

export function RatingBadge({ rating, size = "sm" }: RatingBadgeProps) {
  const iconSize = size === "sm" ? 12 : 14;
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
      <Star className="fill-yellow-500 text-yellow-500" size={iconSize} />
      <span className={`${textSize} font-semibold text-white leading-none`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
