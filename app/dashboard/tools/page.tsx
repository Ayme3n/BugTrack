'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type ToolJob = {
  id: string;
  tool_name: string;
  target_input: string;
  status: string;
  result_count: number | null;
  created_at: string;
  completed_at: string | null;
  duration_ms: number | null;
};

const TOOLS = [
  {
    name: 'SUBFINDER',
    icon: '🔍',
    title: 'Subfinder',
    description: 'Discover subdomains for a target domain',
    placeholder: 'example.com',
    color: 'blue'
  },
  {
    name: 'HTTPX',
    icon: '🌐',
    title: 'Httpx',
    description: 'HTTP probing and analysis',
    placeholder: 'https://example.com',
    color: 'green'
  },
  {
    name: 'NUCLEI',
    icon: '⚡',
    title: 'Nuclei',
    description: 'Vulnerability scanner',
    placeholder: 'https://example.com',
    color: 'red'
  }
];

export default function ToolsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [selectedTool, setSelectedTool] = useState('SUBFINDER');
  const [targetInput, setTargetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentJobs, setRecentJobs] = useState<ToolJob[]>([]);

  useEffect(() => {
    fetchRecentJobs();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchRecentJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRecentJobs() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/tools/jobs');
      if (response.ok) {
        const jobs = await response.json();
        setRecentJobs(jobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/tools/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: selectedTool,
          target_input: targetInput
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create job');
      }

      // Reset form
      setTargetInput('');
      
      // Refresh jobs list
      fetchRecentJobs();
      
      // Show success
      alert('✅ Job queued successfully! The runner will process it shortly.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedToolConfig = TOOLS.find(t => t.name === selectedTool);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🛠️ Tool Integration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Run security tools using Docker containers. Make sure the runner service is running locally.
        </p>
      </div>

      {/* Tool Selection & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left: Tool Selection */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Tool
          </h2>
          <div className="space-y-3">
            {TOOLS.map((tool) => (
              <button
                key={tool.name}
                onClick={() => setSelectedTool(tool.name)}
                className={`w-full text-left p-4 border-2 rounded-lg transition-all ${
                  selectedTool === tool.name
                    ? `border-${tool.color}-500 bg-${tool.color}-50 dark:bg-${tool.color}-900/20`
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{tool.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {tool.description}
                    </p>
                  </div>
                  {selectedTool === tool.name && (
                    <span className="text-green-500">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Job Form */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Configure & Run
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target
              </label>
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder={selectedToolConfig?.placeholder}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedTool === 'SUBFINDER' && 'Enter a domain name (e.g., example.com)'}
                {selectedTool === 'HTTPX' && 'Enter a URL (e.g., https://example.com)'}
                {selectedTool === 'NUCLEI' && 'Enter a URL to scan for vulnerabilities'}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !targetInput}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? '⏳ Queuing Job...' : `▶️ Run ${selectedToolConfig?.title}`}
            </button>
          </form>

          {/* Runner Status */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              📡 Runner Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Jobs are processed by the local runner service. Make sure it's running:
            </p>
            <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto">
              cd runner{'\n'}npm start
            </pre>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Jobs
          </h2>
          <button
            onClick={fetchRecentJobs}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No jobs yet. Run your first tool scan above! 🚀
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Tool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Results
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {job.tool_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {job.target_input}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        job.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        job.status === 'RUNNING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        job.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {job.result_count !== null ? job.result_count : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(1)}s` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/tools/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

