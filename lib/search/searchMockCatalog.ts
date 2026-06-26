import { MOCK_SONGS, type MockSong } from "@/lib/mockSong";
import { normalizeForMatch, normalizeMusicQuery } from "./normalizeMusicQuery";

export type CatalogSearchResult = {
  song: MockSong;
  score: number;
};

const AUTO_SELECT_MIN_SCORE = 8;
const AUTO_SELECT_GAP = 3;

function scoreSong(query: string, song: MockSong): number {
  if (!query) return 0;

  const title = normalizeForMatch(song.title);
  const artist = normalizeForMatch(song.artist);
  const combinedA = `${title} ${artist}`;
  const combinedB = `${artist} ${title}`;

  if (title === query || artist === query || combinedA === query || combinedB === query) {
    return 20;
  }

  let score = 0;

  if (title.includes(query)) score += 10;
  if (artist.includes(query)) score += 10;
  if (combinedA.includes(query) || combinedB.includes(query)) score += 8;

  const queryTokens = query.split(" ").filter(Boolean);
  if (queryTokens.length === 0) return score;

  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (title.includes(token)) score += 3;
    if (artist.includes(token)) score += 3;
  }

  return score;
}

export function searchMockCatalog(
  rawQuery: string,
  songs: MockSong[] = MOCK_SONGS,
): CatalogSearchResult[] {
  const query = normalizeMusicQuery(rawQuery);
  if (!query) return [];

  return songs
    .map((song) => ({ song, score: scoreSong(query, song) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title));
}

export function pickAutoSelectResult(
  results: CatalogSearchResult[],
): CatalogSearchResult | null {
  if (results.length === 0) return null;

  const [top, second] = results;
  if (top.score < AUTO_SELECT_MIN_SCORE) return null;

  if (!second || top.score - second.score >= AUTO_SELECT_GAP) {
    return top;
  }

  return null;
}
