import type { LyricLine } from "@/lib/mockSong";

export function createPreviewMockLyrics(title: string): LyricLine[] {
  return [
    { time: 0, text: `♪ ${title} (preview) ♪` },
    { time: 5, text: "Preview de 30 segundos" },
    { time: 12, text: "Pulsa «Buscar letra real»" },
    { time: 20, text: "para sincronizar con LRCLIB" },
  ];
}

export const PREVIEW_NOTICE =
  "Preview de 30 segundos para validar audio. Apple Music completo vendrá después.";

export const AUDIO_PLAY_BLOCKED_MESSAGE =
  "El navegador bloqueó reproducción. Toca Play de nuevo.";
