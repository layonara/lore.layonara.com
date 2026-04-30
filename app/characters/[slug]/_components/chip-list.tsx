// Wrapped pills for feat / skill / similar lists. Server component.

export function ChipList({
  items,
  empty = "None recorded.",
  rightOf,
}: {
  items: Array<{ id: number; label: string; right?: string | null }>;
  empty?: string;
  rightOf?: (item: { id: number; label: string }) => string | null;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-forge-text-secondary">{empty}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => {
        const right = it.right ?? rightOf?.(it);
        return (
          <li
            key={it.id}
            className="inline-flex items-baseline gap-1.5 rounded-md border border-forge-border bg-forge-bg/40 px-2.5 py-1 text-sm text-forge-text"
          >
            <span>{it.label}</span>
            {right && <span className="font-mono text-xs text-forge-accent">{right}</span>}
          </li>
        );
      })}
    </ul>
  );
}
