"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Film,
  Tv,
  Flame,
  Menu,
  X,
  Search,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
} from "lucide-react";
import type { CardItem } from "@/components/streamex/media-card";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSuggestion?: (item: CardItem) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "movies", label: "Movies", icon: Film },
  { id: "tvshows", label: "TV Shows", icon: Tv },
  { id: "trending", label: "Trending", icon: Flame },
];

const libraryItems = [
  { id: "history", label: "History", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Heart },
];

export function Sidebar({
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onSelectSuggestion,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CardItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionItemsRef = useRef<HTMLButtonElement[]>([]);

  const isActive = (id: string) => activeView === id;

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.items?.slice(0, 5) ?? []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    onSearchChange(value);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (item: CardItem) => {
    onSearchChange(item.title);
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionItemsRef.current[highlightedIndex]) {
      suggestionItemsRef.current[highlightedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleNavClick = (id: string) => {
    onViewChange(id);
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-[#0a0a0a] border-r border-streamex-border transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-streamex-border">
        <div className="w-8 h-8 rounded-lg bg-streamex-accent flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-sm">F</span>
        </div>
        {!isCollapsed && (
          <span className="text-lg font-black text-white tracking-tight">
            Flux<span className="text-streamex-accent"> Stream</span>
          </span>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className="relative" ref={searchContainerRef}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-streamex-text-secondary"
              size={14}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                  setHighlightedIndex(-1);
                }
              }}
              placeholder="Search..."
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-streamex-surface focus:ring-1 focus:ring-streamex-accent rounded-lg py-2 pl-8 pr-3 text-sm text-white placeholder:text-streamex-text-secondary focus:outline-none transition-all duration-200"
            />

            {/* Loading indicator */}
            {isLoadingSuggestions && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2 text-streamex-text-secondary animate-spin"
                size={14}
              />
            )}

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-streamex-border rounded-lg shadow-xl z-[100] overflow-hidden"
                >
                  <ul className="py-1 max-h-80 overflow-y-auto custom-scrollbar">
                    {suggestions.map((item, idx) => (
                      <li key={item.tmdb_id}>
                        <button
                          ref={(el) => { suggestionItemsRef.current[idx] = el!; }}
                          onClick={() => handleSuggestionClick(item)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2 transition-colors duration-100 cursor-pointer text-left ${
                            idx === highlightedIndex
                              ? "bg-white/10"
                              : "hover:bg-white/10"
                          }`}
                        >
                          {/* Poster thumbnail */}
                          <div className="w-8 h-12 rounded object-cover flex-shrink-0 overflow-hidden bg-white/5">
                            {item.posterImage ? (
                              <img
                                src={item.posterImage}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-streamex-text-secondary">
                                <Film size={12} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className={`text-sm truncate leading-tight ${
                              idx === highlightedIndex ? "text-white" : "text-white"
                            }`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-streamex-text-secondary mt-0.5">
                              {item.year}{item.year && item.type ? " · " : ""}{item.type}
                            </p>
                            <div className="text-[10px] flex items-center gap-1 mt-1">
                              {item.rating > 0 && (
                                <span className="text-yellow-500">★ {item.rating.toFixed(1)}</span>
                              )}
                              {item.genres.length > 0 && (
                                <span className="text-streamex-text-secondary/60">{item.genres[0]}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
        {/* Browse section */}
        {!isCollapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-streamex-text-secondary/50">
            Browse
          </p>
        )}
        <nav className="space-y-0.5">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive(id)
                  ? "bg-streamex-accent text-white"
                  : "text-streamex-text-secondary hover:text-white hover:bg-white/5"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-streamex-border my-4 mx-2" />

        {/* Library section */}
        {!isCollapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-streamex-text-secondary/50">
            Library
          </p>
        )}
        <nav className="space-y-0.5">
          {libraryItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive(id)
                  ? "bg-streamex-accent text-white"
                  : "text-streamex-text-secondary hover:text-white hover:bg-white/5"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-streamex-border p-2 hidden md:block">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-streamex-text-secondary hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronRight
                size={18}
                className="rotate-180"
              />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0a0a0a] border border-streamex-border text-white md:hidden cursor-pointer"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-40 md:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:block flex-shrink-0">{sidebarContent}</aside>
    </>
  );
}
