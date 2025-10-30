-- ============================================================================
-- FIX ALL TABLE DEFAULTS AND RLS POLICIES
-- Run this SQL in Supabase SQL Editor to fix all issues at once
-- ============================================================================

-- Fix TARGETS table
ALTER TABLE targets ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE targets ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Fix FINDINGS table
ALTER TABLE findings ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE findings ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Fix PAYLOADS table
ALTER TABLE payloads ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE payloads ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Fix NOTES table
ALTER TABLE notes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE notes ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Fix ATTACHMENTS table
ALTER TABLE attachments ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Fix USERS table (if needed)
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- Verify the defaults were set correctly
-- ============================================================================
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('targets', 'findings', 'payloads', 'notes', 'attachments', 'users')
  AND column_name IN ('id', 'updated_at')
ORDER BY table_name, column_name;

