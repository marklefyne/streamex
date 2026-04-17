"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Trophy,
  Play,
  Clock,
  Filter,
} from "lucide-react";
import { SportsPlayerModal, type SportMatch } from "./sports-player-modal";

/* ------------------------------------------------------------------ */
/*  Sport config & images                                              */
/* ------------------------------------------------------------------ */

type SportType = "Football" | "Basketball" | "Fight" | "Cricket" | "Hockey" | "Baseball" | "Tennis";
type FilterTab = "live" | "today" | "all";
type SportFilter = "All Sports" | SportType;

const SPORT_IMAGES: Record<SportType, string> = {
  Football: "/sports/football.png",
  Basketball: "/sports/basketball.png",
  Fight: "/sports/fight.png",
  Cricket: "/sports/cricket.png",
  Hockey: "/sports/hockey.png",
  Baseball: "/sports/baseball.png",
  Tennis: "/sports/tennis.png",
};

const sportIcons: Record<string, string> = {
  Football: "\u26BD",
  Basketball: "\uD83C\uDFC0",
  Fight: "\uD83E\uDD4A",
  Cricket: "\uD83C\uDFCF",
  Hockey: "\uD83C\uDFD2",
  Baseball: "\u26BE",
  Tennis: "\uD83C\uDFBE",
};

const sportAccentColors: Record<SportType, string> = {
  Football: "#22C55E",
  Basketball: "#F97316",
  Fight: "#EF4444",
  Cricket: "#3B82F6",
  Hockey: "#06B6D4",
  Baseball: "#EAB308",
  Tennis: "#A855F7",
};

/* ------------------------------------------------------------------ */
/*  Match data (20 matches across 7 sports)                            */
/* ------------------------------------------------------------------ */

const matches: SportMatch[] = [
  // Football (4 matches)
  { id: 1,  team1: "Real Madrid",    team2: "PSG",             sport: "Football",   status: "live",      time: "72'",       score: "2 - 1",   league: "UEFA Champions League", color1: "#FEBE10", color2: "#004170" },
  { id: 2,  team1: "Man City",       team2: "Liverpool",       sport: "Football",   status: "live",      time: "58'",       score: "1 - 1",   league: "Premier League",       color1: "#6CABDD", color2: "#C8102E" },
  { id: 3,  team1: "Barcelona",      team2: "Bayern Munich",   sport: "Football",   status: "scheduled", time: "3:00 PM",                league: "UEFA Champions League", color1: "#A50044", color2: "#DC052D" },
  { id: 4,  team1: "Arsenal",        team2: "Chelsea",         sport: "Football",   status: "live",      time: "81'",       score: "3 - 2",   league: "Premier League",       color1: "#EF0107", color2: "#034694" },

  // Basketball (3 matches)
  { id: 5,  team1: "Lakers",         team2: "Warriors",        sport: "Basketball", status: "live",      time: "Q3 4:22",              league: "NBA",                  color1: "#552583", color2: "#1D428A" },
  { id: 6,  team1: "Celtics",        team2: "Heat",            sport: "Basketball", status: "scheduled", time: "8:30 PM",               league: "NBA",                  color1: "#007A33", color2: "#98002E" },
  { id: 7,  team1: "Bulls",          team2: "Nets",            sport: "Basketball", status: "live",      time: "Q2 8:15",   score: "54 - 48", league: "NBA",                  color1: "#CE1141", color2: "#000000" },

  // Fight (2 matches)
  { id: 8,  team1: "Tyson Fury",     team2: "Oleksandr Usyk",  sport: "Fight",      status: "live",      time: "Rd 9",                 league: "Heavyweight Championship", color1: "#1E3A5F", color2: "#FFD700" },
  { id: 9,  team1: "C. McGregor",    team2: "D. Poirier",      sport: "Fight",      status: "scheduled", time: "11:00 PM",              league: "UFC 310",              color1: "#006847", color2: "#8B0000" },

  // Cricket (3 matches)
  { id: 10, team1: "India",          team2: "Australia",       sport: "Cricket",    status: "live",      time: "32 Overs",  score: "245/4",  league: "ICC World Cup",       color1: "#0066B3", color2: "#FFD700" },
  { id: 11, team1: "Pakistan",       team2: "England",         sport: "Cricket",    status: "scheduled", time: "2:00 PM",               league: "ICC World Cup",       color1: "#01411C", color2: "#003366" },
  { id: 12, team1: "South Africa",   team2: "New Zealand",     sport: "Cricket",    status: "live",      time: "28 Overs",  score: "189/6",  league: "ICC World Cup",       color1: "#007A4D", color2: "#000000" },

  // Hockey (2 matches)
  { id: 13, team1: "Maple Leafs",    team2: "Bruins",          sport: "Hockey",     status: "live",      time: "P2 14:05",             league: "NHL",                  color1: "#00205B", color2: "#FFB81C" },
  { id: 14, team1: "Blackhawks",     team2: "Rangers",         sport: "Hockey",     status: "scheduled", time: "7:00 PM",               league: "NHL",                  color1: "#CF0A2C", color2: "#0038A8" },

  // Baseball (3 matches)
  { id: 15, team1: "Yankees",        team2: "Dodgers",         sport: "Baseball",   status: "scheduled", time: "9:40 PM",               league: "MLB",                  color1: "#003087", color2: "#005A9C" },
  { id: 16, team1: "Astros",         team2: "Braves",          sport: "Baseball",   status: "live",      time: "Top 7th",  score: "5 - 3",  league: "MLB",                  color1: "#002D62", color2: "#CE1141" },
  { id: 17, team1: "Red Sox",        team2: "Cubs",            sport: "Baseball",   status: "live",      time: "Btm 5th",  score: "4 - 2",  league: "MLB",                  color1: "#BD3039", color2: "#0E3386" },

  // Tennis (3 matches)
  { id: 18, team1: "Djokovic",       team2: "Alcaraz",         sport: "Tennis",     status: "live",      time: "Set 3",    score: "6-4, 3-6, 4-2", league: "Wimbledon",         color1: "#1E3A5F", color2: "#CE1141" },
  { id: 19, team1: "Sinner",         team2: "Medvedev",        sport: "Tennis",     status: "scheduled", time: "1:30 PM",               league: "US Open",             color1: "#0066B3", color2: "#FFD700" },
  { id: 20, team1: "Swiatek",        team2: "Sabalenka",       sport: "Tennis",     status: "live",      time: "Set 2",    score: "6-3, 5-4",   league: "French Open",        color1: "#DC143C", color2: "#003366" },
];

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const filterTabs: { key: FilterTab; label: string; hasPulse?: boolean }[] = [
  { key: "live",  label: "Live Now", hasPulse: true },
  { key: "today", label: "Today" },
  { key: "all",   label: "All Matches" },
];

const sportOptions: SportFilter[] = [
  "All Sports",
  "Football",
  "Basketball",
  "Fight",
  "Cricket",
  "Hockey",
  "Baseball",
  "Tennis",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LiveSports() {
  const [activeTab, setActiveTab] = useState<FilterTab>("live");
  const [activeSport, setActiveSport] = useState<SportFilter>("All Sports");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SportMatch | null>(null);

  /* ---- Filtering logic ---- */
  const filtered = useMemo(() =>
    matches.filter((m) => {
      if (activeTab === "live" && m.status !== "live") return false;
      if (activeSport !== "All Sports" && m.sport !== activeSport) return false;
      return true;
    }),
    [activeTab, activeSport]
  );

  const liveCount = matches.filter((m) => m.status === "live").length;
  const matchCounts = useMemo(() => {
    const counts: Record<string, number> = { "All Sports": matches.length };
    for (const m of matches) {
      counts[m.sport] = (counts[m.sport] || 0) + 1;
    }
    return counts;
  }, []);

  /* ---- Animations ---- */
  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a]">
      {/* ============================================================ */}
      {/*  Hero Banner                                                  */}
      {/* ============================================================ */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/sports/hero.png')" }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />

        {/* Hero content */}
        <div className="relative h-full flex items-end px-6 sm:px-8 pb-5 sm:pb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-streamex-accent/20 backdrop-blur-md border border-streamex-accent/30 flex items-center justify-center shadow-lg shadow-streamex-accent/10">
              <Trophy size={24} className="text-streamex-accent sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                Live Sports
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-sm font-semibold text-red-400">
                    {liveCount} {liveCount === 1 ? "event" : "events"} live
                  </span>
                </div>
                <span className="text-streamex-text-secondary text-xs">|</span>
                <span className="text-sm text-streamex-text-secondary">
                  {matches.length} total matches
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Filter Bar                                                   */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/92 backdrop-blur-lg border-b border-white/[0.06]">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-[#121212] rounded-xl p-1 border border-white/[0.04]">
              {filterTabs.map(({ key, label, hasPulse }) => {
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-streamex-accent text-white shadow-lg shadow-streamex-accent/20"
                        : "text-streamex-text-secondary hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {hasPulse && (
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                      </span>
                    )}
                    <span>{label}</span>
                    {key === "live" && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {liveCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sport category dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#121212] border border-white/[0.06] hover:border-white/[0.12] text-sm text-white transition-colors cursor-pointer"
              >
                <Filter size={14} className="text-streamex-text-secondary" />
                <span className="hidden sm:inline">{activeSport}</span>
                <span className="sm:hidden">
                  {activeSport === "All Sports" ? "All" : sportIcons[activeSport]}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-streamex-text-secondary transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-52 bg-[#161616] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
                  >
                    {sportOptions.map((sport) => (
                      <button
                        key={sport}
                        onClick={() => {
                          setActiveSport(sport);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors cursor-pointer text-left ${
                          activeSport === sport
                            ? "bg-streamex-accent/15 text-streamex-accent"
                            : "text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="text-base">
                          {sport === "All Sports" ? "\uD83C\uDFC3" : sportIcons[sport]}
                        </span>
                        <span className="font-medium flex-1">{sport}</span>
                        <span className="text-xs text-streamex-text-secondary">
                          {matchCounts[sport] || 0}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Match Cards Grid                                             */}
      {/* ============================================================ */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-5">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-28 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#121212] flex items-center justify-center mb-5 border border-white/[0.04]">
                <Trophy size={32} className="text-streamex-text-secondary/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No matches found
              </h3>
              <p className="text-sm text-streamex-text-secondary max-w-xs">
                Try changing your filters to see more events
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab + activeSport}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {filtered.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={index}
                  variants={cardVariants}
                  onWatchNow={() => setSelectedMatch(match)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================ */}
      {/*  Pop-up Player Modal                                          */}
      {/* ============================================================ */}
      <SportsPlayerModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MatchCard sub-component                                            */
/* ------------------------------------------------------------------ */

function MatchCard({
  match,
  index,
  variants,
  onWatchNow,
}: {
  match: SportMatch;
  index: number;
  variants: {
    hidden: { opacity: number; y: number; scale: number };
    visible: (i: number) => {
      opacity: number;
      y: number;
      scale: number;
      transition: { delay: number; duration: number; ease: number[] };
    };
  };
  onWatchNow: () => void;
}) {
  const isLive = match.status === "live";
  const sportType = match.sport as SportType;
  const accentColor = sportAccentColors[sportType] || "#E50914";
  const bgImage = SPORT_IMAGES[sportType];

  return (
    <motion.div
      custom={index}
      variants={variants}
      className="group relative rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:shadow-2xl hover:shadow-black/40 bg-[#121212]"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Background image with overlay */}
      <div className="relative h-28 sm:h-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700"
          style={{ backgroundImage: `url('${bgImage}')` }}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/70 to-[#121212]/30" />

        {/* Top row: League + Status badge */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-2.5 sm:p-3">
          {/* Sport badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md backdrop-blur-md text-[10px] sm:text-[11px] font-medium"
            style={{
              backgroundColor: `${accentColor}20`,
              border: `1px solid ${accentColor}30`,
              color: accentColor,
            }}
          >
            <span className="text-sm">{sportIcons[match.sport]}</span>
            <span className="hidden sm:inline">{match.sport}</span>
          </div>

          {/* Status badge */}
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/20 backdrop-blur-md border border-red-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-black text-red-400 uppercase tracking-wider">
                LIVE
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/[0.08]">
              <Clock size={10} className="text-streamex-text-secondary" />
              <span className="text-[10px] sm:text-[11px] font-medium text-streamex-text-secondary">
                {match.time}
              </span>
            </div>
          )}
        </div>

        {/* League name bottom */}
        <div className="absolute bottom-2 left-2.5 sm:left-3 right-2.5 sm:right-3">
          <span className="text-[9px] sm:text-[10px] font-medium text-white/50 uppercase tracking-wider truncate block">
            {match.league}
          </span>
        </div>
      </div>

      {/* Card body: Teams + Score */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        {/* Live time / match progress */}
        {isLive && (
          <div className="text-center mb-2.5">
            <span
              className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }}
            >
              {match.time}
            </span>
          </div>
        )}

        {/* Teams display */}
        <div className="space-y-2.5">
          {/* Team 1 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] sm:text-sm font-bold shadow-lg ring-2 ring-white/10"
              style={{ backgroundColor: match.color1 }}
            >
              {match.team1.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white truncate flex-1">
              {match.team1}
            </span>
            {isLive && match.score && (
              <span className="text-sm sm:text-base font-black text-white tabular-nums">
                {match.score.split(" - ")[0]}
              </span>
            )}
          </div>

          {/* Center divider with VS or dash */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px bg-white/[0.06]" />
            {isLive && match.score ? (
              <span className="text-[10px] font-bold text-streamex-text-secondary px-1">-</span>
            ) : (
              <span className="text-[10px] font-black text-streamex-text-secondary tracking-[0.15em]">VS</span>
            )}
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] sm:text-sm font-bold shadow-lg ring-2 ring-white/10"
              style={{ backgroundColor: match.color2 }}
            >
              {match.team2.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white truncate flex-1">
              {match.team2}
            </span>
            {isLive && match.score && (
              <span className="text-sm sm:text-base font-black text-white tabular-nums">
                {match.score.split(" - ")[1]}
              </span>
            )}
          </div>
        </div>

        {/* Watch Now button */}
        <button
          onClick={(e) => { e.stopPropagation(); onWatchNow(); }}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
          style={{
            backgroundColor: isLive ? `${accentColor}20` : "rgba(255,255,255,0.05)",
            border: `1px solid ${isLive ? `${accentColor}40` : "rgba(255,255,255,0.08)"}`,
            color: isLive ? accentColor : "#A0A0A0",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = accentColor;
            e.currentTarget.style.color = "#FFFFFF";
            e.currentTarget.style.borderColor = accentColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isLive ? `${accentColor}20` : "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = isLive ? accentColor : "#A0A0A0";
            e.currentTarget.style.borderColor = isLive ? `${accentColor}40` : "rgba(255,255,255,0.08)";
          }}
        >
          <Play size={14} fill="currentColor" />
          {isLive ? "Watch Live" : "Watch Now"}
        </button>
      </div>
    </motion.div>
  );
}
