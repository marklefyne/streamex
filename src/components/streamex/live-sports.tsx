'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Tv,
  Radio,
  Users,
  Clock,
  ChevronRight,
  Zap,
  Circle,
} from 'lucide-react';
import { SportsPlayerModal } from './sports-player-modal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number;
  poster: string | null;
  popular: boolean;
  isLive: boolean;
  teams: {
    home: { name: string; badge: string };
    away: { name: string; badge: string };
  };
  sources: { source: string; id: string }[];
  homeTeam: string;
  awayTeam: string;
  homeBadge: string | null;
  awayBadge: string | null;
  matchTime: string;
  matchDate: string;
  streamCount: number;
}

export interface StreamData {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
  viewers: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  'football',
  'basketball',
  'baseball',
  'hockey',
  'motor-sports',
  'fight',
  'tennis',
  'cricket',
  'rugby',
  'golf',
  'other',
  'american-football',
] as const;

type CategorySlug = (typeof ALL_CATEGORIES)[number];

interface CategoryTab {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

const CATEGORY_TABS: CategoryTab[] = [
  { label: 'All', value: 'all' },
  {
    label: '🔴 Live',
    value: 'live',
    icon: <Circle className="h-3 w-3 fill-red-500 text-red-500" />,
  },
  { label: 'Football', value: 'football' },
  { label: 'Basketball', value: 'basketball' },
  { label: 'Baseball', value: 'baseball' },
  { label: 'Hockey', value: 'hockey' },
  { label: 'Fight', value: 'fight' },
  { label: 'Motor Sports', value: 'motor-sports' },
  { label: 'Cricket', value: 'cricket' },
  { label: 'Other', value: 'other' },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function MatchCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-[#111] p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-16 rounded bg-white/10" />
        <div className="h-4 w-12 rounded bg-white/10" />
      </div>
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
        </div>
        <div className="h-3 w-8 rounded bg-white/10" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
        </div>
      </div>
      <div className="h-9 w-full rounded-lg bg-white/5 mt-4" />
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({
  match,
  onWatch,
}: {
  match: StreamedMatch;
  onWatch: (match: StreamedMatch) => void;
}) {
  const hasSources = match.sources && match.sources.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-xl border border-white/[0.06] bg-[#111] overflow-hidden transition-colors hover:border-emerald-500/20"
    >
      {/* Live pulse indicator */}
      {match.isLive && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          LIVE
        </div>
      )}

      {/* Category badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-white/50 capitalize backdrop-blur-sm">
          {match.category.replace('-', ' ')}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Match time & date */}
        <div className="mb-4 flex items-center justify-center gap-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {match.matchTime}
          </span>
          <span>•</span>
          <span>{match.matchDate}</span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-3 py-2">
          {/* Home team */}
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/5 p-1 ring-1 ring-white/10">
              {match.homeBadge ? (
                <img
                  src={match.homeBadge}
                  alt={match.homeTeam}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Tv className="h-5 w-5 text-white/20" />
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-white/90 line-clamp-1 max-w-[100px]">
              {match.homeTeam}
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold tracking-widest text-white/20">
              VS
            </span>
          </div>

          {/* Away team */}
          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/5 p-1 ring-1 ring-white/10">
              {match.awayBadge ? (
                <img
                  src={match.awayBadge}
                  alt={match.awayTeam}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Tv className="h-5 w-5 text-white/20" />
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-white/90 line-clamp-1 max-w-[100px]">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Stream info */}
        {match.streamCount > 0 && (
          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-white/30">
            <span className="flex items-center gap-1">
              <Radio className="h-3 w-3" />
              {match.streamCount} stream{match.streamCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Watch button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!hasSources}
          onClick={() => onWatch(match)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-emerald-600 disabled:hover:shadow-none"
        >
          {match.isLive ? (
            <>
              <Zap className="h-4 w-4" />
              Watch Live
            </>
          ) : (
            <>
              <Tv className="h-4 w-4" />
              Watch
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LiveSports() {
  const [activeTab, setActiveTab] = useState('all');
  const [allMatches, setAllMatches] = useState<StreamedMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<StreamedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Player modal state
  const [playerMatch, setPlayerMatch] = useState<StreamedMatch | null>(null);
  const [playerStreams, setPlayerStreams] = useState<StreamData[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Fetch matches for a single category
  const fetchCategory = useCallback(
    async (category: CategorySlug): Promise<StreamedMatch[]> => {
      try {
        const res = await fetch(`/api/sports/${category}`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.matches ?? []) as StreamedMatch[];
      } catch {
        return [];
      }
    },
    []
  );

  // Fetch all categories
  const fetchAllMatches = useCallback(async () => {
    const results = await Promise.all(
      ALL_CATEGORIES.map((cat) => fetchCategory(cat))
    );
    return results.flat();
  }, [fetchCategory]);

  // Load matches based on active tab
  const loadMatches = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        if (activeTab === 'all') {
          const matches = await fetchAllMatches();
          setAllMatches(matches);
          setFilteredMatches(matches);
        } else if (activeTab === 'live') {
          const matches = await fetchAllMatches();
          setAllMatches(matches);
          setFilteredMatches(matches.filter((m) => m.isLive));
        } else {
          const matches = await fetchCategory(activeTab as CategorySlug);
          setFilteredMatches(matches);
        }
      } catch {
        setFilteredMatches([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, fetchAllMatches, fetchCategory]
  );

  // Load on mount and tab change
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Handle watch
  const handleWatch = useCallback(async (match: StreamedMatch) => {
    if (!match.sources || match.sources.length === 0) return;

    setPlayerMatch(match);
    setStreamsLoading(true);
    setShowPlayer(true);

    const { source, id } = match.sources[0];
    try {
      const res = await fetch(
        `/api/sports/streams?source=${encodeURIComponent(source)}&id=${encodeURIComponent(id)}`
      );
      if (res.ok) {
        const data = await res.json();
        setPlayerStreams((data.streams ?? []) as StreamData[]);
      } else {
        setPlayerStreams([]);
      }
    } catch {
      setPlayerStreams([]);
    } finally {
      setStreamsLoading(false);
    }
  }, []);

  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false);
    setTimeout(() => {
      setPlayerMatch(null);
      setPlayerStreams([]);
    }, 300);
  }, []);

  const handleRefresh = useCallback(() => {
    loadMatches(true);
  }, [loadMatches]);

  // Derive live count from all matches
  const liveCount = allMatches.filter((m) => m.isLive).length;

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 ring-1 ring-emerald-500/20">
                <Radio className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Live Sports
                </h1>
                <p className="text-xs text-white/40">
                  {loading
                    ? 'Loading matches...'
                    : `${filteredMatches.length} match${filteredMatches.length !== 1 ? 'es' : ''}${liveCount > 0 ? ` · ${liveCount} live` : ''}`}
                </p>
              </div>
            </div>

            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-emerald-500/20 hover:text-emerald-400 disabled:opacity-40"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </motion.button>
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === tab.value
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-emerald-600 -z-10"
                    transition={{
                      type: 'spring',
                      bounce: 0.15,
                      duration: 0.5,
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {loading ? (
          /* Skeleton Grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMatches.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
              <Radio className="h-7 w-7 text-white/20" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white/70">
              No matches found
            </h3>
            <p className="mt-1.5 text-sm text-white/30">
              {activeTab === 'live'
                ? 'No live matches at the moment. Check back soon!'
                : 'No matches available for this category right now.'}
            </p>
          </motion.div>
        ) : (
          /* Match Grid */
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            >
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onWatch={handleWatch}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Player Modal */}
      <AnimatePresence>
        {showPlayer && playerMatch && (
          <SportsPlayerModal
            match={playerMatch}
            streams={playerStreams}
            isLoading={streamsLoading}
            onClose={handleClosePlayer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
