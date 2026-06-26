"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useIsClient } from "@/lib/useIsClient";
import { getSpeechRecognitionSupportFlags } from "@/lib/voice/speechRecognitionSupport";

type DebugInfo = {
  width: string;
  height: string;
  visualViewportWidth: string;
  visualViewportHeight: string;
  devicePixelRatio: string;
  userAgent: string;
  language: string;
  platform: string;
  displayMode: string;
  orientation: string;
  visibilityState: string;
  lastUpdated: string;
  errorMessage: string;
  speechRecognitionSupported: string;
  webkitSpeechRecognitionSupported: string;
  isSecureContext: string;
};

const INITIAL_INFO: DebugInfo = {
  width: "unknown",
  height: "unknown",
  visualViewportWidth: "unsupported",
  visualViewportHeight: "unsupported",
  devicePixelRatio: "unknown",
  userAgent: "unknown",
  language: "unknown",
  platform: "unknown",
  displayMode: "unknown",
  orientation: "unknown",
  visibilityState: "unknown",
  lastUpdated: "never",
  errorMessage: "",
  speechRecognitionSupported: "unknown",
  webkitSpeechRecognitionSupported: "unknown",
  isSecureContext: "unknown",
};

const FIELDS: { key: keyof DebugInfo; label: string }[] = [
  { key: "width", label: "Ancho (innerWidth)" },
  { key: "height", label: "Alto (innerHeight)" },
  { key: "visualViewportWidth", label: "visualViewport.width" },
  { key: "visualViewportHeight", label: "visualViewport.height" },
  { key: "devicePixelRatio", label: "devicePixelRatio" },
  { key: "userAgent", label: "User agent" },
  { key: "language", label: "Idioma" },
  { key: "platform", label: "Plataforma" },
  { key: "displayMode", label: "Display mode" },
  { key: "orientation", label: "Orientación" },
  { key: "visibilityState", label: "visibilityState" },
  { key: "lastUpdated", label: "Última actualización" },
  { key: "speechRecognitionSupported", label: "SpeechRecognition" },
  { key: "webkitSpeechRecognitionSupported", label: "webkitSpeechRecognition" },
  { key: "isSecureContext", label: "isSecureContext" },
  { key: "errorMessage", label: "Error" },
];

export default function DebugClient() {
  const [clicks, setClicks] = useState(0);
  const mounted = useIsClient();
  const [info, setInfo] = useState<DebugInfo>(INITIAL_INFO);

  function readDebugInfo() {
    if (
      typeof window === "undefined" ||
      typeof document === "undefined" ||
      typeof navigator === "undefined"
    ) {
      return;
    }

    try {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const vv = window.visualViewport;

      const speech = getSpeechRecognitionSupportFlags();

      const next: DebugInfo = {
        width: `${w}px`,
        height: `${h}px`,
        visualViewportWidth: vv ? `${vv.width}px` : "unsupported",
        visualViewportHeight: vv ? `${vv.height}px` : "unsupported",
        devicePixelRatio: String(window.devicePixelRatio),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        displayMode: window.matchMedia("(display-mode: standalone)").matches
          ? "standalone"
          : "browser",
        orientation: w >= h ? "landscape" : "portrait",
        visibilityState: document.visibilityState,
        lastUpdated: new Date().toLocaleTimeString(),
        errorMessage: "",
        speechRecognitionSupported: speech.speechRecognitionSupported,
        webkitSpeechRecognitionSupported: speech.webkitSpeechRecognitionSupported,
        isSecureContext: speech.isSecureContext,
      };

      setInfo(next);
    } catch (error) {
      setInfo((prev) => ({
        ...prev,
        errorMessage: String(error),
        lastUpdated: new Date().toLocaleTimeString(),
      }));
    }
  }

  useEffect(() => {
    function read() {
      if (
        typeof window === "undefined" ||
        typeof document === "undefined" ||
        typeof navigator === "undefined"
      ) {
        return;
      }

      try {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const vv = window.visualViewport;
        const speech = getSpeechRecognitionSupportFlags();

        const next: DebugInfo = {
          width: `${w}px`,
          height: `${h}px`,
          visualViewportWidth: vv ? `${vv.width}px` : "unsupported",
          visualViewportHeight: vv ? `${vv.height}px` : "unsupported",
          devicePixelRatio: String(window.devicePixelRatio),
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          displayMode: window.matchMedia("(display-mode: standalone)").matches
            ? "standalone"
            : "browser",
          orientation: w >= h ? "landscape" : "portrait",
          visibilityState: document.visibilityState,
          lastUpdated: new Date().toLocaleTimeString(),
          errorMessage: "",
          speechRecognitionSupported: speech.speechRecognitionSupported,
          webkitSpeechRecognitionSupported: speech.webkitSpeechRecognitionSupported,
          isSecureContext: speech.isSecureContext,
        };

        setInfo(next);
      } catch (error) {
        setInfo((prev) => ({
          ...prev,
          errorMessage: String(error),
          lastUpdated: new Date().toLocaleTimeString(),
        }));
      }
    }

    read();

    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    document.addEventListener("visibilitychange", read);
    window.visualViewport?.addEventListener("resize", read);

    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
      document.removeEventListener("visibilitychange", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, []);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          ← Inicio
        </Link>
        <span className="text-sm font-medium text-muted">Debug viewport</span>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-8">
        <h1 className="mb-4 text-2xl font-semibold">Información del dispositivo</h1>

        <div className="mb-6 space-y-1 text-sm">
          <p className="font-medium">Debug cargado</p>
          <p>
            JS hidratado:{" "}
            <span className="font-mono font-semibold">{mounted ? "sí" : "no"}</span>
          </p>
          <p>
            Clicks: <span className="font-mono font-semibold">{clicks}</span>
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setClicks((c) => c + 1)}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-medium transition-colors hover:bg-border/40"
          >
            Probar click
          </button>
          <button
            type="button"
            onClick={readDebugInfo}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-6 text-sm font-medium transition-colors hover:bg-border/40"
          >
            Actualizar datos
          </button>
        </div>

        <table className="w-full border-collapse rounded-2xl border border-border bg-surface text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted">Campo</th>
              <th className="px-4 py-3 text-left font-medium text-muted">Valor</th>
            </tr>
          </thead>
          <tbody>
            {FIELDS.map(({ key, label }) => (
              <tr key={key} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 align-top font-medium text-muted">{label}</td>
                <td className="break-all px-4 py-3 font-mono">{info[key] || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
