import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed "output: export" to enable middleware, headers, and redirects
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
