"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MonitorPlay, Zap, Shield, HardDrive, Check } from "lucide-react";

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
  viewers?: string;
}

/* ------------------------------------------------------------------ */
/*  Sport streaming servers with quality labels                         */
/* ------------------------------------------------------------------ */

const SPORT_SERVERS = [
  { id: "server-1", name: "Server 1", quality: "HD", icon: Zap, desc: "Primary — Fastest" },
  { id: "server-2", name: "Server 2", quality: "HD", icon: Shield, desc: "Backup — Stable" },
  { id: "server-3", name: "Server 3", quality: "SD", icon: HardDrive, desc: "Low bandwidth" },
];

function getSportStreamUrl(matchId: number, serverId: string): string {
  const sources: Record<string, string> = {
    "server-1": `https://vidsrc.me/embed/movie/${11 + matchId}`,
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
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, rotateX: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40, rotateX: 2 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[960px] max-h-[92vh] flex flex-col rounded-2xl overflow-hidden z-10 sport-modal-shadow"
          >
            {/* ===== MATCH INFO HEADER ===== */}
            <div className="relative flex items-center justify-between px-5 sm:px-7 py-4 sport-modal-header border-b border-emerald-500/10">
              {/* Team info + score */}
              <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
                {/* Team 1 */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs sm:text-sm font-black shadow-lg sport-team-logo"
                    style={{ backgroundColor: match.color1 }}
                  >
                    {match.team1.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-bold text-white truncate block leading-tight">
                      {match.team1}
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/40 truncate block mt-0.5">
                      {match.league}
                    </span>
                  </div>
                </div>

                {/* Score / Status block */}
                <div className="flex flex-col items-center px-3 sm:px-5 flex-shrink-0">
                  {isLive ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="relative flex h-2 w-2">
                          <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live</span>
                      </div>
                      {match.score ? (
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight sport-score-text">
                          {match.score}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-emerald-400">{match.time}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Scheduled</span>
                      <span className="text-lg font-bold text-white mt-1">{match.time}</span>
                    </>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
                  <div className="min-w-0 text-right">
                    <span className="text-sm sm:text-base font-bold text-white truncate block leading-tight">
                      {match.team2}
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/40 truncate block mt-0.5">
                      {match.sport}
                    </span>
                  </div>
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs sm:text-sm font-black shadow-lg sport-team-logo"
                    style={{ backgroundColor: match.color2 }}
                  >
                    {match.team2.substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/50 hover:text-white transition-all duration-200 flex-shrink-0 ml-3 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ===== VIDEO PLAYER ===== */}
            <div className="relative w-full bg-black sport-player-area">
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

            {/* ===== STREAM SERVER SELECTOR ===== */}
            <div className="px-5 sm:px-7 py-4 sport-modal-footer border-t border-emerald-500/10">
              <div className="flex items-center gap-2 mb-3">
                <MonitorPlay size={14} className="text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Select Stream</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {SPORT_SERVERS.map((server) => {
                  const ServerIcon = server.icon;
                  const isActive = activeServer === server.id;
                  return (
                    <button
                      key={server.id}
                      onClick={() => handleServerChange(server.id)}
                      className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                          : "bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/70 border border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      {/* Quality badge */}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded absolute -top-2 right-1 tracking-wider ${
                        isActive
                          ? "bg-emerald-500 text-white"
                          : server.quality === "HD"
                            ? "bg-white/10 text-white/40"
                            : "bg-white/5 text-white/30"
                      }`}>
                        {server.quality}
                      </span>

                      <ServerIcon size={18} strokeWidth={isActive ? 2.5 : 1.5} />

                      <div className="text-center">
                        <span className="font-semibold block">{server.name}</span>
                        <span className="text-[9px] text-white/30 block mt-0.5">{server.desc}</span>
                      </div>

                      {isActive && (
                        <div className="absolute top-1.5 left-1.5">
                          <Check size={10} className="text-emerald-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
