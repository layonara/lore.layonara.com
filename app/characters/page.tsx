// Characters list — autocomplete combobox + paginated portrait grid.
// Server-rendered. The combobox is the only client-island; the rest is
// served as cached HTML so the first-paint cost is just markup + portraits.

import type { Metadata } from "next";

import { listCharacters } from "@/lib/characters";

import { CharacterSearch } from "./_components/character-search";
import { Pagination } from "./_components/pagination";
import { PortraitCard } from "./_components/portrait-card";

const PAGE_SIZE = 60;

export const metadata: Metadata = {
  title: "Characters",
  description:
    "Browse every character in Layonara — past and present, from the legacy NWN1 vault and the live EE server.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: "recent" | "name" | "player" | "level";
  }>;
}

export default async function CharactersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(Number(sp.page ?? 1) || 1, 1);
  const offset = (page - 1) * PAGE_SIZE;
  const q = sp.q?.trim();
  const sort = sp.sort ?? "recent";

  const list = await listCharacters({ q, limit: PAGE_SIZE, offset, sort });
  const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-forge-text-secondary">
          The Lore · Characters
        </p>
        <h1 className="font-heading mt-3 text-4xl font-medium leading-tight text-forge-text sm:text-5xl">
          Every soul on the realm.
        </h1>
        <p className="mt-4 max-w-2xl text-forge-text-secondary">
          {list.total.toLocaleString()} characters indexed across the legacy NWN1
          vault and the live Enhanced Edition server. Search for someone you
          remember, or browse the most recently active.
        </p>
      </header>

      <div className="mb-10">
        <CharacterSearch />
      </div>

      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-xl text-forge-text">
          {q ? (
            <>
              Results for{" "}
              <span className="text-forge-accent">&ldquo;{q}&rdquo;</span>
            </>
          ) : (
            "Recently active"
          )}
        </h2>
        <SortBar current={sort} q={q} />
      </div>

      {list.items.length === 0 ? (
        <div className="rounded-2xl border border-forge-border bg-forge-surface/50 px-6 py-16 text-center">
          <p className="font-heading text-xl text-forge-text">No characters found.</p>
          <p className="mt-2 text-sm text-forge-text-secondary">
            Try a different name, or clear the search to browse everyone.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.items.map((c) => (
            <li key={c.id}>
              <PortraitCard character={c} />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/characters"
        searchParams={{ q, sort: sort === "recent" ? undefined : sort }}
      />
    </div>
  );
}

function SortBar({
  current,
  q,
}: {
  current: "recent" | "name" | "player" | "level";
  q: string | undefined;
}) {
  // Sort options live in URL params so they're shareable + back-button safe.
  // Server-side links keep the choice deterministic on first paint.
  const sorts: Array<{ key: typeof current; label: string }> = [
    { key: "recent", label: "Recent" },
    { key: "name", label: "Name" },
    { key: "player", label: "Player" },
    { key: "level", label: "Level" },
  ];
  const buildHref = (key: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (key !== "recent") params.set("sort", key);
    const s = params.toString();
    return s ? `/characters?${s}` : "/characters";
  };
  return (
    <div className="flex items-center gap-1 rounded-md border border-forge-border bg-forge-surface/60 p-1 text-xs">
      {sorts.map((s) => (
        <a
          key={s.key}
          href={buildHref(s.key)}
          className={
            s.key === current
              ? "rounded-sm bg-forge-accent/15 px-3 py-1 font-mono uppercase tracking-wider text-forge-accent"
              : "rounded-sm px-3 py-1 font-mono uppercase tracking-wider text-forge-text-secondary transition hover:text-forge-text"
          }
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}
