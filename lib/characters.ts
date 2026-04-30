// Server-side typed wrappers around the layo-chars endpoints on ops-api.
// Each call returns a Zod-parsed value so misshapen responses fail loudly
// at the boundary instead of silently breaking deep in a server component.
//
// Caching strategy:
// - List queries: { next: { revalidate: 60 } } — fresh enough for browse,
//   keeps load off ops-api during traffic spikes.
// - Detail queries: { next: { revalidate: 300, tags: ['character:slug'] } }
//   so a character's data is cached per-slug and we can targeted-revalidate
//   when sync runs (future hook).

import { z } from "zod";

import { opsApi } from "./api";

// ──────────────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────────────

export const CharacterListItemSchema = z.object({
  id: z.number().int(),
  slug: z.string().nullable(),
  playername: z.string(),
  full_name: z.string(),
  race: z.string(),
  level: z.number().int().nullable(),
  portrait_resref: z.string().nullable(),
  source: z.enum(["ee", "vault169"]),
});
export type CharacterListItem = z.infer<typeof CharacterListItemSchema>;

export const CharacterListSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
  items: z.array(CharacterListItemSchema),
});
export type CharacterList = z.infer<typeof CharacterListSchema>;

const NumLike = z.union([z.number(), z.string()]).transform((v) =>
  typeof v === "string" ? Number(v) : v,
);

// The detail bundle ships datetimes as ISO strings post-serialization.
export const CharacterCoreSchema = z.object({
  id: z.number().int(),
  slug: z.string().nullable(),
  display_playername: z.string().nullable(),
  playername: z.string(),
  charname: z.string(),
  full_name: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  source: z.enum(["ee", "vault169"]),
  race_id: z.number().int().nullable(),
  race_name: z.string().nullable(),
  subrace: z.string().nullable(),
  gender: z.string().nullable(),
  deity: z.string().nullable(),
  alignment: z.string().nullable(),
  age: z.number().int().nullable(),
  hp_max: z.number().int().nullable(),
  hp_current: z.number().int().nullable(),
  experience: NumLike.nullable(),
  total_level: z.number().int().nullable(),
  portrait_resref: z.string().nullable(),
  description: z.string().nullable(),
  player_tracking_id: z.number().int().nullable(),
  bic_mtime: z.string().nullable(),
});
export type CharacterCore = z.infer<typeof CharacterCoreSchema>;

export const ClassEntrySchema = z.object({
  slot: z.number().int(),
  class_id: z.number().int(),
  class_name: z.string(),
  level: z.number().int(),
});
export type ClassEntry = z.infer<typeof ClassEntrySchema>;

export const AbilitiesSchema = z
  .object({
    str_base: z.number().int(),
    dex_base: z.number().int(),
    con_base: z.number().int(),
    int_base: z.number().int(),
    wis_base: z.number().int(),
    cha_base: z.number().int(),
  })
  .nullable();
export type Abilities = z.infer<typeof AbilitiesSchema>;

export const FeatSchema = z.object({
  feat_id: z.number().int(),
  feat_name: z.string(),
});
export type Feat = z.infer<typeof FeatSchema>;

export const SkillSchema = z.object({
  skill_id: z.number().int(),
  skill_name: z.string(),
  ranks: z.number().int(),
});
export type Skill = z.infer<typeof SkillSchema>;

export const CharacterDetailSchema = z.object({
  character: CharacterCoreSchema,
  classes: z.array(ClassEntrySchema),
  abilities: AbilitiesSchema,
  feats: z.array(FeatSchema),
  skills: z.array(SkillSchema),
});
export type CharacterDetail = z.infer<typeof CharacterDetailSchema>;

// Per-level rows store feats/skills as JSON columns. The api hands them
// back as raw strings (mariadb JSON serialization); we decode on the way
// in so server components can render directly.
const LevelPickedSchema = z
  .union([
    z.string().transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "feats_picked/skills_picked is not valid JSON",
        });
        return [];
      }
    }),
    z.array(z.unknown()),
    z.null(),
  ])
  .nullable();

export const FeatPickedSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
export const SkillPickedSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  ranks: z.number().int(),
});

export const LevelEntrySchema = z.object({
  level: z.number().int(),
  class_id: z.number().int(),
  class_name: z.string(),
  hp_gained: z.number().int(),
  ability_increase: z.string().nullable(),
  feats_picked: LevelPickedSchema,
  skills_picked: LevelPickedSchema,
});
export type LevelEntry = z.infer<typeof LevelEntrySchema>;

export const LevelsResponseSchema = z.object({
  levels: z.array(LevelEntrySchema),
});

export const TradeSchema = z.object({
  trade_id: z.number().int(),
  name: z.string(),
  xp: z.number().int(),
  level: z.number().int(),
  next_level_xp: z.number().int().nullable(),
});
export type Trade = z.infer<typeof TradeSchema>;

export const CraftingResponseSchema = z.object({
  trades: z.array(TradeSchema),
});

export const DeathSchema = z.object({
  timestamp: z.string(),
  killername: z.string().nullable(),
  level: z.number().int().nullable(),
  token: z.number().int().nullable(),
});
export type Death = z.infer<typeof DeathSchema>;

export const DeathsResponseSchema = z.object({
  deaths: z.array(DeathSchema),
});

export const XpSampleSchema = z.object({
  t: z.number().int(),
  xp: z.number().int(),
});
export type XpSample = z.infer<typeof XpSampleSchema>;

export const XpHistoryResponseSchema = z.object({
  samples: z.array(XpSampleSchema),
});

export const RecipeSchema = z.object({
  recipe_id: z.number().int(),
  description: z.string(),
  output_tag: z.string(),
  attempts: z.number().int(),
  successes: z.number().int(),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const RecipesResponseSchema = z.object({
  recipes: z.array(RecipeSchema),
  totals: z.object({
    attempts: z.number().int(),
    successes: z.number().int(),
  }),
});

// ──────────────────────────────────────────────────────────────────────
// Calls
// ──────────────────────────────────────────────────────────────────────

export interface ListParams {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "recent" | "name" | "player" | "level";
}

export async function listCharacters(params: ListParams = {}): Promise<CharacterList> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  if (params.sort) search.set("sort", params.sort);
  const qs = search.toString();
  const data = await opsApi<unknown>(
    `/api/v1/character/list${qs ? `?${qs}` : ""}`,
    { next: { revalidate: 60, tags: ["character-list"] } },
  );
  return CharacterListSchema.parse(data);
}

export async function getCharacterBySlug(slug: string): Promise<CharacterDetail> {
  const data = await opsApi<unknown>(`/api/v1/character/by-slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: 300, tags: [`character:${slug}`] },
  });
  return CharacterDetailSchema.parse(data);
}

export async function getCharacterById(id: number): Promise<CharacterDetail> {
  const data = await opsApi<unknown>(`/api/v1/character/${id}`, {
    next: { revalidate: 300 },
  });
  return CharacterDetailSchema.parse(data);
}

export async function getCharacterLevels(id: number) {
  const data = await opsApi<unknown>(`/api/v1/character/${id}/levels`, {
    next: { revalidate: 300 },
  });
  return LevelsResponseSchema.parse(data);
}

export async function getCharacterCrafting(id: number) {
  const data = await opsApi<unknown>(`/api/v1/character/${id}/crafting`, {
    next: { revalidate: 120 },
  });
  return CraftingResponseSchema.parse(data);
}

export async function getCharacterDeaths(id: number, limit = 50) {
  const data = await opsApi<unknown>(
    `/api/v1/character/${id}/deaths?limit=${limit}`,
    { next: { revalidate: 120 } },
  );
  return DeathsResponseSchema.parse(data);
}

export async function getCharacterXpHistory(id: number, limit = 2000) {
  const data = await opsApi<unknown>(
    `/api/v1/character/${id}/xp_history?limit=${limit}`,
    { next: { revalidate: 300 } },
  );
  return XpHistoryResponseSchema.parse(data);
}

export async function getCharacterRecipes(id: number, limit = 25) {
  const data = await opsApi<unknown>(
    `/api/v1/character/${id}/recipes?limit=${limit}`,
    { next: { revalidate: 300 } },
  );
  return RecipesResponseSchema.parse(data);
}

// Convenience: portrait URL builder for use in <Image> / <img>. Always
// hits our own /api/portrait route so the WebP cache pipeline is the
// single point of truth — no direct nwn-haks paths leak to the client.
export function portraitUrl(resref: string | null | undefined, width = 128): string {
  if (!resref) return `/portrait-placeholder.webp`;
  return `/api/portrait/${encodeURIComponent(resref)}?w=${width}`;
}
