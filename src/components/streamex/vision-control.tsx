"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Users,
  Activity,
  Trash2,
  RefreshCw,
  Shield,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import type { CardItem } from "./media-card";

interface TelemetrySession {
  id: string;
  ip: string;
  userAgent: string;
  country: string | null;
  city: string | null;
  region: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  path: string | null;
  createdAt: string;
}

interface TelemetryStats {
  totalVisits: number;
  uniqueVisitors: number;
  activeNow: number;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  os: Record<string, number>;
  countries: Record<string, number>;
}

interface VisionControlProps {
  onBack: () => void;
}

export function VisionControl({ onBack }: VisionControlProps) {
  const [sessions, setSessions] = useState<TelemetrySession[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortField, setSortField] = useState<"createdAt" | "country" | "device" | "browser">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/telemetry");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleClear = async () => {
    try {
      await fetch("/api/v1/telemetry", { method: "DELETE" });
      setSessions([]);
      setStats(null);
    } catch (err) {
      console.error("Failed to clear sessions:", err);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    const aVal = a[sortField] || "";
    const bVal = b[sortField] || "";
    return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const DeviceIcon = ({ device }: { device: string }) => {
    switch (device) {
      case "Mobile": return <Smartphone size={14} className="text-cyan-400" />;
      case "Tablet": return <Tablet size={14} className="text-purple-400" />;
      case "Desktop": return <Monitor size={14} className="text-emerald-400" />;
      default: return <Monitor size={14} className="text-gray-400" />;
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, subtext }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    subtext?: string;
  }) => (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 hover:border-[#222] transition-colors">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={16} />
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">{label}</span>
      </div>
      <div className="text-2xl font-black text-white font-mono">{value}</div>
      {subtext && <div className="text-xs text-gray-600 mt-1 font-mono">{subtext}</div>}
    </div>
  );

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-[#1a1a1a] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Shield size={20} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white font-mono tracking-tight">
                VISION CONTROL
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Real-time visitor analytics &middot; Silent telemetry engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                autoRefresh
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-[#0a0a0a] border-[#1a1a1a] text-gray-500 hover:text-gray-400"
              }`}
            >
              <Activity size={12} className={autoRefresh ? "animate-pulse" : ""} />
              {autoRefresh ? "LIVE" : "PAUSED"}
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <RefreshCw className="animate-spin text-emerald-400" size={20} />
            <span className="text-sm text-gray-500 font-mono">Loading telemetry data...</span>
          </div>
        </div>
      ) : (
        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard
                icon={Users}
                label="Total Visits"
                value={stats.totalVisits}
                color="bg-emerald-500/10 text-emerald-400"
                subtext={`${stats.uniqueVisitors} unique visitors`}
              />
              <StatCard
                icon={Activity}
                label="Active Now"
                value={stats.activeNow}
                color="bg-cyan-500/10 text-cyan-400"
                subtext="Last 30 minutes"
              />
              <StatCard
                icon={Globe}
                label="Countries"
                value={Object.keys(stats.countries).length}
                color="bg-purple-500/10 text-purple-400"
                subtext={Object.keys(stats.countries).length > 0 ? Object.keys(stats.countries).sort((a, b) => stats.countries[b] - stats.countries[a])[0] : "No data"}
              />
              <StatCard
                icon={Monitor}
                label="Top Device"
                value={Object.keys(stats.devices).length > 0 ? Object.keys(stats.devices).sort((a, b) => stats.devices[b] - stats.devices[a])[0] : "—"}
                color="bg-amber-500/10 text-amber-400"
                subtext={Object.entries(stats.devices).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              />
            </motion.div>
          )}

          {/* Distribution bars */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Devices */}
              {Object.keys(stats.devices).length > 0 && (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Devices</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.devices)
                      .sort(([, a], [, b]) => b - a)
                      .map(([device, count]) => {
                        const max = Math.max(...Object.values(stats.devices));
                        const pct = Math.round((count / max) * 100);
                        const colors: Record<string, string> = {
                          Desktop: "bg-emerald-500",
                          Mobile: "bg-cyan-500",
                          Tablet: "bg-purple-500",
                        };
                        return (
                          <div key={device} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-mono w-16">{device}</span>
                            <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${colors[device] || "bg-gray-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-emerald-400 font-mono w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Browsers */}
              {Object.keys(stats.browsers).length > 0 && (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-3">Browsers</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.browsers)
                      .sort(([, a], [, b]) => b - a)
                      .map(([browser, count]) => {
                        const max = Math.max(...Object.values(stats.browsers));
                        const pct = Math.round((count / max) * 100);
                        return (
                          <div key={browser} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-mono w-16">{browser}</span>
                            <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-emerald-400 font-mono w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Sessions Table */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white font-mono">Active Sessions</h3>
                  <span className="text-xs text-gray-600 font-mono">({sessions.length})</span>
                </div>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[#111] text-[10px] text-gray-600 uppercase tracking-wider font-mono">
                <button onClick={() => handleSort("createdAt")} className="col-span-2 flex items-center gap-1 hover:text-gray-400 transition-colors cursor-pointer">
                  Time <ArrowUpDown size={10} />
                </button>
                <div className="col-span-2">IP Address</div>
                <div className="col-span-2">Location</div>
                <button onClick={() => handleSort("device")} className="col-span-1 flex items-center gap-1 hover:text-gray-400 transition-colors cursor-pointer">
                  Device <ArrowUpDown size={10} />
                </button>
                <button onClick={() => handleSort("browser")} className="col-span-2 flex items-center gap-1 hover:text-gray-400 transition-colors cursor-pointer">
                  Browser <ArrowUpDown size={10} />
                </button>
                <div className="col-span-1">OS</div>
                <div className="col-span-2">Path</div>
              </div>

              {/* Rows */}
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {sortedSessions.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <Eye size={32} className="text-gray-700 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 font-mono">No sessions recorded yet</p>
                      <p className="text-xs text-gray-700 font-mono mt-1">Visit the site to start tracking</p>
                    </div>
                  </div>
                ) : (
                  sortedSessions.map((session, i) => (
                    <div
                      key={session.id}
                      className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[#0d0d0d] hover:bg-[#111] transition-colors"
                      style={{ animationDelay: `${i * 0.02}s` }}
                    >
                      <div className="col-span-2">
                        <div className="text-xs text-emerald-400 font-mono">{formatTime(session.createdAt)}</div>
                        <div className="text-[10px] text-gray-600 font-mono">{formatDate(session.createdAt)}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-cyan-400 font-mono">{session.ip}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-300 font-mono">
                          {session.city && session.country
                            ? `${session.city}, ${session.country}`
                            : session.country || "Unknown"}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <div className="flex items-center gap-1.5">
                          <DeviceIcon device={session.device || "Unknown"} />
                          <span className="text-xs text-gray-400 font-mono">{session.device}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-400 font-mono">{session.browser}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-xs text-gray-500 font-mono">{session.os}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-600 font-mono truncate block">{session.path || "/"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <footer className="border-t border-[#1a1a1a] px-0 py-6">
            <div className="flex items-center justify-between text-xs text-gray-600 font-mono">
              <p>Vision Control &middot; StreameX Telemetry Engine</p>
              <p>{autoRefresh ? "Auto-refresh: 5s" : "Auto-refresh: off"}</p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
