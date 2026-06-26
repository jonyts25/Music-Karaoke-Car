export type LyricsSearchStatus =
  | "synced"
  | "plain"
  | "instrumental"
  | "not_found"
  | "error";

export type SyncedLyricLine = {
  time: number;
  text: string;
};

export type NormalizedLyricsResult = {
  status: LyricsSearchStatus;
  source: "lrclib";
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLines: SyncedLyricLine[];
  plainLyrics: string;
  message: string;
};
