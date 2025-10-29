/**
 * Dashboard Layout - Main app layout with sidebar navigation
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import DashboardClientLayout from '@/components/layouts/DashboardClientLayout';

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

  return <DashboardClientLayout user={user}>{children}</DashboardClientLayout>;
}

