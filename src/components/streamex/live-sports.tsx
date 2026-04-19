"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Trophy,
  Play,
  Clock,
  Filter,
  Calendar,
  Flame,
  Gamepad2,
  Swords,
  Star,
  ArrowRight,
  Radio,
  Eye,
  Zap,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { SportsPlayerModal, type SportMatch } from "./sports-player-modal";

/* ================================================================== */
/*  CONSTANTS & TYPES                                                  */
/* ================================================================== */

type SportType = "Football" | "Basketball" | "Fighting" | "Cricket" | "Hockey" | "Esports";
type DateFilter = "Today" | "Tomorrow" | "Upcoming";

const SPORT_IMAGES: Record<SportType, string> = {
  Football: "/sports/football.png",
  Basketball: "/sports/basketball.png",
  Fighting: "/sports/fight.png",
  Cricket: "/sports/cricket.png",
  Hockey: "/sports/hockey.png",
  Esports: "/sports/esports.png",
};

const sportMeta: Record<SportType, { icon: string; accent: string; label: string }> = {
  Football:  { icon: "\u26BD", accent: "#22C55E", label: "Football" },
  Basketball:{ icon: "\uD83C\uDFC0", accent: "#F97316", label: "Basketball" },
  Fighting:  { icon: "\uD83E\uDD4A", accent: "#EF4444", label: "Boxing & UFC" },
  Cricket:   { icon: "\uD83C\uDFCF", accent: "#3B82F6", label: "Cricket" },
  Hockey:    { icon: "\uD83C\uDFD2", accent: "#06B6D4", label: "Hockey" },
  Esports:   { icon: "\uD83C\uDFAE", accent: "#A855F7", label: "Esports" },
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export function LiveSports() {
  const [activeSport, setActiveSport] = useState<"All" | SportType>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today");
  const [sportDropdown, setSportDropdown] = useState(false);
  const [dateDropdown, setDateDropdown] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SportMatch | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [matchStreams, setMatchStreams] = useState<Map<number, Record<string, string>>>(new Map());

  // Real data state
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  // Fetch real data from ESPN API
  const fetchMatches = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setFetchError(null);

    try {
      const res = await fetch("/api/sports/espn");
      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const data = await res.json();
      const fetchedMatches: SportMatch[] = data.matches || [];
      setMatches(fetchedMatches);
      setLastFetched(data.fetched_at || new Date().toISOString());
    } catch (err) {
      console.error("[LiveSports] Failed to fetch matches:", err);
      setFetchError("Failed to load live sports data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Fetch streams from API for a specific match
  const handleWatchMatch = useCallback(async (match: SportMatch) => {
    // Check cache first
    const cached = matchStreams.get(match.id);
    if (cached && Object.keys(cached).length > 0) {
      setSelectedMatch({ ...match, stream_urls: { ...match.stream_urls, ...cached } });
      return;
    }

    // Open player immediately with "searching" state
    setSelectedMatch({ ...match, stream_urls: { "searching": "" } });

    // Fetch streams from API in background
    try {
      const params = new URLSearchParams({
        match_id: String(match.id),
        sport: match.sport,
        team1: match.team1,
        team2: match.team2,
        league: match.league,
      });
      const res = await fetch(`/api/sports/streams?${params}`);
      if (res.ok) {
        const data = await res.json();
        const fetchedStreams: Record<string, string> = {};
        if (data.streams && Array.isArray(data.streams)) {
          data.streams.forEach((stream: { server: string; url: string }, idx: number) => {
            const key = stream.server || `server-${idx + 1}`;
            fetchedStreams[key] = stream.url;
          });
        }

        if (Object.keys(fetchedStreams).length > 0) {
          // Update cache
          setMatchStreams((prev) => {
            const next = new Map(prev);
            next.set(match.id, fetchedStreams);
            return next;
          });
          // Update the selected match with found streams
          setSelectedMatch((prev) =>
            prev ? { ...prev, stream_urls: { ...prev.stream_urls, ...fetchedStreams } } : prev
          );
        } else {
          // No streams found - remove the "searching" key so it shows custom URL input
          setSelectedMatch((prev) =>
            prev ? { ...prev, stream_urls: {} } : prev
          );
        }
      } else {
        setSelectedMatch((prev) =>
          prev ? { ...prev, stream_urls: {} } : prev
        );
      }
    } catch {
      setSelectedMatch((prev) =>
        prev ? { ...prev, stream_urls: {} } : prev
      );
    }
  }, [matchStreams]);

  const liveCount = matches.filter((m) => m.status === "live").length;

  const filteredBySport = useMemo(() => {
    if (activeSport === "All") return matches;
    return matches.filter((m) => m.sport === activeSport);
  }, [activeSport, matches]);

  const filteredByDate = useMemo(() => {
    if (dateFilter === "Today") return filteredBySport;
    if (dateFilter === "Tomorrow") return filteredBySport.filter((m) => m.time.toLowerCase().includes("tomorrow"));
    return filteredBySport;
  }, [filteredBySport, dateFilter]);

  /* ---- Build visible categories ---- */
  const visibleCategories = useMemo(() => {
    if (activeSport === "All" && dateFilter === "Today") {
      return buildCategories(matches);
    }
    // When filtered, flatten into a single "Matches" section
    return [{
      id: "matches",
      title: dateFilter === "Tomorrow" ? "Tomorrow's Matches" : dateFilter === "Upcoming" ? "Upcoming Matches" : activeSport === "All" ? "All Matches" : `${sportMeta[activeSport as SportType]?.label ?? activeSport}`,
      icon: <Filter size={18} />,
      filter: () => filteredByDate,
    }];
  }, [activeSport, dateFilter, filteredByDate, matches]);

  /* ---- Card animations ---- */
  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  const sportTabs: { key: "All" | SportType; label: string; icon: string }[] = [
    { key: "All",        label: "All",        icon: "\uD83C\uDFC3" },
    { key: "Football",   label: "Football",   icon: "\u26BD" },
    { key: "Basketball", label: "Basketball", icon: "\uD83C\uDFC0" },
    { key: "Fighting",   label: "Boxing & UFC", icon: "\uD83E\uDD4A" },
    { key: "Cricket",    label: "Cricket",    icon: "\uD83C\uDFCF" },
    { key: "Hockey",     label: "Hockey",     icon: "\uD83C\uDFD2" },
    { key: "Esports",    label: "Esports",    icon: "\uD83C\uDFAE" },
  ];

  const dateOptions: DateFilter[] = ["Today", "Tomorrow", "Upcoming"];

  return (
    <div className="w-full min-h-screen bg-[#080808]">
      {/* ============================================================ */}
      {/*  CONTROL BAR                                                  */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-30 bg-[#080808]/95 backdrop-blur-xl border-b border-emerald-500/10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          {/* Title row */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                <Trophy size={20} className="text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Live Sports</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-xs font-semibold text-red-400">{liveCount} live now</span>
                  <span className="text-white/10">|</span>
                  <span className="text-xs text-white/30">{matches.length} total</span>
                  {lastFetched && !isLoading && (
                    <>
                      <span className="text-white/10">|</span>
                      <span className="text-[10px] text-white/20">
                        Updated {new Date(lastFetched).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <button
                onClick={() => fetchMatches(true)}
                disabled={isLoading || isRefreshing}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-emerald-500/30 text-sm text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw size={14} className={`text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing…" : "Refresh"}</span>
              </button>

              {/* Date dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setDateDropdown(!dateDropdown); setSportDropdown(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-emerald-500/30 text-sm text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <Calendar size={14} className="text-emerald-400" />
                  <span className="hidden sm:inline">{dateFilter}</span>
                  <ChevronDown size={14} className={`text-white/30 transition-transform duration-200 ${dateDropdown ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {dateDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
                    >
                      {dateOptions.map((d) => (
                        <button key={d} onClick={() => { setDateFilter(d); setDateDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${dateFilter === d ? "bg-emerald-500/15 text-emerald-400 font-semibold" : "text-white/60 hover:bg-white/[0.04] hover:text-white"}`}>
                          {d}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sport filter pills */}
          <div className="flex items-center gap-1.5 pb-4 -mx-1 px-1 overflow-x-auto no-scrollbar">
            {sportTabs.map(({ key, label, icon }) => {
              const isActive = activeSport === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSport(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                      : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/70 border border-white/[0.04]"
                  }`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  {key !== "All" && isActive && (
                    <span className="text-[10px] bg-white/20 px-1 py-0.5 rounded-full ml-0.5">
                      {matches.filter((m) => m.sport === key).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  LOADING STATE                                                */}
      {/* ============================================================ */}
      {isLoading && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5 border border-emerald-500/20">
              <Loader2 size={28} className="text-emerald-400 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Loading Live Sports</h3>
            <p className="text-sm text-white/30 max-w-xs text-center">
              Fetching real-time match data from ESPN…
            </p>
          </div>
          {/* Skeleton grid */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-[#0f0f0f] border border-white/[0.05]">
                <div className="h-24 sm:h-28 bg-white/[0.03] skeleton-shimmer" />
                <div className="p-3 space-y-2.5">
                  <div className="h-3 bg-white/[0.04] rounded w-3/4 skeleton-shimmer" />
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] skeleton-shimmer" />
                    <div className="h-3 bg-white/[0.03] rounded flex-1 skeleton-shimmer" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] skeleton-shimmer" />
                    <div className="h-3 bg-white/[0.03] rounded flex-1 skeleton-shimmer" />
                  </div>
                  <div className="h-8 bg-white/[0.03] rounded-lg skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  ERROR STATE                                                  */}
      {/* ============================================================ */}
      {!isLoading && fetchError && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-5 border border-red-500/20">
              <Zap size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to Load Sports Data</h3>
            <p className="text-sm text-white/30 max-w-xs mb-6">{fetchError}</p>
            <button
              onClick={() => fetchMatches()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  CONTENT SECTIONS                                             */}
      {/* ============================================================ */}
      {!isLoading && !fetchError && (
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pb-12">
          {visibleCategories.map((cat) => {
            const items = cat.filter(filteredByDate);
            if (items.length === 0) return null;

            const isFeatured = cat.id === "featured";

            return (
              <section key={cat.id} className="mb-10 sm:mb-14">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{cat.title}</h2>
                    {cat.description && (
                      <p className="text-xs text-white/30 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                  {items.length > 0 && !isFeatured && (
                    <span className="ml-auto text-xs text-white/20 font-medium">{items.length} events</span>
                  )}
                </div>

                {/* === FEATURED HERO CARD === */}
                {isFeatured && items.length > 0 && (
                  <FeaturedHeroCard match={items[0]} onWatch={() => handleWatchMatch(items[0])} />
                )}

                {/* === MATCH CARD GRID === */}
                {!isFeatured && (
                  <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
                    initial="hidden" animate="visible"
                  >
                    {items.map((match, i) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        index={i}
                        variants={cardVariants}
                        isExpanded={expandedCard === match.id}
                        onToggleExpand={() => setExpandedCard(expandedCard === match.id ? null : match.id)}
                        onWatchNow={() => handleWatchMatch(match)}
                      />
                    ))}
                  </motion.div>
                )}
              </section>
            );
          })}

          {/* Empty state */}
          {visibleCategories.every((cat) => cat.filter(filteredByDate).length === 0) && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-5 border border-white/[0.04]">
                <Trophy size={32} className="text-white/10" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
              <p className="text-sm text-white/30 max-w-xs">
                {activeSport !== "All"
                  ? `No ${sportMeta[activeSport as SportType]?.label || activeSport} matches available right now. Try another sport or check back later.`
                  : "No matches available right now. Try changing your filters or check back later."
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  POP-UP STREAM SELECTOR                                       */}
      {/* ============================================================ */}
      {selectedMatch && (
        <SportsPlayerModal key={selectedMatch.id} match={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </div>
  );
}

/* ================================================================== */
/*  CATEGORY SECTIONS                                                  */
/* ================================================================== */

interface CategorySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  filter: (m: SportMatch[]) => SportMatch[];
}

function buildCategories(allMatches: SportMatch[]): CategorySection[] {
  const liveMatches = (m: SportMatch[]) => m.filter((x) => x.status === "live");

  // Pick the best featured match: prefer live Football, then any live, then any
  const pickFeatured = (matches: SportMatch[]): SportMatch | null => {
    if (matches.length === 0) return null;
    // Prefer live football matches (big leagues)
    const liveFootball = matches.find(
      (m) => m.status === "live" && m.sport === "Football" && m.league === "UEFA Champions League",
    );
    if (liveFootball) return liveFootball;
    const liveFootballAny = matches.find(
      (m) => m.status === "live" && m.sport === "Football",
    );
    if (liveFootballAny) return liveFootballAny;
    // Then any live match
    const anyLive = matches.find((m) => m.status === "live");
    if (anyLive) return anyLive;
    // Fallback to first match
    return matches[0];
  };

  const featured = pickFeatured(allMatches);

  return [
    {
      id: "featured",
      title: "Featured Match",
      icon: <Flame size={18} />,
      description: "The biggest match happening right now",
      filter: () => (featured ? [featured] : []),
    },
    {
      id: "live-now",
      title: "Live Now",
      icon: <Radio size={18} />,
      description: "All sports currently streaming",
      filter: liveMatches,
    },
    {
      id: "football",
      title: "Football",
      icon: <span className="text-base">\u26BD</span>,
      filter: (m) => m.filter((x) => x.sport === "Football"),
    },
    {
      id: "basketball",
      title: "Basketball",
      icon: <span className="text-base">\uD83C\uDFC0</span>,
      filter: (m) => m.filter((x) => x.sport === "Basketball"),
    },
    {
      id: "hockey",
      title: "Hockey",
      icon: <span className="text-base">\uD83C\uDFD2</span>,
      filter: (m) => m.filter((x) => x.sport === "Hockey"),
    },
    {
      id: "boxing-ufc",
      title: "Boxing & UFC",
      icon: <Swords size={18} />,
      filter: (m) => m.filter((x) => x.sport === "Fighting"),
    },
    {
      id: "upcoming",
      title: "Upcoming Events",
      icon: <Calendar size={18} />,
      filter: (m) => m.filter((x) => x.status === "scheduled"),
    },
  ];
}

/* ================================================================== */
/*  FEATURED HERO CARD                                                */
/* ================================================================== */

function FeaturedHeroCard({ match, onWatch }: { match: SportMatch; onWatch: () => void }) {
  const isLive = match.status === "live";
  const bgImage = SPORT_IMAGES[match.sport as SportType] || "/sports/hero.png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full rounded-2xl overflow-hidden border border-white/[0.06] sport-hero-card"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url('${bgImage}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>

      {/* Content */}
      <div className="relative px-6 sm:px-10 py-10 sm:py-14 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 min-h-[280px] sm:min-h-[320px]">
        {/* Left: Match info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            {isLive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[11px] font-black text-red-400 uppercase tracking-widest">Live</span>
              </div>
            )}
            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{match.league}</span>
          </div>

          {/* Team names + score */}
          <div className="flex items-center gap-4 sm:gap-6 mb-4">
            <div className="flex items-center gap-3">
              {match.team1_logo ? (
                <img src={match.team1_logo} alt={match.team1} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain shadow-xl bg-white/10 p-1.5" />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xl" style={{ backgroundColor: match.color1 }}>
                  {match.team1.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="text-lg sm:text-2xl font-black text-white">{match.team1}</span>
            </div>

            {match.score ? (
              <div className="flex flex-col items-center">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">{match.score}</span>
                <span className="text-[10px] text-white/30 font-medium mt-1">{match.time}</span>
              </div>
            ) : (
              <span className="text-2xl font-black text-white/20 tracking-widest">VS</span>
            )}

            <div className="flex items-center gap-3">
              <span className="text-lg sm:text-2xl font-black text-white">{match.team2}</span>
              {match.team2_logo ? (
                <img src={match.team2_logo} alt={match.team2} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain shadow-xl bg-white/10 p-1.5" />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xl" style={{ backgroundColor: match.color2 }}>
                  {match.team2.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-white/40 max-w-md mb-6">
            The most anticipated {match.sport.toLowerCase()} event. Don&apos;t miss this thrilling matchup between two world-class competitors.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onWatch}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
            >
              <Play size={16} fill="black" />
              Watch Now
            </button>
            <button
              onClick={onWatch}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-sm font-semibold transition-all cursor-pointer border border-white/[0.08]"
            >
              <Eye size={16} />
              Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ================================================================== */
/*  MATCH CARD (with hover-expand)                                     */
/* ================================================================== */

function MatchCard({
  match, index, variants, isExpanded, onToggleExpand, onWatchNow,
}: {
  match: SportMatch;
  index: number;
  variants: { hidden: { opacity: number; y: number; scale: number }; visible: (i: number) => { opacity: number; y: number; scale: number; transition: { delay: number; duration: number; ease: number[] } } };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onWatchNow: () => void;
}) {
  const isLive = match.status === "live";
  const sportType = match.sport as SportType;
  const meta = sportMeta[sportType];
  const accent = meta?.accent || "#22C55E";
  const bgImage = SPORT_IMAGES[sportType];

  return (
    <motion.div
      custom={index}
      variants={variants}
      layout
      className="group relative rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 bg-[#0f0f0f] sport-match-card"
      style={{
        borderColor: isExpanded ? `${accent}40` : "rgba(255,255,255,0.05)",
        boxShadow: isExpanded ? `0 8px 40px ${accent}15` : "none",
      }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {/* Background image */}
      <div className="relative h-24 sm:h-28 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-[#0f0f0f]/40" />

        {/* Sport + Status badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold"
            style={{ backgroundColor: `${accent}25`, color: accent }}
          >
            <span className="text-sm">{meta?.icon}</span>
            <span className="hidden sm:inline">{meta?.label}</span>
          </div>

          {isLive ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/25 backdrop-blur-md border border-red-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/[0.06]">
              <Clock size={9} className="text-white/40" />
              <span className="text-[10px] font-medium text-white/40">Scheduled</span>
            </div>
          )}
        </div>

        {/* League */}
        <div className="absolute bottom-1.5 left-2.5">
          <span className="text-[9px] font-medium text-white/30 uppercase tracking-wider truncate block max-w-[140px]">
            {match.league}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-3 py-3">
        {/* Live match time */}
        {isLive && (
          <div className="text-center mb-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: `${accent}15`, color: accent }}>
              {match.time}
            </span>
          </div>
        )}

        {/* Teams */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {match.team1_logo ? (
              <img src={match.team1_logo} alt={match.team1} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain flex-shrink-0 bg-white/10 p-0.5 shadow-md" />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] sm:text-[11px] font-bold shadow-md" style={{ backgroundColor: match.color1 }}>
                {match.team1.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] sm:text-xs font-semibold text-white truncate flex-1">{match.team1}</span>
            {isLive && match.score && <span className="text-xs font-black text-white/80 tabular-nums">{match.score.split(" - ")[0]}</span>}
          </div>

          <div className="flex items-center gap-2 px-0.5">
            <div className="flex-1 h-px bg-white/[0.04]" />
            {isLive && match.score ? (
              <span className="text-[9px] font-bold text-white/15">-</span>
            ) : (
              <span className="text-[9px] font-black text-white/15 tracking-[0.2em]">VS</span>
            )}
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          <div className="flex items-center gap-2">
            {match.team2_logo ? (
              <img src={match.team2_logo} alt={match.team2} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain flex-shrink-0 bg-white/10 p-0.5 shadow-md" />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] sm:text-[11px] font-bold shadow-md" style={{ backgroundColor: match.color2 }}>
                {match.team2.substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] sm:text-xs font-semibold text-white truncate flex-1">{match.team2}</span>
            {isLive && match.score && <span className="text-xs font-black text-white/80 tabular-nums">{match.score.split(" - ")[1]}</span>}
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Competition</span>
                  <span className="text-[10px] text-white/50 font-medium">{match.league}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Status</span>
                  {isLive ? (
                    <span className="text-[10px] font-bold text-red-400">{match.time}</span>
                  ) : (
                    <span className="text-[10px] font-medium text-white/50">{match.time}</span>
                  )}
                </div>
                {match.str_status && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">API Status</span>
                    <span className="text-[10px] font-medium text-white/40">{match.str_status.replace("STATUS_", "").replace(/_/g, " ")}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onWatchNow(); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <Play size={12} fill="currentColor" />
            {isLive ? "Watch Live" : "Watch Now"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer ${
              isExpanded ? "bg-white/[0.08] text-white" : "bg-white/[0.04] text-white/30 hover:bg-white/[0.08] hover:text-white/60"
            }`}
          >
            <ArrowRight size={12} className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
