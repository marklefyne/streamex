"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Flame,
  Calendar,
  Star,
  Clock,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ChevronUp,
} from "lucide-react";
import { type CardItem } from "@/components/streamex/media-card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AnimeItem {
  id: string;
  malId: number;
  title: string;
  japaneseTitle: string;
  posterImage: string;
  bannerImage: string;
  description: string;
  rating: number;
  year: number;
  episodes: number;
  status: string;
  type: string;
  genres: string[];
  studios: string[];
  hasSub: boolean;
  hasDub: boolean;
}

interface AnimeSection {
  type: "trending" | "season" | "top" | "upcoming";
  title: string;
  icon: React.ReactNode;
  items: AnimeItem[];
  loading: boolean;
  error: string | null;
}

interface AnimePageProps {
  onSelect: (item: CardItem) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ANIME_ACCENT = "#22C55E";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

/* ------------------------------------------------------------------ */
/*  Skeleton loader for a row                                          */
/* ------------------------------------------------------------------ */

function AnimeRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-hidden px-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="w-36 sm:w-40 md:w-44 aspect-[2/3] rounded-lg bg-white/[0.06]" />
          <div className="mt-2.5 space-y-2 px-0.5">
            <div className="h-3.5 rounded bg-white/[0.06] w-4/5" />
            <div className="h-3 rounded bg-white/[0.04] w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimeGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="aspect-[2/3] rounded-lg bg-white/[0.06]" />
          <div className="mt-2.5 space-y-2 px-0.5">
            <div className="h-3.5 rounded bg-white/[0.06] w-4/5" />
            <div className="h-3 rounded bg-white/[0.04] w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Anime Card                                                         */
/* ------------------------------------------------------------------ */

function AnimeCard({
  anime,
  index,
  onSelect,
}: {
  anime: AnimeItem;
  index: number;
  onSelect: (anime: AnimeItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const staggerDelay = index * 0.04;

  return (
    <motion.div
      className="group relative flex-shrink-0 cursor-pointer"
      style={{ animationDelay: `${staggerDelay}s` }}
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onSelect(anime)}
    >
      <div className="relative w-36 sm:w-40 md:w-44 aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.06] ring-1 ring-white/[0.06] group-hover:ring-emerald-500/30 transition-all duration-300">
        {/* Gradient fallback */}
        {!loaded && !errored && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-gray-900 to-black flex items-center justify-center p-3">
            <span className="text-white/60 text-xs font-medium text-center leading-tight line-clamp-3">
              {anime.title}
            </span>
          </div>
        )}

        {/* Rating badge — top right */}
        {anime.rating > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-yellow-500/85 backdrop-blur-sm flex items-center gap-0.5">
              <Star size={8} className="fill-current" />
              {anime.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Sub/Dub pills — bottom left */}
        <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1">
          <span className="px-1.5 py-0.5 bg-emerald-500/90 rounded text-[9px] font-bold text-white uppercase tracking-wide backdrop-blur-sm">
            SUB
          </span>
          {anime.hasDub && (
            <span className="px-1.5 py-0.5 bg-blue-500/90 rounded text-[9px] font-bold text-white uppercase tracking-wide backdrop-blur-sm">
              DUB
            </span>
          )}
        </div>

        {/* Poster image */}
        {anime.posterImage && !errored && (
          <motion.img
            src={anime.posterImage}
            alt={anime.title}
            className="w-full h-full object-cover"
            loading={index < 6 ? "eager" : "lazy"}
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1.5">
              {anime.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <span>{anime.year || "—"}</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{anime.type}</span>
              {anime.episodes > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span>{anime.episodes} ep</span>
                </>
              )}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {anime.genres.slice(0, 2).map((genre) => (
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
        <h3 className="text-[13px] font-medium text-white truncate group-hover:text-emerald-400 transition-colors duration-200">
          {anime.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          {anime.rating > 0 && (
            <span className="text-[11px] text-yellow-500 font-medium">
              ⭐ {anime.rating.toFixed(1)}
            </span>
          )}
          {anime.year > 0 && (
            <>
              {anime.rating > 0 && (
                <span className="text-[10px] text-gray-600">·</span>
              )}
              <span className="text-[11px] text-gray-500">{anime.year}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Anime Card for grid mode (search results)                          */
/* ------------------------------------------------------------------ */

function AnimeGridCard({
  anime,
  index,
  onSelect,
}: {
  anime: AnimeItem;
  index: number;
  onSelect: (anime: AnimeItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <motion.div
      className="group relative cursor-pointer"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
      whileHover={{ scale: 1.04, y: -6 }}
      style={{ transition: { type: "spring", stiffness: 300, damping: 22 } }}
      onClick={() => onSelect(anime)}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.06] ring-1 ring-white/[0.06] group-hover:ring-emerald-500/30 transition-all duration-300">
        {/* Gradient fallback */}
        {!loaded && !errored && (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-gray-900 to-black flex items-center justify-center p-3">
            <span className="text-white/60 text-xs font-medium text-center leading-tight line-clamp-3">
              {anime.title}
            </span>
          </div>
        )}

        {/* Rating badge */}
        {anime.rating > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white bg-yellow-500/85 backdrop-blur-sm flex items-center gap-0.5">
              <Star size={8} className="fill-current" />
              {anime.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Sub/Dub pills — bottom left */}
        <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1">
          <span className="px-1.5 py-0.5 bg-emerald-500/90 rounded text-[9px] font-bold text-white uppercase tracking-wide backdrop-blur-sm">
            SUB
          </span>
          {anime.hasDub && (
            <span className="px-1.5 py-0.5 bg-blue-500/90 rounded text-[9px] font-bold text-white uppercase tracking-wide backdrop-blur-sm">
              DUB
            </span>
          )}
        </div>

        {/* Poster */}
        {anime.posterImage && !errored && (
          <motion.img
            src={anime.posterImage}
            alt={anime.title}
            className="w-full h-full object-cover"
            loading={index < 8 ? "eager" : "lazy"}
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-1 flex-wrap mb-1.5">
              {anime.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70"
                >
                  {genre}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-white/50 line-clamp-2">
              {anime.description}
            </p>
          </div>
        </div>
      </div>

      {/* Title below card */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-[13px] font-semibold text-white truncate group-hover:text-emerald-400 transition-colors duration-200 leading-snug">
          {anime.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          {anime.rating > 0 && (
            <span className="text-[11px] text-yellow-500 font-medium">
              ⭐ {anime.rating.toFixed(1)}
            </span>
          )}
          {anime.year > 0 && (
            <>
              {anime.rating > 0 && (
                <span className="text-[10px] text-gray-600">·</span>
              )}
              <span className="text-[11px] text-gray-500">{anime.year}</span>
            </>
          )}
          {anime.episodes > 0 && (
            <>
              <span className="text-[10px] text-gray-700">·</span>
              <span className="text-[11px] text-gray-500">{anime.episodes} ep</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scrollable anime row                                               */
/* ------------------------------------------------------------------ */

function AnimeRow({
  section,
  onSelect,
}: {
  section: AnimeSection;
  onSelect: (anime: AnimeItem) => void;
}) {
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
  }, [section.items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (section.loading && section.items.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3 px-8">
          <span className="text-emerald-400">{section.icon}</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            {section.title}
          </h2>
        </div>
        <AnimeRowSkeleton count={8} />
      </div>
    );
  }

  if (section.error && section.items.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-3 px-8">
          <span className="text-emerald-400">{section.icon}</span>
          <h2 className="text-base font-bold text-white tracking-tight">
            {section.title}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 px-8">
          <AlertCircle size={24} className="text-red-400/60 mb-2" />
          <p className="text-sm text-gray-500">Failed to load</p>
        </div>
      </div>
    );
  }

  if (section.items.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Row title */}
      <div className="flex items-center gap-2.5 mb-3 px-8">
        <span className="text-emerald-400">{section.icon}</span>
        <h2 className="text-base font-bold text-white tracking-tight">
          {section.title}
        </h2>
        <span className="text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md">
          {section.items.length} titles
        </span>
      </div>

      {/* Scroll container */}
      <div
        className="relative group/row"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Left arrow */}
        {canScrollLeft && isHovering && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 w-14 z-20 flex items-center justify-center bg-gradient-to-r from-[#080808] via-[#080808]/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
            aria-label="Scroll left"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <ChevronLeft className="text-white" size={18} />
            </div>
          </button>
        )}

        {/* Anime cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto no-scrollbar px-8 pb-4"
        >
          {section.items.map((anime, i) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              index={i}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Right arrow */}
        {canScrollRight && isHovering && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 w-14 z-20 flex items-center justify-center bg-gradient-to-l from-[#080808] via-[#080808]/70 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 cursor-pointer"
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

/* ------------------------------------------------------------------ */
/*  Scroll to top button                                               */
/* ------------------------------------------------------------------ */

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-colors cursor-pointer"
          aria-label="Scroll to top"
        >
          <ChevronUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Main AnimePage component                                           */
/* ------------------------------------------------------------------ */

export function AnimePage({ onSelect }: AnimePageProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AnimeItem[]>([]);
  const [searching, setSearching] = useState(false);

  // Sections data
  const [sections, setSections] = useState<AnimeSection[]>([
    { type: "trending", title: "Trending Now", icon: <Flame size={16} />, items: [], loading: true, error: null },
    { type: "season", title: "This Season", icon: <Calendar size={16} />, items: [], loading: true, error: null },
    { type: "top", title: "Top Rated", icon: <Star size={16} />, items: [], loading: true, error: null },
    { type: "upcoming", title: "Upcoming", icon: <Clock size={16} />, items: [], loading: true, error: null },
  ]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anyError, setAnyError] = useState(false);

  // Convert AnimeItem to CardItem for onSelect
  const handleAnimeSelect = useCallback(
    (anime: AnimeItem) => {
      const cardItem: CardItem = {
        id: anime.id,
        tmdb_id: anime.malId,
        title: anime.title,
        year: anime.year,
        type: "Anime",
        rating: anime.rating,
        genres: anime.genres,
        description: anime.description,
        posterImage: anime.posterImage,
        backdropImage: anime.bannerImage,
      };
      onSelect(cardItem);
    },
    [onSelect]
  );

  // Fetch all sections in parallel on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const types = ["trending", "season", "top", "upcoming"] as const;

      // Fetch all four types in parallel
      const promises = types.map(async (type) => {
        try {
          const res = await fetch(`/api/anime?type=${type}&page=1`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          return { type, items: data.items || [], error: null };
        } catch (err) {
          return { type, items: [], error: err instanceof Error ? err.message : "Failed to load" };
        }
      });

      const results = await Promise.all(promises);

      if (cancelled) return;

      let hasError = false;
      setSections((prev) =>
        prev.map((section) => {
          const result = results.find((r) => r.type === section.type);
          if (!result) return section;
          if (result.error) hasError = true;
          return {
            ...section,
            items: result.items,
            loading: false,
            error: result.error,
          };
        })
      );
      setAnyError(hasError);
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // Search with debounce
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/anime?type=search&query=${encodeURIComponent(value)}&page=1`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setSearchResults(data.items || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  // Retry all failed sections
  const handleRetryAll = useCallback(() => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        loading: true,
        error: null,
      }))
    );
    setAnyError(false);
  }, []);

  const isSearchMode = query.trim().length > 0;

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Title row */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: ANIME_ACCENT }}
            >
              <Sparkles size={18} className="text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-white tracking-tight">
                  Anime
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
                  Sub &amp; Dub
                </span>
              </div>
              <p className="text-[11px] text-gray-500 -mt-0.5">
                Browse trending, seasonal, and top-rated anime
              </p>
            </div>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div
              className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                query.length > 0
                  ? "bg-[#141414] border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : "bg-white/[0.04] border-transparent hover:bg-white/[0.07]"
              }`}
            >
              <Search
                className={`absolute left-3.5 transition-colors duration-200 ${
                  query.length > 0 ? "text-emerald-400" : "text-gray-600"
                }`}
                size={16}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search anime by title, genre, or studio..."
                className="w-full bg-transparent rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-600 focus:outline-none"
              />
              {query && !searching && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              )}
              {searching && (
                <div className="absolute right-3.5">
                  <Loader2 className="animate-spin text-emerald-400" size={16} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-8">
        <AnimatePresence mode="wait">
          {isSearchMode ? (
            /* ---- SEARCH RESULTS ---- */
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
            >
              {/* Section heading */}
              <div className="flex items-center gap-2.5 mb-5">
                <Search size={16} style={{ color: ANIME_ACCENT }} />
                <h2 className="text-base font-bold text-white">
                  Results for &ldquo;{query}&rdquo;
                </h2>
                <span className="text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md">
                  {searchResults.length} found
                </span>
              </div>

              {searching ? (
                <AnimeGridSkeleton count={12} />
              ) : searchResults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                    <Search size={28} className="text-gray-700" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">No anime found</p>
                  <p className="text-xs text-gray-700">
                    Try a different search term
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4"
                  initial="initial"
                  animate="animate"
                >
                  {searchResults.map((anime, i) => (
                    <AnimeGridCard
                      key={anime.id}
                      anime={anime}
                      index={i}
                      onSelect={handleAnimeSelect}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* ---- BROWSE MODE ---- */
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-4"
            >
              {/* Error retry bar */}
              {anyError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[1400px] mx-auto px-8 mb-4"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-400" />
                      <span className="text-xs text-red-300">
                        Some sections failed to load
                      </span>
                    </div>
                    <button
                      onClick={handleRetryAll}
                      className="flex items-center gap-1.5 text-xs text-red-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Anime sections */}
              {sections.map((section) => (
                <AnimeRow
                  key={section.type}
                  section={section}
                  onSelect={handleAnimeSelect}
                />
              ))}

              {/* All loading state (initial) */}
              {sections.every((s) => s.loading) && (
                <div className="space-y-8 pt-2">
                  <div>
                    <div className="flex items-center gap-2.5 mb-3 px-8">
                      <Flame size={16} className="text-emerald-400" />
                      <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
                    </div>
                    <AnimeRowSkeleton count={8} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-3 px-8">
                      <Calendar size={16} className="text-emerald-400" />
                      <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
                    </div>
                    <AnimeRowSkeleton count={8} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-3 px-8">
                      <Star size={16} className="text-emerald-400" />
                      <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
                    </div>
                    <AnimeRowSkeleton count={8} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-3 px-8">
                      <Clock size={16} className="text-emerald-400" />
                      <div className="h-4 w-28 rounded bg-white/[0.06] animate-pulse" />
                    </div>
                    <AnimeRowSkeleton count={8} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ScrollToTop />
    </div>
  );
}
