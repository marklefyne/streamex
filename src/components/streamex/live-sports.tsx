"use client";

import { useState, useMemo, useCallback } from "react";
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
/*  MATCH DATA — 28 matches across all sports                          */
/* ================================================================== */

const HLS_STREAMS: Record<string, string> = {
  "server-1": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
  "server-2": "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
  "server-3": "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8",
  "server-4": "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
  "server-5": "https://storage.googleapis.com/shaka-demo-assets/angel-one.m3u8",
};

const allMatches: SportMatch[] = [
  // --- Football (5) ---
  { id: 1, team1: "Real Madrid",   team2: "PSG",              sport: "Football",  status: "live",      time: "72'",       score: "2 - 1",   league: "UEFA Champions League", color1: "#FEBE10", color2: "#004170", viewers: "1.2M",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 2, team1: "Man City",      team2: "Liverpool",        sport: "Football",  status: "live",      time: "58'",       score: "1 - 1",   league: "Premier League",       color1: "#6CABDD", color2: "#C8102E", viewers: "980K",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 3, team1: "Barcelona",     team2: "Bayern Munich",    sport: "Football",  status: "scheduled", time: "Tomorrow 3:00 PM",        league: "UEFA Champions League", color1: "#A50044", color2: "#DC052D",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 4, team1: "Arsenal",       team2: "Chelsea",          sport: "Football",  status: "live",      time: "81'",       score: "3 - 2",   league: "Premier League",       color1: "#EF0107", color2: "#034694", viewers: "870K",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 5, team1: "Inter Milan",   team2: "AC Milan",         sport: "Football",  status: "scheduled", time: "Upcoming 9:00 PM",       league: "Serie A",              color1: "#0068A8", color2: "#FB090B",
    stream_urls: { ...HLS_STREAMS },
  },

  // --- Basketball (4) ---
  { id: 6,  team1: "Lakers",       team2: "Warriors",         sport: "Basketball", status: "live",      time: "Q3 4:22",  score: "89 - 84", league: "NBA",                  color1: "#552583", color2: "#1D428A", viewers: "2.1M",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 7,  team1: "Celtics",      team2: "Heat",             sport: "Basketball", status: "scheduled", time: "Tomorrow 8:30 PM",       league: "NBA",                  color1: "#007A33", color2: "#98002E",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 8,  team1: "Bucks",        team2: "76ers",            sport: "Basketball", status: "live",      time: "Q2 6:15",  score: "54 - 48", league: "NBA",                  color1: "#00471B", color2: "#006BB6", viewers: "640K",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 9,  team1: "Nuggets",      team2: "Suns",             sport: "Basketball", status: "scheduled", time: "Upcoming 10:00 PM",      league: "NBA",                  color1: "#0E2240", color2: "#1D1160",
    stream_urls: { ...HLS_STREAMS },
  },

  // --- Fighting (4) ---
  { id: 10, team1: "Tyson Fury",   team2: "Oleksandr Usyk",   sport: "Fighting",  status: "live",      time: "Rd 9",                  league: "Heavyweight Championship", color1: "#1E3A5F", color2: "#FFD700", viewers: "3.4M",
    stream_urls: {
      "server-1": "https://www.youtube.com/embed/MoU73PpOGKE",
      "server-2": "https://www.youtube.com/embed/YXJFMt8hyww",
      ...HLS_STREAMS,
    },
  },
  { id: 11, team1: "C. McGregor",  team2: "D. Poirier",       sport: "Fighting",  status: "scheduled", time: "Tomorrow 11:00 PM",      league: "UFC 310",              color1: "#006847", color2: "#8B0000",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 12, team1: "Canelo",       team2: "Bivol",             sport: "Fighting",  status: "live",      time: "Rd 7",     score: "68-65",  league: "WBC Super Middleweight", color1: "#BE2535", color2: "#1E3A5F", viewers: "1.8M",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 13, team1: "J. Jones",     team2: "S. Aspinall",       sport: "Fighting",  status: "scheduled", time: "Upcoming",               league: "UFC 311",              color1: "#000000", color2: "#DC143C",
    stream_urls: { ...HLS_STREAMS },
  },

  // --- Cricket (3) ---
  { id: 14, team1: "India",        team2: "Australia",        sport: "Cricket",    status: "live",      time: "32 Overs", score: "245/4",  league: "ICC World Cup",       color1: "#0066B3", color2: "#FFD700", viewers: "450M",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 15, team1: "Pakistan",     team2: "England",          sport: "Cricket",    status: "scheduled", time: "Tomorrow 2:00 PM",       league: "ICC World Cup",       color1: "#01411C", color2: "#003366",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 16, team1: "South Africa", team2: "New Zealand",      sport: "Cricket",    status: "live",      time: "28 Overs", score: "189/6",  league: "ICC World Cup",       color1: "#007A4D", color2: "#000000", viewers: "210M",
    stream_urls: { ...HLS_STREAMS },
  },

  // --- Hockey (3) ---
  { id: 17, team1: "Maple Leafs",  team2: "Bruins",           sport: "Hockey",     status: "live",      time: "P2 14:05",             league: "NHL",                  color1: "#00205B", color2: "#FFB81C", viewers: "320K",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 18, team1: "Blackhawks",   team2: "Rangers",          sport: "Hockey",     status: "scheduled", time: "Tomorrow 7:00 PM",       league: "NHL",                  color1: "#CF0A2C", color2: "#0038A8",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 19, team1: "Oilers",       team2: "Panthers",         sport: "Hockey",     status: "live",      time: "P3 8:30",  score: "3 - 2",  league: "NHL",                  color1: "#041E42", color2: "#041E42", viewers: "410K",
    stream_urls: { ...HLS_STREAMS },
  },

  // --- Esports (5) ---
  { id: 20, team1: "T1",           team2: "Gen.G",            sport: "Esports",    status: "live",      time: "Game 3",               league: "Worlds 2025 — LoL",   color1: "#E4002B", color2: "#1A1A1A", viewers: "4.2M",
    stream_urls: {
      "server-1": "https://www.youtube.com/embed/GfBcGFtHR8c",
      "server-2": "https://www.youtube.com/embed/t6bMAgOb3GY",
      ...HLS_STREAMS,
    },
  },
  { id: 21, team1: "NAVI",         team2: "FaZe Clan",        sport: "Esports",    status: "scheduled", time: "Tomorrow 6:00 PM",       league: "IEM Katowice — CS2",  color1: "#FFD700", color2: "#FF0000",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 22, team1: "Sentinels",    team2: "LOUD",             sport: "Esports",    status: "live",      time: "Map 2",    score: "13-8",   league: "VCT Masters — VAL",  color1: "#FF4655", color2: "#00FF94", viewers: "1.1M",
    stream_urls: {
      "server-1": "https://www.youtube.com/embed/gDEkMJT3CuE",
      ...HLS_STREAMS,
    },
  },
  { id: 23, team1: "Team Spirit",  team2: "Gaimin Gladiators",sport: "Esports",    status: "scheduled", time: "Upcoming 4:00 PM",       league: "The International — Dota 2", color1: "#4B2C7F", color2: "#00FF7F",
    stream_urls: { ...HLS_STREAMS },
  },
  { id: 24, team1: "Cloud9",       team2: "100 Thieves",      sport: "Esports",    status: "scheduled", time: "Upcoming 8:00 PM",       league: "VCT Americas — VAL", color1: "#009BCD", color2: "#FF4444",
    stream_urls: { ...HLS_STREAMS },
  },

  // --- Catch-up / Replays (4) ---
  { id: 25, team1: "Man Utd",      team2: " Arsenal",          sport: "Football",  status: "scheduled", time: "Yesterday",             league: "FA Cup — Highlights", color1: "#DA291C", color2: "#EF0107",
    stream_urls: {
      "server-1": "https://www.youtube.com/embed/H0RNMZPM8aI",
      ...HLS_STREAMS,
    },
  },
  { id: 26, team1: "Warriors",     team2: "Celtics",          sport: "Basketball", status: "scheduled", time: "Yesterday",             league: "NBA Finals Replay",   color1: "#1D428A", color2: "#007A33",
    stream_urls: {
      "server-1": "https://www.youtube.com/embed/mXnk_Z0a7mk",
      "server-2": "https://www.youtube.com/embed/hcbG2KPCa0E",
      ...HLS_STREAMS,
    },
  },
  { id: 27, team1: "G2 Esports",   team2: "Fnatic",           sport: "Esports",    status: "scheduled", time: "2 days ago",            league: "Worlds 2025 — LoL",   color1: "#F7F7F7", color2: "#FF6B00",
    stream_urls: {
      "server-1": "https://www.youtube.com/embed/QJXgYxYXHSo",
      ...HLS_STREAMS,
    },
  },
  { id: 28, team1: "M. Wilder",    team2: "A. Joshua",        sport: "Fighting",  status: "scheduled", time: "Last week",              league: "Heavyweight — Replay", color1: "#8B0000", color2: "#003366",
    stream_urls: {
      "server-1": "https://www.youtube.com/embed/aVEKJ7goZp0",
      "server-2": "https://www.youtube.com/embed/Gd3YbNDKEwY",
      ...HLS_STREAMS,
    },
  },
];

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

function buildCategories(): CategorySection[] {
  const liveMatches = (m: SportMatch[]) => m.filter((x) => x.status === "live");

  return [
    {
      id: "featured",
      title: "Featured Match",
      icon: <Flame size={18} />,
      description: "The biggest match happening right now",
      filter: () => {
        const featured = allMatches.find((m) => m.id === 10); // Fury vs Usyk
        return featured ? [featured] : [];
      },
    },
    {
      id: "live-now",
      title: "Live Now",
      icon: <Radio size={18} />,
      description: "All sports currently streaming",
      filter: liveMatches,
    },
    {
      id: "boxing-ufc",
      title: "Boxing & UFC",
      icon: <Swords size={18} />,
      filter: (m) => m.filter((x) => x.sport === "Fighting"),
    },
    {
      id: "esports",
      title: "Esports Arena",
      icon: <Gamepad2 size={18} />,
      filter: (m) => m.filter((x) => x.sport === "Esports"),
    },
    {
      id: "upcoming",
      title: "Upcoming Events",
      icon: <Calendar size={18} />,
      filter: (m) => m.filter((x) => x.status === "scheduled" && x.id <= 24),
    },
    {
      id: "catchup",
      title: "Top-Rated Catch-up",
      icon: <Star size={18} />,
      description: "Popular replays and highlights",
      filter: (m) => m.filter((x) => x.id >= 25),
    },
  ];
}

const CATEGORIES = buildCategories();

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

  // Fetch streams from API for a specific match
  const handleWatchMatch = useCallback(async (match: SportMatch) => {
    // If match already has stream URLs, open player immediately
    const hasStreams = match.stream_urls && Object.values(match.stream_urls).some((v) => v);

    if (!hasStreams) {
      // Try to fetch streams from API
      try {
        const res = await fetch(`/api/sports/streams?match_id=${match.id}&sport=${encodeURIComponent(match.sport)}&team1=${encodeURIComponent(match.team1)}&team2=${encodeURIComponent(match.team2)}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedStreams: Record<string, string> = {};
          if (data.streams && Array.isArray(data.streams)) {
            data.streams.forEach((stream: { server: string; url: string }, idx: number) => {
              const key = stream.server || `server-${idx + 1}`;
              fetchedStreams[key] = stream.url;
            });
          }
          // If we got streams, update the cache and use them
          if (Object.keys(fetchedStreams).length > 0) {
            setMatchStreams((prev) => {
              const next = new Map(prev);
              next.set(match.id, fetchedStreams);
              return next;
            });
            // Open player with fetched streams
            setSelectedMatch({ ...match, stream_urls: { ...match.stream_urls, ...fetchedStreams } });
            return;
          }
        }
      } catch {
        // API failed, open with existing data (which will show custom URL input)
      }
    }

    // Merge cached streams if available
    const cached = matchStreams.get(match.id);
    const enrichedMatch = cached
      ? { ...match, stream_urls: { ...match.stream_urls, ...cached } }
      : match;

    setSelectedMatch(enrichedMatch);
  }, [matchStreams]);

  const liveCount = allMatches.filter((m) => m.status === "live").length;

  const filteredBySport = useMemo(() => {
    if (activeSport === "All") return allMatches;
    return allMatches.filter((m) => m.sport === activeSport);
  }, [activeSport]);

  const filteredByDate = useMemo(() => {
    if (dateFilter === "Today") return filteredBySport;
    if (dateFilter === "Tomorrow") return filteredBySport.filter((m) => m.time.toLowerCase().includes("tomorrow"));
    return filteredBySport;
  }, [filteredBySport, dateFilter]);

  /* ---- Build visible categories ---- */
  const visibleCategories = useMemo(() => {
    if (activeSport === "All" && dateFilter === "Today") return CATEGORIES;
    // When filtered, flatten into a single "Matches" section
    return [{
      id: "matches",
      title: dateFilter === "Tomorrow" ? "Tomorrow's Matches" : dateFilter === "Upcoming" ? "Upcoming Matches" : activeSport === "All" ? "All Matches" : `${sportMeta[activeSport as SportType]?.label ?? activeSport}`,
      icon: <Filter size={18} />,
      filter: () => filteredByDate,
    }];
  }, [activeSport, dateFilter, filteredByDate]);

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
                  <span className="text-xs text-white/30">{allMatches.length} total</span>
                </div>
              </div>
            </div>

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
                      {allMatches.filter((m) => m.sport === key).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  CONTENT SECTIONS                                             */}
      {/* ============================================================ */}
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
            <p className="text-sm text-white/30 max-w-xs">Try changing your sport or date filters to see more events.</p>
          </div>
        )}
      </div>

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
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xl" style={{ backgroundColor: match.color1 }}>
                {match.team1.substring(0, 2).toUpperCase()}
              </div>
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xl" style={{ backgroundColor: match.color2 }}>
                {match.team2.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          <p className="text-sm text-white/40 max-w-md mb-6">
            The most anticipated {match.sport.toLowerCase()} event of the year. Don&apos;t miss this thrilling matchup between two world-class competitors.
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
              {match.viewers ? `${match.viewers} watching` : "Details"}
            </button>
          </div>
        </div>

        {/* Right: Viewer count badge */}
        {match.viewers && (
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Eye size={24} className="text-emerald-400 sm:w-7 sm:h-7" />
            </div>
            <span className="text-xs font-bold text-emerald-400">{match.viewers}</span>
            <span className="text-[10px] text-white/30">viewers</span>
          </div>
        )}
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

        {/* Viewer count (live only) */}
        {isLive && match.viewers && (
          <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1">
            <Eye size={9} className="text-white/25" />
            <span className="text-[9px] font-medium text-white/25">{match.viewers}</span>
          </div>
        )}
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
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] sm:text-[11px] font-bold shadow-md" style={{ backgroundColor: match.color1 }}>
              {match.team1.substring(0, 2).toUpperCase()}
            </div>
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
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] sm:text-[11px] font-bold shadow-md" style={{ backgroundColor: match.color2 }}>
              {match.team2.substring(0, 2).toUpperCase()}
            </div>
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
                {match.viewers && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Viewers</span>
                    <span className="text-[10px] font-medium text-emerald-400">{match.viewers}</span>
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
