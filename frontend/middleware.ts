import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security Headers - Applied to all routes
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.nearblocks.io https://rpc.mainnet.near.org",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // HSTS (only for HTTPS)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Permissions Policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Handle versioned routes with proper cache control
  if (request.nextUrl.pathname.startsWith('/v1/')) {
    // Set cache headers for versioned routes
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    response.headers.set('X-Version', '1.0');
    response.headers.set('X-API-Version', 'v1');
    
    // Set specific cache duration based on route type
    if (request.nextUrl.pathname.includes('/analytics')) {
      response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    } else if (request.nextUrl.pathname.includes('/explorer')) {
      response.headers.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');
    } else if (request.nextUrl.pathname.includes('/dashboard')) {
      response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200');
    }
    
    // Add CORS headers for sharing (restrict origin in production)
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS || 'https://nearacles.com'
      : '*';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Version');
  }
  
  // Handle legacy routes - redirect to versioned routes
  if (request.nextUrl.pathname === '/oracles') {
    return NextResponse.redirect(new URL('/v1/oracles', request.url));
  }
  if (request.nextUrl.pathname === '/analytics') {
    return NextResponse.redirect(new URL('/v1/analytics', request.url));
  }
  if (request.nextUrl.pathname === '/explorer') {
    return NextResponse.redirect(new URL('/v1/explorer', request.url));
  }
  if (request.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/v1/dashboard', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    '/v1/:path*',
    '/oracles',
    '/analytics', 
    '/explorer',
    '/dashboard'
  ]
};