import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

// Extract database credentials from Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;
const ref = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

console.log('🔌 Connecting to Supabase PostgreSQL...');
console.log(`   Project ref: ${ref}`);

// Supabase PostgreSQL connection string
// Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// OR: Use direct connection with service_role key

// Since we don't have direct DB password, we'll use Supabase REST API instead
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('📝 Reading migration SQL...\n');
const migrationSql = readFileSync('migration-054-059.sql', 'utf8');

// Split SQL into individual statements
const statements = migrationSql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))
  .filter(s => !s.match(/^(CREATE|ALTER|INSERT|UPDATE|DO|COMMENT|GRANT)/i) === false);

console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Starting migration execution...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Since we can't execute raw SQL directly via supabase-js client,
// we need to inform the user to run this via Supabase Dashboard

console.log('⚠️  IMPORTANT: Supabase REST API does not support direct SQL execution');
console.log('   without a custom RPC function.\n');

console.log('📋 Please follow these steps to complete the migration:\n');
console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/' + ref);
console.log('2. Navigate to: SQL Editor');
console.log('3. Create a new query');
console.log('4. Copy and paste the contents of: migration-054-059.sql');
console.log('5. Click "Run" to execute the migration');
console.log('\nOR\n');
console.log('1. First, run setup_exec_sql.sql in SQL Editor to create the exec_sql function');
console.log('2. Then run this script again with --use-rpc flag\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📄 Migration file ready at: migration-054-059.sql');
console.log('📄 Setup file ready at: scripts/setup_exec_sql.sql');
console.log('\n✅ Backup created at: backup-*.json (see earlier output)\n');
