import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows static export when building for GitHub Pages,
  // while retaining full Vercel edge deployment capability
  output: process.env.STATIC_EXPORT === "true" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
