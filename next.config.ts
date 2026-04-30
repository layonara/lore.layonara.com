import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the runtime image small (~150MB) by bundling
  // only what's needed instead of the full node_modules tree.
  output: "standalone",
  // Sharp is a transitive runtime dep we use directly in image routes;
  // keep it external so it isn't bundled into RSC chunks.
  serverExternalPackages: ["sharp"],
  // Phase 1: noindex everywhere via X-Robots-Tag header on every response.
  // Pair with robots.txt and per-page meta tags.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
