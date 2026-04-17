"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MonitorPlay, Zap, Shield, Server } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SportMatch {
  id: number;
  team1: string;
  team2: string;
  sport: string;
  status: "live" | "scheduled";
  time: string;
  score?: string;
  league: string;
  color1: string;
  color2: string;
}

/* ------------------------------------------------------------------ */
/*  Sport streaming server options                                     */
/* ------------------------------------------------------------------ */

const SPORT_SERVERS = [
  { id: "server-1", name: "Server 1", icon: Zap, tier: "primary" },
  { id: "server-2", name: "Server 2", icon: Shield, tier: "backup" },
  { id: "server-3", name: "Server 3", icon: Server, tier: "backup" },
];

// Sport stream embed URLs (demonstration — these point to placeholder content)
function getSportStreamUrl(matchId: number, serverId: string): string {
  // Using generic embed sources for sports streaming demonstration
  const sources: Record<string, string> = {
    "server-1": `https://vidsrc.me/embed/movie/${11 + matchId}`, // placeholder using vidsrc
    "server-2": `https://vidsrc.to/embed/movie/${11 + matchId}`,
    "server-3": `https://embed.su/embed/movie/${11 + matchId}`,
  };
  return sources[serverId] || sources["server-1"];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface SportsPlayerModalProps {
  match: SportMatch | null;
  onClose: () => void;
}

export function SportsPlayerModal({ match, onClose }: SportsPlayerModalProps) {
  const [activeServer, setActiveServer] = useState("server-1");

  const handleServerChange = useCallback((serverId: string) => {
    setActiveServer(serverId);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!match) return null;

  const streamUrl = getSportStreamUrl(match.id, activeServer);
  const isLive = match.status === "live";
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          key="sports-player-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6"
          onClick={handleBackdropClick}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-5xl max-h-[95vh] flex flex-col rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.08] shadow-2xl shadow-black/80 z-10"
          >
            {/* ========== MATCH INFO HEADER ========== */}
            <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-r from-[#111] to-[#0d0d0d] border-b border-white/[0.06]">
              {/* Left: Team names + score */}
              <div className="flex items-center gap-3 sm:gap-5 min-w-0 flex-1">
                {/* Team 1 */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] sm:text-xs font-bold shadow-lg ring-2 ring-white/10"
                    style={{ backgroundColor: match.color1 }}
                  >
                    {match.team1.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-white truncate">
                    {match.team1}
                  </span>
                </div>

                {/* Score / Status */}
                <div className="flex flex-col items-center px-2 sm:px-3 flex-shrink-0">
                  {isLive ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="relative flex h-2 w-2">
                          <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">LIVE</span>
                      </div>
                      {match.score ? (
                        <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                          {match.score}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-streamex-accent">{match.time}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-medium text-streamex-text-secondary uppercase tracking-wider">Upcoming</span>
                      <span className="text-sm font-bold text-white mt-0.5">{match.time}</span>
                    </>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                  <span className="text-sm sm:text-base font-semibold text-white truncate">
                    {match.team2}
                  </span>
                  <div
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] sm:text-xs font-bold shadow-lg ring-2 ring-white/10"
                    style={{ backgroundColor: match.color2 }}
                  >
                    {match.team2.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-streamex-text-secondary hover:text-white transition-all duration-200 flex-shrink-0 ml-3 cursor-pointer"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            {/* ========== VIDEO PLAYER ========== */}
            <div className="relative w-full bg-black">
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <iframe
                  key={`${match.id}-${activeServer}`}
                  src={streamUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                  referrerPolicy="origin"
                  title={`${match.team1} vs ${match.team2} — Live Stream`}
                />
              </div>
            </div>

            {/* ========== SERVER SELECTOR BAR ========== */}
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-gradient-to-r from-[#0d0d0d] to-[#111] border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mr-2">
                <MonitorPlay size={14} className="text-streamex-text-secondary" />
                <span className="text-xs font-medium text-streamex-text-secondary uppercase tracking-wider hidden sm:inline">
                  Stream
                </span>
              </div>

              {/* Server buttons */}
              <div className="flex items-center gap-2 flex-1">
                {SPORT_SERVERS.map((server) => {
                  const ServerIcon = server.icon;
                  const isActive = activeServer === server.id;
                  return (
                    <button
                      key={server.id}
                      onClick={() => handleServerChange(server.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-streamex-accent text-white shadow-lg shadow-streamex-accent/25 ring-1 ring-streamex-accent/50"
                          : "bg-white/[0.04] text-streamex-text-secondary hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      <ServerIcon size={14} />
                      <span className="hidden sm:inline">{server.name}</span>
                      <span className="sm:hidden">{server.id.split("-")[1]}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* League badge */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px] font-semibold text-streamex-text-secondary uppercase tracking-wider truncate max-w-[120px]">
                  {match.league}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
