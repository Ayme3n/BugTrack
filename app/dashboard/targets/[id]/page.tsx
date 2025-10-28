/**
 * Target Details Page
 * View individual target information and scope
 */

import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function TargetDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch target
  const { data: target, error } = await supabase
    .from('targets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !target) {
    notFound();
  }

  const scope = target.scope_json as { inScope?: string[]; outOfScope?: string[] };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/targets"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Targets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {target.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
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
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                {target.program_type.replace('_', ' ')}
              </span>
              {target.priority === 1 && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  🔴 High Priority
                </span>
              )}
              {target.priority === 2 && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  🟡 Medium Priority
                </span>
              )}
              {target.priority === 3 && (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  🟢 Low Priority
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/dashboard/targets/${target.id}/edit`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <dl className="space-y-3">
              {target.url && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">URL</dt>
                  <dd className="mt-1">
                    <a
                      href={target.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {target.url} ↗
                    </a>
                  </dd>
                </div>
              )}
              {target.platform && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Platform</dt>
                  <dd className="mt-1 text-gray-900 dark:text-white">{target.platform}</dd>
                </div>
              )}
              {target.reward_range && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Reward Range
                  </dt>
                  <dd className="mt-1 text-green-600 dark:text-green-400 font-medium">
                    💰 {target.reward_range}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {new Date(target.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Scope */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Scope Definition
            </h2>
            
            {/* In Scope */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
                ✅ In Scope
              </h3>
              {scope?.inScope && scope.inScope.length > 0 ? (
                <ul className="space-y-2">
                  {scope.inScope.map((item, index) => (
                    <li
                      key={index}
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-3 py-2 text-sm font-mono text-gray-900 dark:text-white"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No in-scope items defined
                </p>
              )}
            </div>

            {/* Out of Scope */}
            <div>
              <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                ❌ Out of Scope
              </h3>
              {scope?.outOfScope && scope.outOfScope.length > 0 ? (
                <ul className="space-y-2">
                  {scope.outOfScope.map((item, index) => (
                    <li
                      key={index}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2 text-sm font-mono text-gray-900 dark:text-white"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                  No out-of-scope items defined
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {target.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notes
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {target.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          {target.tags && target.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {target.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Findings</dt>
                <dd className="text-2xl font-bold text-gray-900 dark:text-white">0</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Last Updated</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(target.updated_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href={`/findings/new?targetId=${target.id}`}
                className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
              >
                Add Finding
              </Link>
              <Link
                href={`/dashboard/targets/${target.id}/edit`}
                className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Edit Target
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

