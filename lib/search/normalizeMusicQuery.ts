const INTENT_WORDS = new Set([
  "pon",
  "reproduce",
  "busca",
  "buscar",
  "quiero",
  "escuchar",
  "cancion",
  "canción",
  "musica",
  "música",
  "de",
  "por",
]);

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

export function normalizeMusicQuery(raw: string): string {
  const lower = stripAccents(raw.toLowerCase());
  const cleaned = lower.replace(/[^\p{L}\p{N}\s]/gu, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((token) => !INTENT_WORDS.has(token));
  return filtered.join(" ").trim();
}

export function normalizeForMatch(value: string): string {
  return stripAccents(value.toLowerCase()).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
