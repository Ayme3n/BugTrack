/**
 * Setup Notifications System
 * Run this script to create the notifications table and test notification
 * 
 * Usage: node setup-notifications.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role to bypass RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function setup() {
  console.log('🚀 Setting up notifications system...\n');

  try {
    // Step 1: Create enum type
    console.log('1️⃣ Creating NotificationType enum...');
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
            CREATE TYPE "NotificationType" AS ENUM (
              'FINDING_CREATED',
              'FINDING_UPDATED',
              'TARGET_ADDED',
              'PAYLOAD_USED',
              'SYSTEM',
              'ACHIEVEMENT',
              'REMINDER'
            );
          END IF;
        END $$;
      `
    });
    
    if (enumError) {
      console.log('   ℹ️  Enum might already exist (this is okay)');
    } else {
      console.log('   ✅ Enum created\n');
    }

    // Step 2: Create notifications table
    console.log('2️⃣ Creating notifications table...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link_url TEXT,
        icon TEXT,
        is_read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.log('   ℹ️  Table might already exist');
    } else {
      console.log('   ✅ Table created\n');
    }

    // Step 3: Create indexes
    console.log('3️⃣ Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);',
    ];

    for (const sql of indexes) {
      await supabase.rpc('exec_sql', { sql });
    }
    console.log('   ✅ Indexes created\n');

    // Step 4: Enable RLS
    console.log('4️⃣ Enabling Row Level Security...');
    await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;' 
    });
    console.log('   ✅ RLS enabled\n');

    // Step 5: Create RLS policies
    console.log('5️⃣ Creating RLS policies...');
    
    const policies = [
      `DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;`,
      `CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);`,
      
      `DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;`,
      `CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);`,
      
      `DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;`,
      `CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid()::text = user_id::text);`,
      
      `DROP POLICY IF EXISTS "System can create notifications" ON notifications;`,
      `CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);`,
    ];

    for (const sql of policies) {
      await supabase.rpc('exec_sql', { sql });
    }
    console.log('   ✅ RLS policies created\n');

    // Step 6: Get current user and create test notification
    console.log('6️⃣ Creating test notification...');
    
    // Get the first user from auth.users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();

    if (usersError || !users) {
      console.log('   ⚠️  No users found. Please register a user first.');
      console.log('   ℹ️  You can create notifications manually later.\n');
    } else {
      const userId = users.id;
      
      const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'SYSTEM',
          title: 'Welcome to BugTrack! 🎉',
          message: 'Your notification system is now set up and ready to use!',
          link_url: '/dashboard',
          icon: '🎯',
          metadata: { test: true }
        })
        .select()
        .single();

      if (notifError) {
        console.log('   ⚠️  Error creating test notification:', notifError.message);
      } else {
        console.log('   ✅ Test notification created!');
        console.log('   📧 User ID:', userId);
        console.log('   🔔 Notification ID:', notification.id);
        console.log('');
      }
    }

    console.log('🎉 Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Go to http://localhost:3001/dashboard');
    console.log('2. Check the bell icon in the header');
    console.log('3. You should see a notification badge!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();

