-- ============================================================================
-- Row Level Security (RLS) Policies for Payloads Table
-- ============================================================================

-- Enable RLS on payloads table (if not already enabled)
ALTER TABLE payloads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own payloads" ON payloads;
DROP POLICY IF EXISTS "Users can insert their own payloads" ON payloads;
DROP POLICY IF EXISTS "Users can update their own payloads" ON payloads;
DROP POLICY IF EXISTS "Users can delete their own payloads" ON payloads;

-- Policy 1: Users can view their own payloads
CREATE POLICY "Users can view their own payloads"
ON payloads
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own payloads
CREATE POLICY "Users can insert their own payloads"
ON payloads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own payloads
CREATE POLICY "Users can update their own payloads"
ON payloads
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own payloads
CREATE POLICY "Users can delete their own payloads"
ON payloads
FOR DELETE
USING (auth.uid() = user_id);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'payloads';

