import { searchLrclibLyrics } from "@/lib/lyrics/lrclib";
import type { NormalizedLyricsResult } from "@/lib/lyrics/types";
import { NextRequest, NextResponse } from "next/server";

function errorPayload(message: string): NormalizedLyricsResult {
  return {
    status: "error",
    source: "lrclib",
    trackName: "",
    artistName: "",
    syncedLines: [],
    plainLyrics: "",
    message,
  };
}

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get("artist")?.trim() ?? "";
  const track = request.nextUrl.searchParams.get("track")?.trim() ?? "";
  const durationRaw = request.nextUrl.searchParams.get("duration")?.trim();

  if (!artist || !track) {
    return NextResponse.json(
      errorPayload("Parámetros requeridos: artist y track."),
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  let duration: number | undefined;
  if (durationRaw) {
    const parsed = Number.parseInt(durationRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return NextResponse.json(
        errorPayload("duration debe ser un entero positivo en segundos."),
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    duration = parsed;
  }

  const result = await searchLrclibLyrics(artist, track, duration);

  return NextResponse.json(result, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
