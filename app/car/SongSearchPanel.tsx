"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  pickAutoSelectResult,
  searchMockCatalog,
  type CatalogSearchResult,
} from "@/lib/search/searchMockCatalog";
import { useSpeechSearch } from "@/lib/voice/useSpeechSearch";

type SearchUiStatus = "idle" | "searching" | "not-found";

type SongSearchPanelProps = {
  onSelectSong: (songId: string) => void;
};

function statusMessage(
  isSupported: boolean,
  isListening: boolean,
  searchUiStatus: SearchUiStatus,
  errorMessage: string,
): string {
  if (!isSupported) return "Voz no soportada en este navegador";
  if (isListening) return "Escuchando...";
  if (searchUiStatus === "searching") return "Buscando...";
  if (errorMessage === "Permiso de micrófono denegado") {
    return "Permiso de micrófono denegado";
  }
  if (errorMessage === "No escuché nada") return "No escuché nada";
  if (errorMessage) return errorMessage;
  return "Voz soportada";
}

export default function SongSearchPanel({ onSelectSong }: SongSearchPanelProps) {
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

  const [manualQuery, setManualQuery] = useState("");
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [selectionNotice, setSelectionNotice] = useState("");
  const [searchUiStatus, setSearchUiStatus] = useState<SearchUiStatus>("idle");
  const lastProcessedTranscript = useRef("");

  const runSearch = useCallback(
    (rawQuery: string) => {
      const query = rawQuery.trim();
      if (!query) {
        setResults([]);
        setSelectionNotice("");
        setSearchUiStatus("idle");
        return;
      }

      setSearchUiStatus("searching");
      setSelectionNotice("");

      const matches = searchMockCatalog(query);
      setResults(matches);

      const auto = pickAutoSelectResult(matches);
      if (auto) {
        const label = `${auto.song.title} — ${auto.song.artist}`;
        setSelectionNotice(`Seleccioné: ${label}`);
        onSelectSong(auto.song.id);
        setSearchUiStatus("idle");
        return;
      }

      if (matches.length === 0) {
        setSelectionNotice("No encontrada");
        setSearchUiStatus("not-found");
        return;
      }

      setSearchUiStatus("idle");
    },
    [onSelectSong],
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
    setResults([]);
    setSelectionNotice("");
    setSearchUiStatus("idle");
    startListening();
  };

  const handleManualSearch = () => {
    runSearch(manualQuery);
  };

  const heardText = [transcript, interimTranscript].filter(Boolean).join(" ").trim();

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-base font-semibold">Buscar canción</h2>

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
        {statusMessage(isSupported, isListening, searchUiStatus, errorMessage)}
      </p>

      {heardText ? (
        <p className="text-sm">
          Escuché: <span className="font-medium">{heardText}</span>
        </p>
      ) : null}

      {selectionNotice ? (
        <p className="text-sm font-medium text-foreground">{selectionNotice}</p>
      ) : null}

      {results.length > 1 ? (
        <ul className="space-y-2">
          {results.slice(0, 5).map(({ song }) => (
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
                  setResults([]);
                }}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold transition-colors hover:bg-border/40"
              >
                Usar
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
