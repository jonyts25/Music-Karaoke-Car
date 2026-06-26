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

export const MOCK_SONGS: MockSong[] = [
  {
    id: "1",
    title: "Midnight Drive",
    artist: "Equinox Demo",
    duration: 48,
    lyrics: [
      { time: 0, text: "♪ Intro instrumental ♪" },
      { time: 4, text: "Luces de neón en el asfalto" },
      { time: 9, text: "La radio suena, vamos de paso" },
      { time: 14, text: "Ventanas abajo, brisa en la cara" },
      { time: 19, text: "Esta noche no hay prisa por llegar" },
      { time: 24, text: "Cantamos fuerte en el camino" },
      { time: 29, text: "Cada verso es un destino" },
      { time: 34, text: "El coro sube, manos al cielo" },
      { time: 39, text: "Karaoke en movimiento, puro anhelo" },
      { time: 44, text: "♪ Outro ♪" },
    ],
  },
  {
    id: "2",
    title: "Highway Echo",
    artist: "Spike Band",
    duration: 36,
    lyrics: [
      { time: 0, text: "♪ Comienza el viaje ♪" },
      { time: 5, text: "Eco en la carretera" },
      { time: 10, text: "Una voz que no se frena" },
      { time: 15, text: "Pantalla grande, letra clara" },
      { time: 20, text: "Automotive y sin demora" },
      { time: 25, text: "Siguiente estrofa, sin pausa" },
      { time: 30, text: "Fin del demo, aplauso en casa" },
    ],
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
