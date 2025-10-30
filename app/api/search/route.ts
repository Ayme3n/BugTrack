import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: {
          targets: [],
          findings: [],
          payloads: [],
          notes: [],
        },
        totalCount: 0,
      });
    }

    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchPattern = `%${query}%`;

    // Search targets
    const { data: targets, error: targetsError } = await supabase
      .from('targets')
      .select('id, name, url, platform, status, created_at')
      .eq('user_id', user.id)
      .or(`name.ilike.${searchPattern},url.ilike.${searchPattern},platform.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (targetsError) {
      console.error('Error searching targets:', targetsError);
    }

    // Search findings
    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select('id, title, severity, workflow_state, created_at')
      .eq('user_id', user.id)
      .or(`title.ilike.${searchPattern},description_md.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (findingsError) {
      console.error('Error searching findings:', findingsError);
    }

    // Search payloads (search title and content only, category is enum)
    const { data: payloads, error: payloadsError } = await supabase
      .from('payloads')
      .select('id, title, category, content, created_at')
      .eq('user_id', user.id)
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (payloadsError) {
      console.error('Error searching payloads:', payloadsError);
    }

    // Search notes (titles only, content is encrypted)
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .ilike('title', searchPattern)
      .order('created_at', { ascending: false })
      .limit(5);

    if (notesError) {
      console.error('Error searching notes:', notesError);
    }

    const results = {
      targets: targets || [],
      findings: findings || [],
      payloads: payloads || [],
      notes: notes || [],
    };

    const totalCount =
      (targets?.length || 0) +
      (findings?.length || 0) +
      (payloads?.length || 0) +
      (notes?.length || 0);

    return NextResponse.json({
      results,
      totalCount,
      query,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

