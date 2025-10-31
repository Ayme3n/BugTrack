import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';

// GET /api/tools/jobs - List user's jobs
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: jobs, error } = await supabase
      .from('tool_jobs')
      .select('id, tool_name, target_input, status, result_count, created_at, completed_at, duration_ms')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(jobs || []);
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tools/jobs - Create new job
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tool_name, target_input, target_id, params_json, priority } = body;

    // Validate tool name
    const validTools = ['SUBFINDER', 'HTTPX', 'NUCLEI', 'GAU', 'WAYBACKURLS', 'FFUF', 'DIRSEARCH'];
    if (!validTools.includes(tool_name)) {
      return NextResponse.json({ error: 'Invalid tool name' }, { status: 400 });
    }

    // Create job using Supabase client
    const { data: job, error } = await supabase
      .from('tool_jobs')
      .insert({
        user_id: user.id,
        tool_name,
        target_input,
        target_id: target_id || null,
        params_json: params_json || null,
        priority: priority || 5,
        status: 'QUEUED'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

