"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LyricsSearchStatus, NormalizedLyricsResult } from "@/lib/lyrics/types";
import {
  AUDIO_PLAY_BLOCKED_MESSAGE,
  PREVIEW_NOTICE,
  createPreviewMockLyrics,
} from "@/lib/music/previewCopy";
import type { MusicProvider, MusicSearchResult } from "@/lib/music/types";
import {
  MOCK_SONGS,
  findSongIndexById,
  formatTime,
  getLyricIndices,
  type LyricLine,
  type MockSong,
} from "@/lib/mockSong";
import SongSearchPanel from "./SongSearchPanel";

const TICK_MS = 200;
const PREVIEW_FALLBACK_DURATION = 30;

type LyricsSource = "mock" | "lrclib";
type UiLyricsMode = "karaoke" | "plain" | "instrumental";

const STATUS_LABEL: Record<LyricsSearchStatus | "mock" | "searching", string> = {
  mock: "Letra mock",
  searching: "Buscando letra...",
  synced: "Letra sincronizada",
  plain: "Letra estática",
  instrumental: "Instrumental",
  not_found: "Sin letra encontrada",
  error: "Error buscando letra",
};

function AlbumArt({ artworkUrl }: { artworkUrl?: string }) {
  if (artworkUrl) {
    return (
      <img
        src={artworkUrl}
        alt=""
        className="aspect-square w-full max-w-[220px] rounded-2xl border border-border object-cover sm:max-w-[180px] lg:max-w-[220px]"
      />
    );
  }

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
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const base =
    "inline-flex min-h-16 min-w-16 items-center justify-center rounded-2xl text-xl font-semibold transition-opacity active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-accent px-8 text-background hover:opacity-90"
      : "border border-border bg-surface px-6 hover:bg-border/40";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  );
}

export default function CarKaraoke() {
  const [musicProvider, setMusicProvider] = useState<MusicProvider>("mock");
  const [songIndex, setSongIndex] = useState(0);
  const [previewTrack, setPreviewTrack] = useState<MusicSearchResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [lyricsSource, setLyricsSource] = useState<LyricsSource>("mock");
  const [lyricsStatus, setLyricsStatus] = useState<LyricsSearchStatus | "mock">("mock");
  const [uiMode, setUiMode] = useState<UiLyricsMode>("karaoke");
  const [activeLyrics, setActiveLyrics] = useState<LyricLine[]>(MOCK_SONGS[0].lyrics);
  const [plainLyrics, setPlainLyrics] = useState("");
  const [playbackDuration, setPlaybackDuration] = useState(MOCK_SONGS[0].duration);
  const [lastLyricsMessage, setLastLyricsMessage] = useState("");
  const [notice, setNotice] = useState("");

  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const mockSong: MockSong = MOCK_SONGS[songIndex];
  const isPreview = musicProvider === "itunes-preview" && previewTrack !== null;

  const displayTitle = isPreview ? previewTrack.title : mockSong.title;
  const displayArtist = isPreview ? previewTrack.artist : mockSong.artist;
  const displayAlbum = isPreview ? previewTrack.album : mockSong.album;
  const displayArtwork = isPreview ? previewTrack.artworkUrl : undefined;

  const { previous, current, next } = getLyricIndices(activeLyrics, currentTime);
  const progress =
    playbackDuration > 0 ? (currentTime / playbackDuration) * 100 : 0;

  const statusLabel = isSearching
    ? STATUS_LABEL.searching
    : STATUS_LABEL[lyricsStatus];

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const resetToMockLyrics = useCallback(
    (title: string, duration: number) => {
      setLyricsSource("mock");
      setLyricsStatus("mock");
      setUiMode("karaoke");
      setActiveLyrics(createPreviewMockLyrics(title));
      setPlainLyrics("");
      setPlaybackDuration(duration);
      setLastLyricsMessage("");
      setNotice("");
      setIsSearching(false);
    },
    [],
  );

  const resetToMock = useCallback(
    (index: number) => {
      const nextSong = MOCK_SONGS[index];
      setMusicProvider("mock");
      setPreviewTrack(null);
      setAudioReady(false);
      setAudioError("");
      setAudioDuration(0);
      stopAudio();
      setLyricsSource("mock");
      setLyricsStatus("mock");
      setUiMode("karaoke");
      setActiveLyrics(nextSong.lyrics);
      setPlainLyrics("");
      setPlaybackDuration(nextSong.duration);
      setLastLyricsMessage("");
      setNotice("");
      setIsSearching(false);
    },
    [stopAudio],
  );

  const resetSong = useCallback(
    (index: number) => {
      stopTimer();
      setIsPlaying(false);
      setSongIndex(index);
      setCurrentTime(0);
      resetToMock(index);
    },
    [resetToMock, stopTimer],
  );

  const handleSelectPreview = useCallback(
    (result: MusicSearchResult) => {
      if (!result.previewUrl) {
        setNotice("Este resultado no tiene previewUrl.");
        return;
      }

      stopTimer();
      stopAudio();
      setIsPlaying(false);
      setCurrentTime(0);
      setMusicProvider("itunes-preview");
      setPreviewTrack(result);
      setAudioReady(false);
      setAudioError("");
      setAudioDuration(0);

      const duration = result.duration ?? PREVIEW_FALLBACK_DURATION;
      resetToMockLyrics(result.title, duration);
      setNotice(PREVIEW_NOTICE);
    },
    [resetToMockLyrics, stopAudio, stopTimer],
  );

  useEffect(() => {
    if (musicProvider !== "itunes-preview" || !previewTrack?.previewUrl) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    setAudioReady(false);
    setAudioError("");
    audio.src = previewTrack.previewUrl;
    audio.load();

    const onCanPlay = () => setAudioReady(true);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
        setPlaybackDuration(audio.duration);
      } else if (previewTrack.duration) {
        setAudioDuration(previewTrack.duration);
        setPlaybackDuration(previewTrack.duration);
      }
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || playbackDuration);
    };
    const onError = () => {
      setAudioError("No se pudo cargar el preview de audio.");
      setIsPlaying(false);
    };

    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [musicProvider, playbackDuration, previewTrack]);

  useEffect(() => {
    if (musicProvider !== "mock" || !isPlaying) {
      stopTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const nextTime = prev + TICK_MS / 1000;
        if (nextTime >= playbackDuration) {
          stopTimer();
          setIsPlaying(false);
          return playbackDuration;
        }
        return nextTime;
      });
    }, TICK_MS);

    return stopTimer;
  }, [isPlaying, musicProvider, playbackDuration, stopTimer]);

  const handlePrevSong = () => {
    if (isPreview) return;
    const nextIndex = songIndex === 0 ? MOCK_SONGS.length - 1 : songIndex - 1;
    resetSong(nextIndex);
  };

  const handleNextSong = () => {
    if (isPreview) return;
    const nextIndex = (songIndex + 1) % MOCK_SONGS.length;
    resetSong(nextIndex);
  };

  const togglePlay = async () => {
    if (isPreview) {
      const audio = audioRef.current;
      if (!audio || !previewTrack?.previewUrl) {
        setNotice("Preview no disponible.");
        return;
      }

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      if (currentTime >= playbackDuration) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }

      try {
        await audio.play();
        setAudioError("");
        setIsPlaying(true);
      } catch {
        setAudioError(AUDIO_PLAY_BLOCKED_MESSAGE);
        setIsPlaying(false);
      }
      return;
    }

    if (currentTime >= playbackDuration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const applyLyricsResult = (result: NormalizedLyricsResult, fallbackDuration: number) => {
    const fallbackLyrics = isPreview
      ? createPreviewMockLyrics(displayTitle)
      : mockSong.lyrics;

    setLyricsSource("lrclib");
    setLyricsStatus(result.status);
    setLastLyricsMessage(result.message);
    setNotice(result.message);

    if (result.duration && result.duration > 0) {
      setPlaybackDuration(result.duration);
    } else {
      setPlaybackDuration(fallbackDuration);
    }

    if (result.status === "synced") {
      setUiMode("karaoke");
      setActiveLyrics(result.syncedLines);
      setPlainLyrics(result.plainLyrics);
      setCurrentTime(0);
      if (isPreview && audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      setNotice("");
      return;
    }

    if (result.status === "plain") {
      setUiMode("plain");
      setActiveLyrics(fallbackLyrics);
      setPlainLyrics(result.plainLyrics);
      setCurrentTime(0);
      if (isPreview && audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    if (result.status === "instrumental") {
      setUiMode("instrumental");
      setActiveLyrics(fallbackLyrics);
      setPlainLyrics("");
      setCurrentTime(0);
      if (isPreview && audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    setLyricsSource("mock");
    setLyricsStatus("mock");
    setUiMode("karaoke");
    setActiveLyrics(fallbackLyrics);
    setPlainLyrics("");
    setPlaybackDuration(fallbackDuration);
  };

  const searchRealLyrics = async () => {
    setIsSearching(true);
    setNotice("");
    stopTimer();
    setIsPlaying(false);
    stopAudio();

    const fallbackDuration = isPreview
      ? previewTrack?.duration ?? PREVIEW_FALLBACK_DURATION
      : mockSong.duration;
    const fallbackLyrics = isPreview
      ? createPreviewMockLyrics(displayTitle)
      : mockSong.lyrics;

    try {
      const params = new URLSearchParams({
        artist: displayArtist,
        track: displayTitle,
        duration: String(Math.round(fallbackDuration)),
      });

      const response = await fetch(`/api/lyrics/search?${params.toString()}`);
      const result = (await response.json()) as NormalizedLyricsResult;

      if (!response.ok) {
        setLyricsSource("mock");
        setLyricsStatus("mock");
        setUiMode("karaoke");
        setActiveLyrics(fallbackLyrics);
        setLastLyricsMessage(result.message || "Parámetros inválidos.");
        setNotice(result.message || "No se pudo buscar la letra.");
        return;
      }

      applyLyricsResult(result, fallbackDuration);
    } catch (error) {
      setLyricsSource("mock");
      setLyricsStatus("mock");
      setUiMode("karaoke");
      setActiveLyrics(fallbackLyrics);
      const message =
        error instanceof Error ? error.message : "Error de red al buscar letra.";
      setLastLyricsMessage(message);
      setNotice(message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSongFromSearch = useCallback(
    (songId: string) => {
      const index = findSongIndexById(songId);
      if (index >= 0) {
        resetSong(index);
      }
    },
    [resetSong],
  );

  return (
    <div className="flex min-h-full flex-col bg-background">
      <audio ref={audioRef} preload="metadata" className="hidden" />

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
          <AlbumArt artworkUrl={displayArtwork} />
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
              {displayTitle}
            </h1>
            <p className="mt-1 text-lg text-muted">{displayArtist}</p>
            {displayAlbum ? (
              <p className="mt-1 text-sm text-muted">{displayAlbum}</p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-3">
            <SongSearchPanel
              onSelectSong={handleSelectSongFromSearch}
              onSelectPreview={handleSelectPreview}
            />
            {isPreview ? (
              <p className="text-xs leading-relaxed text-muted">{PREVIEW_NOTICE}</p>
            ) : null}
            <span className="rounded-xl border border-border bg-surface px-4 py-2 text-center text-sm font-medium lg:text-left">
              {statusLabel}
            </span>
            <button
              type="button"
              onClick={searchRealLyrics}
              disabled={isSearching}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-border bg-surface px-6 text-base font-semibold transition-colors hover:bg-border/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buscar letra real
            </button>
            {audioError ? (
              <p className="text-sm font-medium text-foreground">{audioError}</p>
            ) : null}
            {notice ? (
              <p className="text-xs leading-relaxed text-muted">{notice}</p>
            ) : null}
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col justify-center gap-4 lg:gap-6">
          {uiMode === "karaoke" ? (
            <div className="space-y-3 sm:space-y-4">
              <p
                className="truncate text-lg text-muted opacity-60 sm:text-xl lg:text-2xl"
                aria-live="off"
              >
                {previous >= 0 ? activeLyrics[previous].text : "\u00a0"}
              </p>
              <p
                className="text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-tight tracking-tight"
                aria-live="polite"
              >
                {current >= 0 ? activeLyrics[current].text : "\u00a0"}
              </p>
              <p
                className="truncate text-lg text-muted opacity-70 sm:text-xl lg:text-2xl"
                aria-live="off"
              >
                {next >= 0 ? activeLyrics[next].text : "\u00a0"}
              </p>
            </div>
          ) : null}

          {uiMode === "plain" ? (
            <div className="max-h-[40vh] overflow-y-auto rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <p className="mb-3 text-sm font-medium text-muted">Modo lectura</p>
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed sm:text-lg">
                {plainLyrics}
              </pre>
            </div>
          ) : null}

          {uiMode === "instrumental" ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-xl font-semibold sm:text-2xl">Pista instrumental</p>
              <p className="mt-2 text-sm text-muted">
                LRCLIB no reporta letra para esta canción.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-surface"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={playbackDuration}
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
              <span>{formatTime(playbackDuration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 sm:gap-6">
            <ControlButton
              label="Canción anterior"
              onClick={handlePrevSong}
              disabled={isPreview}
            >
              ⏮
            </ControlButton>
            <ControlButton
              label={isPlaying ? "Pausar" : "Reproducir"}
              onClick={() => {
                void togglePlay();
              }}
              variant="primary"
              disabled={isPreview && !previewTrack?.previewUrl}
            >
              {isPlaying ? "⏸" : "▶"}
            </ControlButton>
            <ControlButton
              label="Canción siguiente"
              onClick={handleNextSong}
              disabled={isPreview}
            >
              ⏭
            </ControlButton>
          </div>

          <details className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium text-muted">
              Debug letras / audio
            </summary>
            <dl className="mt-3 space-y-2 font-mono text-xs sm:text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">musicProvider</dt>
                <dd>{musicProvider}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">audioReady</dt>
                <dd>{audioReady ? "yes" : "no"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">audioCurrentTime</dt>
                <dd>{currentTime.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">audioDuration</dt>
                <dd>{audioDuration > 0 ? audioDuration.toFixed(2) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">audioError</dt>
                <dd className="break-all">{audioError || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">selectedPreviewUrl</dt>
                <dd>{previewTrack?.previewUrl ? "yes" : "no"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">lyricsSource</dt>
                <dd>{lyricsSource}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">lyricsStatus</dt>
                <dd>{lyricsStatus}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">syncedLines</dt>
                <dd>
                  {uiMode === "karaoke" && lyricsSource === "lrclib"
                    ? activeLyrics.length
                    : 0}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">plainLyrics length</dt>
                <dd>{plainLyrics.length}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted">lastLyricsMessage</dt>
                <dd className="break-all">{lastLyricsMessage || "—"}</dd>
              </div>
            </dl>
          </details>
        </section>
      </main>
    </div>
  );
}
