// Thin client for layonara-ops-api. Server-side only by default — the
// API token is read from env and must never be sent to the browser.
//
// Endpoints land on ops-api as we add features; this module exists so the
// auth + base-URL plumbing is in one place from day one.

const OPS_API_URL = process.env.OPS_API_URL ?? "http://10.99.0.1:8100";
const OPS_API_KEY = process.env.OPS_API_KEY ?? "";

if (typeof window !== "undefined") {
  throw new Error("lib/api.ts is server-only — never import from a client component");
}

export class OpsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    message: string,
  ) {
    super(`ops-api ${status} on ${endpoint}: ${message}`);
  }
}

export async function opsApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${OPS_API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(OPS_API_KEY ? { Authorization: `Bearer ${OPS_API_KEY}` } : {}),
      ...(init.headers ?? {}),
    },
    // Cache strategy is per-call: most reads use { next: { revalidate: 60 } }
    // applied at the call site so the lib stays uneditorialized.
    cache: init.cache ?? "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OpsApiError(res.status, path, body.slice(0, 200));
  }
  return (await res.json()) as T;
}
