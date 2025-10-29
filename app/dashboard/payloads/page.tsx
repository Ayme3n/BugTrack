'use client';

/**
 * Payload Library Page
 * Manage and organize attack payloads with quick-copy functionality
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Payload {
  id: string;
  category: string;
  title: string;
  content: string;
  description?: string;
  tags: string[];
  is_encrypted: boolean;
  is_favorite: boolean;
  usage_count: number;
  language?: string;
  source_url?: string;
  created_at: string;
}

export default function PayloadsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [payloads, setPayloads] = useState<Payload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Category definitions with emojis
  const categories = [
    { value: 'ALL', label: 'All Categories', emoji: '📚' },
    { value: 'XSS', label: 'XSS', emoji: '🔴' },
    { value: 'SQLI', label: 'SQL Injection', emoji: '🗃️' },
    { value: 'COMMAND_INJECTION', label: 'Command Injection', emoji: '⚡' },
    { value: 'SSRF', label: 'SSRF', emoji: '🌐' },
    { value: 'XXE', label: 'XXE', emoji: '📄' },
    { value: 'LFI_RFI', label: 'LFI/RFI', emoji: '📁' },
    { value: 'IDOR', label: 'IDOR', emoji: '🔓' },
    { value: 'CSRF', label: 'CSRF', emoji: '🔗' },
    { value: 'AUTH_BYPASS', label: 'Auth Bypass', emoji: '🚪' },
    { value: 'DESERIALIZATION', label: 'Deserialization', emoji: '📦' },
    { value: 'TEMPLATE_INJECTION', label: 'Template Injection', emoji: '📝' },
    { value: 'LDAP_INJECTION', label: 'LDAP Injection', emoji: '👥' },
    { value: 'NOSQL_INJECTION', label: 'NoSQL Injection', emoji: '🍃' },
    { value: 'PROTOTYPE_POLLUTION', label: 'Prototype Pollution', emoji: '🧬' },
    { value: 'RACE_CONDITION', label: 'Race Condition', emoji: '🏁' },
    { value: 'RECON_COMMAND', label: 'Recon Command', emoji: '🔍' },
    { value: 'FUZZING_WORDLIST', label: 'Fuzzing/Wordlist', emoji: '🎲' },
    { value: 'CUSTOM_SCRIPT', label: 'Custom Script', emoji: '🛠️' },
    { value: 'OTHER', label: 'Other', emoji: '📌' },
  ];

  useEffect(() => {
    fetchPayloads();
  }, [selectedCategory, showFavoritesOnly]);

  const fetchPayloads = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payloads')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'ALL') {
        query = query.eq('category', selectedCategory);
      }

      if (showFavoritesOnly) {
        query = query.eq('is_favorite', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayloads(data || []);
    } catch (err: any) {
      console.error('Error fetching payloads:', err);
      setError(err.message || 'Failed to fetch payloads');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPayload = async (payload: Payload) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload.content);
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement('textarea');
        textArea.value = payload.content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          textArea.remove();
        } catch (err) {
          console.error('Fallback copy failed:', err);
          textArea.remove();
          throw err;
        }
      }
      
      setCopiedId(payload.id);
      
      // Increment usage count
      await supabase
        .from('payloads')
        .update({ usage_count: payload.usage_count + 1 })
        .eq('id', payload.id);

      // Update local state
      setPayloads(payloads.map(p => 
        p.id === payload.id ? { ...p, usage_count: p.usage_count + 1 } : p
      ));

      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. Please try manually selecting and copying the text.');
    }
  };

  const handleToggleFavorite = async (payload: Payload) => {
    try {
      const newFavoriteStatus = !payload.is_favorite;
      
      const { error } = await supabase
        .from('payloads')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', payload.id);

      if (error) throw error;

      setPayloads(payloads.map(p => 
        p.id === payload.id ? { ...p, is_favorite: newFavoriteStatus } : p
      ));
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite status');
    }
  };

  const handleDeletePayload = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payload?')) return;

    try {
      const { error } = await supabase
        .from('payloads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPayloads(payloads.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting payload:', err);
      alert('Failed to delete payload');
    }
  };

  // Filter payloads by search query
  const filteredPayloads = payloads.filter(payload => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      payload.title.toLowerCase().includes(search) ||
      payload.description?.toLowerCase().includes(search) ||
      payload.tags.some(tag => tag.toLowerCase().includes(search)) ||
      payload.content.toLowerCase().includes(search)
    );
  });

  // Get category stats
  const getCategoryCount = (category: string) => {
    if (category === 'ALL') return payloads.length;
    return payloads.filter(p => p.category === category).length;
  };

  const getCategoryEmoji = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.emoji || '📌';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              💉 Payload Library
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Store and manage your attack payloads
            </p>
          </div>
          <Link
            href="/dashboard/payloads/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            + New Payload
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Payloads</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{payloads.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {payloads.filter(p => p.is_favorite).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {new Set(payloads.map(p => p.category)).size}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Uses</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {payloads.reduce((sum, p) => sum + p.usage_count, 0)}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search payloads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label} {cat.value !== 'ALL' ? `(${getCategoryCount(cat.value)})` : ''}
                </option>
              ))}
            </select>

            {/* Favorites Toggle */}
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">⭐ Favorites Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading payloads...</p>
        </div>
      ) : filteredPayloads.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">💉</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || showFavoritesOnly ? 'No payloads found' : 'No payloads yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || showFavoritesOnly
              ? 'Try adjusting your filters'
              : 'Create your first payload to get started'}
          </p>
          {!searchQuery && !showFavoritesOnly && (
            <Link
              href="/dashboard/payloads/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              + Create Payload
            </Link>
          )}
        </div>
      ) : (
        /* Payload Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayloads.map((payload) => (
            <div
              key={payload.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getCategoryEmoji(payload.category)}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {payload.title}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {payload.category.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Favorite Button */}
                <button
                  onClick={() => handleToggleFavorite(payload)}
                  className="text-2xl hover:scale-110 transition-transform"
                  title={payload.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {payload.is_favorite ? '⭐' : '☆'}
                </button>
              </div>

              {/* Description */}
              {payload.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {payload.description}
                </p>
              )}

              {/* Content Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 mb-3">
                <code className="text-xs text-gray-800 dark:text-gray-200 font-mono line-clamp-3 break-all">
                  {payload.is_encrypted ? '🔒 Encrypted payload' : payload.content}
                </code>
              </div>

              {/* Tags */}
              {payload.tags && payload.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {payload.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {payload.tags.length > 3 && (
                    <span className="text-xs px-2 py-0.5 text-gray-500">
                      +{payload.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Used {payload.usage_count} times
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyPayload(payload)}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      copiedId === payload.id
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title="Copy to clipboard"
                  >
                    {copiedId === payload.id ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  
                  <Link
                    href={`/dashboard/payloads/${payload.id}/edit`}
                    className="p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Edit"
                  >
                    ✏️
                  </Link>
                  
                  <button
                    onClick={() => handleDeletePayload(payload.id)}
                    className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

