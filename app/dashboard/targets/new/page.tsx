'use client';

/**
 * Create New Target Page
 * Form to add a new bug bounty program or pentest target
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewTargetPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    program_type: 'BUG_BOUNTY',
    url: '',
    platform: '',
    status: 'ACTIVE',
    priority: 2,
    reward_range: '',
    notes: '',
    tags: '',
    inScopeUrls: '',
    outOfScopeUrls: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Parse scope JSON
      const scopeJson = {
        inScope: formData.inScopeUrls
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.trim()),
        outOfScope: formData.outOfScopeUrls
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.trim()),
      };

      // Parse tags
      const tags = formData.tags
        .split(',')
        .filter((tag) => tag.trim())
        .map((tag) => tag.trim());

      // Insert target
      const { data, error: insertError } = await supabase
        .from('targets')
        .insert({
          user_id: user.id,
          name: formData.name,
          program_type: formData.program_type,
          url: formData.url || null,
          platform: formData.platform || null,
          status: formData.status,
          priority: formData.priority,
          reward_range: formData.reward_range || null,
          notes: formData.notes || null,
          tags: tags.length > 0 ? tags : null,
          scope_json: scopeJson,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirect to targets list
      router.push('/dashboard/targets');
    } catch (err: any) {
      console.error('Error creating target:', err);
      setError(err.message || 'Failed to create target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/targets"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Targets
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Add New Target
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create a new bug bounty program or pentesting target
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., HackerOne Platform, ACME Corp Pentest"
            />
          </div>

          {/* Program Type */}
          <div>
            <label htmlFor="program_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Program Type <span className="text-red-500">*</span>
            </label>
            <select
              id="program_type"
              required
              value={formData.program_type}
              onChange={(e) => setFormData({ ...formData, program_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="BUG_BOUNTY">Bug Bounty</option>
              <option value="VDP">VDP (Vulnerability Disclosure Program)</option>
              <option value="PENTEST">Penetration Test</option>
              <option value="PERSONAL">Personal Project</option>
              <option value="CTF">CTF (Capture The Flag)</option>
            </select>
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target URL
            </label>
            <input
              type="url"
              id="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="https://example.com"
            />
          </div>

          {/* Platform */}
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Platform
            </label>
            <input
              type="text"
              id="platform"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="e.g., HackerOne, Bugcrowd, Private, Intigriti"
            />
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value={1}>🔴 High</option>
              <option value={2}>🟡 Medium</option>
              <option value={3}>🟢 Low</option>
            </select>
          </div>

          {/* Reward Range */}
          <div>
            <label htmlFor="reward_range" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reward Range
            </label>
            <input
              type="text"
              id="reward_range"
              value={formData.reward_range}
              onChange={(e) => setFormData({ ...formData, reward_range: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="$500-$10,000"
            />
          </div>
        </div>

        {/* Scope */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scope Definition
          </h2>

          {/* In Scope */}
          <div>
            <label htmlFor="inScopeUrls" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              In Scope (one per line)
            </label>
            <textarea
              id="inScopeUrls"
              rows={5}
              value={formData.inScopeUrls}
              onChange={(e) => setFormData({ ...formData, inScopeUrls: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="https://example.com&#10;https://*.example.com&#10;https://api.example.com"
            />
          </div>

          {/* Out of Scope */}
          <div>
            <label htmlFor="outOfScopeUrls" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Out of Scope (one per line)
            </label>
            <textarea
              id="outOfScopeUrls"
              rows={5}
              value={formData.outOfScopeUrls}
              onChange={(e) => setFormData({ ...formData, outOfScopeUrls: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="https://example.com/admin&#10;https://test.example.com&#10;https://staging.example.com"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Additional Information
          </h2>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="web, api, mobile, high-value"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Any additional notes about this target..."
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/dashboard/targets"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Target'}
          </button>
        </div>
      </form>
    </div>
  );
}

