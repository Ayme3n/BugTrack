import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

// GET /api/tools/jobs/[id] - Get job details
export async function GET(request: Request, context: { params: Params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const { data: job, error } = await supabase
      .from('tool_jobs')
      .select(`
        *,
        target:targets(id, name)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

