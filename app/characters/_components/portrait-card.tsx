// Server-rendered portrait card for the browse grid. Stays a server
// component so we don't ship hydrated nodes for what's essentially a
// styled <a><img>.

import Link from "next/link";

import { portraitUrl, type CharacterListItem } from "@/lib/characters";

export function PortraitCard({ character }: { character: CharacterListItem }) {
  if (!character.slug) return null; // Defensive: backfill should leave none null
  return (
    <Link
      href={`/characters/${character.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-forge-border bg-forge-surface/60 transition hover:border-forge-accent/60 hover:bg-forge-surface focus-visible:border-forge-accent focus-visible:outline-none"
    >
      <div className="relative aspect-[16/25] w-full overflow-hidden bg-forge-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portraitUrl(character.portrait_resref, 192)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {character.level != null && (
          <span className="absolute right-2 top-2 rounded-md bg-forge-bg/85 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-forge-accent backdrop-blur-sm">
            L{character.level}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-3">
        <div className="font-heading line-clamp-1 text-sm text-forge-text">
          {character.full_name}
        </div>
        <div className="line-clamp-1 text-xs text-forge-text-secondary">
          <span className="text-forge-accent/85">{character.playername}</span>
          {character.race ? ` · ${character.race}` : ""}
        </div>
      </div>
    </Link>
  );
}
