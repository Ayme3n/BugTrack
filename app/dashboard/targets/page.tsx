/**
 * Targets List Page
 * Display all user's targets with filtering and search
 */

import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TargetsPage() {
  const supabase = await createServerSupabaseClient();
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's targets
  const { data: targets, error } = await supabase
    .from('targets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching targets:', error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🎯 Targets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your bug bounty programs and pentesting targets
            </p>
          </div>
          <Link
            href="/dashboard/targets/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Target
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Targets
            </h3>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {targets?.length || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            All programs
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active
            </h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-500">
            {targets?.filter((t) => t.status === 'ACTIVE').length || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Currently testing
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Paused
            </h3>
            <span className="text-2xl">⏸️</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
            {targets?.filter((t) => t.status === 'PAUSED').length || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            On hold
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Completed
            </h3>
            <span className="text-2xl">🏁</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">
            {targets?.filter((t) => t.status === 'COMPLETED').length || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Finished
          </p>
        </div>
      </div>

      {/* Targets List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {!targets || targets.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <span className="text-5xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No targets yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Get started by adding your first bug bounty program or penetration testing target. Track scope, findings, and rewards all in one place.
            </p>
            <Link
              href="/dashboard/targets/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Target
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {targets.map((target) => (
              <Link
                key={target.id}
                href={`/dashboard/targets/${target.id}`}
                className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {target.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          target.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : target.status === 'PAUSED'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : target.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {target.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        {target.program_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {target.url && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {target.url}
                      </p>
                    )}
                    
                    {target.platform && (
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Platform: {target.platform}
                      </p>
                    )}
                    
                    {target.reward_range && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        💰 {target.reward_range}
                      </p>
                    )}
                    
                    {target.tags && target.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {target.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center gap-2">
                    {target.priority === 1 && (
                      <span className="text-red-500" title="High Priority">
                        🔴
                      </span>
                    )}
                    {target.priority === 2 && (
                      <span className="text-yellow-500" title="Medium Priority">
                        🟡
                      </span>
                    )}
                    {target.priority === 3 && (
                      <span className="text-green-500" title="Low Priority">
                        🟢
                      </span>
                    )}
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

