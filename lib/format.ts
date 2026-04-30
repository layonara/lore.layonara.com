// Small server-safe formatters used by the character pages. Pure functions
// only; no React, no DOM.

const ABIL_NAMES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;

export function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export const ABILITY_NAMES = ABIL_NAMES;

// ISO timestamp -> "Apr 30, 2026" / "today" / "yesterday".
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// XP -> "1.2M" / "245k" / "850".
export function formatXp(xp: number | null | undefined): string {
  if (xp == null) return "—";
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(2)}M`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}k`;
  return String(xp);
}

export function plural(n: number, one: string, many?: string): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many ?? `${one}s`}`;
}

// Conservative line-break + paragraph normaliser for character descriptions.
// Players write descriptions with mixed CRLF, double-newlines for paragraphs,
// and inline single newlines. Render double-newlines as paragraph breaks and
// single newlines as soft <br>s; the page-level CSS handles the spacing.
export function paragraphs(text: string | null | undefined): string[][] {
  if (!text) return [];
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((para) => para.split("\n").map((line) => line.trim()).filter(Boolean));
}
