'use client';

/**
 * Edit Encrypted Note Page
 * Decrypts, allows editing, then re-encrypts content
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { encrypt, decrypt, hash, importKey } from '@/lib/crypto/encryption';

const ENCRYPTION_KEY_STORAGE = 'bugtrack_encryption_key';

export default function EditNotePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const supabase = createClient();
  
  const [noteId, setNoteId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    color: '',
    is_favorite: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);

  const colors = [
    { value: '', label: 'No Color' },
    { value: '#ff6b6b', label: '🔴 Red' },
    { value: '#feca57', label: '🟡 Yellow' },
    { value: '#48dbfb', label: '🔵 Blue' },
    { value: '#1dd1a1', label: '🟢 Green' },
    { value: '#a29bfe', label: '🟣 Purple' },
    { value: '#fd79a8', label: '🌸 Pink' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        // Load encryption key
        const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
        if (!storedKey) {
          setError('Encryption key not found. Cannot decrypt note.');
          setLoading(false);
          return;
        }

        const key = await importKey(storedKey);
        setEncryptionKey(key);

        // Unwrap params promise
        const resolvedParams = await params;
        setNoteId(resolvedParams.id);

        // Fetch note data
        const { data: note, error: fetchError } = await supabase
          .from('notes')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (fetchError) throw fetchError;

        if (!note) {
          setError('Note not found');
          setLoading(false);
          return;
        }

        // Decrypt content
        const decrypted = await decrypt(
          note.encrypted_content,
          note.encryption_iv,
          key
        );

        // Populate form
        setFormData({
          title: note.title,
          content: decrypted,
          tags: (note.tags || []).join(', '),
          color: note.color || '',
          is_favorite: note.is_favorite,
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching note:', err);
        setError(err.message || 'Failed to fetch note');
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (!encryptionKey) {
      setError('Encryption key not available');
      return;
    }

    try {
      setSubmitting(true);

      // Re-encrypt content
      const { encrypted, iv } = await encrypt(formData.content, encryptionKey);
      
      // Generate new content hash
      const contentHash = await hash(formData.content);

      // Parse tags (comma-separated)
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error: updateError } = await supabase
        .from('notes')
        .update({
          title: formData.title.trim(),
          encrypted_content: encrypted,
          encryption_iv: iv,
          content_hash: contentHash,
          tags,
          color: formData.color || null,
          is_favorite: formData.is_favorite,
        })
        .eq('id', noteId);

      if (updateError) throw updateError;

      router.push(`/dashboard/notes/${noteId}`);
    } catch (err: any) {
      console.error('Error updating note:', err);
      setError(err.message || 'Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
        <Link
          href="/dashboard/notes"
          className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/notes/${noteId}`}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Note
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ✏️ Edit Encrypted Note
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Content will be re-encrypted before saving
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Admin Credentials, Private Research Notes"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content <span className="text-red-500">*</span> <span className="text-green-600">🔐 Encrypted</span>
          </label>
          <textarea
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Write your sensitive information here..."
            rows={15}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="e.g., credentials, research, important (comma-separated)"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color Label
          </label>
          <select
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {colors.map(color => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </div>

        {/* Favorite Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_favorite}
              onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              ⭐ Mark as favorite
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {submitting ? '🔐 Re-encrypting & Saving...' : '💾 Save Changes'}
          </button>
          <Link
            href={`/dashboard/notes/${noteId}`}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

