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
  ArrowUpRight,
  Star,
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
  const [isFocused, setIsFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    }, 250);
  };

  const clearSearch = () => {
    onSearchChange("");
    setHighlightedIndex(-1);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleViewAllResults = () => {
    setShowSuggestions(false);
    setHighlightedIndex(-1);
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
            {/* Enhanced search input */}
            <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
              isFocused
                ? 'bg-streamex-surface border-streamex-accent/40 shadow-lg shadow-streamex-accent/5'
                : 'bg-white/[0.04] border-transparent hover:bg-white/[0.07] hover:border-white/10'
            }`}>
              <Search
                className={`absolute left-3 transition-colors duration-200 ${
                  isFocused ? 'text-streamex-accent' : 'text-streamex-text-secondary'
                }`}
                size={15}
              />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setIsFocused(true);
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                    setHighlightedIndex(-1);
                  }
                }}
                onBlur={() => {
                  setIsFocused(false);
                }}
                placeholder="Search movies & shows..."
                className="w-full bg-transparent rounded-xl py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-streamex-text-secondary/60 focus:outline-none"
              />

              {/* Clear button */}
              <AnimatePresence>
                {searchQuery.length > 0 && !isLoadingSuggestions && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    onClick={clearSearch}
                    className="absolute right-2 p-1 rounded-md text-streamex-text-secondary hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Loading spinner */}
              {isLoadingSuggestions && (
                <div className="absolute right-2.5">
                  <Loader2 className="text-streamex-accent animate-spin" size={14} />
                </div>
              )}
            </div>

            {/* Keyboard shortcut hint */}
            {!isFocused && searchQuery.length === 0 && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-streamex-text-secondary/50 bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[9px]">⌘</span>K
                </kbd>
              </div>
            )}

            {/* Enhanced suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#161616] border border-streamex-border rounded-xl shadow-2xl shadow-black/50 z-[100] overflow-hidden"
                >
                  {/* Section header */}
                  <div className="px-3 pt-3 pb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-streamex-text-secondary/50">
                      Suggestions
                    </p>
                  </div>

                  <ul className="px-2 pb-2 max-h-[420px] overflow-y-auto custom-scrollbar">
                    {suggestions.map((item, idx) => (
                      <li key={item.tmdb_id} className="mb-0.5">
                        <button
                          ref={(el) => { suggestionItemsRef.current[idx] = el!; }}
                          onClick={() => handleSuggestionClick(item)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer text-left group ${
                            idx === highlightedIndex
                              ? 'bg-white/10'
                              : 'hover:bg-white/[0.06]'
                          }`}
                        >
                          {/* Larger poster thumbnail */}
                          <div className="w-10 h-[60px] rounded-md overflow-hidden flex-shrink-0 bg-white/5 shadow-md">
                            {item.posterImage ? (
                              <img
                                src={item.posterImage}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-streamex-text-secondary">
                                <Film size={14} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 py-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[13px] font-medium text-white truncate leading-snug">
                                {item.title}
                              </p>
                              {idx === highlightedIndex && (
                                <ArrowUpRight size={13} className="text-streamex-text-secondary flex-shrink-0 mt-0.5" />
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              {/* Type badge */}
                              <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                item.type === 'Movie'
                                  ? 'bg-blue-500/15 text-blue-400'
                                  : 'bg-purple-500/15 text-purple-400'
                              }`}>
                                {item.type === 'Movie' ? 'Movie' : 'TV'}
                              </span>
                              {item.year && (
                                <span className="text-[11px] text-streamex-text-secondary/70">
                                  {item.year}
                                </span>
                              )}
                              {item.rating > 0 && (
                                <span className="flex items-center gap-0.5 text-[11px]">
                                  <Star size={10} className="fill-yellow-500 text-yellow-500" />
                                  <span className="text-yellow-400 font-medium">{item.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>

                            {/* Genre tags */}
                            {item.genres.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                                {item.genres.slice(0, 2).map((g) => (
                                  <span
                                    key={g}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-streamex-text-secondary/60 truncate max-w-[80px]"
                                  >
                                    {g}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* View all results footer */}
                  <button
                    onClick={handleViewAllResults}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border-t border-streamex-border text-xs text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
                  >
                    <Search size={12} />
                    View all results for "{searchQuery}"
                    <ArrowUpRight size={11} />
                  </button>
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
