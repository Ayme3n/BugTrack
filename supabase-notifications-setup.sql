-- ============================================================================
-- Notifications System Setup for Supabase
-- ============================================================================

-- Create NotificationType enum
CREATE TYPE "NotificationType" AS ENUM (
  'FINDING_CREATED',
  'FINDING_UPDATED',
  'TARGET_ADDED',
  'PAYLOAD_USED',
  'SYSTEM',
  'ACHIEVEMENT',
  'REMINDER'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type "NotificationType" NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  icon TEXT,
  
  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING (auth.uid()::text = user_id::text);

-- Policy: System can create notifications (for service role)
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type "NotificationType",
  p_title TEXT,
  p_message TEXT,
  p_link_url TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link_url,
    icon,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link_url,
    p_icon,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function: Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE user_id = p_user_id AND is_read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function: Delete old read notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE is_read = true
    AND read_at < NOW() - (p_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- Test/Sample Data (Optional - Comment out for production)
-- ============================================================================

-- Create sample notifications for testing
-- Replace 'YOUR_USER_ID' with an actual user ID from auth.users
/*
SELECT create_notification(
  'YOUR_USER_ID'::UUID,
  'SYSTEM'::NotificationType,
  'Welcome to BugTrack! 🎉',
  'Start by adding your first target or creating a finding.',
  '/dashboard/targets/new',
  '🎯',
  '{"action": "onboarding"}'::JSONB
);

SELECT create_notification(
  'YOUR_USER_ID'::UUID,
  'FINDING_CREATED'::NotificationType,
  'New Finding Created',
  'XSS vulnerability in login form',
  '/dashboard/findings/123',
  '⚠️',
  '{"severity": "high", "finding_id": "123"}'::JSONB
);
*/

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Check if everything is set up correctly
SELECT 
    'Notifications table created' as status,
    COUNT(*) as notification_count
FROM notifications;

SELECT 
    'RLS policies enabled' as status,
    COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'notifications';

-- ============================================================================
-- Usage Examples
-- ============================================================================

/*
-- Create a notification
SELECT create_notification(
  auth.uid(),
  'FINDING_CREATED',
  'New Finding',
  'SQL Injection found in search',
  '/dashboard/findings/abc123',
  '🔍'
);

-- Get unread notifications for current user
SELECT * FROM notifications
WHERE user_id = auth.uid() AND is_read = false
ORDER BY created_at DESC;

-- Mark a notification as read
UPDATE notifications
SET is_read = true, read_at = NOW()
WHERE id = 'notification-id' AND user_id = auth.uid();

-- Mark all as read
SELECT mark_all_notifications_read(auth.uid());

-- Clean up old notifications (30+ days old and read)
SELECT cleanup_old_notifications(30);
*/

