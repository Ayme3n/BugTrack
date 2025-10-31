'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';

type ToolJob = {
  id: string;
  tool_name: string;
  target_input: string;
  status: string;
  result_count: number | null;
  result_json: any;
  raw_output: string | null;
  error_output: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  exit_code: number | null;
  target: { id: string; name: string } | null;
};

export default function JobDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [job, setJob] = useState<ToolJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJob();
    // Auto-refresh every 5 seconds if job is running
    const interval = setInterval(() => {
      if (job?.status === 'RUNNING' || job?.status === 'QUEUED') {
        fetchJob();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [resolvedParams.id, job?.status]);

  async function fetchJob() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/tools/jobs/${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error('Job not found');
      }

      const data = await response.json();
      setJob(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400">{error || 'Job not found'}</p>
          <Link
            href="/dashboard/tools"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-4 inline-block"
          >
            ← Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/tools"
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm mb-2 inline-block"
        >
          ← Back to Tools
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Job Details
        </h1>
      </div>

      {/* Job Info */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tool</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {job.tool_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Target</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 break-all">
              {job.target_input}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                job.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                job.status === 'RUNNING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                job.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {job.status}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : '-'}
            </p>
          </div>
        </div>

        {job.target && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Linked Target</p>
            <Link
              href={`/dashboard/targets/${job.target.id}`}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-1 inline-block"
            >
              {job.target.name} →
            </Link>
          </div>
        )}
      </div>

      {/* Results */}
      {job.status === 'COMPLETED' && job.result_json && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Results ({job.result_count || 0})
          </h2>
          
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-gray-900 dark:text-gray-100 font-mono">
              {JSON.stringify(job.result_json, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Error Output */}
      {job.status === 'FAILED' && job.error_output && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-4">
            Error
          </h2>
          <pre className="text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
            {job.error_output}
          </pre>
        </div>
      )}

      {/* Raw Output */}
      {job.raw_output && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Raw Output
          </h2>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
              {job.raw_output}
            </pre>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Timeline
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(job.created_at).toLocaleString()}
            </span>
          </div>
          {job.started_at && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(job.started_at).toLocaleString()}
              </span>
            </div>
          )}
          {job.completed_at && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Completed:</span>
              <span className="text-gray-900 dark:text-white">
                {new Date(job.completed_at).toLocaleString()}
              </span>
            </div>
          )}
          {job.exit_code !== null && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Exit Code:</span>
              <span className={job.exit_code === 0 ? 'text-green-600' : 'text-red-600'}>
                {job.exit_code}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

