/**
 * Dashboard Home Page
 */

import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.user_metadata?.name || user?.email}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your security research overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Targets */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Targets
            </h3>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Active programs
          </p>
        </div>

        {/* Findings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Findings
            </h3>
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Documented vulnerabilities
          </p>
        </div>

        {/* Payloads */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Payloads
            </h3>
            <span className="text-2xl">💉</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Saved payloads
          </p>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Notes
            </h3>
            <span className="text-2xl">🔒</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Encrypted notes
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/targets/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Add Target
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start a new program
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/findings/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <span className="text-2xl">🔍</span>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Log Finding
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Document a vulnerability
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/payloads/new"
            className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <span className="text-2xl">💉</span>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Save Payload
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add to your library
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🚀 Getting Started
        </h2>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          Welcome to BugTrack! Here's how to get started:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
          <li>Add your first target or bug bounty program</li>
          <li>Document your findings with markdown and attachments</li>
          <li>Build your payload library for quick access</li>
          <li>Use encrypted notes for sensitive information</li>
        </ol>
        <a
          href="/docs"
          className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Read the full documentation →
        </a>
      </div>
    </div>
  );
}

