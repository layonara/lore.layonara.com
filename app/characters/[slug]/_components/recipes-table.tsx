// Top crafted recipes with attempts + success rate.

import type { Recipe } from "@/lib/characters";

export function RecipesTable({
  recipes,
  totals,
}: {
  recipes: Recipe[];
  totals: { attempts: number; successes: number };
}) {
  if (!recipes.length) {
    return (
      <p className="text-sm text-forge-text-secondary">
        No crafting attempts logged.
      </p>
    );
  }
  const overallRate = totals.attempts === 0 ? 0 : totals.successes / totals.attempts;
  return (
    <div>
      <p className="mb-3 text-xs text-forge-text-secondary">
        {totals.attempts.toLocaleString()} total attempts ·{" "}
        <span className="text-forge-accent">{totals.successes.toLocaleString()}</span>{" "}
        successes ({(overallRate * 100).toFixed(1)}% overall)
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-wider text-forge-text-secondary">
              <th className="px-2 py-2 text-left font-normal">Recipe</th>
              <th className="px-2 py-2 text-right font-normal">Attempts</th>
              <th className="px-2 py-2 text-right font-normal">Success</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => {
              const rate = r.attempts === 0 ? 0 : r.successes / r.attempts;
              return (
                <tr key={r.recipe_id} className="border-t border-forge-border/40">
                  <td className="px-2 py-1.5 text-forge-text">{r.description}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-forge-text-secondary">
                    {r.attempts.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono">
                    <span
                      className={
                        rate >= 0.9
                          ? "text-forge-accent"
                          : rate >= 0.6
                            ? "text-forge-text"
                            : "text-forge-text-secondary"
                      }
                    >
                      {(rate * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
