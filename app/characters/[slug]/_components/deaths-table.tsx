// Recent deaths with timestamps + killer + level.

import type { Death } from "@/lib/characters";

export function DeathsTable({ deaths }: { deaths: Death[] }) {
  if (!deaths.length) {
    return (
      <p className="text-sm text-forge-text-secondary">No recorded deaths.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="font-mono text-[10px] uppercase tracking-wider text-forge-text-secondary">
            <th className="px-2 py-2 text-left font-normal">When</th>
            <th className="px-2 py-2 text-right font-normal">Lvl</th>
            <th className="px-2 py-2 text-left font-normal">Killer</th>
          </tr>
        </thead>
        <tbody>
          {deaths.map((d, i) => (
            <tr
              key={`${d.timestamp}-${i}`}
              className="border-t border-forge-border/40"
            >
              <td className="px-2 py-1.5 font-mono text-xs text-forge-text-secondary">
                {new Date(d.timestamp).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-forge-accent">
                {d.level ?? "—"}
              </td>
              <td className="px-2 py-1.5 text-forge-text">
                {d.killername ?? <span className="text-forge-text-secondary/60">unknown</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
