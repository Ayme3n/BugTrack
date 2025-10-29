-- ============================================================================
-- Notes Table Setup: Defaults + RLS Policies
-- ============================================================================

-- Add default UUID and timestamp for notes
ALTER TABLE notes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE notes ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- Policy 1: Users can view their own notes
CREATE POLICY "Users can view their own notes"
ON notes FOR SELECT
USING (auth.uid()::text = user_id);

-- Policy 2: Users can insert their own notes
CREATE POLICY "Users can insert their own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Policy 3: Users can update their own notes
CREATE POLICY "Users can update their own notes"
ON notes FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy 4: Users can delete their own notes
CREATE POLICY "Users can delete their own notes"
ON notes FOR DELETE
USING (auth.uid()::text = user_id);

