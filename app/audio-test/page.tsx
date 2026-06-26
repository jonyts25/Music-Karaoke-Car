"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/mockSong";
import {
  AUDIO_PLAY_BLOCKED_MESSAGE,
  PREVIEW_NOTICE,
} from "@/lib/music/previewCopy";
import type { MusicSearchResult } from "@/lib/music/types";

export default function AudioTestPage() {
  const [query, setQuery] = useState("Blinding Lights The Weeknd");
  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<MusicSearchResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [audioReady, setAudioReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selected?.previewUrl) return;

    setAudioReady(false);
    setAudioError("");
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    audio.src = selected.previewUrl;
    audio.load();

    const onCanPlay = () => setAudioReady(true);
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    const onError = () => setAudioError("No se pudo cargar el preview.");

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
  }, [selected]);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    setMessage("");
    setResults([]);
    setSelected(null);

    try {
      const params = new URLSearchParams({ q });
      const response = await fetch(`/api/music/search?${params.toString()}`);
      const data = (await response.json()) as {
        status: "ok" | "error";
        results: MusicSearchResult[];
        message?: string;
      };

      if (!response.ok || data.status === "error") {
        setMessage(data.message || "Error buscando en iTunes.");
        return;
      }

      setResults(data.results);
      if (data.results.length === 0) {
        setMessage("Sin previews reproducibles.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Error de red al buscar música.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !selected?.previewUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setAudioError("");
      setIsPlaying(true);
    } catch {
      setAudioError(AUDIO_PLAY_BLOCKED_MESSAGE);
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <audio ref={audioRef} preload="metadata" className="hidden" />

      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          ← Inicio
        </Link>
        <span className="text-sm font-medium text-muted">Audio test</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 sm:p-8">
        <h1 className="text-2xl font-semibold">Prueba iTunes Preview</h1>
        <p className="text-sm text-muted">{PREVIEW_NOTICE}</p>

        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void runSearch();
            }}
            placeholder="Blinding Lights The Weeknd"
            className="min-h-12 flex-1 rounded-xl border border-border bg-surface px-4 text-base"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={isSearching}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-background disabled:opacity-50"
          >
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {message ? <p className="text-sm text-muted">{message}</p> : null}

        {results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((result) => (
              <li
                key={result.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
              >
                {result.artworkUrl ? (
                  <img
                    src={result.artworkUrl}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{result.title}</p>
                  <p className="truncate text-sm text-muted">{result.artist}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(result)}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold"
                >
                  Elegir
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {selected ? (
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
            <p className="font-medium">
              {selected.title} — {selected.artist}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-background"
              >
                {isPlaying ? "Pausar" : "Play preview"}
              </button>
            </div>
            <dl className="space-y-1 font-mono text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">ready</dt>
                <dd>{audioReady ? "yes" : "no"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">currentTime</dt>
                <dd>{formatTime(currentTime)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">duration</dt>
                <dd>{duration > 0 ? formatTime(duration) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">error</dt>
                <dd>{audioError || "—"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </main>
    </div>
  );
}
