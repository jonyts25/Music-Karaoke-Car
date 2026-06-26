import type { MusicSearchResult } from "./types";

const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_LIMIT = 10;

type ItunesRawResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  trackTimeMillis?: number;
  artworkUrl100?: string;
  previewUrl?: string;
  trackViewUrl?: string;
};

type ItunesSearchResponse = {
  resultCount: number;
  results: ItunesRawResult[];
};

function normalizeItunesResult(raw: ItunesRawResult): MusicSearchResult {
  const duration =
    typeof raw.trackTimeMillis === "number" && raw.trackTimeMillis > 0
      ? Math.round(raw.trackTimeMillis / 1000)
      : undefined;

  return {
    id: String(raw.trackId),
    provider: "itunes-preview",
    title: raw.trackName,
    artist: raw.artistName,
    album: raw.collectionName,
    duration,
    artworkUrl: raw.artworkUrl100,
    previewUrl: raw.previewUrl,
    sourceUrl: raw.trackViewUrl,
    raw,
  };
}

async function fetchItunes(
  term: string,
  country: string,
  signal: AbortSignal,
): Promise<ItunesSearchResponse> {
  const params = new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    limit: String(DEFAULT_LIMIT),
    country,
  });

  const response = await fetch(`${ITUNES_SEARCH_URL}?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`iTunes respondió ${response.status}`);
  }

  return (await response.json()) as ItunesSearchResponse;
}

function playableResults(rawResults: ItunesRawResult[]): MusicSearchResult[] {
  return rawResults
    .filter((item) => Boolean(item.previewUrl?.trim()))
    .map(normalizeItunesResult);
}

export async function searchItunesPreview(
  term: string,
  country = "MX",
): Promise<{ results: MusicSearchResult[]; message?: string }> {
  const query = term.trim();
  if (!query) {
    return { results: [], message: "Query vacía." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const primary = await fetchItunes(query, country, controller.signal);
    let results = playableResults(primary.results);

    if (results.length === 0 && country.toUpperCase() !== "US") {
      const fallback = await fetchItunes(query, "US", controller.signal);
      results = playableResults(fallback.results);
    }

    return { results };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { results: [], message: "Tiempo de espera agotado al buscar en iTunes." };
    }

    const message =
      error instanceof Error ? error.message : "Error desconocido al buscar en iTunes.";
    return { results: [], message };
  } finally {
    clearTimeout(timeout);
  }
}
