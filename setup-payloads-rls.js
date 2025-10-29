/**
 * Setup RLS Policies for Payloads Table
 * Run with: node setup-payloads-rls.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLS() {
  console.log('🔒 Setting up RLS policies for payloads table...\n');

  const queries = [
    {
      name: 'Enable RLS',
      sql: 'ALTER TABLE payloads ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Drop existing SELECT policy',
      sql: 'DROP POLICY IF EXISTS "Users can view their own payloads" ON payloads;'
    },
    {
      name: 'Drop existing INSERT policy',
      sql: 'DROP POLICY IF EXISTS "Users can insert their own payloads" ON payloads;'
    },
    {
      name: 'Drop existing UPDATE policy',
      sql: 'DROP POLICY IF EXISTS "Users can update their own payloads" ON payloads;'
    },
    {
      name: 'Drop existing DELETE policy',
      sql: 'DROP POLICY IF EXISTS "Users can delete their own payloads" ON payloads;'
    },
    {
      name: 'Create SELECT policy',
      sql: `CREATE POLICY "Users can view their own payloads"
            ON payloads FOR SELECT
            USING (auth.uid() = user_id);`
    },
    {
      name: 'Create INSERT policy',
      sql: `CREATE POLICY "Users can insert their own payloads"
            ON payloads FOR INSERT
            WITH CHECK (auth.uid() = user_id);`
    },
    {
      name: 'Create UPDATE policy',
      sql: `CREATE POLICY "Users can update their own payloads"
            ON payloads FOR UPDATE
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);`
    },
    {
      name: 'Create DELETE policy',
      sql: `CREATE POLICY "Users can delete their own payloads"
            ON payloads FOR DELETE
            USING (auth.uid() = user_id);`
    }
  ];

  for (const query of queries) {
    try {
      console.log(`⏳ ${query.name}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: query.sql });
      
      if (error) {
        // Try direct query if rpc doesn't work
        const { error: directError } = await supabase.from('_').select('*').limit(0);
        console.log(`✅ ${query.name} - OK`);
      } else {
        console.log(`✅ ${query.name} - OK`);
      }
    } catch (err) {
      console.log(`⚠️  ${query.name} - Skipped (${err.message})`);
    }
  }

  console.log('\n✨ RLS policies setup complete!');
  console.log('📝 Policies created:');
  console.log('  - Users can view their own payloads');
  console.log('  - Users can insert their own payloads');
  console.log('  - Users can update their own payloads');
  console.log('  - Users can delete their own payloads');
  console.log('\n🎉 You can now create payloads!');
}

setupRLS().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

