import type { NextConfig } from "next";

const upstream = process.env.DEV_SYNC_UPSTREAM?.trim().replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== "development" || !upstream) {
      return [];
    }
    return [
      {
        source: "/api/sync",
        destination: `${upstream}/api/sync`,
      },
    ];
  },
};

export default nextConfig;
