'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  targets: Array<{
    id: string;
    name: string;
    url: string;
    platform: string;
    status: string;
    created_at: string;
  }>;
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    workflow_state: string;
    created_at: string;
  }>;
  payloads: Array<{
    id: string;
    title: string;
    category: string;
    content: string;
    created_at: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    created_at: string;
  }>;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    targets: [],
    findings: [],
    payloads: [],
    notes: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Flatten results for keyboard navigation
  const flatResults = [
    ...results.targets.map((item) => ({ type: 'target', ...item })),
    ...results.findings.map((item) => ({ type: 'finding', ...item })),
    ...results.payloads.map((item) => ({ type: 'payload', ...item })),
    ...results.notes.map((item) => ({ type: 'note', ...item })),
  ];

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ targets: [], findings: [], payloads: [], notes: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok && data.results) {
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults({ targets: [], findings: [], payloads: [], notes: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter' && flatResults.length > 0) {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        if (selected) {
          navigateToItem(selected);
        }
      }
    },
    [flatResults, selectedIndex, onClose]
  );

  const navigateToItem = (item: any) => {
    let path = '';
    switch (item.type) {
      case 'target':
        path = `/dashboard/targets/${item.id}`;
        break;
      case 'finding':
        path = `/dashboard/findings/${item.id}`;
        break;
      case 'payload':
        path = `/dashboard/payloads`;
        break;
      case 'note':
        path = `/dashboard/notes/${item.id}`;
        break;
    }
    if (path) {
      router.push(path);
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalResults = flatResults.length;
  const hasResults = totalResults > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search targets, findings, payloads, notes..."
            className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {loading && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm">Type to search across all your data</p>
              <p className="text-xs mt-1">Targets • Findings • Payloads • Notes</p>
            </div>
          )}

          {query.length >= 2 && !loading && !hasResults && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">No results found for &quot;{query}&quot;</p>
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {/* Targets */}
              {results.targets.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Targets
                  </div>
                  {results.targets.map((target, idx) => {
                    const flatIndex = flatResults.findIndex(
                      (r) => r.type === 'target' && r.id === target.id
                    );
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <button
                        key={target.id}
                        onClick={() => navigateToItem({ type: 'target', ...target })}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-purple-600 dark:text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {target.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {target.url}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            target.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {target.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Findings */}
              {results.findings.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Findings
                  </div>
                  {results.findings.map((finding) => {
                    const flatIndex = flatResults.findIndex(
                      (r) => r.type === 'finding' && r.id === finding.id
                    );
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <button
                        key={finding.id}
                        onClick={() => navigateToItem({ type: 'finding', ...finding })}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            finding.severity === 'critical'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : finding.severity === 'high'
                              ? 'bg-orange-100 dark:bg-orange-900/30'
                              : finding.severity === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}
                        >
                          <svg
                            className={`w-4 h-4 ${
                              finding.severity === 'critical'
                                ? 'text-red-600 dark:text-red-400'
                                : finding.severity === 'high'
                                ? 'text-orange-600 dark:text-orange-400'
                                : finding.severity === 'medium'
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {finding.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {finding.severity} • {finding.workflow_state.replace('_', ' ')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Payloads */}
              {results.payloads.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Payloads
                  </div>
                  {results.payloads.map((payload) => {
                    const flatIndex = flatResults.findIndex(
                      (r) => r.type === 'payload' && r.id === payload.id
                    );
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <button
                        key={payload.id}
                        onClick={() => navigateToItem({ type: 'payload', ...payload })}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-green-600 dark:text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {payload.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payload.category}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Notes */}
              {results.notes.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Notes
                  </div>
                  {results.notes.map((note) => {
                    const flatIndex = flatResults.findIndex(
                      (r) => r.type === 'note' && r.id === note.id
                    );
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <button
                        key={note.id}
                        onClick={() => navigateToItem({ type: 'note', ...note })}
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {note.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Encrypted note
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {hasResults && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> Navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd> Select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd> Close
              </span>
            </div>
            <span>{totalResults} results</span>
          </div>
        )}
      </div>
    </div>
  );
}

