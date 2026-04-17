import { create } from "zustand";

export interface TrendingViewItem {
  tmdb_id: number;
  title: string;
  type: string;
  posterImage: string;
  view_count: number;
}

interface TrendingViewState {
  items: TrendingViewItem[];
  loaded: boolean;
  fetchTrending: () => Promise<void>;
}

export const useTrendingStore = create<TrendingViewState>((set) => ({
  items: [],
  loaded: false,

  fetchTrending: async () => {
    try {
      const res = await fetch("/api/trending-views");
      if (!res.ok) {
        set({ items: [], loaded: true });
        return;
      }
      const data = await res.json();
      set({ items: (data.items || []) as TrendingViewItem[], loaded: true });
    } catch {
      set({ items: [], loaded: true });
    }
  },
}));
