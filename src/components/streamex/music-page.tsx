"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Play,
  Pause,
  Music2,
  TrendingUp,
  Disc3,
  Loader2,
  Sparkles,
  Volume2,
  Clock,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { useMusicStore, type MusicTrack } from "@/lib/music-store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GenreInfo {
  id: string;
  name: string;
  genreId: number;
}

interface TrendingResponse {
  tracks: MusicTrack[];
  genre: GenreInfo;
  availableGenres: GenreInfo[];
}

interface SearchResult {
  tracks: MusicTrack[];
  albums: {
    id: string;
    collectionName: string;
    artistName: string;
    artworkUrl100: string;
    trackCount: number;
    releaseDate: string;
  }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const GENRE_LABEL_MAP: Record<string, string> = {
  all: "All",
  pop: "Pop",
  "hip-hop": "Hip-Hop",
  rap: "Rap",
  rock: "Rock",
  electronic: "Electronic",
  rnb: "R&B/Soul",
  latin: "Latin",
  country: "Country",
  jazz: "Jazz",
  classical: "Classical",
  anime: "Anime",
};

const DEFAULT_GENRES: GenreInfo[] = [
  { id: "all", name: "Top Charts", genreId: 0 },
  { id: "pop", name: "Pop", genreId: 14 },
  { id: "hip-hop", name: "Hip-Hop", genreId: 18 },
  { id: "rap", name: "Rap", genreId: 18 },
  { id: "rock", name: "Rock", genreId: 21 },
  { id: "electronic", name: "Electronic", genreId: 7 },
  { id: "rnb", name: "R&B/Soul", genreId: 15 },
  { id: "latin", name: "Latin", genreId: 12 },
  { id: "country", name: "Country", genreId: 6 },
  { id: "jazz", name: "Jazz", genreId: 11 },
  { id: "classical", name: "Classical", genreId: 9 },
  { id: "anime", name: "Anime", genreId: 29 },
];

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getArtworkUrl(url100: string, size: number = 300): string {
  if (!url100) return "";
  return url100.replace(/\/\d+x\d+/, `/${size}x${size}`);
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function TrackCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square rounded-2xl skeleton-shimmer" />
      <div className="space-y-2 px-0.5">
        <div className="h-4 rounded-md skeleton-shimmer w-4/5" />
        <div className="h-3 rounded-md skeleton-shimmer w-3/5" />
        <div className="h-3 rounded-md skeleton-shimmer w-2/5" />
      </div>
    </div>
  );
}

function TrackGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.025, ease: "easeOut" }}
        >
          <TrackCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Track Card                                                         */
/* ------------------------------------------------------------------ */

interface TrackCardProps {
  track: MusicTrack;
  index: number;
  tracks: MusicTrack[];
  onPlay: (track: MusicTrack, tracks: MusicTrack[]) => void;
  isCurrentTrack: boolean;
  isPlaying: boolean;
}

function TrackCard({ track, index, tracks, onPlay, isCurrentTrack, isPlaying }: TrackCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const artworkUrl = getArtworkUrl(track.artworkUrl100, 600);

  return (
    <motion.div
      className="group relative flex flex-col"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      {/* Artwork */}
      <button
        onClick={() => onPlay(track, tracks)}
        className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.04] flex-shrink-0 cursor-pointer ring-1 ring-white/[0.06] transition-all duration-300 hover:ring-purple-500/40 hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.2)]"
        aria-label={`Play ${track.trackName} by ${track.artistName}`}
      >
        {/* Image */}
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            <img
              src={artworkUrl}
              alt={`${track.trackName} artwork`}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-black/60">
            <Disc3 size={40} className="text-purple-400/50" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Currently playing indicator */}
        {isCurrentTrack && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/90 backdrop-blur-sm">
            {isPlaying ? (
              <div className="flex items-center gap-[2px]">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-[3px] bg-white rounded-full"
                    animate={{ height: ["4px", "14px", "4px"] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            ) : (
              <Pause size={10} className="text-white" />
            )}
            <span className="text-[9px] font-bold text-white uppercase tracking-wider">
              {isPlaying ? "Now" : "Paused"}
            </span>
          </div>
        )}

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30 backdrop-blur-sm"
            initial={false}
            animate={{
              scale: isCurrentTrack ? 1 : [1, 0, 1],
              opacity: isCurrentTrack ? 0.9 : [0, 1, 0],
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCurrentTrack && isPlaying ? (
              <Pause size={20} className="text-white" fill="white" />
            ) : (
              <Play size={20} className="text-white ml-0.5" fill="white" />
            )}
          </motion.div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-white/80 font-medium">
            <Clock size={9} />
            {formatDuration(track.durationMs)}
          </span>
        </div>
      </button>

      {/* Track info */}
      <div className="mt-3 px-0.5 space-y-1.5 min-w-0">
        <h3
          className={`text-sm font-semibold truncate transition-colors duration-200 ${
            isCurrentTrack ? "text-purple-400" : "text-white group-hover:text-purple-300"
          }`}
        >
          {track.trackName}
        </h3>
        <p className="text-xs text-[#A0A0A0] truncate group-hover:text-white/70 transition-colors duration-200">
          {track.artistName}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20">
            {track.primaryGenreName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Album Card (for search results)                                    */
/* ------------------------------------------------------------------ */

interface AlbumCardProps {
  album: SearchResult["albums"][0];
  index: number;
}

function AlbumCard({ album, index }: AlbumCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const artworkUrl = getArtworkUrl(album.artworkUrl100, 600);

  return (
    <motion.div
      className="group relative flex flex-col"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.04] flex-shrink-0 ring-1 ring-white/[0.06] transition-all duration-300 group-hover:ring-purple-500/30 group-hover:shadow-[0_0_30px_-6px_rgba(168,85,247,0.15)]">
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            <img
              src={artworkUrl}
              alt={`${album.collectionName} artwork`}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/30 to-black/50">
            <Disc3 size={40} className="text-purple-400/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] text-white/80 font-medium w-fit">
            <Music2 size={9} />
            {album.trackCount} tracks
          </div>
        </div>
      </div>
      <div className="mt-3 px-0.5 space-y-1.5 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors duration-200">
          {album.collectionName}
        </h3>
        <p className="text-xs text-[#A0A0A0] truncate group-hover:text-white/70 transition-colors duration-200">
          {album.artistName}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Genre Pill                                                         */
/* ------------------------------------------------------------------ */

interface GenrePillProps {
  genre: GenreInfo;
  isActive: boolean;
  onClick: () => void;
}

function GenrePill({ genre, isActive, onClick }: GenrePillProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-250 cursor-pointer select-none ${
        isActive
          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25"
          : "bg-white/[0.06] text-[#A0A0A0] hover:bg-white/[0.1] hover:text-white border border-white/[0.06]"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="musicGenreGlow"
          className="absolute inset-0 rounded-full bg-purple-500"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{genre.name || GENRE_LABEL_MAP[genre.id] || genre.id}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main MusicPage                                                     */
/* ------------------------------------------------------------------ */

export function MusicPage() {
  /* ---- state ---- */
  const [genres, setGenres] = useState<GenreInfo[]>(DEFAULT_GENRES);
  const [activeGenre, setActiveGenre] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingTracks, setTrendingTracks] = useState<MusicTrack[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genreScrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---- store ---- */
  const playTrack = useMusicStore((s) => s.playTrack);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const togglePlay = useMusicStore((s) => s.togglePlay);

  const handlePlayTrack = useCallback(
    (track: MusicTrack, tracks: MusicTrack[]) => {
      if (currentTrack?.id === track.id) {
        togglePlay();
      } else {
        playTrack(track, tracks);
      }
    },
    [currentTrack, togglePlay, playTrack]
  );

  /* ---- fetch trending ---- */
  const fetchTrending = useCallback(async (genreId: string) => {
    setIsLoadingTrending(true);
    try {
      const res = await fetch(`/api/music/trending?genre=${encodeURIComponent(genreId)}&limit=20`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: TrendingResponse = await res.json();

      setTrendingTracks(data.tracks || []);
      if (data.availableGenres && data.availableGenres.length > 0) {
        setGenres(data.availableGenres);
      }
    } catch (err) {
      console.error("Failed to fetch trending tracks:", err);
      setTrendingTracks([]);
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  useEffect(() => {
    fetchTrending(activeGenre);
  }, [activeGenre, fetchTrending]);

  /* ---- initial load animation gate ---- */
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, []);

  /* ---- fetch search ---- */
  const fetchSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults(null);
      setIsLoadingSearch(false);
      return;
    }
    setIsLoadingSearch(true);
    try {
      const res = await fetch(`/api/music/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data: SearchResult = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults(null);
    } finally {
      setIsLoadingSearch(false);
    }
  }, []);

  /* ---- search input handler ---- */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        fetchSearch(value);
      }, 350);
    },
    [fetchSearch]
  );

  /* ---- cleanup ---- */
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  /* ---- dropdown close on outside click ---- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowGenreDropdown(false);
      }
    }
    if (showGenreDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showGenreDropdown]);

  /* ---- is currently searching ---- */
  const isSearchActive = searchQuery.trim().length >= 2;

  /* ---- active genre name for display ---- */
  const activeGenreName =
    genres.find((g) => g.id === activeGenre)?.name ||
    GENRE_LABEL_MAP[activeGenre] ||
    "Top Charts";

  return (
    <motion.div
      className="min-h-screen bg-[#080808] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-[40%] left-[20%] w-[600px] h-[600px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
        <div className="absolute top-[30%] -right-[20%] w-[500px] h-[500px] rounded-full bg-violet-600/[0.03] blur-[100px]" />
        <div className="absolute -bottom-[20%] left-[40%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/[0.025] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* ---- Header ---- */}
        <header className="sticky top-0 z-30 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.04]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col gap-4">
              {/* Top row: title + search */}
              <div className="flex items-center gap-4">
                {/* Title */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Music2 size={20} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                      Music
                    </h1>
                    <p className="text-[11px] text-[#A0A0A0]/60 font-medium mt-0.5">
                      Discover &amp; stream trending tracks
                    </p>
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Search bar */}
                <div className="relative w-full max-w-md flex-shrink-0">
                  <div className="flex items-center rounded-xl bg-white/[0.06] border border-white/[0.06] focus-within:border-purple-500/40 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_20px_-4px_rgba(168,85,247,0.15)] transition-all duration-250">
                    <Search size={16} className="ml-3.5 text-[#A0A0A0]/60 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search songs, artists..."
                      className="w-full bg-transparent py-2.5 px-3 text-sm text-white placeholder:text-[#A0A0A0]/40 focus:outline-none"
                    />
                    <AnimatePresence>
                      {searchQuery.length > 0 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.12 }}
                          onClick={() => {
                            setSearchQuery("");
                            setSearchResults(null);
                          }}
                          className="mr-2 p-1 rounded-lg text-[#A0A0A0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                    {isLoadingSearch && (
                      <div className="mr-3">
                        <Loader2 size={14} className="text-purple-400 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Genre filter bar */}
              <div className="relative" ref={dropdownRef}>
                {/* Scrollable pills */}
                <div
                  ref={genreScrollRef}
                  className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                >
                  {genres.map((genre) => (
                    <GenrePill
                      key={genre.id}
                      genre={genre}
                      isActive={activeGenre === genre.id}
                      onClick={() => {
                        setActiveGenre(genre.id);
                        setSearchQuery("");
                        setSearchResults(null);
                      }}
                    />
                  ))}
                </div>

                {/* Mobile dropdown trigger */}
                <button
                  onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                  className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.06] text-[#A0A0A0] hover:text-white cursor-pointer z-10"
                  aria-label="More genres"
                >
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${showGenreDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Mobile dropdown */}
                <AnimatePresence>
                  {showGenreDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="md:hidden absolute top-full right-0 mt-2 bg-[#161616] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden min-w-[160px]"
                    >
                      <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {genres.map((genre) => (
                          <button
                            key={genre.id}
                            onClick={() => {
                              setActiveGenre(genre.id);
                              setShowGenreDropdown(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                              activeGenre === genre.id
                                ? "bg-purple-500/15 text-purple-400"
                                : "text-[#A0A0A0] hover:bg-white/[0.05] hover:text-white"
                            }`}
                          >
                            {genre.name || GENRE_LABEL_MAP[genre.id] || genre.id}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* ---- Main Content ---- */}
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {isSearchActive ? (
              /* ===================== SEARCH RESULTS ===================== */
              <motion.div
                key="search-results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Search header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/15">
                    <Search size={14} className="text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400">
                      Search results for &ldquo;{searchQuery}&rdquo;
                    </span>
                  </div>
                </div>

                {isLoadingSearch ? (
                  <TrackGridSkeleton count={12} />
                ) : searchResults ? (
                  <>
                    {/* Albums section */}
                    {searchResults.albums && searchResults.albums.length > 0 && (
                      <div className="mb-10">
                        <div className="flex items-center gap-2 mb-5">
                          <Disc3 size={16} className="text-purple-400" />
                          <h2 className="text-lg font-bold text-white tracking-tight">Albums</h2>
                          <span className="text-xs text-[#A0A0A0]/50 font-medium">
                            {searchResults.albums.length} found
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                          {searchResults.albums.map((album, i) => (
                            <AlbumCard key={album.id} album={album} index={i} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tracks section */}
                    {searchResults.tracks && searchResults.tracks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-5">
                          <Music2 size={16} className="text-purple-400" />
                          <h2 className="text-lg font-bold text-white tracking-tight">Tracks</h2>
                          <span className="text-xs text-[#A0A0A0]/50 font-medium">
                            {searchResults.tracks.length} found
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                          {searchResults.tracks.map((track, i) => (
                            <TrackCard
                              key={track.id}
                              track={track}
                              index={i}
                              tracks={searchResults.tracks}
                              onPlay={handlePlayTrack}
                              isCurrentTrack={currentTrack?.id === track.id}
                              isPlaying={isPlaying && currentTrack?.id === track.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No results */}
                    {(!searchResults.tracks || searchResults.tracks.length === 0) &&
                      (!searchResults.albums || searchResults.albums.length === 0) && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center justify-center py-20 text-center"
                        >
                          <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
                            <Search size={32} className="text-[#A0A0A0]/30" />
                          </div>
                          <h3 className="text-lg font-semibold text-white/70 mb-2">
                            No results found
                          </h3>
                          <p className="text-sm text-[#A0A0A0]/50 max-w-sm">
                            Try different keywords or check the spelling of your search.
                          </p>
                        </motion.div>
                      )}
                  </>
                ) : null}
              </motion.div>
            ) : (
              /* ===================== TRENDING ===================== */
              <motion.div
                key={`trending-${activeGenre}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
                        <TrendingUp size={16} className="text-purple-400" />
                      </div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        Trending Tracks
                      </h2>
                    </div>
                    <motion.span
                      key={activeGenre}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20"
                    >
                      {activeGenreName}
                    </motion.span>
                    {!isLoadingTrending && trendingTracks.length > 0 && (
                      <span className="text-xs text-[#A0A0A0]/40 font-medium">
                        {trendingTracks.length} tracks
                      </span>
                    )}
                  </div>

                  {/* Quick stats */}
                  {!isLoadingTrending && trendingTracks.length > 0 && (
                    <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#A0A0A0]/40">
                      <span className="flex items-center gap-1">
                        <Sparkles size={11} />
                        Updated today
                      </span>
                    </div>
                  )}
                </div>

                {/* Tracks grid */}
                {isLoadingTrending ? (
                  <TrackGridSkeleton count={20} />
                ) : trendingTracks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    <AnimatePresence mode="popLayout">
                      {trendingTracks.map((track, i) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          index={i}
                          tracks={trendingTracks}
                          onPlay={handlePlayTrack}
                          isCurrentTrack={currentTrack?.id === track.id}
                          isPlaying={isPlaying && currentTrack?.id === track.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Empty state */
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/[0.04] flex items-center justify-center mb-5">
                      <Volume2 size={32} className="text-[#A0A0A0]/30" />
                    </div>
                    <h3 className="text-lg font-semibold text-white/70 mb-2">
                      No trending tracks found
                    </h3>
                    <p className="text-sm text-[#A0A0A0]/50 max-w-sm">
                      We couldn&apos;t find any trending tracks for this genre right now. Try a
                      different genre or check back later.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}
