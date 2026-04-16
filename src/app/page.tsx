"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Star, Film } from "lucide-react";

import { Sidebar } from "@/components/streamex/sidebar";
import { HeroShowcase } from "@/components/streamex/hero-showcase";
import { MediaRow } from "@/components/streamex/media-row";
import { MediaCard } from "@/components/streamex/media-card";
import { SkeletonRow } from "@/components/streamex/skeleton-card";
import { SkeletonGrid } from "@/components/streamex/skeleton-card";
import { VideoPlayer } from "@/components/streamex/video-player";

import {
  heroMedia,
  trendingNow,
  topRated,
  newReleases,
  allMedia,
  searchMedia,
  type MediaItem,
} from "@/lib/mock-data";

type ViewType =
  | "home"
  | "movies"
  | "tvshows"
  | "trending"
  | "toprated"
  | "new"
  | "mylist"
  | "settings";

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [playingItem, setPlayingItem] = useState<MediaItem | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef("");

  // Determine if we're in search mode
  const isInSearchMode = searchQuery.trim().length > 0 || isSearching;

  // Initial loading simulation (for the homepage skeleton)
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup search timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Search handler - event-driven (no setState in effects)
  const handleSearchChange = useCallback((value: string) => {
    searchQueryRef.current = value;
    setSearchQuery(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    if (value.trim().length > 0) {
      setIsSearching(true);

      // Simulate debounce (400ms) + API delay (600ms)
      searchTimerRef.current = setTimeout(() => {
        const results = searchMedia(searchQueryRef.current);
        setSearchResults(results);
        setIsSearching(false);
        searchTimerRef.current = null;
      }, 1000);
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

  const handlePlay = useCallback((item: MediaItem) => {
    setPlayingItem(item);
  }, []);

  // Compute category-specific media
  const getFilteredMedia = useCallback(
    (view: ViewType): { title: string; items: MediaItem[] }[] => {
      switch (view) {
        case "movies":
          return [
            { title: "All Movies", items: allMedia.filter((m) => m.type === "Movie") },
            {
              title: "Action & Thriller",
              items: allMedia.filter(
                (m) => m.type === "Movie" && (m.genres.includes("Action") || m.genres.includes("Thriller"))
              ),
            },
            {
              title: "Drama & Mystery",
              items: allMedia.filter(
                (m) => m.type === "Movie" && (m.genres.includes("Drama") || m.genres.includes("Mystery"))
              ),
            },
          ];
        case "tvshows":
          return [
            { title: "All TV Shows", items: allMedia.filter((m) => m.type === "TV Series") },
            {
              title: "Sci-Fi & Fantasy",
              items: allMedia.filter(
                (m) => m.type === "TV Series" && (m.genres.includes("Sci-Fi") || m.genres.includes("Fantasy"))
              ),
            },
          ];
        case "trending":
          return [{ title: "Trending Now", items: trendingNow }];
        case "toprated":
          return [{ title: "Top Rated", items: topRated }];
        case "new":
          return [{ title: "New Releases", items: newReleases }];
        default:
          return [];
      }
    },
    []
  );

  // Player overlay
  if (playingItem) {
    return <VideoPlayer item={playingItem} onClose={() => setPlayingItem(null)} />;
  }

  const categoryContent = getFilteredMedia(activeView);

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <Sidebar
        activeView={isInSearchMode ? "search" : activeView}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
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
                  <HeroShowcase item={heroMedia} />

                  <div className="space-y-2 py-6">
                    <MediaRow title="Trending Now" items={trendingNow} startIndex={0} />
                    <MediaRow title="Top Rated" items={topRated} startIndex={10} />
                    <MediaRow title="New Releases" items={newReleases} startIndex={20} />
                  </div>

                  <footer className="border-t border-streamex-border px-8 py-6 mt-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-streamex-text-secondary">
                      <p>&copy; 2025 StreameX. All rights reserved. Built with Next.js.</p>
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
                    ? "Searching..."
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
                      <MediaCard item={item} index={i} />
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
                  <p>&copy; 2025 StreameX. All rights reserved.</p>
                  <div className="flex gap-4">
                    <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {/* ============ CATEGORY VIEWS ============ */}
          {!isInSearchMode && activeView !== "home" && (
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
                        Customize your StreameX experience. Settings will be available in a future update.
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
                  <MediaRow key={section.title} title={section.title} items={section.items} />
                ))
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
                  <p>&copy; 2025 StreameX. All rights reserved.</p>
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
