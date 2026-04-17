"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Film,
  Tv,
  Search,
  ChevronRight,
  Clock,
  Heart,
  Loader2,
  ArrowUpRight,
  Star,
  Menu,
  X,
  Flame,
  Sparkles,
  Trophy,
  Music,
  BookOpen,
  ShieldAlert,
  LayoutGrid,
} from "lucide-react";
import type { CardItem } from "@/components/streamex/media-card";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSuggestion?: (item: CardItem) => void;
}

const mainNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
];

const mediaNav = [
  { id: "movies", label: "Movies", icon: Film },
  { id: "tvshows", label: "TV Shows", icon: Tv },
  { id: "anime", label: "Anime", icon: Sparkles },
  { id: "manga", label: "Manga", icon: BookOpen },
  { id: "music", label: "Music", icon: Music },
  { id: "sports", label: "Live Sports", icon: Trophy },
];

const userNav = [
  { id: "favorites", label: "Watchlist", icon: Heart },
  { id: "history", label: "History", icon: Clock },
];

const moreNav = [
  { id: "dmca", label: "Legal / DMCA", icon: ShieldAlert },
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

  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionItemsRef.current[highlightedIndex]) {
      suggestionItemsRef.current[highlightedIndex].scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

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

  // Nav item renderer
  const renderNavItem = ({ id, label, icon: Icon }: { id: string; label: string; icon: typeof Home }) => (
    <button
      key={id}
      onClick={() => handleNavClick(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer relative ${
        isActive(id)
          ? "bg-white/10 text-white"
          : "text-streamex-text-secondary hover:text-white hover:bg-white/5"
      } ${isCollapsed ? "justify-center" : ""}`}
      title={isCollapsed ? label : undefined}
    >
      {isActive(id) && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-streamex-accent rounded-r-full" />
      )}
      <Icon size={18} className={`flex-shrink-0 ${isActive(id) ? "text-white" : ""}`} />
      {!isCollapsed && <span>{label}</span>}
      {/* Active indicator dot for sports */}
      {id === "sports" && !isCollapsed && (
        <span className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-pulse" />
          <span className="text-[10px] text-red-400 font-medium">LIVE</span>
        </span>
      )}
    </button>
  );

  // Section header
  const renderSectionHeader = (label: string) => {
    if (isCollapsed) {
      return (
        <div className="flex justify-center my-3">
          <div className="w-6 h-px bg-white/10" />
        </div>
      );
    }
    return (
      <p className="px-3 mb-1.5 mt-4 text-[10px] font-bold uppercase tracking-[0.15em] text-streamex-text-secondary/40">
        {label}
      </p>
    );
  };

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-[#0a0a0a] transition-all duration-300 ${
        isCollapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <button
        onClick={() => handleNavClick("home")}
        className="flex items-center gap-2.5 px-4 py-5 w-full cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-lg bg-streamex-accent flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-sm">F</span>
        </div>
        {!isCollapsed && (
          <span className="text-lg font-black text-white tracking-tight">
            Flux<span className="text-streamex-accent">Stream</span>
          </span>
        )}
      </button>

      {/* Search — always visible at top */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="relative" ref={searchContainerRef}>
            <div className={`relative flex items-center rounded-lg border transition-all duration-200 ${
              isFocused
                ? 'bg-[#1a1a1a] border-white/10 shadow-lg'
                : 'bg-white/[0.04] border-transparent hover:bg-white/[0.07]'
            }`}>
              <Search
                className={`absolute left-2.5 transition-colors duration-200 ${
                  isFocused ? 'text-streamex-accent' : 'text-streamex-text-secondary/50'
                }`}
                size={14}
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
                onBlur={() => { setIsFocused(false); }}
                placeholder="Search..."
                className="w-full bg-transparent rounded-lg py-2 pl-8 pr-8 text-[13px] text-white placeholder:text-streamex-text-secondary/40 focus:outline-none"
              />
              <AnimatePresence>
                {searchQuery.length > 0 && !isLoadingSuggestions && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    onClick={clearSearch}
                    className="absolute right-2 p-0.5 rounded text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
              {isLoadingSuggestions && (
                <div className="absolute right-2.5">
                  <Loader2 className="text-streamex-accent animate-spin" size={12} />
                </div>
              )}
            </div>

            {!isFocused && searchQuery.length === 0 && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium text-streamex-text-secondary/30 bg-white/[0.02] border border-white/[0.05]">
                  ⌘K
                </kbd>
              </div>
            )}

            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-full left-0 right-0 mt-1.5 bg-[#161616] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 z-[100] overflow-hidden"
                >
                  <div className="px-3 pt-3 pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-streamex-text-secondary/40">
                      Suggestions
                    </p>
                  </div>
                  <ul className="px-1.5 pb-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {suggestions.map((item, idx) => (
                      <li key={item.tmdb_id} className="mb-px">
                        <button
                          ref={(el) => { suggestionItemsRef.current[idx] = el!; }}
                          onClick={() => handleSuggestionClick(item)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer text-left group ${
                            idx === highlightedIndex ? 'bg-white/10' : 'hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="w-9 h-[54px] rounded overflow-hidden flex-shrink-0 bg-white/5">
                            {item.posterImage ? (
                              <img src={item.posterImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-streamex-text-secondary">
                                <Film size={12} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 py-0.5">
                            <p className="text-[13px] font-medium text-white truncate leading-snug">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                item.type === 'Movie' ? 'bg-blue-500/15 text-blue-400' :
                                item.type === 'Anime' ? 'bg-emerald-500/15 text-emerald-400' :
                                'bg-purple-500/15 text-purple-400'
                              }`}>
                                {item.type === 'Movie' ? 'Movie' : item.type === 'Anime' ? 'Anime' : 'TV'}
                              </span>
                              {item.year && <span className="text-[11px] text-streamex-text-secondary/50">{item.year}</span>}
                              {item.rating > 0 && (
                                <span className="flex items-center gap-0.5 text-[11px]">
                                  <Star size={9} className="fill-yellow-500 text-yellow-500" />
                                  <span className="text-yellow-400 font-medium">{item.rating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                            {item.genres.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {item.genres.slice(0, 2).map((g) => (
                                  <span key={g} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-streamex-text-secondary/50 truncate max-w-[72px]">{g}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {idx === highlightedIndex && (
                            <ArrowUpRight size={12} className="text-streamex-text-secondary/50 flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleViewAllResults}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border-t border-white/[0.05] text-[11px] text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
                  >
                    <Search size={11} />
                    View all results for &ldquo;{searchQuery}&rdquo;
                    <ArrowUpRight size={10} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2.5">
        {/* Main */}
        {renderSectionHeader("Main")}
        <nav className="space-y-0.5">
          {mainNav.map(renderNavItem)}
        </nav>

        {/* Media */}
        {renderSectionHeader("Media")}
        <nav className="space-y-0.5">
          {mediaNav.map(renderNavItem)}
        </nav>

        {/* User */}
        {renderSectionHeader("User")}
        <nav className="space-y-0.5">
          {userNav.map(renderNavItem)}
        </nav>

        {/* More */}
        <div className="mt-4 border-t border-white/[0.04] pt-3">
          <nav className="space-y-0.5">
            {moreNav.map(renderNavItem)}
          </nav>
        </div>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-white/[0.04] p-2 hidden md:block">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] text-streamex-text-secondary/50 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronRight size={16} className="rotate-180" />
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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0a0a0a]/90 backdrop-blur-sm border border-white/[0.06] text-white md:hidden cursor-pointer"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
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
