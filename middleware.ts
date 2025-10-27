/**
 * Next.js Middleware for BugTrack
 * 
 * Handles:
 * - Supabase session refresh
 * - Protected route authentication
 * - Redirect logged-in users away from auth pages
 */

import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/health (health check)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/health).*)',
  ],
};

