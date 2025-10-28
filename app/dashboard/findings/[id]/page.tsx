/**
 * Finding Details Page
 * View complete information about a vulnerability finding
 */

import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default async function FindingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Await params (Next.js 15+ requirement)
  const { id: findingId } = await params;

  // Fetch finding with target information
  // Note: RLS policies automatically filter by user_id
  const { data: finding, error } = await supabase
    .from('findings')
    .select(`
      *,
      target:targets(id, name, url)
    `)
    .eq('id', findingId)
    .single();

  if (error || !finding) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          Finding not found or you don't have permission to view it.
        </div>
        <Link
          href="/dashboard/findings"
          className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Findings
        </Link>
      </div>
    );
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'INFO': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  // Get workflow state color
  const getWorkflowColor = (state: string) => {
    switch (state) {
      case 'REWARDED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ACCEPTED': case 'FIXED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'REPORTED': case 'TRIAGED': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'DUPLICATE': case 'NOT_APPLICABLE': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/findings"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Findings
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {finding.title}
            </h1>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Severity Badge */}
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSeverityColor(finding.severity)}`}>
                {finding.severity}
              </span>
              
              {/* Workflow State Badge */}
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getWorkflowColor(finding.workflow_state)}`}>
                {finding.workflow_state.replace('_', ' ')}
              </span>
              
              {/* CVSS Score */}
              {finding.cvss_score && (
                <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                  CVSS {finding.cvss_score.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          
          {/* Edit Button */}
          <Link
            href={`/dashboard/findings/${finding.id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Vulnerability Type */}
        {finding.vulnerability_type && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Type</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {finding.vulnerability_type}
            </p>
          </div>
        )}
        
        {/* Target */}
        {finding.target && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target</p>
            <Link
              href={`/dashboard/targets/${finding.target.id}`}
              className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {finding.target.name}
            </Link>
          </div>
        )}
        
        {/* Reward */}
        {finding.reward_amount && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reward</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              💰 {finding.reward_amount}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Description
        </h2>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{finding.description_md}</ReactMarkdown>
        </div>
      </div>

      {/* Impact */}
      {finding.impact && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Impact
          </h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {finding.impact}
          </p>
        </div>
      )}

      {/* Reproduction Steps */}
      {finding.reproduction_steps && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Steps to Reproduce
          </h2>
          <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
            {finding.reproduction_steps}
          </pre>
        </div>
      )}

      {/* Remediation */}
      {finding.remediation && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recommended Remediation
          </h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {finding.remediation}
          </p>
        </div>
      )}

      {/* References */}
      {finding.references && finding.references.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            References
          </h2>
          <ul className="space-y-2">
            {finding.references.map((ref: string, index: number) => (
              <li key={index}>
                <a
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {ref}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {finding.tags && finding.tags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {finding.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Metadata
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Created</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {new Date(finding.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {new Date(finding.updated_at).toLocaleString()}
            </p>
          </div>
          {finding.reported_at && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">Reported</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(finding.reported_at).toLocaleString()}
              </p>
            </div>
          )}
          {finding.resolved_at && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(finding.resolved_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

