// Character detail page. Server-rendered with parallel data fetches —
// after the slug resolves to an ID, every sub-resource fans out at once.
//
// Layout: portrait + identity column on the left at desktop, panels stack
// to the right. Single column on mobile.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  OpsApiError,
} from "@/lib/api";
import {
  getCharacterBySlug,
  getCharacterCrafting,
  getCharacterDeaths,
  getCharacterLevels,
  getCharacterRecipes,
  getCharacterXpHistory,
  portraitUrl,
} from "@/lib/characters";
import { formatDate, formatXp, plural } from "@/lib/format";

import { AbilitiesBlock } from "./_components/abilities-block";
import { ChipList } from "./_components/chip-list";
import { CraftingTable } from "./_components/crafting-table";
import { DeathsTable } from "./_components/deaths-table";
import { LevelProgression } from "./_components/level-progression";
import { RecipesTable } from "./_components/recipes-table";
import { Section } from "./_components/section";
import { XpChart } from "./_components/xp-chart";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const detail = await getCharacterBySlug(slug);
    const c = detail.character;
    const name = c.full_name ?? c.charname;
    return {
      title: `${name} (${c.display_playername ?? c.playername})`,
      description: `${name} — ${c.race_name ?? "unknown race"}${
        c.subrace ? ` (${c.subrace})` : ""
      }, level ${c.total_level ?? "?"}.`,
    };
  } catch {
    return { title: "Character not found" };
  }
}

export default async function CharacterPage({ params }: PageProps) {
  const { slug } = await params;

  // First fetch resolves the slug → character row. Other sub-resources need
  // the integer id, so we do them in a second parallel batch. With the cache
  // hot (revalidate: 300) the slug → detail is a no-op on subsequent visits.
  let detail;
  try {
    detail = await getCharacterBySlug(slug);
  } catch (err) {
    if (err instanceof OpsApiError && err.status === 404) notFound();
    throw err;
  }
  const character = detail.character;
  const id = character.id;

  // Fan out everything else. Errors on individual sub-resources shouldn't
  // tank the whole page — settle and degrade gracefully.
  const [levelsRes, craftingRes, deathsRes, xpRes, recipesRes] =
    await Promise.allSettled([
      getCharacterLevels(id),
      getCharacterCrafting(id),
      getCharacterDeaths(id, 50),
      getCharacterXpHistory(id, 2000),
      getCharacterRecipes(id, 25),
    ]);

  const levels = levelsRes.status === "fulfilled" ? levelsRes.value.levels : [];
  const trades = craftingRes.status === "fulfilled" ? craftingRes.value.trades : [];
  const deaths = deathsRes.status === "fulfilled" ? deathsRes.value.deaths : [];
  const xpSamples = xpRes.status === "fulfilled" ? xpRes.value.samples : [];
  const recipes =
    recipesRes.status === "fulfilled"
      ? recipesRes.value
      : { recipes: [], totals: { attempts: 0, successes: 0 } };

  const heroName = character.full_name ?? character.charname;
  const heroPlayer = character.display_playername ?? character.playername;
  const raceLine = [
    character.race_name,
    character.subrace,
    character.gender,
  ]
    .filter((v) => v && v.trim())
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs slug={slug} name={heroName} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={portraitUrl(character.portrait_resref, 384)}
            alt={`Portrait of ${heroName}`}
            width={280}
            height={448}
            decoding="async"
            className="aspect-[5/8] w-full rounded-2xl border border-forge-border object-cover shadow-lg"
          />
          <div className="space-y-2 rounded-xl border border-forge-border bg-forge-surface/60 px-4 py-4 text-sm">
            <KvRow label="Player" value={heroPlayer} accent />
            <KvRow label="Race" value={raceLine || "—"} />
            <KvRow label="Alignment" value={character.alignment ?? "—"} />
            <KvRow label="Deity" value={character.deity ?? "—"} />
            {character.age != null && (
              <KvRow label="Age" value={`${character.age}`} />
            )}
            <KvRow
              label="Total level"
              value={character.total_level != null ? `L${character.total_level}` : "—"}
            />
            <KvRow label="Experience" value={formatXp(character.experience)} />
            {character.hp_max != null && (
              <KvRow
                label="Hit points"
                value={`${character.hp_current ?? "—"} / ${character.hp_max}`}
              />
            )}
            <KvRow
              label="Last seen"
              value={formatDate(character.bic_mtime)}
              dim
            />
          </div>
        </aside>

        <main className="space-y-6">
          <header>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-forge-text-secondary">
              {character.source === "ee" ? "Active in EE" : "Legacy NWN1 vault"}
            </p>
            <h1 className="font-heading mt-2 text-4xl text-forge-text sm:text-5xl">
              {heroName}
            </h1>
            <p className="mt-1 text-sm text-forge-text-secondary">
              played by{" "}
              <span className="text-forge-accent">{heroPlayer}</span>
            </p>
            {detail.classes.length > 0 && (
              <p className="mt-3 text-sm text-forge-text">
                {detail.classes
                  .map((c) => `${c.class_name} ${c.level}`)
                  .join(" / ")}
              </p>
            )}
          </header>

          {character.description && (
            <Section title="Description">
              <DescriptionBody text={character.description} />
            </Section>
          )}

          <Section title="Ability scores">
            <AbilitiesBlock abilities={detail.abilities} />
          </Section>

          {levels.length > 0 && (
            <Section
              title="Level progression"
              subtitle={`${plural(levels.length, "level")} captured from the .bic.`}
            >
              <LevelProgression levels={levels} />
            </Section>
          )}

          {detail.feats.length > 0 && (
            <Section
              title="Feats"
              subtitle={`${detail.feats.length.toLocaleString()} learned.`}
            >
              <ChipList
                items={detail.feats.map((f) => ({
                  id: f.feat_id,
                  label: f.feat_name,
                }))}
              />
            </Section>
          )}

          {detail.skills.length > 0 && (
            <Section
              title="Skills"
              subtitle="Ranks invested at character creation + level-ups."
            >
              <ChipList
                items={detail.skills.map((s) => ({
                  id: s.skill_id,
                  label: s.skill_name,
                  right: `+${s.ranks}`,
                }))}
              />
            </Section>
          )}

          {trades.length > 0 && (
            <Section
              title="Crafting skills"
              subtitle="CNR tradeskill XP from the live game database."
            >
              <CraftingTable trades={trades} />
            </Section>
          )}

          {xpSamples.length > 1 && (
            <Section title="Experience over time">
              <XpChart samples={xpSamples} />
            </Section>
          )}

          {recipes.recipes.length > 0 && (
            <Section title="Top crafted recipes">
              <RecipesTable recipes={recipes.recipes} totals={recipes.totals} />
            </Section>
          )}

          {deaths.length > 0 && (
            <Section
              title="Recent deaths"
              subtitle={`Last ${deaths.length} on record.`}
            >
              <DeathsTable deaths={deaths} />
            </Section>
          )}
        </main>
      </div>
    </div>
  );
}

function Breadcrumbs({ slug, name }: { slug: string; name: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-forge-text-secondary">
      <ol className="flex flex-wrap items-center gap-1.5 font-mono uppercase tracking-wider">
        <li>
          <Link href="/" className="transition hover:text-forge-text">
            Lore
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link href="/characters" className="transition hover:text-forge-text">
            Characters
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li className="truncate text-forge-text" title={slug}>
          {name}
        </li>
      </ol>
    </nav>
  );
}

function KvRow({
  label,
  value,
  accent,
  dim,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  dim?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-forge-text-secondary">
        {label}
      </span>
      <span
        className={
          accent
            ? "text-right text-sm text-forge-accent"
            : dim
              ? "text-right text-xs text-forge-text-secondary"
              : "text-right text-sm text-forge-text"
        }
      >
        {value}
      </span>
    </div>
  );
}

function DescriptionBody({ text }: { text: string }) {
  // Lean paragraph splitter — NWN descriptions vary wildly. We keep
  // double-newlines as paragraph breaks and treat singles as soft breaks.
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) {
    return (
      <p className="text-sm text-forge-text-secondary">
        (No description recorded.)
      </p>
    );
  }
  return (
    <div className="space-y-3 text-sm leading-relaxed text-forge-text/90">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {p}
        </p>
      ))}
    </div>
  );
}
