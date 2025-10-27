/**
 * Supabase Client Utilities for BugTrack MVP
 * 
 * This file provides Supabase client instances for different contexts:
 * - Client Components (browser-side)
 * - Server Components (server-side)
 * - Route Handlers (API routes)
 * 
 * Migration Note: When moving to self-hosted (Phase 4+), replace these
 * with custom auth utilities (JWT sessions, bcrypt password verification)
 */

import { createBrowserClient } from '@supabase/ssr';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create Supabase client for Client Components (browser)
 * Use this in any 'use client' components
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Create Supabase client for Server Components
 * Use this in server components (default in app directory)
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create Supabase client for Route Handlers (API routes)
 * Use this in app/api routes
 */
export { createServerClient as createRouteHandlerClient };

