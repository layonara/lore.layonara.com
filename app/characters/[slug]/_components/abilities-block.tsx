// Six-stat block. Server component — pure rendering of a row of cards.

import type { Abilities } from "@/lib/characters";
import { ABILITY_NAMES, abilityModifier } from "@/lib/format";

export function AbilitiesBlock({ abilities }: { abilities: Abilities }) {
  if (!abilities) {
    return (
      <p className="text-sm text-forge-text-secondary">
        Ability scores unavailable for this character.
      </p>
    );
  }
  const scores = [
    abilities.str_base,
    abilities.dex_base,
    abilities.con_base,
    abilities.int_base,
    abilities.wis_base,
    abilities.cha_base,
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {ABILITY_NAMES.map((name, i) => (
        <div
          key={name}
          className="rounded-lg border border-forge-border bg-forge-surface/60 px-3 py-3 text-center"
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-forge-text-secondary">
            {name}
          </div>
          <div className="font-heading mt-1 text-2xl text-forge-text">{scores[i]}</div>
          <div className="text-xs text-forge-accent/90">{abilityModifier(scores[i])}</div>
        </div>
      ))}
    </div>
  );
}
