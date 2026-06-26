import type { SyncedLyricLine } from "./types";

const METADATA_TAG =
  /^\[(?:ar|ti|al|by|offset|tool|re|ve|lang|length|au):[^\]]*\]$/i;

const TIMESTAMP = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

function parseTimestamp(
  minutes: string,
  seconds: string,
  fraction?: string,
): number {
  const mins = Number.parseInt(minutes, 10);
  const secs = Number.parseInt(seconds, 10);
  let fractional = 0;

  if (fraction) {
    if (fraction.length <= 2) {
      fractional = Number.parseInt(fraction.padEnd(2, "0"), 10) / 100;
    } else {
      fractional = Number.parseInt(fraction.padEnd(3, "0").slice(0, 3), 10) / 1000;
    }
  }

  return mins * 60 + secs + fractional;
}

export function parseLrc(lrc: string): SyncedLyricLine[] {
  const lines: SyncedLyricLine[] = [];

  for (const rawLine of lrc.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (METADATA_TAG.test(line)) continue;

    const timestamps: number[] = [];
    let match: RegExpExecArray | null;

    TIMESTAMP.lastIndex = 0;
    while ((match = TIMESTAMP.exec(line)) !== null) {
      timestamps.push(parseTimestamp(match[1], match[2], match[3]));
    }

    if (timestamps.length === 0) continue;

    const text = line.replace(TIMESTAMP, "").trim();
    if (!text) continue;

    for (const time of timestamps) {
      lines.push({ time, text });
    }
  }

  lines.sort((a, b) => a.time - b.time || a.text.localeCompare(b.text));

  return lines;
}
