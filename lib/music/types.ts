export type MusicProvider = "mock" | "itunes-preview";

export type MusicSearchResult = {
  id: string;
  provider: MusicProvider;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  artworkUrl?: string;
  previewUrl?: string;
  sourceUrl?: string;
  raw?: unknown;
};

export type MusicSearchResponse = {
  status: "ok" | "error";
  provider: "itunes-preview";
  results: MusicSearchResult[];
  message?: string;
};
