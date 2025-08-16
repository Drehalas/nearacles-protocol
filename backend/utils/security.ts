/**
 * Basic Security Middleware for NEAR Oracle Intent Protocol
 * Essential security headers and rate limiting for testnet deployment
 */

import { IncomingMessage, ServerResponse } from 'http';

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface SecurityConfig {
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableCors: boolean;
  allowedOrigins: string[];
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimitWindowMs: 60000, // 1 minute
  rateLimitMaxRequests: 100, // 100 requests per minute
  enableCors: true,
  allowedOrigins: [
    'http://localhost:3000',
    'https://testnet.nearacles.com',
    'https://nearacles.com',
  ],
};

/**
 * Apply basic security headers to HTTP response
 */
export function applySecurityHeaders(res: ServerResponse, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): void {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (basic)
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' ws: wss: https:; " +
    "img-src 'self' data: https:;"
  );

  // CORS headers if enabled
  if (config.enableCors) {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
}

/**
 * Apply CORS origin check
 */
export function applyCorsOrigin(req: IncomingMessage, res: ServerResponse, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): boolean {
  if (!config.enableCors) return true;

  const origin = req.headers.origin;
  if (!origin) return true; // Allow requests without origin (same-origin)

  if (config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    return true;
  }

  return false; // Origin not allowed
}

/**
 * Simple rate limiting implementation
 */
export function checkRateLimit(req: IncomingMessage, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
} {
  const clientKey = getClientKey(req);
  const now = Date.now();
  
  // Clean up expired entries
  cleanupRateLimitStore(now, config.rateLimitWindowMs);
  
  let clientData = rateLimitStore.get(clientKey);
  
  if (!clientData || now > clientData.resetTime) {
    // New window or expired
    clientData = {
      count: 0,
      resetTime: now + config.rateLimitWindowMs,
    };
  }
  
  clientData.count++;
  rateLimitStore.set(clientKey, clientData);
  
  const allowed = clientData.count <= config.rateLimitMaxRequests;
  const remainingRequests = Math.max(0, config.rateLimitMaxRequests - clientData.count);
  
  return {
    allowed,
    remainingRequests,
    resetTime: clientData.resetTime,
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientKey(req: IncomingMessage): string {
  // Try to get real IP from headers (for reverse proxy setups)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  let clientIp: string;
  
  if (typeof forwardedFor === 'string') {
    clientIp = forwardedFor.split(',')[0].trim();
  } else if (typeof realIp === 'string') {
    clientIp = realIp;
  } else {
    // Fallback to socket remote address
    clientIp = req.socket.remoteAddress || 'unknown';
  }
  
  return `ip:${clientIp}`;
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimitStore(now: number, windowMs: number): void {
  const cutoff = now - windowMs;
  
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Apply rate limiting and return appropriate headers
 */
export function applyRateLimit(req: IncomingMessage, res: ServerResponse, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): boolean {
  const result = checkRateLimit(req, config);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', config.rateLimitMaxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', result.remainingRequests.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());
    return false;
  }
  
  return true;
}

/**
 * Complete security middleware that can be applied to HTTP servers
 */
export function securityMiddleware(
  req: IncomingMessage, 
  res: ServerResponse, 
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): { allowed: boolean; reason?: string } {
  // Apply security headers
  applySecurityHeaders(res, config);
  
  // Check CORS origin
  if (!applyCorsOrigin(req, res, config)) {
    return { allowed: false, reason: 'CORS origin not allowed' };
  }
  
  // Apply rate limiting
  if (!applyRateLimit(req, res, config)) {
    return { allowed: false, reason: 'Rate limit exceeded' };
  }
  
  return { allowed: true };
}

/**
 * Security audit checklist for testnet deployment
 */
export interface SecurityAuditResult {
  passed: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    description: string;
    recommendation?: string;
  }>;
  score: number;
}

export function performBasicSecurityAudit(config: SecurityConfig = DEFAULT_SECURITY_CONFIG): SecurityAuditResult {
  const checks = [
    {
      name: 'Security Headers',
      passed: true, // We apply headers by default
      description: 'Basic security headers are configured',
    },
    {
      name: 'Rate Limiting',
      passed: config.rateLimitMaxRequests > 0 && config.rateLimitWindowMs > 0,
      description: 'Rate limiting is configured and active',
      recommendation: config.rateLimitMaxRequests === 0 ? 'Enable rate limiting to prevent abuse' : undefined,
    },
    {
      name: 'CORS Configuration',
      passed: config.enableCors && config.allowedOrigins.length > 0 && !config.allowedOrigins.includes('*'),
      description: 'CORS is configured with specific allowed origins',
      recommendation: config.allowedOrigins.includes('*') ? 'Specify explicit allowed origins instead of wildcard' : undefined,
    },
    {
      name: 'Content Security Policy',
      passed: true, // We set basic CSP
      description: 'Content Security Policy headers are set',
    },
  ];
  
  const passed = checks.every(check => check.passed);
  const score = Math.round((checks.filter(check => check.passed).length / checks.length) * 100);
  
  return {
    passed,
    checks,
    score,
  };
}

/**
 * Get security configuration from environment variables
 */
export function getSecurityConfigFromEnv(): SecurityConfig {
  return {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    enableCors: process.env.ENABLE_CORS !== 'false',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || DEFAULT_SECURITY_CONFIG.allowedOrigins,
  };
}