"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MOCK_SONGS,
  formatTime,
  getLyricIndices,
  type MockSong,
} from "@/lib/mockSong";

const TICK_MS = 200;

function AlbumPlaceholder() {
  return (
    <div
      className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-border bg-surface sm:max-w-[180px] lg:max-w-[220px]"
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        className="h-16 w-16 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="32" cy="32" r="28" />
        <circle cx="32" cy="32" r="8" fill="currentColor" />
        <path d="M32 4v24M32 36v24M4 32h24M36 32h24" />
      </svg>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  variant = "secondary",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex min-h-16 min-w-16 items-center justify-center rounded-2xl text-xl font-semibold transition-opacity active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-accent px-8 text-background hover:opacity-90"
      : "border border-border bg-surface px-6 hover:bg-border/40";

  return (
    <button type="button" aria-label={label} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export default function CarKaraoke() {
  const [songIndex, setSongIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const song: MockSong = MOCK_SONGS[songIndex];
  const { previous, current, next } = getLyricIndices(song.lyrics, currentTime);
  const progress = song.duration > 0 ? (currentTime / song.duration) * 100 : 0;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetSong = useCallback(
    (index: number) => {
      stopTimer();
      setIsPlaying(false);
      setSongIndex(index);
      setCurrentTime(0);
    },
    [stopTimer],
  );

  useEffect(() => {
    if (!isPlaying) {
      stopTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const nextTime = prev + TICK_MS / 1000;
        if (nextTime >= song.duration) {
          stopTimer();
          setIsPlaying(false);
          return song.duration;
        }
        return nextTime;
      });
    }, TICK_MS);

    return stopTimer;
  }, [isPlaying, song.duration, stopTimer]);

  const handlePrevSong = () => {
    const nextIndex = songIndex === 0 ? MOCK_SONGS.length - 1 : songIndex - 1;
    resetSong(nextIndex);
  };

  const handleNextSong = () => {
    const nextIndex = (songIndex + 1) % MOCK_SONGS.length;
    resetSong(nextIndex);
  };

  const togglePlay = () => {
    if (currentTime >= song.duration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          ← Inicio
        </Link>
        <span className="text-sm font-medium text-muted">Modo camioneta</span>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:items-center lg:gap-10 lg:p-8">
        <section className="flex shrink-0 flex-col items-center gap-4 lg:w-[280px] lg:items-start">
          <AlbumPlaceholder />
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {song.title}
            </h1>
            <p className="mt-1 text-lg text-muted">{song.artist}</p>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col justify-center gap-4 lg:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <p
              className="truncate text-lg text-muted opacity-60 sm:text-xl lg:text-2xl"
              aria-live="off"
            >
              {previous >= 0 ? song.lyrics[previous].text : "\u00a0"}
            </p>
            <p
              className="text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-tight tracking-tight"
              aria-live="polite"
            >
              {current >= 0 ? song.lyrics[current].text : "\u00a0"}
            </p>
            <p
              className="truncate text-lg text-muted opacity-70 sm:text-xl lg:text-2xl"
              aria-live="off"
            >
              {next >= 0 ? song.lyrics[next].text : "\u00a0"}
            </p>
          </div>

          <div className="space-y-2">
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-surface"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={song.duration}
              aria-valuenow={Math.floor(currentTime)}
              aria-label="Progreso de la canción"
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-sm text-muted sm:text-base">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(song.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 sm:gap-6">
            <ControlButton label="Canción anterior" onClick={handlePrevSong}>
              ⏮
            </ControlButton>
            <ControlButton label={isPlaying ? "Pausar" : "Reproducir"} onClick={togglePlay} variant="primary">
              {isPlaying ? "⏸" : "▶"}
            </ControlButton>
            <ControlButton label="Canción siguiente" onClick={handleNextSong}>
              ⏭
            </ControlButton>
          </div>
        </section>
      </main>
    </div>
  );
}
