'use client';

/**
 * Create New Finding Page
 * Form to document a new vulnerability discovery
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

// Dynamically import markdown editor to avoid SSR issues
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import 'easymde/dist/easymde.min.css';

export default function NewFindingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [targets, setTargets] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    severity: 'MEDIUM',
    workflow_state: 'DRAFT',
    cvss_score: '',
    vulnerability_type: '',
    target_id: '',
    description_md: '',
    impact: '',
    reproduction_steps: '',
    remediation: '',
    references: '',
    tags: '',
    reward_amount: '',
  });

  // Memoized markdown editor onChange handler
  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description_md: value }));
  }, []);

  // Memoized editor options
  const editorOptions = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Describe the vulnerability in detail...',
    status: false,
    toolbar: ['bold', 'italic', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', 'image', '|', 'preview', 'side-by-side', 'fullscreen', '|', 'guide'],
  }), []);

  // Fetch user's targets
  useEffect(() => {
    async function fetchTargets() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('targets')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (!error && data) {
        setTargets(data);
      }
    }
    fetchTargets();
  }, [supabase]);

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

      // Validate required fields
      if (!formData.title || !formData.description_md) {
        setError('Title and description are required');
        setLoading(false);
        return;
      }

      // Parse arrays
      const referencesArray = formData.references
        ? formData.references.split('\n').filter((r) => r.trim())
        : [];
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((t) => t.trim()).filter((t) => t)
        : [];

      // Insert finding
      const { data, error: insertError } = await supabase
        .from('findings')
        .insert({
          user_id: user.id,
          target_id: formData.target_id || null,
          title: formData.title,
          severity: formData.severity,
          workflow_state: formData.workflow_state,
          cvss_score: formData.cvss_score ? parseFloat(formData.cvss_score) : null,
          vulnerability_type: formData.vulnerability_type || null,
          description_md: formData.description_md,
          impact: formData.impact || null,
          reproduction_steps: formData.reproduction_steps || null,
          remediation: formData.remediation || null,
          references: referencesArray,
          tags: tagsArray,
          reward_amount: formData.reward_amount || null,
          reported_at: formData.workflow_state === 'REPORTED' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirect to findings list or details
      router.push(`/dashboard/findings/${data.id}`);
    } catch (err: any) {
      console.error('Error creating finding:', err);
      setError(err.message || 'Failed to create finding');
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Document New Finding
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Record your vulnerability discovery with detailed information
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Stored XSS in User Profile Name Field"
                required
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target (Optional)
              </label>
              <select
                value={formData.target_id}
                onChange={(e) => setFormData({ ...formData, target_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- None --</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row: Severity, Workflow State, Vulnerability Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Severity *
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🔵 Low</option>
                  <option value="INFO">⚪ Info</option>
                </select>
              </div>

              {/* Workflow State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.workflow_state}
                  onChange={(e) => setFormData({ ...formData, workflow_state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="TESTING">Testing</option>
                  <option value="REPORTED">Reported</option>
                  <option value="TRIAGED">Triaged</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="FIXED">Fixed</option>
                  <option value="DUPLICATE">Duplicate</option>
                  <option value="NOT_APPLICABLE">Not Applicable</option>
                  <option value="REWARDED">Rewarded</option>
                </select>
              </div>

              {/* CVSS Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CVSS Score (0-10)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.cvss_score}
                  onChange={(e) => setFormData({ ...formData, cvss_score: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="7.5"
                />
              </div>
            </div>

            {/* Vulnerability Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Vulnerability Type
              </label>
              <input
                type="text"
                value={formData.vulnerability_type}
                onChange={(e) => setFormData({ ...formData, vulnerability_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., XSS, SQL Injection, IDOR, CSRF, etc."
              />
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Description * (Markdown supported)
          </h2>
          <SimpleMDE
            value={formData.description_md}
            onChange={handleDescriptionChange}
            options={editorOptions}
          />
        </div>

        {/* Impact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Impact
          </h2>
          <textarea
            value={formData.impact}
            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={4}
            placeholder="What is the potential impact of this vulnerability?"
          />
        </div>

        {/* Reproduction Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Steps to Reproduce
          </h2>
          <textarea
            value={formData.reproduction_steps}
            onChange={(e) => setFormData({ ...formData, reproduction_steps: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={6}
            placeholder="1. Go to https://example.com/profile&#10;2. Enter payload in name field: <script>alert(1)</script>&#10;3. Save profile&#10;4. Navigate to profile page&#10;5. XSS executes"
          />
        </div>

        {/* Remediation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recommended Remediation
          </h2>
          <textarea
            value={formData.remediation}
            onChange={(e) => setFormData({ ...formData, remediation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={4}
            placeholder="How should this vulnerability be fixed?"
          />
        </div>

        {/* Additional Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Information
          </h2>
          
          <div className="space-y-4">
            {/* References */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                References (one per line)
              </label>
              <textarea
                value={formData.references}
                onChange={(e) => setFormData({ ...formData, references: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="https://owasp.org/www-community/attacks/xss/&#10;https://cwe.mitre.org/data/definitions/79.html"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="xss, web, critical, user-input"
              />
            </div>

            {/* Reward Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reward Amount (if applicable)
              </label>
              <input
                type="text"
                value={formData.reward_amount}
                onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="$500"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Finding'}
          </button>
          <Link
            href="/dashboard/findings"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

