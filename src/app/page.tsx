"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Star, Film, Eye } from "lucide-react";

import { Sidebar } from "@/components/streamex/sidebar";
import { HeroShowcase } from "@/components/streamex/hero-showcase";
import { MediaRow } from "@/components/streamex/media-row";
import { MediaCard, type CardItem } from "@/components/streamex/media-card";
import { SkeletonRow, SkeletonGrid } from "@/components/streamex/skeleton-card";
import { MovieDetail } from "@/components/streamex/movie-detail";
import { VisionControl } from "@/components/streamex/vision-control";

import { SERVERS } from "@/lib/mock-data";

type ViewType =
  | "home"
  | "movies"
  | "tvshows"
  | "trending"
  | "toprated"
  | "new"
  | "mylist"
  | "settings"
  | "detail"
  | "vision-control";

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CardItem | null>(null);

  // Live TMDB data
  const [trendingItems, setTrendingItems] = useState<CardItem[]>([]);
  const [topRatedItems, setTopRatedItems] = useState<CardItem[]>([]);
  const [newReleaseItems, setNewReleaseItems] = useState<CardItem[]>([]);
  const [tvShowItems, setTVShowItems] = useState<CardItem[]>([]);
  const [heroItem, setHeroItem] = useState<CardItem | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef("");

  // Determine if we're in search mode
  const isInSearchMode = searchQuery.trim().length > 0 || isSearching;

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
      } catch (err) {
        console.error("Failed to fetch TMDB data:", err);
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
        } catch (err) {
          console.error("Search failed:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
          searchTimerRef.current = null;
        }
      }, 600); // debounce 600ms
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

  const handleSelectItem = useCallback((item: CardItem) => {
    setSelectedItem(item);
    setActiveView("detail");
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedItem(null);
    setActiveView("home");
  }, []);

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

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView === "detail" ? "home" : isInSearchMode ? "search" : activeView}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* ============ VISION CONTROL VIEW ============ */}
          {activeView === "vision-control" && (
            <motion.div
              key="vision-control"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <VisionControl onBack={() => handleViewChange("home")} />
            </motion.div>
          )}

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

          {/* ============ CATEGORY VIEWS ============ */}
          {!isInSearchMode && activeView !== "home" && activeView !== "detail" && activeView !== "vision-control" && (
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
                    : activeView === "toprated"
                      ? "Top Rated"
                      : activeView === "mylist"
                        ? "My List"
                        : activeView === "settings"
                          ? "Settings"
                          : activeView === "new"
                            ? "New Releases"
                            : activeView === "trending"
                              ? "Trending"
                              : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h1>
              </div>

              {activeView === "settings" ? (
                <div className="px-8 max-w-2xl">
                  <div className="bg-streamex-surface rounded-lg p-6 space-y-6">
                    <div>
                      <h3 className="text-white font-medium mb-2">Preferences</h3>
                      <p className="text-sm text-streamex-text-secondary">
                        Customize your Flux Stream experience. Settings will be available in a future update.
                      </p>
                    </div>
                    <div className="h-px bg-streamex-border" />
                    <div>
                      <h3 className="text-white font-medium mb-2">Playback</h3>
                      <p className="text-sm text-streamex-text-secondary">
                        Default quality, subtitles, and audio preferences.
                      </p>
                    </div>
                    <div className="h-px bg-streamex-border" />
                    <div>
                      <h3 className="text-white font-medium mb-2">Account</h3>
                      <p className="text-sm text-streamex-text-secondary">
                        Manage your account and subscription details.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeView === "mylist" ? (
                <div className="flex flex-col items-center justify-center py-20 px-8">
                  <div className="w-16 h-16 rounded-full bg-streamex-surface flex items-center justify-center mb-4">
                    <Star size={24} className="text-streamex-text-secondary" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">Your list is empty</h3>
                  <p className="text-sm text-streamex-text-secondary text-center max-w-sm">
                    Add movies and TV shows to your list to watch them later.
                  </p>
                </div>
              ) : categoryContent.length > 0 && categoryContent.some((v) => v.items.length > 0) ? (
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
    </div>
  );
}
