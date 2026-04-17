"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Film,
  Tv,
  Flame,
  Star,
  Clock,
  Bookmark,
  Settings,
  Menu,
  X,
  Search,
  ChevronRight,
  Eye,
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const mainNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "movies", label: "Movies", icon: Film },
  { id: "tvshows", label: "TV Shows", icon: Tv },
  { id: "trending", label: "Trending", icon: Flame },
];

const discoverNav = [
  { id: "toprated", label: "Top Rated", icon: Star },
  { id: "new", label: "New Releases", icon: Clock },
];

const libraryNav = [
  { id: "mylist", label: "My List", icon: Bookmark },
];

const sidebarFooter = [
  { id: "vision-control", label: "Vision Control", icon: Eye },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (id: string) => activeView === id || (activeView === "home" && id === "home");

  const handleNavClick = (id: string) => {
    onViewChange(id);
    setIsMobileOpen(false);
  };

  const renderNavSection = (title: string, items: typeof mainNav) => (
    <div className="mb-4">
      {!isCollapsed && (
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-streamex-text-secondary">
          {title}
        </p>
      )}
      <nav className="space-y-0.5">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
              id === "vision-control"
                ? isActive(id)
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10"
                : isActive(id)
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
  );

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-[#0a0a0a] border-r border-streamex-border transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-streamex-border">
        <div className="w-8 h-8 rounded-lg bg-streamex-accent flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-sm">S</span>
        </div>
        {!isCollapsed && (
          <span className="text-lg font-black text-white tracking-tight">
            Stream<span className="text-streamex-accent">EX</span>
          </span>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-streamex-text-secondary"
              size={14}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-streamex-surface focus:ring-1 focus:ring-streamex-accent rounded-lg py-2 pl-8 pr-3 text-sm text-white placeholder:text-streamex-text-secondary focus:outline-none transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
        {renderNavSection("Browse", mainNav)}
        {renderNavSection("Discover", discoverNav)}
        {renderNavSection("Library", libraryNav)}
        {renderNavSection("", sidebarFooter)}
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
