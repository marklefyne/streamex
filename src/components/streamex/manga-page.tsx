"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Clock,
  ArrowLeft,
  FileText,
  Tag,
  Layers,
  Eye,
  ChevronUp,
  Sparkles,
  BookMarked,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MangaItem {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  artist: string;
  status: "ongoing" | "completed";
  year: number;
  tags: string[];
  rating: number;
  contentRating: string;
}

interface MangaChapter {
  id: string;
  chapter: string;
  title: string;
  volume: string;
  pages: number;
  publishedAt: string;
  group: string;
  lang: string;
}

interface MangaPageItem {
  index: number;
  url: string;
  lowResUrl: string;
}

interface PopularResponse {
  results: MangaItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface ChaptersResponse {
  chapters: MangaChapter[];
  total: number;
}

interface ReaderPagesResponse {
  pages: MangaPageItem[];
  hash: string;
  baseUrl: string;
  chapterId: string;
}

type View = "browse" | "detail" | "reader";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MANGA_ACCENT = "#F59E0B";
const MANGA_ACCENT_HOVER = "#D97706";

/* ------------------------------------------------------------------ */
/*  Helper: animate variants                                           */
/* ------------------------------------------------------------------ */

const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

/* ------------------------------------------------------------------ */
/*  Skeleton loaders                                                   */
/* ------------------------------------------------------------------ */

function MangaGridSkeleton({ count = 20 }: { count?: number }) {
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

function ChapterListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-lg bg-white/[0.04] animate-pulse"
          style={{ animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}

function ReaderSkeleton() {
  return (
    <div className="flex flex-col items-center gap-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-full max-w-[780px] aspect-[2/3] bg-white/[0.03] animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Manga Card                                                         */
/* ------------------------------------------------------------------ */

function MangaCard({
  manga,
  index,
  onSelect,
}: {
  manga: MangaItem;
  index: number;
  onSelect: (m: MangaItem) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <motion.div
      className="group relative cursor-pointer"
      {...staggerItem}
      style={{ animationDelay: `${index * 40}ms` }}
      whileHover={{ scale: 1.04, y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onClick={() => onSelect(manga)}
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.06] ring-1 ring-white/[0.06] group-hover:ring-amber-500/30 transition-all duration-300">
        {/* Gradient fallback */}
        {!loaded && !errored && (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-gray-900 to-black flex items-center justify-center p-3">
            <span className="text-white/60 text-xs font-medium text-center leading-tight line-clamp-3">
              {manga.title}
            </span>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm ${
              manga.status === "ongoing"
                ? "bg-emerald-500/85 text-white"
                : "bg-blue-500/85 text-white"
            }`}
          >
            {manga.status === "ongoing" ? (
              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
            ) : null}
            {manga.status}
          </span>
        </div>

        {/* Content rating */}
        {manga.contentRating && manga.contentRating !== "safe" && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm bg-red-500/80 text-white">
              {manga.contentRating}
            </span>
          </div>
        )}

        {/* Cover image */}
        {manga.coverUrl && !errored && (
          <motion.img
            src={manga.coverUrl}
            alt={manga.title}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-1 flex-wrap mb-1.5">
              {manga.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-white/50 line-clamp-2">
              {manga.description}
            </p>
          </div>
        </div>
      </div>

      {/* Title & meta below card */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-[13px] font-semibold text-white truncate group-hover:text-amber-400 transition-colors duration-200 leading-snug">
          {manga.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-gray-500 truncate">
            {manga.artist}
          </span>
          {manga.year > 0 && (
            <>
              <span className="text-[10px] text-gray-700">·</span>
              <span className="text-[11px] text-gray-500">{manga.year}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll-to-top button                                               */
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
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transition-colors cursor-pointer"
          aria-label="Scroll to top"
        >
          <ChevronUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Browse View                                                        */
/* ------------------------------------------------------------------ */

function BrowseView({
  onSelectManga,
}: {
  onSelectManga: (m: MangaItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MangaItem[]>([]);
  const [popular, setPopular] = useState<MangaItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch popular manga
  const fetchPopular = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/manga/popular?limit=20&page=${page}`
      );
      const data: PopularResponse = await res.json();
      if (page === 1) {
        setPopular(data.results || []);
      } else {
        setPopular((prev) => [...prev, ...(data.results || [])]);
      }
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || 1);
      setTotal(data.total || 0);
    } catch {
      // Silently handle — keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopular(1);
  }, [fetchPopular]);

  // Infinite scroll
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          currentPage < totalPages &&
          !searching
        ) {
          fetchPopular(currentPage + 1);
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, currentPage, totalPages, searching, fetchPopular]);

  // Search
  const handleSearchChange = useCallback(
    (value: string) => {
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
            `/api/manga/search?query=${encodeURIComponent(value)}`
          );
          const data: PopularResponse = await res.json();
          setSearchResults(data.results || []);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 350);
    },
    []
  );

  const displayedManga = query.trim() ? searchResults : popular;
  const isSearchMode = query.trim().length > 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
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
              style={{ background: MANGA_ACCENT }}
            >
              <BookOpen size={18} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Manga
              </h1>
              <p className="text-[11px] text-gray-500 -mt-0.5">
                Browse &amp; read thousands of titles
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
                  ? "bg-[#141414] border-amber-500/40 shadow-lg shadow-amber-500/5"
                  : "bg-white/[0.04] border-transparent hover:bg-white/[0.07]"
              }`}
            >
              <Search
                className={`absolute left-3.5 transition-colors duration-200 ${
                  query.length > 0
                    ? "text-amber-400"
                    : "text-gray-600"
                }`}
                size={16}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search manga by title, artist, or tag..."
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
                  <Loader2 className="animate-spin text-amber-400" size={16} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between mb-5"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} style={{ color: MANGA_ACCENT }} />
            <h2 className="text-base font-bold text-white">
              {isSearchMode
                ? `Results for "${query}"`
                : "Popular Manga"}
            </h2>
            {!isSearchMode && total > 0 && (
              <span className="text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md">
                {total.toLocaleString()} titles
              </span>
            )}
            {isSearchMode && (
              <span className="text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md">
                {searchResults.length} found
              </span>
            )}
          </div>
        </motion.div>

        {/* Grid */}
        {loading && !isSearchMode ? (
          <MangaGridSkeleton count={20} />
        ) : searching && isSearchMode ? (
          <MangaGridSkeleton count={8} />
        ) : displayedManga.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-gray-700" />
            </div>
            <p className="text-sm text-gray-500 mb-1">No manga found</p>
            <p className="text-xs text-gray-700">
              Try a different search term
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {displayedManga.map((manga, i) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                index={i}
                onSelect={onSelectManga}
              />
            ))}
          </motion.div>
        )}

        {/* Load more sentinel */}
        {!isSearchMode && currentPage < totalPages && (
          <div ref={gridRef} className="py-8 flex justify-center">
            {loading && <Loader2 className="animate-spin text-amber-400" size={20} />}
          </div>
        )}
      </div>

      <ScrollToTop />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail View                                                        */
/* ------------------------------------------------------------------ */

function DetailView({
  manga,
  onBack,
  onReadChapter,
}: {
  manga: MangaItem;
  onBack: () => void;
  onReadChapter: (manga: MangaItem, chapter: MangaChapter) => void;
}) {
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [totalChapters, setTotalChapters] = useState(0);
  const [showAllDesc, setShowAllDesc] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverErrored, setCoverErrored] = useState(false);

  // Fetch chapters
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingChapters(true);
      try {
        const res = await fetch(
          `/api/manga/chapters?manga_id=${encodeURIComponent(manga.id)}`
        );
        const data: ChaptersResponse = await res.json();
        if (!cancelled) {
          setChapters(data.chapters || []);
          setTotalChapters(data.total || 0);
        }
      } catch {
        if (!cancelled) {
          setChapters([]);
        }
      } finally {
        if (!cancelled) setLoadingChapters(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [manga.id]);

  const firstChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative w-full overflow-hidden">
        {/* Backdrop */}
        {manga.coverUrl && !coverErrored && (
          <div className="absolute inset-0 opacity-20 blur-2xl scale-110">
            <img
              src={manga.coverUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setCoverErrored(true)}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-[#080808]/70 to-[#080808]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/80 to-transparent" />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          onClick={onBack}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm hover:bg-black/80 transition-colors cursor-pointer border border-white/[0.08]"
        >
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">Back</span>
        </motion.button>

        {/* Content */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-8">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex-shrink-0 mx-auto sm:mx-0"
            >
              <div className="w-44 sm:w-52 md:w-60 aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60 bg-white/[0.04]">
                {!coverLoaded && !coverErrored && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-950/40 via-gray-900 to-black flex items-center justify-center p-4">
                    <span className="text-white/60 text-xs text-center line-clamp-3">
                      {manga.title}
                    </span>
                  </div>
                )}
                {manga.coverUrl && !coverErrored && (
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      coverLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setCoverLoaded(true)}
                    onError={() => setCoverErrored(true)}
                  />
                )}
              </div>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="flex-1 pt-0 sm:pt-4 text-center sm:text-left"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                {manga.title}
              </h1>

              {/* Meta row */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 flex-wrap">
                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                    manga.status === "ongoing"
                      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20"
                  }`}
                >
                  {manga.status === "ongoing" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {manga.status}
                </span>

                {manga.year > 0 && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar size={13} />
                    {manga.year}
                  </span>
                )}

                {manga.artist && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <User size={13} />
                    {manga.artist}
                  </span>
                )}

                {totalChapters > 0 && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Layers size={13} />
                    {totalChapters} chapters
                  </span>
                )}
              </div>

              {/* Tags */}
              {manga.tags.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-3 flex-wrap">
                  <Tag size={12} className="text-gray-600" />
                  {manga.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] text-gray-400 bg-white/[0.04] ring-1 ring-white/[0.06] hover:text-amber-300 hover:ring-amber-500/20 transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {manga.description && (
                <div className="mt-4">
                  <p
                    className={`text-sm text-gray-400 leading-relaxed ${
                      !showAllDesc ? "line-clamp-3 sm:line-clamp-4" : ""
                    }`}
                  >
                    {manga.description}
                  </p>
                  {manga.description.length > 200 && (
                    <button
                      onClick={() => setShowAllDesc(!showAllDesc)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 mt-1 transition-colors cursor-pointer"
                    >
                      {showAllDesc ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
                {firstChapter && (
                  <button
                    onClick={() => onReadChapter(manga, firstChapter)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm text-black transition-all duration-200 cursor-pointer shadow-lg hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: MANGA_ACCENT,
                      boxShadow: `0 8px 30px ${MANGA_ACCENT}30`,
                    }}
                  >
                    <BookOpen size={16} />
                    Read Now
                  </button>
                )}
                <button className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:text-white hover:border-white/15 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer">
                  <BookMarked size={16} />
                  Bookmark
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <FileText size={16} style={{ color: MANGA_ACCENT }} />
              <h2 className="text-base font-bold text-white">Chapters</h2>
              <span className="text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md">
                {chapters.length}{" "}
                {totalChapters > chapters.length
                  ? `of ${totalChapters}`
                  : ""}
              </span>
            </div>
          </div>

          {loadingChapters ? (
            <ChapterListSkeleton count={12} />
          ) : chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3">
                <FileText size={24} className="text-gray-700" />
              </div>
              <p className="text-sm text-gray-500">No chapters available</p>
            </div>
          ) : (
            <motion.div
              className="space-y-1.5"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {chapters.map((ch, i) => (
                <motion.button
                  key={ch.id}
                  variants={staggerItem}
                  onClick={() => onReadChapter(manga, ch)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.06] transition-all duration-200 cursor-pointer group text-left"
                >
                  {/* Chapter number */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `${MANGA_ACCENT}15`,
                      color: MANGA_ACCENT,
                    }}
                  >
                    {ch.chapter || i + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors truncate">
                      {ch.title || `Chapter ${ch.chapter}`}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {ch.group && (
                        <span className="text-[11px] text-gray-500">
                          {ch.group}
                        </span>
                      )}
                      {ch.pages > 0 && (
                        <>
                          <span className="text-[10px] text-gray-700">
                            ·
                          </span>
                          <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                            <Eye size={10} />
                            {ch.pages} pages
                          </span>
                        </>
                      )}
                      {ch.volume && (
                        <>
                          <span className="text-[10px] text-gray-700">
                            ·
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Vol. {ch.volume}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="hidden sm:block flex-shrink-0 text-right">
                    <span className="flex items-center gap-1 text-[11px] text-gray-600">
                      <Clock size={10} />
                      {formatDate(ch.publishedAt)}
                    </span>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={14}
                    className="text-gray-700 group-hover:text-amber-400 transition-colors flex-shrink-0"
                  />
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      <ScrollToTop />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reader View                                                        */
/* ------------------------------------------------------------------ */

function ReaderView({
  manga,
  chapter,
  onBack,
}: {
  manga: MangaItem;
  chapter: MangaChapter;
  onBack: () => void;
}) {
  const [pages, setPages] = useState<MangaPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Fetch pages
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setLoadedImages(new Set());
      try {
        const res = await fetch(
          `/api/manga/chapters?chapter_id=${encodeURIComponent(chapter.id)}`
        );
        if (!res.ok) throw new Error("Failed to load chapter");
        const data: ReaderPagesResponse = await res.json();
        if (!cancelled) {
          setPages(data.pages || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load chapter"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    window.scrollTo({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [chapter.id]);

  // Reading progress
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 1200);
      if (progressRef.current && readerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          document.documentElement;
        const progress =
          scrollHeight > clientHeight
            ? scrollTop / (scrollHeight - clientHeight)
            : 0;
        progressRef.current.style.width = `${Math.min(progress * 100, 100)}%`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => new Set([...prev, index]));
  };

  const chapterTitle = chapter.title || `Chapter ${chapter.chapter}`;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-white/[0.06]">
        <div
          ref={progressRef}
          className="h-full transition-[width] duration-150 ease-out"
          style={{
            background: MANGA_ACCENT,
            width: "0%",
          }}
        />
      </div>

      {/* Top nav */}
      <div className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm transition-colors cursor-pointer border border-white/[0.06] flex-shrink-0"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Chapter title */}
          <div className="text-center min-w-0 flex-1">
            <p className="text-xs text-gray-500 truncate">{manga.title}</p>
            <p className="text-sm font-semibold text-white truncate">
              {chapterTitle}
            </p>
          </div>

          {/* Pages count */}
          <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-500">
            <Eye size={12} />
            {pages.length} pages
          </div>
        </div>
      </div>

      {/* Content */}
      <div ref={readerRef} className="relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2
              className="animate-spin mb-4"
              size={28}
              style={{ color: MANGA_ACCENT }}
            />
            <p className="text-sm text-gray-500">Loading chapter...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-3">
              <X size={24} className="text-red-400" />
            </div>
            <p className="text-sm text-gray-400 mb-1">Failed to load chapter</p>
            <p className="text-xs text-gray-600 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors cursor-pointer"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center pb-8">
            {/* Chapter header in reader */}
            <div className="w-full max-w-[780px] py-8 text-center">
              <p className="text-sm text-gray-600 mb-1">{manga.title}</p>
              <h2 className="text-lg font-bold text-white">{chapterTitle}</h2>
              {chapter.group && (
                <p className="text-xs text-gray-600 mt-1">
                  Translated by {chapter.group}
                </p>
              )}
            </div>

            {/* Pages */}
            {pages.map((page) => {
              const imgLoaded = loadedImages.has(page.index);
              return (
                <div
                  key={page.index}
                  className="relative w-full flex justify-center"
                >
                  {/* Loading placeholder */}
                  {!imgLoaded && (
                    <div
                      className="w-full max-w-[780px] flex items-center justify-center"
                      style={{ aspectRatio: "2/3" }}
                    >
                      <Loader2
                        className="animate-spin"
                        size={20}
                        style={{ color: `${MANGA_ACCENT}80` }}
                      />
                    </div>
                  )}
                  <motion.img
                    src={page.lowResUrl || page.url}
                    alt={`Page ${page.index + 1}`}
                    className={`w-full max-w-[780px] h-auto bg-white/[0.02] transition-opacity duration-300 ${
                      imgLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
                    }`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(page.index)}
                    onError={() => handleImageLoad(page.index)}
                  />
                  {/* Page number */}
                  <div className="absolute bottom-2 right-2 sm:right-[calc((100vw-780px)/2+8px)] xl:right-[calc((100vw-780px)/2+8px)]">
                    <span className="text-[10px] text-gray-700 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {page.index + 1}/{pages.length}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* End of chapter */}
            <div className="w-full max-w-[780px] py-12 text-center border-t border-white/[0.06] mt-4">
              <p className="text-sm text-gray-500 mb-1">End of Chapter</p>
              <p className="text-xs text-gray-700">{chapterTitle}</p>
              <button
                onClick={onBack}
                className="mt-5 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-lg font-semibold text-sm text-black transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: MANGA_ACCENT,
                  boxShadow: `0 4px 20px ${MANGA_ACCENT}25`,
                }}
              >
                <BookOpen size={15} />
                Chapter List
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transition-colors cursor-pointer"
            aria-label="Scroll to top"
          >
            <ChevronUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Export                                                        */
/* ------------------------------------------------------------------ */

export function MangaPage() {
  const [view, setView] = useState<View>("browse");
  const [selectedManga, setSelectedManga] = useState<MangaItem | null>(null);
  const [selectedChapter, setSelectedChapter] =
    useState<MangaChapter | null>(null);

  const handleSelectManga = useCallback((manga: MangaItem) => {
    setSelectedManga(manga);
    setView("detail");
    window.scrollTo({ top: 0 });
  }, []);

  const handleBackToBrowse = useCallback(() => {
    setView("browse");
    setSelectedManga(null);
    setSelectedChapter(null);
  }, []);

  const handleBackToDetail = useCallback(() => {
    setView("detail");
    setSelectedChapter(null);
    window.scrollTo({ top: 0 });
  }, []);

  const handleReadChapter = useCallback(
    (manga: MangaItem, chapter: MangaChapter) => {
      setSelectedManga(manga);
      setSelectedChapter(chapter);
      setView("reader");
      window.scrollTo({ top: 0 });
    },
    []
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080808" }}>
      <AnimatePresence mode="wait">
        {view === "browse" && (
          <motion.div
            key="browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <BrowseView onSelectManga={handleSelectManga} />
          </motion.div>
        )}

        {view === "detail" && selectedManga && (
          <motion.div
            key={`detail-${selectedManga.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <DetailView
              manga={selectedManga}
              onBack={handleBackToBrowse}
              onReadChapter={handleReadChapter}
            />
          </motion.div>
        )}

        {view === "reader" && selectedManga && selectedChapter && (
          <motion.div
            key={`reader-${selectedChapter.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ReaderView
              manga={selectedManga}
              chapter={selectedChapter}
              onBack={handleBackToDetail}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MangaPage;
