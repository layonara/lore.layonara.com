// Tradeskill grid with progress bars to the next level. Server component.

import type { Trade } from "@/lib/characters";
import { formatXp } from "@/lib/format";

export function CraftingTable({ trades }: { trades: Trade[] }) {
  if (!trades.length) {
    return (
      <p className="text-sm text-forge-text-secondary">
        No tradeskill XP recorded — this character hasn&apos;t crafted yet.
      </p>
    );
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {trades.map((t) => {
        // Progress: how far between the current level threshold and the next.
        // We don't have the lower bound on the wire, but xp / next is a fine
        // approximation that always reads as "approaching next level".
        const ratio = t.next_level_xp ? Math.min(t.xp / t.next_level_xp, 1) : 1;
        return (
          <li
            key={t.trade_id}
            className="rounded-lg border border-forge-border bg-forge-bg/40 px-4 py-3"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-sm text-forge-text">{t.name}</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-forge-accent">
                L{t.level}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forge-bg">
              <div
                className="h-full bg-forge-accent/70"
                style={{ width: `${(ratio * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between text-[11px] text-forge-text-secondary">
              <span>{formatXp(t.xp)} XP</span>
              {t.next_level_xp ? (
                <span>next {formatXp(t.next_level_xp)}</span>
              ) : (
                <span className="text-forge-accent/80">at cap</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
