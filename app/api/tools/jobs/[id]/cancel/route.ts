import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the job to verify ownership and status
    const { data: job, error: fetchError } = await supabase
      .from('tool_jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only allow cancelling QUEUED or RUNNING jobs
    if (job.status !== 'QUEUED' && job.status !== 'RUNNING') {
      return NextResponse.json(
        { error: `Cannot cancel job with status: ${job.status}` },
        { status: 400 }
      );
    }

    // Update job status to CANCELLED
    const { error: updateError } = await supabase
      .from('tool_jobs')
      .update({
        status: 'CANCELLED',
        completed_at: new Date().toISOString(),
        error_output: 'Job cancelled by user'
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Job cancelled' });
  } catch (error: any) {
    console.error('Error cancelling job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel job' },
      { status: 500 }
    );
  }
}

