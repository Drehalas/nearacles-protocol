import type { NextConfig } from "next";

// Support both static export and dynamic hosting
const isStaticExport = process.env.BUILD_MODE === 'static';

const nextConfig: NextConfig = {

  ...(isStaticExport && { output: "export" }),
  
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  // Optimize for versioned routes and caching
  async headers() {
    return [
      {
        source: '/v1/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Version',
            value: '1.0',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        source: '/v1/analytics/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/v1/explorer/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=900, stale-while-revalidate=1800',
          },
        ],
      },
      {
        source: '/v1/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=600, stale-while-revalidate=1200',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/oracles',
        destination: '/v1/oracles',
        permanent: true,
      },
      {
        source: '/analytics',
        destination: '/v1/analytics',
        permanent: true,
      },
      {
        source: '/explorer',
        destination: '/v1/explorer',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/v1/dashboard',
        permanent: true,
      },
    ];
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
