import type { NextConfig } from "next";

const NGROK_HOST = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((u) => u.replace(/^https?:\/\//, ""))
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: NGROK_HOST,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
