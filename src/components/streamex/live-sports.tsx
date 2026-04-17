"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  ChevronDown,
  Trophy,
  Play,
  Clock,
  Filter,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Match {
  id: number;
  team1: string;
  team2: string;
  sport: "Football" | "Basketball" | "Fight" | "Cricket" | "Hockey" | "Baseball";
  status: "live" | "scheduled";
  time: string;
  league: string;
  color1: string;
  color2: string;
}

type FilterTab = "live" | "today" | "all";
type SportFilter = "All Sports" | "Football" | "Basketball" | "Fight" | "Cricket" | "Hockey" | "Baseball";

/* ------------------------------------------------------------------ */
/*  Hardcoded match data (15 matches)                                  */
/* ------------------------------------------------------------------ */

const matches: Match[] = [
  { id: 1,  team1: "Real Madrid",    team2: "PSG",             sport: "Football",   status: "live",      time: "72'",       league: "Champions League",     color1: "#FEBE10", color2: "#004170" },
  { id: 2,  team1: "Lakers",         team2: "Warriors",        sport: "Basketball", status: "live",      time: "Q3 4:22",   league: "NBA",                   color1: "#552583", color2: "#1D428A" },
  { id: 3,  team1: "Man City",       team2: "Liverpool",       sport: "Football",   status: "live",      time: "58'",       league: "Premier League",        color1: "#6CABDD", color2: "#C8102E" },
  { id: 4,  team1: "Celtics",        team2: "Heat",            sport: "Basketball", status: "scheduled", time: "8:30 PM",    league: "NBA",                   color1: "#007A33", color2: "#98002E" },
  { id: 5,  team1: "India",          team2: "Australia",       sport: "Cricket",    status: "live",      time: "32 Overs",  league: "ICC World Cup",         color1: "#0066B3", color2: "#FFD700" },
  { id: 6,  team1: "Pakistan",       team2: "England",         sport: "Cricket",    status: "scheduled", time: "2:00 PM",    league: "ICC World Cup",         color1: "#01411C", color2: "#003366" },
  { id: 7,  team1: "Tyson Fury",     team2: "O. Usyk",         sport: "Fight",      status: "live",      time: "Rd 9",      league: "Heavyweight Championship", color1: "#1E3A5F", color2: "#FFD700" },
  { id: 8,  team1: "C. McGregor",    team2: "D. Poirier",      sport: "Fight",      status: "scheduled", time: "11:00 PM",   league: "UFC 310",               color1: "#006847", color2: "#8B0000" },
  { id: 9,  team1: "Maple Leafs",    team2: "Bruins",          sport: "Hockey",     status: "live",      time: "P2 14:05",  league: "NHL",                   color1: "#00205B", color2: "#FFB81C" },
  { id: 10, team1: "Blackhawks",     team2: "Rangers",         sport: "Hockey",     status: "scheduled", time: "7:00 PM",    league: "NHL",                   color1: "#CF0A2C", color2: "#0038A8" },
  { id: 11, team1: "Yankees",        team2: "Dodgers",         sport: "Baseball",   status: "scheduled", time: "9:40 PM",    league: "MLB",                   color1: "#003087", color2: "#005A9C" },
  { id: 12, team1: "Astros",         team2: "Braves",          sport: "Baseball",   status: "live",      time: "Top 7th",   league: "MLB",                   color1: "#002D62", color2: "#CE1141" },
  { id: 13, team1: "Barcelona",      team2: "Bayern Munich",   sport: "Football",   status: "scheduled", time: "3:00 PM",    league: "Champions League",     color1: "#A50044", color2: "#DC052D" },
  { id: 14, team1: "Arsenal",        team2: "Chelsea",         sport: "Football",   status: "live",      time: "81'",       league: "Premier League",        color1: "#EF0107", color2: "#034694" },
  { id: 15, team1: "Bulls",          team2: "Nets",            sport: "Basketball", status: "scheduled", time: "10:00 PM",   league: "NBA",                   color1: "#CE1141", color2: "#000000" },
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
];

const sportIcons: Record<string, string> = {
  Football: "\u26BD",
  Basketball: "\uD83C\uDFC0",
  Fight: "\uD83E\uDD4A",
  Cricket: "\uD83C\uDFCF",
  Hockey: "\uD83C\uDFD2",
  Baseball: "\u26BE",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LiveSports() {
  const [activeTab, setActiveTab] = useState<FilterTab>("live");
  const [activeSport, setActiveSport] = useState<SportFilter>("All Sports");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /* ---- Filtering logic ---- */
  const filtered = matches.filter((m) => {
    // Tab filter
    if (activeTab === "live" && m.status !== "live") return false;
    if (activeTab === "today") {
      // "today" shows everything for this demo (same day)
    }
    // Sport filter
    if (activeSport !== "All Sports" && m.sport !== activeSport) return false;
    return true;
  });

  const liveCount = matches.filter((m) => m.status === "live").length;

  /* ---- Animations ---- */
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0a]">
      {/* ============================================================ */}
      {/*  Header                                                       */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-streamex-accent/15 flex items-center justify-center">
                <Trophy size={18} className="text-streamex-accent" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Live Sports
                </h1>
                <p className="text-xs text-streamex-text-secondary mt-0.5">
                  {liveCount} {liveCount === 1 ? "event" : "events"} happening now
                </p>
              </div>
            </div>

            {/* Sport category dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#121212] border border-[#222] hover:border-[#333] text-sm text-white transition-colors cursor-pointer"
              >
                <Filter size={14} className="text-streamex-text-secondary" />
                <span className="hidden sm:inline">{activeSport}</span>
                <span className="sm:hidden">
                  {activeSport === "All Sports" ? "All" : activeSport}
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
                    className="absolute right-0 top-full mt-2 w-48 bg-[#161616] border border-[#222] rounded-xl shadow-2xl shadow-black/60 z-50 overflow-hidden"
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
                        <span className="font-medium">{sport}</span>
                        {sport === "All Sports" && (
                          <span className="ml-auto text-xs text-streamex-text-secondary">
                            {matches.length}
                          </span>
                        )}
                        {sport !== "All Sports" && (
                          <span className="ml-auto text-xs text-streamex-text-secondary">
                            {matches.filter((m) => m.sport === sport).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#121212] rounded-lg p-1 w-fit">
            {filterTabs.map(({ key, label, hasPulse }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
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
                      {isActive && (
                        <Radio size={12} />
                      )}
                    </span>
                  )}
                  {!hasPulse && isActive && <Radio size={12} />}
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
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Match Cards Grid                                             */}
      {/* ============================================================ */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#121212] flex items-center justify-center mb-4">
                <Trophy size={28} className="text-streamex-text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                No matches found
              </h3>
              <p className="text-sm text-streamex-text-secondary">
                Try changing your filters to see more events
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab + activeSport}
              className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
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
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
}: {
  match: Match;
  index: number;
  variants: {
    hidden: { opacity: number; y: number; scale: number };
    visible: (i: number) => {
      opacity: number;
      y: number;
      scale: number;
      transition: {
        delay: number;
        duration: number;
        ease: number[];
      };
    };
  };
}) {
  const isLive = match.status === "live";

  return (
    <motion.div
      custom={index}
      variants={variants}
      className="group relative rounded-xl overflow-hidden bg-[#121212] border border-[#222] hover:border-[#333] transition-colors duration-300 cursor-pointer"
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Card content */}
      <div className="p-3 sm:p-4">
        {/* Top row: league + status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{sportIcons[match.sport]}</span>
            <span className="text-[10px] sm:text-[11px] font-medium text-streamex-text-secondary truncate max-w-[80px] sm:max-w-none">
              {match.league}
            </span>
          </div>

          {isLive ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-red-400 uppercase tracking-wide">
                Live
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.06]">
              <Clock size={10} className="text-streamex-text-secondary" />
              <span className="text-[10px] sm:text-[11px] font-medium text-streamex-text-secondary">
                {match.time}
              </span>
            </span>
          )}
        </div>

        {/* Live match time indicator */}
        {isLive && (
          <div className="text-center mb-3">
            <span className="text-[11px] font-bold text-streamex-accent bg-streamex-accent/10 px-2 py-0.5 rounded-md">
              {match.time}
            </span>
          </div>
        )}

        {/* Teams */}
        <div className="space-y-3">
          {/* Team 1 */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs sm:text-sm font-bold shadow-md"
              style={{ backgroundColor: match.color1 }}
            >
              {match.team1.charAt(0)}
            </div>
            <span className="text-[12px] sm:text-sm font-semibold text-white truncate">
              {match.team1}
            </span>
          </div>

          {/* VS divider */}
          <div className="flex items-center gap-2 px-1">
            <div className="flex-1 h-px bg-[#222]" />
            <span className="text-[10px] font-bold text-streamex-text-secondary tracking-widest">
              VS
            </span>
            <div className="flex-1 h-px bg-[#222]" />
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs sm:text-sm font-bold shadow-md"
              style={{ backgroundColor: match.color2 }}
            >
              {match.team2.charAt(0)}
            </div>
            <span className="text-[12px] sm:text-sm font-semibold text-white truncate">
              {match.team2}
            </span>
          </div>
        </div>
      </div>

      {/* Hover overlay — Watch Now */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-streamex-accent hover:bg-streamex-accent-hover rounded-lg text-white text-sm font-semibold shadow-lg shadow-streamex-accent/30 transition-colors cursor-pointer"
        >
          <Play size={16} fill="white" />
          Watch Now
        </motion.button>
      </div>
    </motion.div>
  );
}
