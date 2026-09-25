import { MAX_NOTE_LENGTH } from "@/lib/myDataModel";

const namedEntities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntity(match: string, body: string): string {
  const named = namedEntities[body.toLowerCase()];
  if (named !== undefined) return named;
  const isHex = body.startsWith("#x") || body.startsWith("#X");
  const isNumeric = body.startsWith("#");
  if (!isNumeric) return match;
  const codePoint = Number.parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
  return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : match;
}

// Imported notes are plain text: markup is removed and escaped characters are restored.
export function cleanNote(raw: string | null | undefined): { text?: string; truncated: boolean } {
  if (!raw) return { truncated: false };
  const stripped = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
  const decoded = stripped.replace(/&(#?[a-z0-9]+);/gi, decodeEntity).trim();
  if (!decoded) return { truncated: false };
  const characters = [...decoded.slice(0, MAX_NOTE_LENGTH * 2)];
  const truncated = characters.length > MAX_NOTE_LENGTH || decoded.length > MAX_NOTE_LENGTH * 2;
  return { text: characters.slice(0, MAX_NOTE_LENGTH).join(""), truncated };
}
