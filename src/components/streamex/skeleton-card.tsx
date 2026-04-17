"use client";

interface SkeletonCardProps {
  variant?: "default" | "large";
}

export function SkeletonCard({ variant = "default" }: SkeletonCardProps) {
  const widthClass = variant === "large" ? "w-44 sm:w-48 md:w-52" : "w-36 sm:w-40 md:w-44";

  return (
    <div className={`flex-shrink-0 ${widthClass}`}>
      {/* Poster skeleton */}
      <div className="aspect-[2/3] rounded-lg skeleton-shimmer" />
      {/* Text skeletons */}
      <div className="mt-2 px-0.5 space-y-2">
        <div className="h-4 rounded skeleton-shimmer w-3/4" />
        <div className="h-3 rounded skeleton-shimmer w-1/2" />
      </div>
    </div>
  );
}

interface SkeletonRowProps {
  title?: boolean;
  count?: number;
}

export function SkeletonRow({ title = true, count = 8 }: SkeletonRowProps) {
  return (
    <div className="mb-8">
      {title && (
        <div className="flex items-center justify-between mb-3 px-8">
          <div className="h-6 w-40 rounded skeleton-shimmer" />
          <div className="h-4 w-12 rounded skeleton-shimmer" />
        </div>
      )}
      <div className="flex gap-3 overflow-hidden px-8">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stagger-item" style={{ animationDelay: `${i * 0.03}s` }}>
          <div className="aspect-[2/3] rounded-lg skeleton-shimmer" />
          <div className="mt-2 space-y-2">
            <div className="h-4 rounded skeleton-shimmer w-3/4" />
            <div className="h-3 rounded skeleton-shimmer w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
