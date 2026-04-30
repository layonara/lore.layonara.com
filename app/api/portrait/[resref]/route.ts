// /api/portrait/[resref]?w=128
//
// Serves a WebP rendering of the requested NWN portrait at the requested
// width. Width is restricted to a small allowlist so the on-disk cache stays
// bounded. Cache headers are immutable because (resref, width) → bytes is a
// pure function — appearance changes go through a different resref.

import { NextResponse, type NextRequest } from "next/server";

import {
  ALLOWED_WIDTHS,
  PortraitNotFoundError,
  isAllowedWidth,
  readPlaceholder,
  renderPortrait,
  sanitizeResref,
} from "@/lib/portrait";

// Default to 128px (the size we use for the list grid). The detail page asks
// for a larger size explicitly via ?w=.
const DEFAULT_WIDTH = 128;

// One-year immutable cache; portrait bytes are content-addressed by resref+width.
const CACHE_HEADER = "public, max-age=31536000, s-maxage=31536000, immutable";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ resref: string }> },
) {
  const { resref: rawResref } = await params;
  const resref = sanitizeResref(rawResref);
  if (!resref) {
    return NextResponse.json({ error: "invalid resref" }, { status: 400 });
  }

  const wParam = req.nextUrl.searchParams.get("w");
  const width = wParam ? Number(wParam) : DEFAULT_WIDTH;
  if (!isAllowedWidth(width)) {
    return NextResponse.json(
      { error: `unsupported width — must be one of ${ALLOWED_WIDTHS.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const { body, contentType } = await renderPortrait({ resref, width });
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_HEADER,
        "X-Portrait-Resref": resref,
      },
    });
  } catch (err) {
    if (err instanceof PortraitNotFoundError) {
      // Try the placeholder before giving up so the UI never paints a
      // broken-image icon. Cache aggressively too — if the resref is wrong
      // it'll keep being wrong.
      try {
        const buf = await readPlaceholder();
        return new NextResponse(new Uint8Array(buf), {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=300",
            "X-Portrait-Fallback": "1",
          },
        });
      } catch {
        return NextResponse.json({ error: "portrait not found" }, { status: 404 });
      }
    }
    console.error("portrait render failed", err);
    return NextResponse.json({ error: "portrait render failed" }, { status: 500 });
  }
}
