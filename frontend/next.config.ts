import type { NextConfig } from "next";

// Support both static export and dynamic hosting
const isStaticExport = process.env.BUILD_MODE === 'static';

const nextConfig: NextConfig = {
  // Enable static export when BUILD_MODE=static
  ...(isStaticExport && { output: "export" }),
  
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Add basic caching headers for production
  async headers() {
    if (isStaticExport) return []; // Skip headers for static export
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  
  // Add basic redirects for clean URLs
  async redirects() {
    if (isStaticExport) return []; // Skip redirects for static export
    
    return [
      {
        source: '/oracles',
        destination: '/oracles',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
