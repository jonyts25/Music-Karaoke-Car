import { parseLrc } from "./parseLrc";
import type { NormalizedLyricsResult } from "./types";

const LRCLIB_BASE = "https://lrclib.net";
const USER_AGENT =
  "music-bridge-karaoke/0.2.0 (https://github.com/jonyts25/Music-Karaoke-Car)";
const REQUEST_TIMEOUT_MS = 12_000;

type LrclibRecord = {
  id?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

function emptyResult(
  overrides: Partial<NormalizedLyricsResult> & Pick<NormalizedLyricsResult, "status" | "message">,
): NormalizedLyricsResult {
  return {
    source: "lrclib",
    trackName: "",
    artistName: "",
    albumName: undefined,
    duration: undefined,
    syncedLines: [],
    plainLyrics: "",
    ...overrides,
  };
}

function normalizeRecord(
  record: LrclibRecord,
  fallbackArtist: string,
  fallbackTrack: string,
): NormalizedLyricsResult {
  const trackName = record.trackName ?? fallbackTrack;
  const artistName = record.artistName ?? fallbackArtist;
  const albumName = record.albumName ?? undefined;
  const duration = record.duration ?? undefined;
  const plainLyrics = (record.plainLyrics ?? "").trim();

  if (record.instrumental) {
    return emptyResult({
      status: "instrumental",
      trackName,
      artistName,
      albumName,
      duration,
      message: "LRCLIB marcó esta pista como instrumental.",
    });
  }

  const syncedRaw = (record.syncedLyrics ?? "").trim();
  if (syncedRaw) {
    const syncedLines = parseLrc(syncedRaw);
    if (syncedLines.length > 0) {
      return emptyResult({
        status: "synced",
        trackName,
        artistName,
        albumName,
        duration,
        syncedLines,
        plainLyrics,
        message: `Letra sincronizada (${syncedLines.length} líneas).`,
      });
    }
  }

  if (plainLyrics) {
    return emptyResult({
      status: "plain",
      trackName,
      artistName,
      albumName,
      duration,
      plainLyrics,
      message: "Solo letra sin timestamps en LRCLIB.",
    });
  }

  return emptyResult({
    status: "not_found",
    trackName,
    artistName,
    albumName,
    duration,
    message: "LRCLIB devolvió un registro sin letra utilizable.",
  });
}

function pickBestMatch(
  records: LrclibRecord[],
  duration?: number,
): LrclibRecord | undefined {
  if (records.length === 0) return undefined;

  if (duration !== undefined && Number.isFinite(duration)) {
    const withDuration = records.filter((r) => typeof r.duration === "number");
    const exact = withDuration.find((r) => Math.abs(r.duration! - duration) <= 2);
    if (exact) return exact;

    const closest = [...withDuration].sort(
      (a, b) =>
        Math.abs(a.duration! - duration) - Math.abs(b.duration! - duration),
    )[0];
    if (closest) return closest;
  }

  const withSynced = records.find((r) => (r.syncedLyrics ?? "").trim().length > 0);
  if (withSynced) return withSynced;

  const withPlain = records.find((r) => (r.plainLyrics ?? "").trim().length > 0);
  if (withPlain) return withPlain;

  return records[0];
}

async function fetchLrclib(
  path: string,
  params: Record<string, string>,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(path, LRCLIB_BASE);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      next: { revalidate: 3600 },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchLrclibLyrics(
  artistName: string,
  trackName: string,
  duration?: number,
): Promise<NormalizedLyricsResult> {
  try {
    const params: Record<string, string> = {
      artist_name: artistName,
      track_name: trackName,
    };

    const response = await fetchLrclib("/api/search", params);

    if (!response.ok) {
      return emptyResult({
        status: "error",
        trackName,
        artistName,
        message: `LRCLIB respondió con HTTP ${response.status}.`,
      });
    }

    const records = (await response.json()) as LrclibRecord[];

    if (!Array.isArray(records) || records.length === 0) {
      return emptyResult({
        status: "not_found",
        trackName,
        artistName,
        message: "No se encontró letra en LRCLIB para esta pista.",
      });
    }

    const best = pickBestMatch(records, duration);
    if (!best) {
      return emptyResult({
        status: "not_found",
        trackName,
        artistName,
        message: "No se encontró letra en LRCLIB para esta pista.",
      });
    }

    return normalizeRecord(best, artistName, trackName);
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tiempo de espera agotado al consultar LRCLIB."
        : error instanceof Error
          ? error.message
          : "Error desconocido al consultar LRCLIB.";

    return emptyResult({
      status: "error",
      trackName,
      artistName,
      message,
    });
  }
}
