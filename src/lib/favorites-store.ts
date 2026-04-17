import { create } from "zustand";

export interface FavoriteItem {
  tmdb_id: number;
  title: string;
  type: string;
  posterImage: string;
  year: number;
  rating: number;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  loaded: boolean;
  addFavorite: (item: FavoriteItem) => Promise<void>;
  removeFavorite: (tmdb_id: number) => Promise<void>;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
  isFavorite: (tmdb_id: number) => boolean;
  loadFavorites: (node_id: string) => Promise<void>;
  fetchFromServer: (node_id: string) => Promise<FavoriteItem[]>;
}

const LS_KEY = "flux_favorites";
const MAX_FAVORITES = 200;

function saveToLocalStorage(items: FavoriteItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items.slice(0, MAX_FAVORITES)));
  } catch {
    // localStorage full or unavailable
  }
}

function loadFromLocalStorage(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteItem[];
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

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: loadFromLocalStorage(),
  loaded: false,

  addFavorite: async (item: FavoriteItem) => {
    const current = get().favorites;
    if (current.some((f) => f.tmdb_id === item.tmdb_id)) return;

    const updated = [...current, item];
    set({ favorites: updated });
    saveToLocalStorage(updated);

    const node_id = getNodeId();
    if (node_id) {
      try {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node_id, ...item }),
        });
      } catch {
        // silent
      }
    }
  },

  removeFavorite: async (tmdb_id: number) => {
    const updated = get().favorites.filter((f) => f.tmdb_id !== tmdb_id);
    set({ favorites: updated });
    saveToLocalStorage(updated);

    const node_id = getNodeId();
    if (node_id) {
      try {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node_id, tmdb_id }),
        });
      } catch {
        // silent
      }
    }
  },

  toggleFavorite: async (item: FavoriteItem) => {
    const isFav = get().isFavorite(item.tmdb_id);
    if (isFav) {
      await get().removeFavorite(item.tmdb_id);
    } else {
      await get().addFavorite(item);
    }
  },

  isFavorite: (tmdb_id: number) => {
    return get().favorites.some((f) => f.tmdb_id === tmdb_id);
  },

  loadFavorites: async (node_id: string) => {
    // Load from localStorage first for instant UI
    const local = loadFromLocalStorage();
    if (local.length > 0) {
      set({ favorites: local, loaded: true });
    }

    // Then fetch from server for sync
    try {
      const serverItems = await get().fetchFromServer(node_id);
      if (serverItems.length > 0) {
        set({ favorites: serverItems, loaded: true });
        saveToLocalStorage(serverItems);
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  fetchFromServer: async (node_id: string): Promise<FavoriteItem[]> => {
    try {
      const res = await fetch(`/api/favorites?node_id=${encodeURIComponent(node_id)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items || []) as FavoriteItem[];
    } catch {
      return [];
    }
  },
}));
