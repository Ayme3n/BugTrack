'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DeleteButtonProps {
  findingId: string;
  findingTitle: string;
}

export default function DeleteButton({ findingId, findingTitle }: DeleteButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${findingTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('findings')
        .delete()
        .eq('id', findingId);

      if (error) throw error;

      router.push('/dashboard/findings');
      router.refresh();
    } catch (err: any) {
      console.error('Error deleting finding:', err);
      alert('Failed to delete finding: ' + (err.message || 'Unknown error'));
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
      title="Delete finding"
    >
      {deleting ? '🗑️ Deleting...' : '🗑️ Delete'}
    </button>
  );
}

