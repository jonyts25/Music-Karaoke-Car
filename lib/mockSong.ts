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
  album?: string;
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
    album: "After Hours",
    duration: 200,
    lyrics: mockFallback("♪ Blinding Lights (mock) ♪"),
  },
  {
    id: "coldplay-yellow",
    title: "Yellow",
    artist: "Coldplay",
    album: "Parachutes",
    duration: 266,
    lyrics: mockFallback("♪ Yellow (mock) ♪"),
  },
  {
    id: "daft-punk-get-lucky",
    title: "Get Lucky",
    artist: "Daft Punk",
    album: "Random Access Memories",
    duration: 248,
    lyrics: mockFallback("♪ Get Lucky (mock) ♪"),
  },
  {
    id: "oasis-wonderwall",
    title: "Wonderwall",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    duration: 258,
    lyrics: mockFallback("♪ Wonderwall (mock) ♪"),
  },
  {
    id: "soda-stereo-de-musica-ligera",
    title: "De Música Ligera",
    artist: "Soda Stereo",
    album: "Canción Animal",
    duration: 215,
    lyrics: mockFallback("♪ De Música Ligera (mock) ♪"),
  },
  {
    id: "zoe-labios-rotos",
    title: "Labios Rotos",
    artist: "Zoé",
    album: "Reptilectric",
    duration: 272,
    lyrics: mockFallback("♪ Labios Rotos (mock) ♪"),
  },
  {
    id: "luis-miguel-ahora-te-puedes-marchar",
    title: "Ahora Te Puedes Marchar",
    artist: "Luis Miguel",
    album: "Soy Como Quiero Ser",
    duration: 243,
    lyrics: mockFallback("♪ Ahora Te Puedes Marchar (mock) ♪"),
  },
  {
    id: "natalia-lafourcade-hasta-la-raiz",
    title: "Hasta la Raíz",
    artist: "Natalia Lafourcade",
    album: "Hasta la Raíz",
    duration: 228,
    lyrics: mockFallback("♪ Hasta la Raíz (mock) ♪"),
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

export function findSongIndexById(id: string): number {
  return MOCK_SONGS.findIndex((song) => song.id === id);
}
