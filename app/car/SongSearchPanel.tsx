"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MusicSearchResult } from "@/lib/music/types";
import {
  pickAutoSelectResult,
  searchMockCatalog,
  type CatalogSearchResult,
} from "@/lib/search/searchMockCatalog";
import { formatTime } from "@/lib/mockSong";
import { PREVIEW_NOTICE } from "@/lib/music/previewCopy";
import { useSpeechSearch } from "@/lib/voice/useSpeechSearch";

type SearchUiStatus = "idle" | "searching" | "not-found";
type SearchSource = "mock" | "itunes";

type SongSearchPanelProps = {
  onSelectSong: (songId: string) => void;
  onSelectPreview: (result: MusicSearchResult) => void;
};

function statusMessage(
  searchSource: SearchSource,
  isSupported: boolean,
  isListening: boolean,
  searchUiStatus: SearchUiStatus,
  errorMessage: string,
): string {
  if (searchSource === "itunes" && searchUiStatus === "searching") {
    return "Buscando en iTunes...";
  }
  if (!isSupported) return "Voz no soportada en este navegador";
  if (isListening) return "Escuchando...";
  if (searchUiStatus === "searching") return "Buscando...";
  if (errorMessage === "Permiso de micrófono denegado") {
    return "Permiso de micrófono denegado";
  }
  if (errorMessage === "No escuché nada") return "No escuché nada";
  if (errorMessage) return errorMessage;
  return searchSource === "itunes" ? "Modo iTunes Preview" : "Voz soportada";
}

export default function SongSearchPanel({
  onSelectSong,
  onSelectPreview,
}: SongSearchPanelProps) {
  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechSearch();

  const [searchSource, setSearchSource] = useState<SearchSource>("mock");
  const [manualQuery, setManualQuery] = useState("");
  const [mockResults, setMockResults] = useState<CatalogSearchResult[]>([]);
  const [itunesResults, setItunesResults] = useState<MusicSearchResult[]>([]);
  const [selectionNotice, setSelectionNotice] = useState("");
  const [searchUiStatus, setSearchUiStatus] = useState<SearchUiStatus>("idle");
  const [itunesMessage, setItunesMessage] = useState("");
  const lastProcessedTranscript = useRef("");

  const runMockSearch = useCallback(
    (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) {
        setMockResults([]);
        setSelectionNotice("");
        setSearchUiStatus("idle");
        return;
      }

      setSearchUiStatus("searching");
      setSelectionNotice("");
      setItunesMessage("");

      const matches = searchMockCatalog(query);
      setMockResults(matches);

      const auto = pickAutoSelectResult(matches);
      if (auto) {
        const label = `${auto.song.title} — ${auto.song.artist}`;
        setSelectionNotice(`Seleccioné: ${label}`);
        onSelectSong(auto.song.id);
        setSearchUiStatus("idle");
        return;
      }

      if (matches.length === 0) {
        setSelectionNotice("No encontrada en catálogo mock");
        setSearchUiStatus("not-found");
        return;
      }

      setSearchUiStatus("idle");
    },
    [onSelectSong],
  );

  const runItunesSearch = useCallback(async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) {
      setItunesResults([]);
      setSelectionNotice("");
      setItunesMessage("");
      setSearchUiStatus("idle");
      return;
    }

    setSearchUiStatus("searching");
    setSelectionNotice("");
    setItunesMessage("");
    setMockResults([]);

    try {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/music/search?${params.toString()}`);
      const data = (await response.json()) as {
        status: "ok" | "error";
        results: MusicSearchResult[];
        message?: string;
      };

      if (!response.ok) {
        setItunesResults([]);
        setSelectionNotice("Error buscando en iTunes");
        setItunesMessage(data.message || "Parámetros inválidos.");
        setSearchUiStatus("not-found");
        return;
      }

      if (data.status === "error" || data.results.length === 0) {
        setItunesResults([]);
        setSelectionNotice("Sin previews reproducibles");
        setItunesMessage(data.message || "No hay resultados con previewUrl.");
        setSearchUiStatus("not-found");
        return;
      }

      setItunesResults(data.results);
      setSearchUiStatus("idle");
    } catch (error) {
      setItunesResults([]);
      setSelectionNotice("Error buscando en iTunes");
      setItunesMessage(
        error instanceof Error ? error.message : "Error de red al buscar música.",
      );
      setSearchUiStatus("not-found");
    }
  }, []);

  const runSearch = useCallback(
    (rawQuery: string) => {
      if (searchSource === "itunes") {
        void runItunesSearch(rawQuery);
        return;
      }
      runMockSearch(rawQuery);
    },
    [runItunesSearch, runMockSearch, searchSource],
  );

  useEffect(() => {
    if (isListening || !transcript) return;
    if (transcript === lastProcessedTranscript.current) return;

    lastProcessedTranscript.current = transcript;
    runSearch(transcript);
  }, [isListening, transcript, runSearch]);

  const handleVoiceClick = () => {
    if (!isSupported) return;
    if (isListening) {
      stopListening();
      return;
    }
    resetTranscript();
    lastProcessedTranscript.current = "";
    setMockResults([]);
    setItunesResults([]);
    setSelectionNotice("");
    setItunesMessage("");
    setSearchUiStatus("idle");
    startListening();
  };

  const handleManualSearch = () => {
    runSearch(manualQuery);
  };

  const toggleSearchSource = () => {
    setSearchSource((prev) => (prev === "mock" ? "itunes" : "mock"));
    setMockResults([]);
    setItunesResults([]);
    setSelectionNotice("");
    setItunesMessage("");
    setSearchUiStatus("idle");
  };

  const heardText = [transcript, interimTranscript].filter(Boolean).join(" ").trim();

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-base font-semibold">Buscar canción</h2>

      <button
        type="button"
        onClick={toggleSearchSource}
        className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold transition-colors hover:bg-border/40"
      >
        {searchSource === "mock"
          ? "Buscar en Apple/iTunes Preview"
          : "Volver a catálogo mock"}
      </button>

      {searchSource === "itunes" ? (
        <p className="text-xs leading-relaxed text-muted">{PREVIEW_NOTICE}</p>
      ) : null}

      <button
        type="button"
        onClick={handleVoiceClick}
        disabled={!isSupported}
        className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-6 text-base font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isListening ? "Escuchando..." : "🎙 Buscar por voz"}
      </button>

      <div className="flex gap-2">
        <input
          type="search"
          value={manualQuery}
          onChange={(event) => setManualQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleManualSearch();
          }}
          placeholder="Escribe canción o artista"
          className="min-h-12 flex-1 rounded-xl border border-border bg-background px-4 text-base outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={handleManualSearch}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold transition-colors hover:bg-border/40"
        >
          Buscar
        </button>
      </div>

      <p className="text-sm text-muted">
        {statusMessage(
          searchSource,
          isSupported,
          isListening,
          searchUiStatus,
          errorMessage,
        )}
      </p>

      {heardText ? (
        <p className="text-sm">
          Escuché: <span className="font-medium">{heardText}</span>
        </p>
      ) : null}

      {selectionNotice ? (
        <p className="text-sm font-medium text-foreground">{selectionNotice}</p>
      ) : null}

      {itunesMessage ? (
        <p className="text-xs leading-relaxed text-muted">{itunesMessage}</p>
      ) : null}

      {searchSource === "mock" && mockResults.length > 1 ? (
        <ul className="space-y-2">
          {mockResults.slice(0, 5).map(({ song }) => (
            <li
              key={song.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{song.title}</p>
                <p className="truncate text-sm text-muted">{song.artist}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const label = `${song.title} — ${song.artist}`;
                  setSelectionNotice(`Seleccioné: ${label}`);
                  onSelectSong(song.id);
                  setMockResults([]);
                }}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-border/40"
              >
                Usar
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {searchSource === "itunes" && itunesResults.length > 0 ? (
        <ul className="space-y-2">
          {itunesResults.map((result) => (
            <li
              key={result.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
            >
              {result.artworkUrl ? (
                <img
                  src={result.artworkUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs text-muted">
                  ♪
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{result.title}</p>
                <p className="truncate text-sm text-muted">{result.artist}</p>
                {result.album ? (
                  <p className="truncate text-xs text-muted">{result.album}</p>
                ) : null}
                {result.duration ? (
                  <p className="text-xs text-muted">{formatTime(result.duration)}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  const label = `${result.title} — ${result.artist}`;
                  setSelectionNotice(`Preview: ${label}`);
                  onSelectPreview(result);
                  setItunesResults([]);
                }}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-border/40"
              >
                Usar preview
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
