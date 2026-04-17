"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useMusicStore } from "@/lib/music-store";

export function MusicMiniPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const volume = useMusicStore((s) => s.volume);
  const currentTime = useMusicStore((s) => s.currentTime);

  const togglePlay = useMusicStore((s) => s.togglePlay);
  const nextTrack = useMusicStore((s) => s.nextTrack);
  const prevTrack = useMusicStore((s) => s.prevTrack);
  const setVolume = useMusicStore((s) => s.setVolume);
  const pause = useMusicStore((s) => s.pause);
  const seekTo = useMusicStore((s) => s.seekTo);
  const closePlayer = useMusicStore((s) => s.closePlayer);

  // ---------- persistent audio element ----------
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }

    const audio = audioRef.current;

    // Sync volume whenever it changes in the store
    audio.volume = volume;

    return () => {
      // Don't destroy on unmount — keep alive across navigations
    };
  }, [volume]);

  // ---------- load a new track ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.previewUrl;
    audio.load();

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Browser may block autoplay — pause the store
          pause();
        });
      }
    }
  }, [currentTrack?.id]);

  // ---------- play / pause sync ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => pause());
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // ---------- volume sync ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // ---------- track-end → auto next ----------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      nextTrack();
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [nextTrack]);

  // ---------- progress ticker (30s preview) ----------
  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressIntervalRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio && !audio.paused && audio.duration) {
          seekTo(audio.currentTime);
        }
      }, 250);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentTrack?.id]);

  // ---------- helpers ----------
  const duration = currentTrack ? currentTrack.durationMs / 1000 : 30;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    closePlayer();
  }, [closePlayer]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !currentTrack) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const newTime = fraction * duration;
      audio.currentTime = newTime;
      seekTo(newTime);
    },
    [currentTrack, duration, seekTo]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVolume(Number(e.target.value));
    },
    [setVolume]
  );

  // ---------- render ----------
  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-5 right-5 z-50 w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      >
        {/* ── progress bar ── */}
        <div
          className="h-1 w-full cursor-pointer bg-white/10"
          onClick={handleProgressClick}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Track progress"
        >
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-[width] duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── body ── */}
        <div className="flex items-center gap-3 p-3">
          {/* artwork */}
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
            <img
              src={currentTrack.artworkUrl100
                .replace("100x100bb", "200x200bb")
                .replace("100x100", "200x200")}
              alt={currentTrack.collectionName}
              className="h-full w-full object-cover"
            />
            {isPlaying && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="flex items-end gap-[3px]">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-[3px] animate-pulse rounded-full bg-violet-400"
                      style={{
                        height: `${8 + Math.random() * 10}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: "0.6s",
                      }}
                    />
                  ))}
                </span>
              </span>
            )}
          </div>

          {/* track info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {currentTrack.trackName}
            </p>
            <p className="truncate text-xs text-gray-400">
              {currentTrack.artistName}
            </p>
          </div>

          {/* close */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-full p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close player"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── controls ── */}
        <div className="flex items-center justify-between px-3 pb-3">
          {/* prev / play-pause / next */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevTrack}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Previous track"
            >
              <SkipBack size={16} />
            </button>

            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Next track"
            >
              <SkipForward size={16} />
            </button>
          </div>

          {/* volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="text-gray-400 transition-colors hover:text-white"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/15 accent-violet-500
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
              aria-label="Volume"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
