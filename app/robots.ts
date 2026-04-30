import type { MetadataRoute } from "next";

// Phase 1 stance: nothing is crawlable. Once the site bakes and we decide
// what's safe to expose, swap this for an explicit allow list.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
