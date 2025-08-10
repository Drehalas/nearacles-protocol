// Cache configuration for versioned routes
export const CACHE_CONFIG = {
  v1: {
    oracles: {
      maxAge: 3600, // 1 hour
      staleWhileRevalidate: 86400, // 24 hours
      description: 'Oracle services with stable data'
    },
    analytics: {
      maxAge: 1800, // 30 minutes
      staleWhileRevalidate: 3600, // 1 hour
      description: 'Real-time analytics data'
    },
    explorer: {
      maxAge: 900, // 15 minutes
      staleWhileRevalidate: 1800, // 30 minutes
      description: 'Live blockchain data'
    },
    dashboard: {
      maxAge: 600, // 10 minutes
      staleWhileRevalidate: 1200, // 20 minutes
      description: 'Real-time dashboard metrics'
    }
  }
};

export const VERSION_INFO = {
  current: 'v1.0',
  status: 'stable',
  features: [
    'Enhanced metadata for social sharing',
    'Optimized cache control headers',
    'Version-specific routes for better CDN caching',
    'Improved SEO with structured data'
  ]
};

export function getCacheHeaders(route: string): string {
  const routeType = route.split('/')[2]; // Extract route type from /v1/route
  const config = CACHE_CONFIG.v1[routeType as keyof typeof CACHE_CONFIG.v1];
  
  if (!config) {
    return 'public, max-age=3600, stale-while-revalidate=86400';
  }
  
  return `public, max-age=${config.maxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`;
}