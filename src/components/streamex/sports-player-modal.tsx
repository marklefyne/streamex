'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Maximize,
  Minimize,
  Loader2,
  MonitorPlay,
  Users,

  Radio,
} from 'lucide-react';
import type { StreamedMatch, StreamData } from './live-sports';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SportsPlayerModalProps {
  match: StreamedMatch;
  streams: StreamData[];
  isLoading: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SportsPlayerModal({
  match,
  streams,
  isLoading,
  onClose,
}: SportsPlayerModalProps) {
  const [activeStream, setActiveStream] = useState<StreamData | null>(
    streams.length > 0 ? streams[0] : null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen not supported or denied
    }
  }, []);

  // Handle backdrop click (only close if not fullscreen)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isFullscreen) {
        onClose();
      }
    },
    [onClose, isFullscreen]
  );

  const currentStream = activeStream ?? (streams.length > 0 ? streams[0] : null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={playerContainerRef}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className={`relative flex w-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#080808] shadow-2xl ${
          isFullscreen
            ? 'h-screen w-screen rounded-none border-0'
            : 'max-w-5xl max-h-[92vh]'
        }`}
      >
        {/* ─── Header ───────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0a] px-4 py-3 sm:px-5">
          {/* Match Info */}
          <div className="flex items-center gap-3 min-w-0">
            {match.isLive && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-600/20 px-2 py-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Live
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 min-w-0">
              {match.homeBadge && (
                <img
                  src={match.homeBadge}
                  alt={match.homeTeam}
                  className="h-6 w-6 shrink-0 object-contain rounded-full bg-white/5 p-0.5"
                />
              )}
              <span className="text-sm font-semibold text-white/90 truncate">
                {match.homeTeam}
              </span>
              <span className="shrink-0 text-xs font-bold text-white/20">
                vs
              </span>
              {match.awayBadge && (
                <img
                  src={match.awayBadge}
                  alt={match.awayTeam}
                  className="h-6 w-6 shrink-0 object-contain rounded-full bg-white/5 p-0.5"
                />
              )}
              <span className="text-sm font-semibold text-white/90 truncate">
                {match.awayTeam}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex shrink-0 items-center gap-1.5 ml-3">
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/90"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Stream Tabs ──────────────────────────────────────────── */}
        {!isLoading && streams.length > 0 && (
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#0b0b0b] px-4 py-2 scrollbar-none">
            {streams.map((stream) => (
              <button
                key={`${stream.source}-${stream.streamNo}`}
                onClick={() => setActiveStream(stream)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  currentStream?.streamNo === stream.streamNo &&
                  currentStream?.source === stream.source
                    ? 'bg-emerald-600/15 text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
                }`}
              >
                <Radio className="h-3 w-3" />
                <span>Stream {stream.streamNo}</span>
                {stream.hd && (
                  <span className="flex items-center gap-0.5 rounded bg-emerald-500/20 px-1 py-px text-[9px] font-bold text-emerald-400">
                    HD
                  </span>
                )}
                {stream.viewers > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-white/30">
                    <Users className="h-2.5 w-2.5" />
                    {stream.viewers >= 1000
                      ? `${(stream.viewers / 1000).toFixed(1)}k`
                      : stream.viewers}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ─── Player Area ──────────────────────────────────────────── */}
        <div className="relative flex-1 min-h-0 bg-black">
          {isLoading ? (
            /* Loading state */
            <div className="flex h-full min-h-[300px] sm:min-h-[400px] flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/60">
                  Loading streams
                </p>
                <p className="mt-1 text-xs text-white/30">
                  Fetching available streams...
                </p>
              </div>
            </div>
          ) : !isLoading && streams.length === 0 ? (
            /* No streams */
            <div className="flex h-full min-h-[300px] sm:min-h-[400px] flex-col items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
                <MonitorPlay className="h-7 w-7 text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/60">
                  No streams found
                </p>
                <p className="mt-1 text-xs text-white/30">
                  No streams are available for this match right now.
                </p>
              </div>
            </div>
          ) : currentStream ? (
            /* Player iframe */
            <div className="relative w-full h-full">
              <iframe
                ref={iframeRef}
                src={currentStream.embedUrl}
                className="absolute inset-0 h-full w-full border-0"
                allow="autoplay; fullscreen; encrypted-media"
                allowFullScreen
                title={`${match.homeTeam} vs ${match.awayTeam} - Stream ${currentStream.streamNo}`}
              />
            </div>
          ) : null}

          {/* Fullscreen overlay controls */}
          {isFullscreen && !isLoading && streams.length > 0 && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
              <button
                onClick={toggleFullscreen}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/60 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
                title="Exit Fullscreen"
              >
                <Minimize className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ─── Footer Info ──────────────────────────────────────────── */}
        {!isFullscreen && currentStream && !isLoading && (
          <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-2.5 sm:px-5">
            <div className="flex items-center gap-4 text-[11px] text-white/30">
              <span className="flex items-center gap-1">
                <Radio className="h-3 w-3" />
                Stream {currentStream.streamNo}
              </span>
              {currentStream.hd && (
                <span className="rounded bg-emerald-500/20 px-1 py-px text-[9px] font-bold text-emerald-400">
                  HD
                </span>
              )}
              {currentStream.viewers > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {currentStream.viewers.toLocaleString()} viewers
                </span>
              )}
              <span className="capitalize">{currentStream.source}</span>
            </div>
            <span className="text-[11px] text-white/20">
              {match.matchDate} · {match.matchTime}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
