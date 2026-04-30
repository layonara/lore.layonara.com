// Portrait pipeline — reads NWN portrait source files (DDS preferred, TGA
// fallback) from /opt/layonara/nwn-haks/portraits/ via a read-only Docker
// mount, converts to WebP via ImageMagick, and caches the result on a
// Coolify-managed volume with an LRU cap.
//
// The cache key is `<resref>_<width>.webp`. Portrait resrefs are immutable
// per appearance, so we can hand out aggressive Cache-Control headers and
// the cache only ever grows when a new (resref, width) pair is requested.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export interface PortraitOptions {
  resref: string;
  width: number;
}

// In the container the host path /opt/layonara/nwn-haks/portraits is bind-
// mounted read-only at /portraits via Coolify persistent storage.
const PORTRAIT_ROOT = process.env.PORTRAITS_DIR ?? "/portraits";
const CACHE_DIR = process.env.PORTRAIT_CACHE_DIR ?? "/var/cache/portraits";
const CACHE_MAX_BYTES = Number(
  process.env.PORTRAIT_CACHE_MAX_BYTES ?? 1024 * 1024 * 1024,
);
// Drop the cache to 90% of the cap on each eviction pass to amortise the
// O(n log n) scan. Triggered only when a write would push us over the cap.
const CACHE_TARGET_BYTES = Math.floor(CACHE_MAX_BYTES * 0.9);

// NWN portrait size suffixes. The sync stores resref with the trailing
// underscore already (e.g. "po_hu_m_dl_01_"), so suffixes don't repeat it.
// We always pull from the highest-resolution source available so resizing
// never has to upscale.
const SOURCE_PRIORITY = [
  "h.dds", "h.tga",
  "l.dds", "l.tga",
  "m.dds", "m.tga",
  "s.dds", "s.tga",
  "t.dds",
] as const;

// Allowed output widths. Restricting this keeps the cache bounded to a
// fixed number of files per portrait and makes Cache-Control safe to
// hand out as immutable.
export const ALLOWED_WIDTHS = [64, 128, 192, 256, 384, 512] as const;
export type AllowedWidth = (typeof ALLOWED_WIDTHS)[number];

export class PortraitNotFoundError extends Error {}
export class PortraitConvertError extends Error {}

export function isAllowedWidth(w: number): w is AllowedWidth {
  return (ALLOWED_WIDTHS as readonly number[]).includes(w);
}

// Strip everything but a-z0-9_- and lowercase. NWN resrefs are 16-char
// lowercase ascii so this is just a defence-in-depth pass before we use
// the resref in a filesystem path.
export function sanitizeResref(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
}

function cachePath(resref: string, width: number): string {
  return path.join(CACHE_DIR, `${resref}_${width}.webp`);
}

async function findSource(resref: string): Promise<string | null> {
  for (const suffix of SOURCE_PRIORITY) {
    const candidate = path.join(PORTRAIT_ROOT, `${resref}${suffix}`);
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next suffix.
    }
  }
  return null;
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

// Run `convert <src> -resize <w>x -quality 82 webp:<dst>`. Aspect ratio is
// preserved via `<w>x` (height auto). Quality 82 is a good portrait sweet
// spot — visibly indistinguishable from the source TGA at ~25KB for 256w.
async function magickConvert(
  source: string,
  destination: string,
  width: number,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      "convert",
      [source, "-resize", `${width}x`, "-quality", "82", `webp:${destination}`],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      reject(new PortraitConvertError(`spawn failed: ${err.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new PortraitConvertError(`convert exit ${code}: ${stderr.trim()}`));
    });
  });
}

interface CacheEntry {
  filename: string;
  size: number;
  mtimeMs: number;
}

async function listCacheEntries(): Promise<CacheEntry[]> {
  let names: string[];
  try {
    names = await readdir(CACHE_DIR);
  } catch {
    return [];
  }
  const out: CacheEntry[] = [];
  await Promise.all(
    names
      .filter((n) => n.endsWith(".webp"))
      .map(async (n) => {
        try {
          const s = await stat(path.join(CACHE_DIR, n));
          out.push({ filename: n, size: s.size, mtimeMs: s.mtimeMs });
        } catch {
          // Vanished mid-scan — ignore.
        }
      }),
  );
  return out;
}

// Drop the oldest cache files (by mtime asc) until total size <= target.
// Single-pass scan; called at most once per cache write that pushes us
// over the cap. Concurrent calls race harmlessly — worst case is double
// eviction, never under-eviction.
async function evictIfOver(): Promise<void> {
  const entries = await listCacheEntries();
  let total = entries.reduce((acc, e) => acc + e.size, 0);
  if (total <= CACHE_MAX_BYTES) return;
  entries.sort((a, b) => a.mtimeMs - b.mtimeMs);
  for (const e of entries) {
    if (total <= CACHE_TARGET_BYTES) break;
    try {
      await unlink(path.join(CACHE_DIR, e.filename));
      total -= e.size;
    } catch {
      // Already gone; keep going.
    }
  }
}

// Touch the cache file's mtime so LRU eviction reflects access frequency,
// not just write order. utimes is fine here — we don't care about exact
// atomicity with reads, just that recently-served files don't get evicted.
async function touch(file: string): Promise<void> {
  try {
    const now = new Date();
    const { utimes } = await import("node:fs/promises");
    await utimes(file, now, now);
  } catch {
    // Touch is best-effort.
  }
}

export interface PortraitResult {
  body: Buffer;
  contentType: "image/webp";
  fromCache: boolean;
  source: string | null;
}

export async function renderPortrait({
  resref: rawResref,
  width,
}: PortraitOptions): Promise<PortraitResult> {
  const resref = sanitizeResref(rawResref);
  if (!resref) {
    throw new PortraitNotFoundError("empty resref");
  }
  if (!isAllowedWidth(width)) {
    throw new PortraitNotFoundError(`unsupported width: ${width}`);
  }
  await ensureCacheDir();
  const cached = cachePath(resref, width);

  // Cache hit fast path — read from disk, refresh mtime async (fire-and-forget).
  try {
    const buf = await readFile(cached);
    void touch(cached);
    return { body: buf, contentType: "image/webp", fromCache: true, source: null };
  } catch {
    // Miss — fall through to convert.
  }

  const source = await findSource(resref);
  if (!source) {
    throw new PortraitNotFoundError(`no portrait source for ${resref}`);
  }

  // Atomic write: convert to a tmp file in the same dir then rename, so
  // concurrent reads never see a half-written WebP. The rename is atomic
  // within the same filesystem.
  const tmpName = `.tmp-${resref}-${width}-${randomToken()}.webp`;
  const tmpPath = path.join(CACHE_DIR, tmpName);
  try {
    await magickConvert(source, tmpPath, width);
    await rename(tmpPath, cached);
  } catch (err) {
    // Clean up tmp file on failure; ignore unlink errors.
    await unlink(tmpPath).catch(() => undefined);
    throw err;
  }

  const buf = await readFile(cached);
  // Eviction runs after the write so the user gets their bytes ASAP.
  void evictIfOver();
  return { body: buf, contentType: "image/webp", fromCache: false, source };
}

function randomToken(): string {
  return createHash("sha1").update(`${process.pid}:${Date.now()}:${Math.random()}`).digest("hex").slice(0, 12);
}

// Serve a tiny fallback when a portrait is missing — saves a round-trip and
// avoids broken-image icons. The placeholder lives in /public and Next.js
// serves it directly; this helper just produces the same Buffer so callers
// can return it with image/webp content-type.
export async function readPlaceholder(): Promise<Buffer> {
  const p = path.join(process.cwd(), "public", "portrait-placeholder.webp");
  return readFile(p);
}

export const __testing = { tmpdir, evictIfOver, listCacheEntries };
