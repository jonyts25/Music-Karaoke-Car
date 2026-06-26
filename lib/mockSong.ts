export type LyricLine = {
  time: number;
  text: string;
};

export type MockSong = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  lyrics: LyricLine[];
};

function mockFallback(intro: string): LyricLine[] {
  return [
    { time: 0, text: intro },
    { time: 8, text: "Letra mock de respaldo" },
    { time: 16, text: "Pulsa «Buscar letra real»" },
    { time: 24, text: "para consultar LRCLIB" },
  ];
}

export const MOCK_SONGS: MockSong[] = [
  {
    id: "weeknd-blinding-lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: 200,
    lyrics: mockFallback("♪ Blinding Lights (mock) ♪"),
  },
  {
    id: "coldplay-yellow",
    title: "Yellow",
    artist: "Coldplay",
    duration: 266,
    lyrics: mockFallback("♪ Yellow (mock) ♪"),
  },
  {
    id: "daft-punk-get-lucky",
    title: "Get Lucky",
    artist: "Daft Punk",
    duration: 248,
    lyrics: mockFallback("♪ Get Lucky (mock) ♪"),
  },
  {
    id: "oasis-wonderwall",
    title: "Wonderwall",
    artist: "Oasis",
    duration: 258,
    lyrics: mockFallback("♪ Wonderwall (mock) ♪"),
  },
];

export function formatTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getLyricIndices(
  lyrics: LyricLine[],
  currentTime: number,
): { previous: number; current: number; next: number } {
  if (lyrics.length === 0) {
    return { previous: -1, current: -1, next: -1 };
  }

  let current = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      current = i;
    } else {
      break;
    }
  }

  return {
    previous: current > 0 ? current - 1 : -1,
    current,
    next: current < lyrics.length - 1 ? current + 1 : -1,
  };
}
