import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next.js 16 defaults to Turbopack; empty config acknowledges we don't need custom turbopack rules.
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.meshy.ai" },
      { protocol: "https", hostname: "assets.meshy.ai" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
