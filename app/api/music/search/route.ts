import { searchItunesPreview } from "@/lib/music/itunes";
import type { MusicSearchResponse } from "@/lib/music/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const country = request.nextUrl.searchParams.get("country")?.trim() || "MX";

  if (!q) {
    const payload: MusicSearchResponse = {
      status: "error",
      provider: "itunes-preview",
      results: [],
      message: "Parámetro requerido: q.",
    };
    return NextResponse.json(payload, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { results, message } = await searchItunesPreview(q, country);

  if (message && results.length === 0) {
    const payload: MusicSearchResponse = {
      status: "error",
      provider: "itunes-preview",
      results: [],
      message,
    };
    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  }

  const payload: MusicSearchResponse = {
    status: "ok",
    provider: "itunes-preview",
    results,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
