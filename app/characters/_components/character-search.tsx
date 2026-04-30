"use client";

// Headless combobox using react-aria-style hook patterns built on plain
// state + listbox markup. Avoids pulling in cmdk/@radix yet — the rest of
// the site doesn't need them for Phase 1B and we keep the JS budget tight.

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/cn";
import { portraitUrl } from "@/lib/characters";

interface SearchHit {
  slug: string | null;
  playername: string;
  full_name: string;
  race: string;
  level: number | null;
  portrait_resref: string | null;
}

interface SearchResponse {
  items: SearchHit[];
}

const DEBOUNCE_MS = 150;

export function CharacterSearch() {
  const router = useRouter();
  const inputId = useId();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Debounced fetch. Aborts in-flight on each keystroke so late responses
  // never overwrite a fresher result set.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const ctrl = new AbortController();
      const url = `/api/characters/search?q=${encodeURIComponent(query)}&limit=12`;
      setLoading(true);
      fetch(url, { signal: ctrl.signal })
        .then((r) => (r.ok ? (r.json() as Promise<SearchResponse>) : { items: [] }))
        .then((data) => {
          setHits(data.items.filter((h) => h.slug));
          setActiveIdx(0);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string })?.name !== "AbortError") {
            setHits([]);
          }
        })
        .finally(() => setLoading(false));
      return () => ctrl.abort();
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  // Click-outside closes the popover.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const navigateTo = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/characters/${slug}`);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const hit = hits[activeIdx];
      if (hit?.slug) {
        e.preventDefault();
        navigateTo(hit.slug);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPopover = open && (loading || hits.length > 0 || query.length > 0);
  const announce = useMemo(() => {
    if (loading) return "Searching…";
    if (hits.length === 0 && query.length > 0) return "No matches.";
    if (hits.length > 0) return `${hits.length} suggestion${hits.length === 1 ? "" : "s"}.`;
    return "";
  }, [loading, hits.length, query.length]);

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Search characters by player or name
      </label>
      <div className="relative">
        {/* Magnifier glyph — drawn inline so we don't pull in lucide just for one icon. */}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-forge-text-secondary"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m17 17-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search by player or character name…"
          autoComplete="off"
          spellCheck={false}
          // ARIA 1.2 combobox pattern: role goes on the input, not the wrapper.
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showPopover}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            showPopover && hits[activeIdx]?.slug
              ? `${listboxId}-${hits[activeIdx].slug}`
              : undefined
          }
          className={cn(
            "w-full rounded-2xl border border-forge-border bg-forge-surface/80",
            "px-12 py-4 text-base text-forge-text placeholder:text-forge-text-secondary",
            "shadow-sm backdrop-blur-sm transition",
            "focus:border-forge-accent focus:outline-none focus:ring-2 focus:ring-forge-accent/30",
          )}
        />
        {loading && (
          <span className="pointer-events-none absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-forge-accent/80" />
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>

      {showPopover && (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute left-0 right-0 z-20 mt-2 max-h-[28rem] overflow-y-auto",
            "rounded-2xl border border-forge-border bg-forge-surface/95",
            "shadow-xl backdrop-blur-md",
          )}
        >
          {loading && hits.length === 0 && (
            <li className="px-5 py-4 text-sm text-forge-text-secondary">Searching…</li>
          )}
          {!loading && hits.length === 0 && query.length > 0 && (
            <li className="px-5 py-4 text-sm text-forge-text-secondary">
              No characters match &ldquo;{query}&rdquo;.
            </li>
          )}
          {hits.map((hit, idx) => (
            <li
              key={hit.slug ?? idx}
              id={hit.slug ? `${listboxId}-${hit.slug}` : undefined}
              role="option"
              aria-selected={idx === activeIdx}
            >
              {hit.slug && (
                <Link
                  href={`/characters/${hit.slug}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition",
                    idx === activeIdx ? "bg-forge-bg/60" : "hover:bg-forge-bg/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={portraitUrl(hit.portrait_resref, 64)}
                    alt=""
                    width={36}
                    height={72}
                    loading="lazy"
                    decoding="async"
                    className="h-[72px] w-9 flex-shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-heading truncate text-base text-forge-text">
                        {hit.full_name}
                      </span>
                      {hit.level != null && (
                        <span className="font-mono text-[11px] uppercase tracking-wider text-forge-text-secondary">
                          L{hit.level}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-forge-text-secondary">
                      <span className="text-forge-accent/80">{hit.playername}</span>
                      {hit.race ? ` · ${hit.race}` : ""}
                    </div>
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
