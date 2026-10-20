import type { NextConfig } from "next";

// Ensure safe build-time fallback if DATABASE_URL is not yet bound in deployment dashboard
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/*.db',
        '**/*.db-journal',
        '**/*.db-wal',
        '**/*.db-shm',
        '**/dev.db*',
        '**/public/uploads/**',
        '**/node_modules/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
