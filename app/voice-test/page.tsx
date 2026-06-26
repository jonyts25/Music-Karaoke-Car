"use client";

import Link from "next/link";
import { useState } from "react";
import { normalizeMusicQuery } from "@/lib/search/normalizeMusicQuery";
import { searchMockCatalog } from "@/lib/search/searchMockCatalog";
import { useSpeechSearch } from "@/lib/voice/useSpeechSearch";

export default function VoiceTestPage() {
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

  const normalized = normalizeMusicQuery(manualQuery || transcript);
  const matches = normalized ? searchMockCatalog(normalized).slice(0, 5) : [];

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          ← Inicio
        </Link>
        <span className="text-sm font-medium text-muted">Voice test</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4 sm:p-8">
        <h1 className="text-2xl font-semibold">Prueba de micrófono / voz</h1>

        <dl className="space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Soportado</dt>
            <dd className="font-mono">{isSupported ? "sí" : "no"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Escuchando</dt>
            <dd className="font-mono">{isListening ? "sí" : "no"}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              resetTranscript();
              startListening();
            }}
            disabled={!isSupported || isListening}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-background disabled:opacity-50"
          >
            Iniciar
          </button>
          <button
            type="button"
            onClick={stopListening}
            disabled={!isListening}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-semibold disabled:opacity-50"
          >
            Detener
          </button>
          <button
            type="button"
            onClick={resetTranscript}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-semibold"
          >
            Limpiar
          </button>
        </div>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-muted">Búsqueda manual (fallback)</span>
          <input
            type="search"
            value={manualQuery}
            onChange={(event) => setManualQuery(event.target.value)}
            placeholder="Escribe canción o artista"
            className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base"
          />
        </label>

        <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
          <p>
            <span className="text-muted">Transcript:</span>{" "}
            <span className="font-mono">{transcript || "—"}</span>
          </p>
          <p>
            <span className="text-muted">Interim:</span>{" "}
            <span className="font-mono">{interimTranscript || "—"}</span>
          </p>
          <p>
            <span className="text-muted">Query normalizada:</span>{" "}
            <span className="font-mono">{normalized || "—"}</span>
          </p>
          <p>
            <span className="text-muted">Error:</span>{" "}
            <span className="font-mono">{errorMessage || "—"}</span>
          </p>
        </div>

        {matches.length > 0 ? (
          <ul className="space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
            <li className="font-medium">Matches del catálogo mock</li>
            {matches.map(({ song, score }) => (
              <li key={song.id} className="flex justify-between gap-3">
                <span>
                  {song.title} — {song.artist}
                </span>
                <span className="font-mono text-muted">score {score}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
