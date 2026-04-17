import { create } from "zustand";

export interface HistoryEntry {
  tmdb_id: number;
  title: string;
  type: string;
  posterImage: string;
  season?: number;
  episode?: number;
  watched_at: string;
}

interface HistoryState {
  history: HistoryEntry[];
  loaded: boolean;
  addToHistory: (item: { tmdb_id: number; title: string; type: string; posterImage: string }, season?: number, episode?: number) => Promise<void>;
  loadHistory: (node_id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const LS_KEY = "flux_watch_history";
const MAX_HISTORY = 50;

function saveToLocalStorage(items: HistoryEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage full or unavailable
  }
}

function loadFromLocalStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function getNodeId(): string {
  try {
    return localStorage.getItem("flux_node_id") || "";
  } catch {
    return "";
  }
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: loadFromLocalStorage(),
  loaded: false,

  addToHistory: async (item, season, episode) => {
    const now = new Date().toISOString();
    const entry: HistoryEntry = {
      ...item,
      season,
      episode,
      watched_at: now,
    };

    // Remove any existing entry with same tmdb_id + season + episode combo
    const key = `${item.tmdb_id}-${season ?? 0}-${episode ?? 0}`;
    const filtered = get().history.filter((h) => `${h.tmdb_id}-${h.season ?? 0}-${h.episode ?? 0}` !== key);

    // Add new entry at the top
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);
    set({ history: updated });
    saveToLocalStorage(updated);

    const node_id = getNodeId();
    if (node_id) {
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node_id, ...entry }),
        });
      } catch {
        // silent
      }
    }
  },

  loadHistory: async (node_id: string) => {
    const local = loadFromLocalStorage();
    if (local.length > 0) {
      set({ history: local, loaded: true });
    }

    try {
      const res = await fetch(`/api/history?node_id=${encodeURIComponent(node_id)}`);
      if (!res.ok) {
        set({ loaded: true });
        return;
      }
      const data = await res.json();
      const serverItems = (data.items || []) as HistoryEntry[];
      if (serverItems.length > 0) {
        set({ history: serverItems, loaded: true });
        saveToLocalStorage(serverItems);
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  clearHistory: async () => {
    set({ history: [] });
    saveToLocalStorage([]);

    const node_id = getNodeId();
    if (node_id) {
      try {
        await fetch("/api/history", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node_id }),
        });
      } catch {
        // silent
      }
    }
  },
}));
