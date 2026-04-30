// Server-rendered pagination strip. Builds Link hrefs that preserve the
// current query string so search + pagination compose. Compact at small
// page counts, ellipses at large ones — capped at ~9 visible pages.

import Link from "next/link";

import { cn } from "@/lib/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}

function buildHref(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...searchParams, ...overrides };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v != null && v !== "") qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

function pageWindow(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const out: (number | "…")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);
  if (left > 2) out.push("…");
  for (let i = left; i <= right; i += 1) out.push(i);
  if (right < totalPages - 1) out.push("…");
  out.push(totalPages);
  return out;
}

export function Pagination({ page, totalPages, basePath, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = pageWindow(page, totalPages);
  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm"
    >
      <PageLink
        href={page > 1 ? buildHref(basePath, searchParams, { page: String(page - 1) }) : undefined}
        label="Previous"
      >
        ←
      </PageLink>
      {items.map((it, idx) =>
        it === "…" ? (
          <span
            key={`gap-${idx}`}
            aria-hidden
            className="px-2 text-forge-text-secondary/70"
          >
            …
          </span>
        ) : (
          <PageLink
            key={it}
            href={buildHref(basePath, searchParams, {
              page: it === 1 ? undefined : String(it),
            })}
            isCurrent={it === page}
            label={`Page ${it}`}
          >
            {it}
          </PageLink>
        ),
      )}
      <PageLink
        href={
          page < totalPages
            ? buildHref(basePath, searchParams, { page: String(page + 1) })
            : undefined
        }
        label="Next"
      >
        →
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  isCurrent,
  label,
}: {
  href: string | undefined;
  children: React.ReactNode;
  isCurrent?: boolean;
  label: string;
}) {
  const cls = cn(
    "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border px-3 font-mono text-xs uppercase tracking-wider transition",
    isCurrent
      ? "border-forge-accent bg-forge-accent/10 text-forge-accent"
      : "border-forge-border text-forge-text-secondary hover:border-forge-accent/60 hover:text-forge-text",
    !href && "cursor-not-allowed opacity-40",
  );
  if (!href) {
    return (
      <span aria-disabled className={cls} aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      aria-label={label}
      className={cls}
    >
      {children}
    </Link>
  );
}
