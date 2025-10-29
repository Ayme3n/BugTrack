'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DeleteButtonProps {
  targetId: string;
  targetName: string;
}

export default function DeleteButton({ targetId, targetName }: DeleteButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${targetName}"?\n\nThis will also delete all associated findings.\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('targets')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      router.push('/dashboard/targets');
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting target:', err);
      alert('Failed to delete target: ' + (err.message || 'Unknown error'));
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
      title="Delete target"
    >
      {deleting ? '🗑️ Deleting...' : '🗑️ Delete'}
    </button>
  );
}

