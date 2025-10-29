'use client';

/**
 * Encrypted Notes Page
 * Client-side encrypted note-taking with AES-256-GCM
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  tags: string[];
  is_favorite: boolean;
  color?: string;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [showFavoritesOnly]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('notes')
        .select('id, title, tags, is_favorite, color, last_accessed_at, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (showFavoritesOnly) {
        query = query.eq('is_favorite', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
      setError(err.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (note: Note) => {
    try {
      const newFavoriteStatus = !note.is_favorite;
      
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', note.id);

      if (error) throw error;

      setNotes(notes.map(n => 
        n.id === note.id ? { ...n, is_favorite: newFavoriteStatus } : n
      ));
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite status');
    }
  };

  const handleDeleteNote = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== id));
    } catch (err: any) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note');
    }
  };

  // Filter notes by search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(search) ||
      note.tags.some(tag => tag.toLowerCase().includes(search))
    );
  });

  const colors = [
    { value: '#ff6b6b', label: 'Red' },
    { value: '#feca57', label: 'Yellow' },
    { value: '#48dbfb', label: 'Blue' },
    { value: '#1dd1a1', label: 'Green' },
    { value: '#a29bfe', label: 'Purple' },
    { value: '#fd79a8', label: 'Pink' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🔒 Encrypted Notes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Client-side encrypted with AES-256-GCM
            </p>
          </div>
          <Link
            href="/dashboard/notes/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            + New Note
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Notes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{notes.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {notes.filter(n => n.is_favorite).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tags</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {new Set(notes.flatMap(n => n.tags)).size}
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
                placeholder="Search notes by title or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

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

      {/* Security Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Zero-Knowledge Encryption
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All note content is encrypted in your browser using AES-256-GCM. The server never sees your plain-text data.
              Your encryption key is stored securely in your browser's local storage.
            </p>
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
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || showFavoritesOnly ? 'No notes found' : 'No notes yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || showFavoritesOnly
              ? 'Try adjusting your filters'
              : 'Create your first encrypted note to get started'}
          </p>
          {!searchQuery && !showFavoritesOnly && (
            <Link
              href="/dashboard/notes/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              + Create Note
            </Link>
          )}
        </div>
      ) : (
        /* Notes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Link
              key={note.id}
              href={`/dashboard/notes/${note.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-4"
              style={{ borderLeft: note.color ? `4px solid ${note.color}` : undefined }}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                  {note.title}
                </h3>
                
                {/* Favorite Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleFavorite(note);
                  }}
                  className="text-xl hover:scale-110 transition-transform ml-2"
                  title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {note.is_favorite ? '⭐' : '☆'}
                </button>
              </div>

              {/* Encrypted indicator */}
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
                <span>🔐</span>
                <span>Encrypted content</span>
              </div>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-xs px-2 py-0.5 text-gray-500">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteNote(note.id, note.title);
                  }}
                  className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

