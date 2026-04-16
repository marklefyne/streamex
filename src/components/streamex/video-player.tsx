"use client";

import { useState } from "react";
import { Play, Clock, Tv, Star, Flag } from "lucide-react";
import type { MediaItem } from "@/lib/mock-data";

interface VideoPlayerProps {
  item: MediaItem;
  onClose: () => void;
}

const servers = [
  { id: "s1", name: "Server 1", flag: "🇺🇸", quality: "1080p" },
  { id: "s2", name: "Server 2", flag: "🇩🇪", quality: "4K" },
  { id: "s3", name: "Server 3", flag: "🇯🇵", quality: "720p" },
];

export function VideoPlayer({ item, onClose }: VideoPlayerProps) {
  const [activeServer, setActiveServer] = useState("s1");
  const currentServer = servers.find((s) => s.id === activeServer);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Player header */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/80 backdrop-blur-sm border-b border-streamex-border">
        <button
          onClick={onClose}
          className="text-sm text-streamex-text-secondary hover:text-white transition-colors cursor-pointer"
        >
          ← Back to browse
        </button>
        <h3 className="text-sm font-medium text-white">{item.title}</h3>
        <div className="w-20" />
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        <div className="w-full max-w-6xl aspect-video bg-streamex-surface rounded-lg mx-auto flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-streamex-accent/20 flex items-center justify-center mx-auto mb-4">
              <Play size={32} className="text-streamex-accent ml-1" />
            </div>
            <p className="text-streamex-text-secondary text-sm">
              {currentServer?.name} · {currentServer?.quality}
            </p>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="px-6 py-4 bg-[#0a0a0a] border-t border-streamex-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xl font-bold text-white">{item.title}</h2>
            <span className="flex items-center gap-1 text-sm">
              <Star className="fill-yellow-500 text-yellow-500" size={14} />
              <span className="text-white font-medium">{item.rating}</span>
            </span>
            <span className="text-sm text-streamex-text-secondary">{item.year}</span>
            {item.runtime && (
              <span className="flex items-center gap-1 text-sm text-streamex-text-secondary">
                <Clock size={12} />
                {item.runtime}
              </span>
            )}
            {item.seasons && (
              <span className="flex items-center gap-1 text-sm text-streamex-text-secondary">
                <Tv size={12} />
                {item.seasons} Season{item.seasons > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Server selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-streamex-text-secondary mr-1">
              Servers:
            </span>
            {servers.map((server) => (
              <button
                key={server.id}
                onClick={() => setActiveServer(server.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activeServer === server.id
                    ? "bg-streamex-accent text-white"
                    : "bg-white/5 text-streamex-text-secondary hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{server.flag}</span>
                <span>{server.name}</span>
                <span className="opacity-60">({server.quality})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
