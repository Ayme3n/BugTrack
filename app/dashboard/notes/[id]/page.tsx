'use client';

/**
 * View Encrypted Note Page
 * Decrypts and displays note content client-side
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { decrypt, importKey } from '@/lib/crypto/encryption';

const ENCRYPTION_KEY_STORAGE = 'bugtrack_encryption_key';

interface Note {
  id: string;
  title: string;
  encrypted_content: string;
  encryption_iv: string;
  content_hash?: string;
  tags: string[];
  is_favorite: boolean;
  color?: string;
  created_at: string;
  updated_at: string;
}

export default function ViewNotePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter();
  const supabase = createClient();
  
  const [noteId, setNoteId] = useState<string>('');
  const [note, setNote] = useState<Note | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAndDecryptNote() {
      try {
        // Unwrap params promise
        const resolvedParams = await params;
        setNoteId(resolvedParams.id);

        // Fetch note data
        const { data: fetchedNote, error: fetchError } = await supabase
          .from('notes')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();

        if (fetchError) throw fetchError;

        if (!fetchedNote) {
          setError('Note not found');
          setLoading(false);
          return;
        }

        setNote(fetchedNote);
        setLoading(false);

        // Start decryption
        await decryptNote(fetchedNote);

        // Update last_accessed_at
        await supabase
          .from('notes')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('id', resolvedParams.id);
      } catch (err: any) {
        console.error('Error fetching note:', err);
        setError(err.message || 'Failed to fetch note');
        setLoading(false);
      }
    }

    fetchAndDecryptNote();
  }, [supabase, params]);

  const decryptNote = async (noteData: Note) => {
    try {
      setDecrypting(true);
      
      // Load encryption key from localStorage
      const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
      
      if (!storedKey) {
        throw new Error('Encryption key not found. Cannot decrypt note.');
      }

      const key = await importKey(storedKey);
      
      // Decrypt content
      const decrypted = await decrypt(
        noteData.encrypted_content,
        noteData.encryption_iv,
        key
      );
      
      setDecryptedContent(decrypted);
      setDecrypting(false);
    } catch (err: any) {
      console.error('Decryption error:', err);
      setError('Failed to decrypt note. Make sure you\'re using the same encryption key.');
      setDecrypting(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    
    if (!confirm(`Are you sure you want to delete "${note.title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;

      router.push('/dashboard/notes');
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="max-w-5xl mx-auto">
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

  if (!note) return null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/notes"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Notes
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {note.title}
            </h1>
            <div className="flex flex-wrap gap-2 items-center">
              {note.color && (
                <span 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: note.color }}
                  title="Color label"
                />
              )}
              {note.is_favorite && (
                <span className="text-yellow-500" title="Favorite">⭐</span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                🔐 Encrypted with AES-256-GCM
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link
              href={`/dashboard/notes/${note.id}/edit`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              ✏️ Edit
            </Link>
            
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {note.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Decryption Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Content
          </h2>
          {decrypting && (
            <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
              Decrypting...
            </span>
          )}
        </div>

        {decrypting ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p>Decrypting content...</p>
          </div>
        ) : decryptedContent ? (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              {decryptedContent}
            </pre>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">
            Failed to decrypt content
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Metadata
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Created</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {new Date(note.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Last Updated</p>
            <p className="text-gray-900 dark:text-white font-medium">
              {new Date(note.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

