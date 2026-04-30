// Browser-callable search endpoint for the autocomplete combobox.
// Proxies to ops-api so the OPS_API_KEY never touches the client; pulls
// down to a small payload (slug + display fields only) for fast typing.

import { NextResponse, type NextRequest } from "next/server";

import { listCharacters } from "@/lib/characters";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 25);

  // Empty query is fine — surfaces the most-recent characters as a hint.
  try {
    const list = await listCharacters({ q: q || undefined, limit, sort: q ? "name" : "recent" });
    return NextResponse.json(
      {
        items: list.items.map((c) => ({
          slug: c.slug,
          playername: c.playername,
          full_name: c.full_name,
          race: c.race,
          level: c.level,
          portrait_resref: c.portrait_resref,
        })),
      },
      {
        headers: {
          // Short cache so popular searches don't re-hit ops-api on every keystroke.
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("character search failed", err);
    return NextResponse.json({ items: [], error: "search failed" }, { status: 502 });
  }
}
