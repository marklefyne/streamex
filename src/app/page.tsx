"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Star, Film, Clock, Heart, Trash2, ShieldAlert, X } from "lucide-react";

import { Sidebar } from "@/components/streamex/sidebar";
import { HeroShowcase } from "@/components/streamex/hero-showcase";
import { MediaRow } from "@/components/streamex/media-row";
import { MediaCard, type CardItem } from "@/components/streamex/media-card";
import { SkeletonRow, SkeletonGrid } from "@/components/streamex/skeleton-card";
import { MovieDetail } from "@/components/streamex/movie-detail";
import { MiniPlayer } from "@/components/streamex/mini-player";

import { SERVERS } from "@/lib/mock-data";
import { useFavoritesStore, type FavoriteItem } from "@/lib/favorites-store";
import { useHistoryStore, type HistoryEntry } from "@/lib/history-store";
import { useTrendingStore, type TrendingViewItem } from "@/lib/trending-store";

type ViewType =
  | "home"
  | "movies"
  | "tvshows"
  | "trending"
  | "history"
  | "favorites"
  | "detail";

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardItem[]>([]);
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
  const [heroItem, setHeroItem] = useState<CardItem | null>(null);

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

  // Determine if we're in search mode
  const isInSearchMode = searchQuery.trim().length > 0 || isSearching;

  // ⌘K / Ctrl+K shortcut to focus search
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus the search input inside the sidebar
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        searchInput?.focus();
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Load stores on mount
  useEffect(() => {
    try {
      const nodeId = localStorage.getItem("node_id") || "";
      if (nodeId) {
        loadFavorites(nodeId);
        loadHistory(nodeId);
      }
    } catch {
      // silent
    }
    fetchTrending();
  }, [loadFavorites, loadHistory, fetchTrending]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [trendingRes, topRatedRes, nowPlayingRes, tvRes] = await Promise.all([
          fetch("/api/tmdb/trending"),
          fetch("/api/tmdb/top-rated"),
          fetch("/api/tmdb/now-playing"),
          fetch("/api/tmdb/popular-tv"),
        ]);

        const trendingData = trendingRes.ok ? await trendingRes.json() : { items: [] };
        const topRatedData = topRatedRes.ok ? await topRatedRes.json() : { items: [] };
        const nowPlayingData = nowPlayingRes.ok ? await nowPlayingRes.json() : { items: [] };
        const tvData = tvRes.ok ? await tvRes.json() : { items: [] };

        setTrendingItems(trendingData.items || []);
        setTopRatedItems(topRatedData.items || []);
        setNewReleaseItems(nowPlayingData.items || []);
        setTVShowItems(tvData.items || []);

        // Set hero item to first trending item
        if (trendingData.items?.length > 0) {
          setHeroItem(trendingData.items[0]);
        }
      } catch {
        // silent
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Search handler - event-driven with TMDB API
  const handleSearchChange = useCallback((value: string) => {
    searchQueryRef.current = value;
    setSearchQuery(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    if (value.trim().length > 0) {
      setIsSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(searchQueryRef.current.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.items || []);
          }
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
          searchTimerRef.current = null;
        }
      }, 600);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, []);

  const handleViewChange = useCallback((view: string) => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    searchQueryRef.current = "";
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setActiveView(view as ViewType);
  }, []);

  const handleSelectItem = useCallback(async (item: CardItem) => {
    // For TV shows, fetch details to get real season count and episode counts
    const isTV = item.type === "TV Series" || item.type === "tv" || item.id.startsWith("tv-");
    if (isTV) {
      try {
        const res = await fetch(`/api/tmdb/details?tmdb_id=${item.tmdb_id}&type=tv`);
        if (res.ok) {
          const data = await res.json();
          if (data.item) {
            const enriched = { ...data.item, seasonEpisodes: data.seasonEpisodes };
            setSelectedItem(enriched as CardItem);
            setActiveView("detail");
            return;
          }
        }
      } catch {
        // Fall back to list data
      }
    }
    setSelectedItem(item);
    setActiveView("detail");
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedItem(null);
    setActiveView("home");
  }, []);

  const handleMiniPlayer = useCallback((item: CardItem, serverIndex: number, season: number, episode: number) => {
    setMiniPlayerItem({ item, serverIndex, season, episode });
    setSelectedItem(null);
    setActiveView("home");
  }, []);

  const handleMiniPlayerExpand = useCallback(() => {
    if (miniPlayerItem) {
      setSelectedItem(miniPlayerItem.item);
      setActiveView("detail");
      setMiniPlayerItem(null);
    }
  }, [miniPlayerItem]);

  const handleMiniPlayerClose = useCallback(() => {
    setMiniPlayerItem(null);
  }, []);

  // Convert favorites/history items to CardItem for MediaCard compatibility
  const favoriteCards: CardItem[] = useMemo(() =>
    favorites.map((f: FavoriteItem) => ({
      id: `fav-${f.tmdb_id}`,
      tmdb_id: f.tmdb_id,
      title: f.title,
      year: f.year,
      type: f.type as "Movie" | "TV Series",
      rating: f.rating,
      genres: [],
      description: "",
      posterImage: f.posterImage,
      backdropImage: f.posterImage,
    })),
    [favorites]
  );

  const historyCards: CardItem[] = useMemo(() =>
    history.map((h: HistoryEntry) => ({
      id: `hist-${h.tmdb_id}-${h.season ?? 0}-${h.episode ?? 0}`,
      tmdb_id: h.tmdb_id,
      title: h.title,
      year: 0,
      type: h.type as "Movie" | "TV Series",
      rating: 0,
      genres: [],
      description: "",
      posterImage: h.posterImage,
      backdropImage: h.posterImage,
    })),
    [history]
  );

  const trendingViewsCards: CardItem[] = useMemo(() =>
    trendingViewsItems.map((t: TrendingViewItem) => ({
      id: `trending-view-${t.tmdb_id}`,
      tmdb_id: t.tmdb_id,
      title: t.title,
      year: 0,
      type: t.type as "Movie" | "TV Series",
      rating: 0,
      genres: [],
      description: "",
      posterImage: t.posterImage,
      backdropImage: t.posterImage,
    })),
    [trendingViewsItems]
  );

  // Get similar items for the detail page
  const similarItems = useMemo(() => {
    if (!selectedItem) return [];
    const allItems = [...trendingItems, ...topRatedItems, ...newReleaseItems, ...tvShowItems];
    return allItems
      .filter(
        (m) =>
          m.id !== selectedItem.id &&
          (m.genres.some((g) => selectedItem.genres.includes(g)) ||
            m.type === selectedItem.type)
      )
      .slice(0, 12);
  }, [selectedItem, trendingItems, topRatedItems, newReleaseItems, tvShowItems]);

  // Compute category-specific media
  const getFilteredMedia = useCallback(
    (view: ViewType): { title: string; items: CardItem[] }[] => {
      switch (view) {
        case "movies":
          return [
            { title: "Trending Movies", items: trendingItems.filter((m) => m.type === "Movie") },
            { title: "Top Rated Movies", items: topRatedItems },
            { title: "New Releases", items: newReleaseItems },
          ];
        case "tvshows":
          return [
            { title: "Popular TV Shows", items: tvShowItems },
            { title: "Trending TV", items: trendingItems.filter((m) => m.type === "TV Series") },
          ];
        case "trending":
          return [{ title: "Trending Now", items: trendingItems }];
        case "toprated":
          return [{ title: "Top Rated", items: topRatedItems }];
        case "new":
          return [{ title: "New Releases", items: newReleaseItems }];
        default:
          return [];
      }
    },
    [trendingItems, topRatedItems, newReleaseItems, tvShowItems]
  );

  const categoryContent = getFilteredMedia(activeView);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView === "detail" ? "home" : isInSearchMode ? "search" : activeView}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSelectSuggestion={handleSelectItem}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* DMCA Button — top-right */}
        <button
          onClick={() => setShowDmca(true)}
          className="fixed top-4 right-4 z-30 px-3 py-1.5 rounded-md text-xs font-medium text-streamex-text-secondary hover:text-white bg-black/70 backdrop-blur-sm border border-streamex-border hover:border-white/20 transition-all duration-200 cursor-pointer"
        >
          <ShieldAlert size={12} className="inline mr-1.5" />
          DMCA
        </button>

        {/* DMCA Modal */}
        <AnimatePresence>
          {showDmca && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setShowDmca(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-[#121212] border border-streamex-border rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert size={20} className="text-streamex-accent" />
                    DMCA Notice
                  </h2>
                  <button
                    onClick={() => setShowDmca(false)}
                    className="p-1.5 rounded-lg text-streamex-text-secondary hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 text-sm text-streamex-text-secondary leading-relaxed">
                  <p>
                    <strong className="text-white">Flux Stream</strong> does not host any files on its servers.
                    All content is provided by third-party, non-affiliated services.
                  </p>
                  <p>
                    Flux Stream is not responsible for the accuracy, compliance, copyright, legality,
                    decency, or any other aspect of the content streamed through this service. Users
                    access content at their own risk.
                  </p>
                  <p>
                    If you believe your copyrighted material is being made available through this
                    service without authorization, please contact us with the following information:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 pl-2">
                    <li>Identification of the copyrighted work claimed to have been infringed</li>
                    <li>Identification of the material that is claimed to be infringing</li>
                    <li>Contact information for the copyright owner (name, address, email, phone)</li>
                    <li>A statement that the complaining party has a good faith belief that the use is not authorized</li>
                    <li>A statement that the information in the notice is accurate, under penalty of perjury</li>
                  </ul>
                  <div className="bg-white/5 rounded-lg p-4 border border-streamex-border">
                    <p className="text-xs text-streamex-text-secondary mb-1 font-semibold text-white">Contact Email</p>
                    <p className="text-xs">dmca@fluxstream.example.com</p>
                  </div>
                  <p className="text-xs opacity-60">
                    This disclaimer is provided for informational purposes only and does not constitute legal advice.
                    Flux Stream complies with the Digital Millennium Copyright Act (DMCA) and will respond to
                    valid takedown requests in accordance with applicable law.
                  </p>
                </div>

                <button
                  onClick={() => setShowDmca(false)}
                  className="mt-6 w-full py-2.5 rounded-lg bg-streamex-accent hover:bg-streamex-accent-hover text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ============ DETAIL VIEW ============ */}
          {activeView === "detail" && selectedItem && (
            <motion.div
              key={`detail-${selectedItem.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MovieDetail
                item={selectedItem}
                similarItems={similarItems}
                onBack={handleBackFromDetail}
                onMiniPlayer={handleMiniPlayer}
              />
            </motion.div>
          )}

          {/* ============ HOME VIEW ============ */}
          {!isInSearchMode && activeView === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isInitialLoading ? (
                <div className="space-y-8 py-6">
                  <div className="h-[60vh] min-h-[400px] skeleton-shimmer" />
                  <SkeletonRow title count={8} />
                  <SkeletonRow title count={8} />
                  <SkeletonRow title count={8} />
                </div>
              ) : (
                <>
                  {heroItem && (
                    <HeroShowcase item={heroItem} onSelect={handleSelectItem} />
                  )}

                  <div className="space-y-2 py-6">
                    {historyCards.length > 0 && (
                      <MediaRow title="▶ Continue Watching" items={historyCards.slice(0, 5)} onSelect={handleSelectItem} />
                    )}
                    {trendingViewsCards.length > 0 && (
                      <MediaRow title="🔥 Most Watched Now" items={trendingViewsCards.slice(0, 10)} onSelect={handleSelectItem} />
                    )}
                    {trendingItems.length > 0 && (
                      <MediaRow title="Trending Now" items={trendingItems} onSelect={handleSelectItem} />
                    )}
                    {topRatedItems.length > 0 && (
                      <MediaRow title="Top Rated" items={topRatedItems} onSelect={handleSelectItem} />
                    )}
                    {newReleaseItems.length > 0 && (
                      <MediaRow title="New Releases" items={newReleaseItems} onSelect={handleSelectItem} />
                    )}
                    {tvShowItems.length > 0 && (
                      <MediaRow title="Popular TV Shows" items={tvShowItems} onSelect={handleSelectItem} />
                    )}
                  </div>

                  <footer className="border-t border-streamex-border px-8 py-6 mt-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
                      <p>&copy; 2025 Flux Stream. All rights reserved. Powered by TMDB.</p>
                      <div className="flex gap-4">
                        <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
                      </div>
                    </div>
                  </footer>
                </>
              )}
            </motion.div>
          )}

          {/* ============ SEARCH VIEW ============ */}
          {isInSearchMode && (
            <motion.div
              key={`search-${searchQuery}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-6"
            >
              <div className="px-8 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Search size={20} className="text-streamex-accent" />
                  <h1 className="text-2xl font-bold text-white">Search Results</h1>
                </div>
                <p className="text-sm text-streamex-text-secondary">
                  {isSearching
                    ? "Searching TMDB..."
                    : searchResults.length > 0
                      ? `Found ${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${searchQuery}"`
                      : searchQuery.trim()
                        ? `No results found for "${searchQuery}"`
                        : "Start typing to search..."}
                </p>
              </div>

              {isSearching ? (
                <SkeletonGrid count={12} />
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
                  {searchResults.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    >
                      <MediaCard item={item} index={i} onSelect={handleSelectItem} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                searchQuery.trim() && (
                  <div className="flex flex-col items-center justify-center py-20 px-8">
                    <div className="w-16 h-16 rounded-full bg-streamex-surface flex items-center justify-center mb-4">
                      <Search size={24} className="text-streamex-text-secondary" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">No results found</h3>
                    <p className="text-sm text-streamex-text-secondary text-center max-w-sm">
                      Try searching for a different title, genre, or keyword.
                    </p>
                  </div>
                )
              )}

              <footer className="border-t border-streamex-border px-8 py-6 mt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
                  <p>&copy; 2025 Flux Stream. All rights reserved.</p>
                  <div className="flex gap-4">
                    <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {/* ============ FAVORITES VIEW ============ */}
          {activeView === "favorites" && !isInSearchMode && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-6"
            >
              <div className="px-8 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Heart size={20} className="text-streamex-accent" />
                  <h1 className="text-2xl font-bold text-white">My Favorites</h1>
                </div>
                <p className="text-sm text-streamex-text-secondary">
                  {favorites.length > 0
                    ? `${favorites.length} title${favorites.length !== 1 ? "s" : ""} saved`
                    : "No favorites yet"}
                </p>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
                  {favoriteCards.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="relative group"
                    >
                      <MediaCard item={item} index={i} onSelect={handleSelectItem} />
                      <div className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500/90 shadow-lg">
                        <Heart size={12} fill="white" className="text-white" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <div className="w-16 h-16 rounded-full bg-streamex-surface flex items-center justify-center mb-4">
                    <Heart size={24} className="text-streamex-text-secondary" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">No favorites yet</h3>
                  <p className="text-sm text-streamex-text-secondary text-center max-w-sm">
                    Click the heart icon on any movie or TV show to save it here.
                  </p>
                </div>
              )}

              <footer className="border-t border-streamex-border px-8 py-6 mt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
                  <p>&copy; 2025 Flux Stream. All rights reserved.</p>
                  <div className="flex gap-4">
                    <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {/* ============ HISTORY VIEW ============ */}
          {activeView === "history" && !isInSearchMode && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-6"
            >
              <div className="px-8 mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock size={20} className="text-streamex-accent" />
                    <h1 className="text-2xl font-bold text-white">Watch History</h1>
                  </div>
                  <p className="text-sm text-streamex-text-secondary">
                    {history.length > 0
                      ? `${history.length} item${history.length !== 1 ? "s" : ""} watched`
                      : "No watch history yet"}
                  </p>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-streamex-text-secondary hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-streamex-border hover:border-red-500/30 transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Clear All
                  </button>
                )}
              </div>

              {history.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-8">
                  {historyCards.map((item, i) => {
                    const entry = history[i];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                        className="relative group"
                      >
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
                  <div className="w-16 h-16 rounded-full bg-streamex-surface flex items-center justify-center mb-4">
                    <Clock size={24} className="text-streamex-text-secondary" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">No watch history yet</h3>
                  <p className="text-sm text-streamex-text-secondary text-center max-w-sm">
                    Movies and TV shows you watch will appear here.
                  </p>
                </div>
              )}

              <footer className="border-t border-streamex-border px-8 py-6 mt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
                  <p>&copy; 2025 Flux Stream. All rights reserved.</p>
                  <div className="flex gap-4">
                    <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {/* ============ CATEGORY VIEWS ============ */}
          {!isInSearchMode && activeView !== "home" && activeView !== "detail" && activeView !== "favorites" && activeView !== "history" && (
            <motion.div
              key={activeView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="py-6"
            >
              <div className="px-8 mb-6">
                <h1 className="text-2xl font-bold text-white">
                  {activeView === "tvshows"
                    ? "TV Shows"
                    : activeView === "trending"
                      ? "Trending"
                      : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h1>
              </div>

              {categoryContent.length > 0 && categoryContent.some((v) => v.items.length > 0) ? (
                categoryContent.map((section) => (
                  <MediaRow
                    key={section.title}
                    title={section.title}
                    items={section.items}
                    onSelect={handleSelectItem}
                  />
                ))
              ) : isInitialLoading ? (
                <div className="space-y-8">
                  <SkeletonRow title count={8} />
                  <SkeletonRow title count={8} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <div className="w-16 h-16 rounded-full bg-streamex-surface flex items-center justify-center mb-4">
                    <Film size={24} className="text-streamex-text-secondary" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">Coming soon</h3>
                  <p className="text-sm text-streamex-text-secondary text-center max-w-sm">
                    Content for this category will be available soon.
                  </p>
                </div>
              )}

              <footer className="border-t border-streamex-border px-8 py-6 mt-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
                  <p>&copy; 2025 Flux Stream. All rights reserved.</p>
                  <div className="flex gap-4">
                    <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mini Player overlay */}
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
    </div>
  );
}
