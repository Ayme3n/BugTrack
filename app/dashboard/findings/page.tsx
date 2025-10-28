/**
 * Findings List Page
 * Display all user's vulnerability findings with filtering and stats
 */

import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function FindingsPage() {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's findings with target information
  const { data: findings, error } = await supabase
    .from('findings')
    .select(`
      *,
      target:targets(id, name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching findings:', error);
  }

  // Calculate stats
  const stats = {
    total: findings?.length || 0,
    critical: findings?.filter((f) => f.severity === 'CRITICAL').length || 0,
    high: findings?.filter((f) => f.severity === 'HIGH').length || 0,
    medium: findings?.filter((f) => f.severity === 'MEDIUM').length || 0,
    low: findings?.filter((f) => f.severity === 'LOW').length || 0,
    info: findings?.filter((f) => f.severity === 'INFO').length || 0,
    rewarded: findings?.filter((f) => f.workflow_state === 'REWARDED').length || 0,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🔍 Findings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your vulnerability discoveries and bug bounty reports
            </p>
          </div>
          <Link
            href="/dashboard/findings/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Finding
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Total
            </h3>
            <span className="text-lg">🔍</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Critical
            </h3>
            <span className="text-lg">🔴</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-500">
            {stats.critical}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              High
            </h3>
            <span className="text-lg">🟠</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">
            {stats.high}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Medium
            </h3>
            <span className="text-lg">🟡</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
            {stats.medium}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Low
            </h3>
            <span className="text-lg">🔵</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">
            {stats.low}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Info
            </h3>
            <span className="text-lg">⚪</span>
          </div>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-500">
            {stats.info}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Rewarded
            </h3>
            <span className="text-lg">💰</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-500">
            {stats.rewarded}
          </p>
        </div>
      </div>

      {/* Findings List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {!findings || findings.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <span className="text-5xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No findings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Start documenting your vulnerability discoveries. Track everything from XSS to SQLi with detailed descriptions, POCs, and attachments.
            </p>
            <Link
              href="/dashboard/findings/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Finding
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {findings.map((finding: any) => (
              <Link
                key={finding.id}
                href={`/dashboard/findings/${finding.id}`}
                className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {finding.title}
                      </h3>
                      
                      {/* Severity Badge */}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          finding.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : finding.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : finding.severity === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : finding.severity === 'LOW'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      
                      {/* Workflow State Badge */}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          finding.workflow_state === 'REWARDED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : finding.workflow_state === 'ACCEPTED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : finding.workflow_state === 'REPORTED'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : finding.workflow_state === 'DUPLICATE' || finding.workflow_state === 'NOT_APPLICABLE'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {finding.workflow_state.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* Vulnerability Type */}
                    {finding.vulnerability_type && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Type:</span> {finding.vulnerability_type}
                      </p>
                    )}
                    
                    {/* Target */}
                    {finding.target && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                        <span className="font-medium">Target:</span> {finding.target.name}
                      </p>
                    )}
                    
                    {/* CVSS Score */}
                    {finding.cvss_score && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">CVSS:</span> {finding.cvss_score.toFixed(1)}
                      </p>
                    )}
                    
                    {/* Reward */}
                    {finding.reward_amount && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        💰 {finding.reward_amount}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {finding.tags && finding.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {finding.tags.slice(0, 5).map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {finding.tags.length > 5 && (
                          <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                            +{finding.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Date */}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                      Created {new Date(finding.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Severity Icon */}
                  <div className="ml-4 text-2xl">
                    {finding.severity === 'CRITICAL' && '🔴'}
                    {finding.severity === 'HIGH' && '🟠'}
                    {finding.severity === 'MEDIUM' && '🟡'}
                    {finding.severity === 'LOW' && '🔵'}
                    {finding.severity === 'INFO' && '⚪'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

