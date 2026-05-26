import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_ROUTES = ['/admin', '/api/admin', '/delivery/dashboard'];
const API_DEBUG_ROUTES = ['/api/debug', '/api/stores/purge-trash'];
const PUBLIC_ROUTES = ['/', '/about', '/stores', '/categories', '/products', '/washer'];

function isRouteMatch(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern || path.startsWith(pattern + '/');
  });
}

function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (pathname.startsWith('/api/debug') && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints disabled in production' },
      { status: 403, headers: getSecurityHeaders() }
    );
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isBot = /bot|crawler|spider|scraper/i.test(userAgent);
  
  if (isBot && (pathname.startsWith('/api/') || pathname.startsWith('/admin'))) {
    console.log('[Security] Blocked bot access:', pathname, userAgent);
    return NextResponse.json(
      { error: 'Automated access denied' },
      { status: 403, headers: getSecurityHeaders() }
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|finanzas|.*\\..*).*)',
  ],
};