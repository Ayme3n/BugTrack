'use client';

/**
 * Dashboard Client Layout Wrapper
 * Wraps the dashboard content in client-side components
 */

import type { User } from '@supabase/supabase-js';
import DashboardNav from '@/components/features/dashboard/DashboardNav';
import DashboardHeader from '@/components/features/dashboard/DashboardHeader';

interface DashboardClientLayoutProps {
  user: User;
  children: React.ReactNode;
}

export default function DashboardClientLayout({ user, children }: DashboardClientLayoutProps) {
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

