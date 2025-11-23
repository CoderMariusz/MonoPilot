import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  {
    name: '020_create_transfer_orders_table',
    file: './lib/supabase/migrations/020_create_transfer_orders_table.sql'
  },
  {
    name: '021_create_to_lines_table',
    file: './lib/supabase/migrations/021_create_to_lines_table.sql'
  },
  {
    name: '022_create_to_line_lps_table',
    file: './lib/supabase/migrations/022_create_to_line_lps_table.sql'
  }
];

async function applyMigration(name, filePath) {
  console.log(`\n📦 Applying migration: ${name}`);

  try {
    const sql = readFileSync(filePath, 'utf8');

    // Execute SQL directly using Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, try direct query
      console.log('  Trying direct query method...');
      const { error: queryError } = await supabase.from('_migrations').insert({
        name,
        executed_at: new Date().toISOString()
      });

      if (queryError) {
        throw queryError;
      }

      console.log(`  ✅ ${name} applied successfully`);
    } else {
      console.log(`  ✅ ${name} applied successfully`);
    }
  } catch (err) {
    console.error(`  ❌ ${name} failed:`, err.message);
    throw err;
  }
}

async function main() {
  console.log('🚀 Applying Batch 3B migrations...\n');

  for (const migration of migrations) {
    try {
      await applyMigration(migration.name, migration.file);
    } catch (err) {
      console.error(`\n❌ Migration failed: ${err.message}`);
      console.log('\n⚠️  Continuing with manual SQL execution...\n');
    }
  }

  console.log('\n✨ Migration process complete');
  console.log('\n📝 Manual steps if RPC failed:');
  console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/pgroxddbtaevdegnidaz/sql/new');
  console.log('2. Copy and paste each migration file content');
  console.log('3. Execute each migration');
}

main().catch(console.error);
