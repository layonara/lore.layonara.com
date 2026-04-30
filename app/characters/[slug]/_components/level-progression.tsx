// Per-level progression. JSON columns for feats/skills picked are decoded
// at the boundary in lib/characters.ts, so we just render arrays here.

import type { LevelEntry } from "@/lib/characters";

interface FeatPick {
  id: number;
  name: string;
}
interface SkillPick {
  id: number;
  name: string;
  ranks: number;
}

function asFeats(picked: unknown): FeatPick[] {
  if (!Array.isArray(picked)) return [];
  return picked.filter(
    (x): x is FeatPick => typeof x === "object" && x !== null && "name" in x,
  );
}
function asSkills(picked: unknown): SkillPick[] {
  if (!Array.isArray(picked)) return [];
  return picked.filter(
    (x): x is SkillPick =>
      typeof x === "object" && x !== null && "name" in x && "ranks" in x,
  );
}

export function LevelProgression({ levels }: { levels: LevelEntry[] }) {
  if (!levels.length) {
    return (
      <p className="text-sm text-forge-text-secondary">
        No per-level data captured for this character.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr className="font-mono text-[10px] uppercase tracking-wider text-forge-text-secondary">
            <th className="px-2 py-1 text-left font-normal">Lvl</th>
            <th className="px-2 py-1 text-left font-normal">Class</th>
            <th className="px-2 py-1 text-right font-normal">HP</th>
            <th className="px-2 py-1 text-left font-normal">Ability+</th>
            <th className="px-2 py-1 text-left font-normal">Feats picked</th>
            <th className="px-2 py-1 text-left font-normal">Skills picked</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((row) => {
            const feats = asFeats(row.feats_picked);
            const skills = asSkills(row.skills_picked);
            return (
              <tr key={row.level} className="rounded-lg bg-forge-bg/40">
                <td className="rounded-l-lg px-2 py-2 font-mono text-forge-accent">
                  {row.level}
                </td>
                <td className="px-2 py-2 text-forge-text">{row.class_name}</td>
                <td className="px-2 py-2 text-right font-mono text-forge-text-secondary">
                  +{row.hp_gained}
                </td>
                <td className="px-2 py-2 text-forge-text-secondary">
                  {row.ability_increase ?? "—"}
                </td>
                <td className="px-2 py-2">
                  {feats.length === 0 ? (
                    <span className="text-forge-text-secondary/60">—</span>
                  ) : (
                    <ul className="flex flex-wrap gap-1">
                      {feats.map((f) => (
                        <li
                          key={f.id}
                          className="rounded-md bg-forge-surface px-2 py-0.5 text-xs text-forge-text"
                        >
                          {f.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="rounded-r-lg px-2 py-2">
                  {skills.length === 0 ? (
                    <span className="text-forge-text-secondary/60">—</span>
                  ) : (
                    <ul className="flex flex-wrap gap-1">
                      {skills.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-md bg-forge-surface px-2 py-0.5 text-xs text-forge-text"
                        >
                          {s.name} <span className="text-forge-accent">+{s.ranks}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
