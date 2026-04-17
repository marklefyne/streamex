"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Star, Film, Clock, Heart, Trash2, ShieldAlert, X,
  Flame, Sparkles, Trophy, Music, BookOpen, Tv, Play,
  Loader2, Disc3, Clapperboard,
} from "lucide-react";

import { Sidebar } from "@/components/streamex/sidebar";
import { HeroShowcase } from "@/components/streamex/hero-showcase";
import { MediaRow } from "@/components/streamex/media-row";
import { MediaCard, type CardItem } from "@/components/streamex/media-card";
import { SkeletonRow, SkeletonGrid } from "@/components/streamex/skeleton-card";
import { MovieDetail } from "@/components/streamex/movie-detail";
import { MiniPlayer } from "@/components/streamex/mini-player";
import { LiveSports } from "@/components/streamex/live-sports";
import { MusicPage } from "@/components/streamex/music-page";
import { MangaPage } from "@/components/streamex/manga-page";
import { MusicMiniPlayer } from "@/components/streamex/music-mini-player";

import { useFavoritesStore, type FavoriteItem } from "@/lib/favorites-store";
import { useHistoryStore, type HistoryEntry } from "@/lib/history-store";
import { useTrendingStore, type TrendingViewItem } from "@/lib/trending-store";

type ViewType =
  | "home"
  | "search"
  | "movies"
  | "tvshows"
  | "anime"
  | "manga"
  | "music"
  | "sports"
  | "favorites"
  | "history"
  | "dmca"
  | "detail";

// Universal search result types
interface MusicSearchResult {
  id: string;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  primaryGenreName: string;
}

interface MangaSearchResult {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  artist: string;
  status: string;
  tags: string[];
}

// Shared footer
function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.04] px-8 py-6 mt-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-streamex-text-secondary/40">
        <p>&copy; 2025 FluxStream. All rights reserved. Powered by TMDB.</p>
        <div className="flex gap-4">
          <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
          <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
        </div>
      </div>
    </footer>
  );
}

// Placeholder "Coming Soon" view for Manga / Music
function ComingSoonView({ title, icon: Icon, description }: { title: string; icon: typeof BookOpen; description: string }) {
  return (
    <div className="py-6">
      <div className="px-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Icon size={22} className="text-streamex-accent" />
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
        <p className="text-sm text-streamex-text-secondary">{description}</p>
      </div>

      {/* Coming soon grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03 }}
            className="group"
          >
            <div className="aspect-[2/3] rounded-lg bg-white/[0.03] border border-white/[0.04] flex flex-col items-center justify-center gap-3">
              <Icon size={28} className="text-streamex-text-secondary/20" />
              <div className="text-center px-3">
                <div className="w-20 h-2 rounded-full bg-white/[0.04] mx-auto mb-2" />
                <div className="w-14 h-2 rounded-full bg-white/[0.03] mx-auto" />
              </div>
              <span className="text-[10px] font-medium text-streamex-text-secondary/30 uppercase tracking-wider mt-1">Coming Soon</span>
            </div>
          </motion.div>
        ))}
      </div>
      <SiteFooter />
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardItem[]>([]);
  const [musicSearchResults, setMusicSearchResults] = useState<MusicSearchResult[]>([]);
  const [mangaSearchResults, setMangaSearchResults] = useState<MangaSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);
  const [showDmca, setShowDmca] = useState(false);
  const [miniPlayerItem, setMiniPlayerItem] = useState<{
    item: CardItem;
    serverIndex: number;
    season: number;
    episode: number;
  } | null>(null);

  // Live TMDB data
  const [trendingItems, setTrendingItems] = useState<CardItem[]>([]);
  const [topRatedItems, setTopRatedItems] = useState<CardItem[]>([]);
  const [newReleaseItems, setNewReleaseItems] = useState<CardItem[]>([]);
  const [tvShowItems, setTVShowItems] = useState<CardItem[]>([]);
  const [topRatedTVItems, setTopRatedTVItems] = useState<CardItem[]>([]);
  const [animeItems, setAnimeItems] = useState<CardItem[]>([]);
  const [trendingMoviesItems, setTrendingMoviesItems] = useState<CardItem[]>([]);
  const [trendingTVItems, setTrendingTVItems] = useState<CardItem[]>([]);
  const [heroItem, setHeroItem] = useState<CardItem | null>(null);
  const heroRotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroIndexRef = useRef(0);

  // Stores
  const favorites = useFavoritesStore((s) => s.favorites);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const history = useHistoryStore((s) => s.history);
  const loadHistory = useHistoryStore((s) => s.loadHistory);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const trendingViewsItems = useTrendingStore((s) => s.items);
  const fetchTrending = useTrendingStore((s) => s.fetchTrending);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef("");

  const isInSearchMode = searchQuery.trim().length > 0 || isSearching;

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        searchInput?.focus();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Load stores on mount
  useEffect(() => {
    try {
      const nodeId = localStorage.getItem("node_id") || "";
      if (nodeId) {
        loadFavorites(nodeId);
        loadHistory(nodeId);
      }
    } catch { /* silent */ }
    fetchTrending();
  }, [loadFavorites, loadHistory, fetchTrending]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          trendingRes, trendingMoviesRes, trendingTVRes,
          topRatedRes, topRatedTVRes,
          nowPlayingRes, tvRes, animeRes,
        ] = await Promise.all([
          fetch("/api/tmdb/trending"),
          fetch("/api/tmdb/trending?type=movie"),
          fetch("/api/tmdb/trending?type=tv"),
          fetch("/api/tmdb/top-rated"),
          fetch("/api/tmdb/top-rated-tv"),
          fetch("/api/tmdb/now-playing"),
          fetch("/api/tmdb/popular-tv"),
          fetch("/api/tmdb/anime"),
        ]);

        const parse = (r: Response) => r.ok ? r.json().then((d) => d.items || []) : Promise.resolve([]);
        const [trending, tMovies, tTV, topRated, topTV, nowPlaying, tv, anime] = await Promise.all([
          parse(trendingRes), parse(trendingMoviesRes), parse(trendingTVRes),
          parse(topRatedRes), parse(topRatedTVRes),
          parse(nowPlayingRes), parse(tvRes), parse(animeRes),
        ]);

        setTrendingItems(trending);
        setTrendingMoviesItems(tMovies);
        setTrendingTVItems(tTV);
        setTopRatedItems(topRated);
        setTopRatedTVItems(topTV);
        setNewReleaseItems(nowPlaying);
        setTVShowItems(tv);
        setAnimeItems(anime);

        if (trending.length > 0) setHeroItem(trending[0]);
      } catch { /* silent */ }
      finally { setIsInitialLoading(false); }
    };
    fetchAllData();
  }, []);

  // Auto-rotate hero every 15 seconds
  useEffect(() => {
    heroRotationRef.current = setInterval(() => {
      const heroPool = trendingItems.filter((m) => m.backdropImage);
      if (heroPool.length > 1) {
        heroIndexRef.current = (heroIndexRef.current + 1) % heroPool.length;
        setHeroItem(heroPool[heroIndexRef.current]);
      }
    }, 15000);
    return () => {
      if (heroRotationRef.current) clearInterval(heroRotationRef.current);
    };
  }, [trendingItems]);

  // Search handler
  const handleSearchChange = useCallback((value: string) => {
    searchQueryRef.current = value;
    setSearchQuery(value);
    if (searchTimerRef.current) { clearTimeout(searchTimerRef.current); searchTimerRef.current = null; }

    if (value.trim().length > 0) {
      setIsSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        const q = searchQueryRef.current.trim();
        try {
          const [moviesRes, musicRes, mangaRes] = await Promise.all([
            fetch(`/api/tmdb/search?query=${encodeURIComponent(q)}`),
            fetch(`/api/music/search?query=${encodeURIComponent(q)}&limit=6`).catch(() => null),
            fetch(`/api/manga/search?query=${encodeURIComponent(q)}&limit=6`).catch(() => null),
          ]);
          if (moviesRes.ok) { const data = await moviesRes.json(); setSearchResults(data.items || []); }
          else { setSearchResults([]); }
          if (musicRes?.ok) { const data = await musicRes.json(); setMusicSearchResults(data.tracks || []); }
          else { setMusicSearchResults([]); }
          if (mangaRes?.ok) { const data = await mangaRes.json(); setMangaSearchResults(data.results || []); }
          else { setMangaSearchResults([]); }
        } catch { setSearchResults([]); setMusicSearchResults([]); setMangaSearchResults([]); }
        finally { setIsSearching(false); searchTimerRef.current = null; }
      }, 600);
    } else {
      setSearchResults([]); setMusicSearchResults([]); setMangaSearchResults([]); setIsSearching(false);
    }
  }, []);

  const handleViewChange = useCallback((view: string) => {
    setSearchQuery(""); setSearchResults([]); setMusicSearchResults([]); setMangaSearchResults([]); setIsSearching(false);
    searchQueryRef.current = "";
    if (searchTimerRef.current) { clearTimeout(searchTimerRef.current); searchTimerRef.current = null; }

    const v = view as ViewType;
    if (v === "dmca") { setShowDmca(true); return; }
    setActiveView(v);
  }, []);

  const handleSelectItem = useCallback(async (item: CardItem) => {
    const isTV = item.type === "TV Series" || item.type === "tv" || item.type === "Anime" || item.id.startsWith("tv-");
    if (isTV) {
      try {
        const res = await fetch(`/api/tmdb/details?tmdb_id=${item.tmdb_id}&type=tv`);
        if (res.ok) {
          const data = await res.json();
          if (data.item) {
            setSelectedItem({ ...data.item, seasonEpisodes: data.seasonEpisodes } as CardItem);
            setActiveView("detail"); return;
          }
        }
      } catch { /* fall through */ }
    }
    setSelectedItem(item);
    setActiveView("detail");
  }, []);

  const handleBackFromDetail = useCallback(() => { setSelectedItem(null); setActiveView("home"); }, []);

  const handleMiniPlayer = useCallback((item: CardItem, serverIndex: number, season: number, episode: number) => {
    setMiniPlayerItem({ item, serverIndex, season, episode }); setSelectedItem(null); setActiveView("home");
  }, []);

  const handleMiniPlayerExpand = useCallback(() => {
    if (miniPlayerItem) { setSelectedItem(miniPlayerItem.item); setActiveView("detail"); setMiniPlayerItem(null); }
  }, [miniPlayerItem]);

  const handleMiniPlayerClose = useCallback(() => { setMiniPlayerItem(null); }, []);

  // Convert store items to CardItem
  const favoriteCards: CardItem[] = useMemo(() =>
    favorites.map((f: FavoriteItem) => ({
      id: `fav-${f.tmdb_id}`, tmdb_id: f.tmdb_id, title: f.title, year: f.year,
      type: f.type as "Movie" | "TV Series", rating: f.rating, genres: [],
      description: "", posterImage: f.posterImage, backdropImage: f.posterImage,
    })), [favorites]);

  const historyCards: CardItem[] = useMemo(() =>
    history.map((h: HistoryEntry) => ({
      id: `hist-${h.tmdb_id}-${h.season ?? 0}-${h.episode ?? 0}`,
      tmdb_id: h.tmdb_id, title: h.title, year: 0,
      type: h.type as "Movie" | "TV Series", rating: 0, genres: [],
      description: "", posterImage: h.posterImage, backdropImage: h.posterImage,
    })), [history]);

  const trendingViewsCards: CardItem[] = useMemo(() =>
    trendingViewsItems.map((t: TrendingViewItem) => ({
      id: `tv-${t.tmdb_id}`, tmdb_id: t.tmdb_id, title: t.title, year: 0,
      type: t.type as "Movie" | "TV Series", rating: 0, genres: [],
      description: "", posterImage: t.posterImage, backdropImage: t.posterImage,
    })), [trendingViewsItems]);

  const similarItems = useMemo(() => {
    if (!selectedItem) return [];
    const allItems = [...trendingItems, ...topRatedItems, ...newReleaseItems, ...tvShowItems, ...animeItems];
    return allItems
      .filter((m) => m.id !== selectedItem.id && (m.genres.some((g) => selectedItem.genres.includes(g)) || m.type === selectedItem.type))
      .slice(0, 12);
  }, [selectedItem, trendingItems, topRatedItems, newReleaseItems, tvShowItems, animeItems]);

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return dateStr; }
  };

  // Resolve activeView for sidebar highlighting
  const sidebarActiveView = activeView === "detail" ? "home" : isInSearchMode ? "search" : activeView;

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <Sidebar
        activeView={sidebarActiveView}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSelectSuggestion={handleSelectItem}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {/* ============ DMCA MODAL ============ */}
        <AnimatePresence>
          {showDmca && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setShowDmca(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-[#121212] border border-white/[0.06] rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert size={20} className="text-streamex-accent" />
                    DMCA Notice
                  </h2>
                  <button onClick={() => setShowDmca(false)} className="p-1.5 rounded-lg text-streamex-text-secondary hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-4 text-sm text-streamex-text-secondary leading-relaxed">
                  <p><strong className="text-white">FluxStream</strong> does not host any files on its servers. All content is provided by third-party, non-affiliated services.</p>
                  <p>FluxStream is not responsible for the accuracy, compliance, copyright, legality, decency, or any other aspect of the content streamed through this service.</p>
                  <p>If you believe your copyrighted material is being made available without authorization, please contact us with:</p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>Identification of the copyrighted work</li>
                    <li>Identification of the infringing material</li>
                    <li>Contact information for the copyright owner</li>
                    <li>A good faith belief statement</li>
                    <li>A statement of accuracy under penalty of perjury</li>
                  </ul>
                  <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.06]">
                    <p className="text-xs text-streamex-text-secondary mb-1 font-semibold text-white">Contact Email</p>
                    <p className="text-xs">dmca@fluxstream.example.com</p>
                  </div>
                </div>
                <button onClick={() => setShowDmca(false)} className="mt-6 w-full py-2.5 rounded-lg bg-streamex-accent hover:bg-streamex-accent-hover text-white font-semibold text-sm transition-colors cursor-pointer">Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ============ DETAIL VIEW ============ */}
          {activeView === "detail" && selectedItem && (
            <motion.div key={`detail-${selectedItem.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <MovieDetail item={selectedItem} similarItems={similarItems} onBack={handleBackFromDetail} onMiniPlayer={handleMiniPlayer} />
            </motion.div>
          )}

          {/* ============ HOME VIEW ============ */}
          {!isInSearchMode && activeView === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {isInitialLoading ? (
                <div className="space-y-8 py-6">
                  <div className="h-[60vh] min-h-[400px] skeleton-shimmer" />
                  <SkeletonRow title count={8} />
                  <SkeletonRow title count={8} />
                  <SkeletonRow title count={8} />
                </div>
              ) : (
                <>
                  {heroItem && <HeroShowcase item={heroItem} onSelect={handleSelectItem} />}
                  <div className="space-y-2 py-6">
                    {historyCards.length > 0 && (
                      <MediaRow title="Continue Watching" icon={<Play size={16} />} items={historyCards.slice(0, 8)} onSelect={handleSelectItem} />
                    )}
                    {trendingMoviesItems.length > 0 && (
                      <MediaRow title="Trending Movies" icon={<Flame size={16} />} items={trendingMoviesItems} onSelect={handleSelectItem} />
                    )}
                    {trendingTVItems.length > 0 && (
                      <MediaRow title="Trending Shows" icon={<Tv size={16} />} items={trendingTVItems} onSelect={handleSelectItem} />
                    )}
                    {topRatedItems.length > 0 && (
                      <MediaRow title="Top Rated Movies" icon={<Star size={16} />} items={topRatedItems} onSelect={handleSelectItem} />
                    )}
                    {newReleaseItems.length > 0 && (
                      <MediaRow title="New Releases" icon={<Film size={16} />} items={newReleaseItems} onSelect={handleSelectItem} />
                    )}
                    {animeItems.length > 0 && (
                      <MediaRow title="Trending Anime" icon={<Sparkles size={16} />} items={animeItems.slice(0, 10)} onSelect={handleSelectItem} showSubDub />
                    )}
                    {tvShowItems.length > 0 && (
                      <MediaRow title="Popular TV Shows" icon={<Tv size={16} />} items={tvShowItems} onSelect={handleSelectItem} />
                    )}
                  </div>
                  <SiteFooter />
                </>
              )}
            </motion.div>
          )}

          {/* ============ SEARCH VIEW ============ */}
          {isInSearchMode && (
            <motion.div key={`search-${searchQuery}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-6">
              <div className="px-8 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Search size={20} className="text-streamex-accent" />
                  <h1 className="text-2xl font-bold text-white">Search Results</h1>
                </div>
                <p className="text-sm text-streamex-text-secondary">
                  {isSearching ? "Searching all categories..." : `Searching for "${searchQuery}"`}
                </p>
              </div>

              {isSearching ? (
                <SkeletonGrid count={12} />
              ) : (
                <div className="space-y-8">
                  {/* Movies & TV Section */}
                  {searchResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-8 mb-4">
                        <Film size={16} className="text-streamex-accent" />
                        <h2 className="text-base font-bold text-white">Found in Movies & TV</h2>
                        <span className="text-xs text-streamex-text-secondary bg-white/[0.04] px-2 py-0.5 rounded-md">{searchResults.length}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
                        {searchResults.slice(0, 12).map((item, i) => (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                            <MediaCard item={item} index={i} onSelect={handleSelectItem} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Music Section */}
                  {musicSearchResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-8 mb-4">
                        <Music size={16} className="text-purple-400" />
                        <h2 className="text-base font-bold text-white">Found in Music</h2>
                        <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-md">{musicSearchResults.length}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
                        {musicSearchResults.slice(0, 6).map((track, i) => (
                          <motion.div
                            key={track.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.04 }}
                            className="group cursor-pointer"
                          >
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] ring-1 ring-white/[0.06] group-hover:ring-purple-500/30 transition-all">
                              <img src={track.artworkUrl100?.replace(/\/\d+x\d+/, "/300x300") || ""} alt={track.trackName} className="w-full h-full object-cover" loading="lazy" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[11px] font-semibold text-white truncate">{track.trackName}</p>
                                <p className="text-[10px] text-white/60 truncate">{track.artistName}</p>
                              </div>
                              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-purple-500/80 text-[8px] font-bold text-white">MUSIC</div>
                            </div>
                            <p className="text-xs font-medium text-white truncate mt-2 px-0.5">{track.trackName}</p>
                            <p className="text-[11px] text-streamex-text-secondary truncate px-0.5">{track.artistName}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manga Section */}
                  {mangaSearchResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-8 mb-4">
                        <BookOpen size={16} className="text-amber-400" />
                        <h2 className="text-base font-bold text-white">Found in Manga</h2>
                        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">{mangaSearchResults.length}</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 px-8">
                        {mangaSearchResults.slice(0, 6).map((manga, i) => (
                          <motion.div
                            key={manga.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.04 }}
                            className="group cursor-pointer"
                            onClick={() => { setSearchQuery(""); setSearchResults([]); setMusicSearchResults([]); setMangaSearchResults([]); setActiveView("manga"); }}
                          >
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/[0.04] ring-1 ring-white/[0.06] group-hover:ring-amber-500/30 transition-all">
                              {manga.coverUrl ? (
                                <img src={manga.coverUrl} alt={manga.title} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><BookOpen size={24} className="text-white/10" /></div>
                              )}
                              <div className="absolute top-1.5 left-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${manga.status === "ongoing" ? "bg-emerald-500/80" : "bg-blue-500/80"} text-white`}>{manga.status}</span>
                              </div>
                              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500/80 text-[8px] font-bold text-white">MANGA</div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[11px] font-semibold text-white truncate">{manga.title}</p>
                              </div>
                            </div>
                            <p className="text-xs font-medium text-white truncate mt-1.5 px-0.5 group-hover:text-amber-400 transition-colors">{manga.title}</p>
                            <p className="text-[10px] text-streamex-text-secondary truncate px-0.5">{manga.artist}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results at all */}
                  {searchResults.length === 0 && musicSearchResults.length === 0 && mangaSearchResults.length === 0 && searchQuery.trim() && (
                    <div className="flex flex-col items-center justify-center py-20 px-8">
                      <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                        <Search size={24} className="text-streamex-text-secondary/30" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-1">No results found</h3>
                      <p className="text-sm text-streamex-text-secondary text-center max-w-sm">Searched Movies, Music, and Manga. Try a different keyword.</p>
                    </div>
                  )}
                </div>
              )}
              <SiteFooter />
            </motion.div>
          )}

          {/* ============ MOVIES VIEW ============ */}
          {!isInSearchMode && activeView === "movies" && (
            <motion.div key="movies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-6">
              <div className="px-8 mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <Film size={22} className="text-streamex-accent" />
                  <h1 className="text-2xl font-bold text-white">Movies</h1>
                </div>
                <p className="text-sm text-streamex-text-secondary">Discover the latest and greatest films</p>
              </div>
              {isInitialLoading ? (
                <div className="space-y-8"><SkeletonRow title count={8} /><SkeletonRow title count={8} /></div>
              ) : (
                <div className="space-y-2">
                  {trendingMoviesItems.length > 0 && <MediaRow title="Trending Movies" icon={<Flame size={16} />} items={trendingMoviesItems} onSelect={handleSelectItem} />}
                  {topRatedItems.length > 0 && <MediaRow title="Top Rated" icon={<Star size={16} />} items={topRatedItems} onSelect={handleSelectItem} />}
                  {newReleaseItems.length > 0 && <MediaRow title="Now Playing" icon={<Play size={16} />} items={newReleaseItems} onSelect={handleSelectItem} />}
                </div>
              )}
              <SiteFooter />
            </motion.div>
          )}

          {/* ============ TV SHOWS VIEW ============ */}
          {!isInSearchMode && activeView === "tvshows" && (
            <motion.div key="tvshows" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-6">
              <div className="px-8 mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <Tv size={22} className="text-streamex-accent" />
                  <h1 className="text-2xl font-bold text-white">TV Shows</h1>
                </div>
                <p className="text-sm text-streamex-text-secondary">Binge-worthy series and shows</p>
              </div>
              {isInitialLoading ? (
                <div className="space-y-8"><SkeletonRow title count={8} /><SkeletonRow title count={8} /></div>
              ) : (
                <div className="space-y-2">
                  {trendingTVItems.length > 0 && <MediaRow title="Trending Shows" icon={<Flame size={16} />} items={trendingTVItems} onSelect={handleSelectItem} />}
                  {tvShowItems.length > 0 && <MediaRow title="Popular TV Shows" icon={<Tv size={16} />} items={tvShowItems} onSelect={handleSelectItem} />}
                  {topRatedTVItems.length > 0 && <MediaRow title="Top Rated Shows" icon={<Star size={16} />} items={topRatedTVItems} onSelect={handleSelectItem} />}
                </div>
              )}
              <SiteFooter />
            </motion.div>
          )}

          {/* ============ ANIME VIEW ============ */}
          {!isInSearchMode && activeView === "anime" && (
            <motion.div key="anime" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-6">
              <div className="px-8 mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <Sparkles size={22} className="text-emerald-400" />
                  <h1 className="text-2xl font-bold text-white">Anime</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Sub & Dub</span>
                </div>
                <p className="text-sm text-streamex-text-secondary">Trending anime series with subtitles and dubs</p>
              </div>
              {animeItems.length > 0 ? (
                <div className="space-y-2">
                  <MediaRow title="Trending Anime" icon={<Flame size={16} />} items={animeItems} onSelect={handleSelectItem} showSubDub />
                </div>
              ) : isInitialLoading ? (
                <SkeletonRow title count={8} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <Sparkles size={32} className="text-streamex-text-secondary/20 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-1">Loading anime...</h3>
                </div>
              )}
              <SiteFooter />
            </motion.div>
          )}

          {/* ============ MANGA VIEW ============ */}
          {!isInSearchMode && activeView === "manga" && (
            <motion.div key="manga" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <MangaPage />
            </motion.div>
          )}

          {/* ============ MUSIC VIEW ============ */}
          {!isInSearchMode && activeView === "music" && (
            <motion.div key="music" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <MusicPage />
            </motion.div>
          )}

          {/* ============ LIVE SPORTS VIEW ============ */}
          {!isInSearchMode && activeView === "sports" && (
            <motion.div key="sports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <LiveSports />
            </motion.div>
          )}

          {/* ============ FAVORITES VIEW ============ */}
          {!isInSearchMode && activeView === "favorites" && (
            <motion.div key="favorites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-6">
              <div className="px-8 mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <Heart size={22} className="text-streamex-accent" />
                  <h1 className="text-2xl font-bold text-white">My Watchlist</h1>
                </div>
                <p className="text-sm text-streamex-text-secondary">{favorites.length > 0 ? `${favorites.length} title${favorites.length !== 1 ? "s" : ""} saved` : "No favorites yet"}</p>
              </div>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
                  {favoriteCards.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="relative group">
                      <MediaCard item={item} index={i} onSelect={handleSelectItem} />
                      <div className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500/90 shadow-lg">
                        <Heart size={12} fill="white" className="text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                    <Heart size={24} className="text-streamex-text-secondary/20" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">No favorites yet</h3>
                  <p className="text-sm text-streamex-text-secondary text-center max-w-sm">Click the heart icon on any title to save it here.</p>
                </div>
              )}
              <SiteFooter />
            </motion.div>
          )}

          {/* ============ HISTORY VIEW ============ */}
          {!isInSearchMode && activeView === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="py-6">
              <div className="px-8 mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Clock size={22} className="text-streamex-accent" />
                    <h1 className="text-2xl font-bold text-white">Watch History</h1>
                  </div>
                  <p className="text-sm text-streamex-text-secondary">{history.length > 0 ? `${history.length} item${history.length !== 1 ? "s" : ""} watched` : "No watch history yet"}</p>
                </div>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-streamex-text-secondary hover:text-red-400 bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/30 transition-all duration-200 cursor-pointer">
                    <Trash2 size={13} /> Clear All
                  </button>
                )}
              </div>
              {history.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
                  {historyCards.map((item, i) => {
                    const entry = history[i];
                    return (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }} className="relative group">
                        <MediaCard item={item} index={i} onSelect={handleSelectItem} />
                        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent px-2 pb-2 pt-6 pointer-events-none">
                          <div className="flex items-center gap-1.5 text-[10px] text-streamex-text-secondary">
                            <Clock size={10} />
                            {formatDate(entry.watched_at)}
                            {entry.season && entry.episode && (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-white text-[9px] font-bold">
                                S{String(entry.season).padStart(2, "0")}E{String(entry.episode).padStart(2, "0")}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
                    <Clock size={24} className="text-streamex-text-secondary/20" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">No watch history yet</h3>
                  <p className="text-sm text-streamex-text-secondary text-center max-w-sm">Movies and shows you watch will appear here.</p>
                </div>
              )}
              <SiteFooter />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mini Player */}
      <AnimatePresence>
        {miniPlayerItem && (
          <MiniPlayer
            item={miniPlayerItem.item}
            serverIndex={miniPlayerItem.serverIndex}
            season={miniPlayerItem.season}
            episode={miniPlayerItem.episode}
            onExpand={handleMiniPlayerExpand}
            onClose={handleMiniPlayerClose}
          />
        )}
      </AnimatePresence>

      {/* Global Music Mini Player */}
      <MusicMiniPlayer />
    </div>
  );
}
