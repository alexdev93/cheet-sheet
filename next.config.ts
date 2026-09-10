import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" produces the self-contained server.js the Dockerfile runs
  // (see docker-compose.yml) — but it conflicts with Vercel's own output
  // tracing/bundling (breaks the build with an ENOENT on
  // .next/next-server.js.nft.json), so skip it there. Vercel sets VERCEL=1
  // during every build.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
