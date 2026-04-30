// Client-safe portrait URL builder. Extracted from lib/characters.ts so the
// autocomplete (and other client components) can import it without dragging
// in lib/api.ts, which is server-only and intentionally throws on import in
// the browser bundle.
//
// The `&v=` parameter is a cache buster — bump it (and PORTRAIT_VERSION in
// lib/portrait.ts) whenever the convert pipeline changes, so the long
// immutable Cache-Control doesn't trap clients on a stale rendering. The
// server doesn't read this param; it just uses it to invalidate the URL.
export const PORTRAIT_URL_VERSION = 3;

export function portraitUrl(
  resref: string | null | undefined,
  width = 128,
): string {
  if (!resref) return `/portrait-placeholder.webp`;
  return `/api/portrait/${encodeURIComponent(resref)}?w=${width}&v=${PORTRAIT_URL_VERSION}`;
}
