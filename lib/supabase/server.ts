/**
 * Supabase Admin Client (Server-Side Only)
 * 
 * WARNING: This client has FULL DATABASE ACCESS (bypasses RLS)
 * Only use for:
 * - Admin operations
 * - Cron jobs
 * - Background tasks
 * - Server-side data migrations
 * 
 * NEVER expose this client to the browser!
 */

import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Supabase Admin Client
 * Has full access, bypasses Row Level Security (RLS)
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Helper: Get user by ID (admin)
 */
export async function getUserById(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Helper: Create user profile (after Supabase auth signup)
 * Call this in a webhook or after auth.signUp()
 */
export async function createUserProfile(userId: string, email: string, name?: string) {
  const { data, error } = await supabaseAdmin.from('users').insert({
    id: userId,
    email,
    name: name || email.split('@')[0],
    email_verified: false,
    two_fa_enabled: false,
  });

  if (error) throw error;
  return data;
}

