import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
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
    
    // Add CORS headers for sharing
    response.headers.set('Access-Control-Allow-Origin', '*');
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