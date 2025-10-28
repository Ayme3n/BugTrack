/**
 * Supabase Client for Client Components (Browser)
 * 
 * Use this in any 'use client' components
 * 
 * Migration Note: When moving to self-hosted (Phase 4+), replace these
 * with custom auth utilities (JWT sessions, bcrypt password verification)
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Create Supabase client for Client Components (browser)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

