import { create } from "zustand";

export interface MusicTrack {
  id: string;
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  durationMs: number;
  primaryGenreName: string;
}

interface MusicPlayerState {
  // Current track
  currentTrack: MusicTrack | null;
  queue: MusicTrack[];
  queueIndex: number;

  // Playback state
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  isLoading: boolean;

  // Actions
  playTrack: (track: MusicTrack, queue?: MusicTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  addToQueue: (track: MusicTrack) => void;
  clearQueue: () => void;
  closePlayer: () => void;
}

export const useMusicStore = create<MusicPlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  isLoading: false,

  playTrack: (track, queue) => {
    if (queue) {
      const index = queue.findIndex((t) => t.id === track.id);
      set({
        currentTrack: track,
        queue,
        queueIndex: index >= 0 ? index : 0,
        isPlaying: true,
        currentTime: 0,
        isLoading: true,
      });
    } else {
      set({
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        isLoading: true,
      });
    }
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  togglePlay: () => {
    const { isPlaying, currentTrack } = get();
    if (!currentTrack) return;
    set({ isPlaying: !isPlaying });
  },

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  nextTrack: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;
    const nextIndex = (queueIndex + 1) % queue.length;
    set({
      currentTrack: queue[nextIndex],
      queueIndex: nextIndex,
      isPlaying: true,
      currentTime: 0,
      isLoading: true,
    });
  },

  prevTrack: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return;
    const prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    set({
      currentTrack: queue[prevIndex],
      queueIndex: prevIndex,
      isPlaying: true,
      currentTime: 0,
      isLoading: true,
    });
  },

  seekTo: (time) => set({ currentTime: time }),

  addToQueue: (track) => {
    const { queue } = get();
    set({ queue: [...queue, track] });
  },

  clearQueue: () => set({ queue: [], queueIndex: 0 }),

  closePlayer: () => set({
    currentTrack: null,
    queue: [],
    queueIndex: 0,
    isPlaying: false,
    currentTime: 0,
    isLoading: false,
  }),
}));
