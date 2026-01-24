import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

console.log('🔌 Attempting direct PostgreSQL connection via Supabase Pooler...\n');

// Supabase supports using service_role JWT as password for connection pooler
// Connection string format for Transaction Pooler (port 6543):
// postgres://postgres.[ref]:[JWT]@aws-0-[region].pooler.supabase.com:6543/postgres

// Try to connect using service role key as password
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

console.log('Connection details:');
console.log('  Project ref:', projectRef);
console.log('  Using: Transaction Pooler (port 6543)');
console.log('  Region: eu-central-1 (guessing, may need adjustment)\n');

const client = new Client({
  connectionString,
  connectionTimeoutMillis: 10000,
});

try {
  console.log('⏳ Connecting...\n');
  await client.connect();
  console.log('✅ Connected to PostgreSQL!\n');

  // Read migration SQL
  console.log('📝 Reading migration SQL...\n');
  const migrationSql = readFileSync('migration-054-059.sql', 'utf8');

  // Execute migration
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⏳ Executing migration SQL...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const result = await client.query(migrationSql);

  console.log('✅ Migration executed successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verify tables were created
  console.log('📊 Verifying tables...\n');

  const tables = ['roles', 'modules', 'organization_modules'];
  for (const table of tables) {
    const check = await client.query(`SELECT COUNT(*) FROM ${table}`);
    console.log(`  ✅ ${table}: ${check.rows[0].count} rows`);
  }

  console.log('\n✅ All tables verified!\n');

} catch (err) {
  console.error('❌ Connection error:', err.message);
  console.error('   Code:', err.code);

  if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    console.log('\n⚠️  Could not connect via pooler. Possible issues:');
    console.log('   - Incorrect region (tried eu-central-1)');
    console.log('   - Pooler not enabled for this project');
    console.log('   - Network connectivity issues\n');

    console.log('🔄 Alternative regions to try:');
    console.log('   - aws-0-us-east-1.pooler.supabase.com');
    console.log('   - aws-0-us-west-1.pooler.supabase.com');
    console.log('   - aws-0-ap-southeast-1.pooler.supabase.com\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  Please execute migration manually via Supabase Dashboard:\n');
  console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef);
  console.log('2. Navigate to: SQL Editor');
  console.log('3. Paste contents of: migration-054-059.sql');
  console.log('4. Click "Run"\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

} finally {
  await client.end();
}
