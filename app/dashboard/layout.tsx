/**
 * Dashboard Layout - Main app layout with sidebar navigation
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import DashboardNav from '@/components/features/dashboard/DashboardNav';
import DashboardHeader from '@/components/features/dashboard/DashboardHeader';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <DashboardNav user={user} />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <DashboardHeader user={user} />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

