import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Create User Profile
 * 
 * Uses service role key to bypass RLS and create user profile
 * Called during registration after Supabase Auth user is created
 */
export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json();

    // Validate required fields
    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Insert user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name: name || email.split('@')[0],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    console.error('Error in create-profile route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

