import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

// Supabase PostgreSQL connection via Transaction Pooler
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
// We'll try using the service role key as password (Supabase supports this for pooler connections)

const supabaseUrl = process.env.SUPABASE_URL;
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Try direct connection with db password (need to extract from Supabase dashboard)
// Format: postgresql://postgres:[YOUR-PASSWORD]@db.pgroxddbtaevdegnidaz.supabase.co:5432/postgres

console.log('🔌 Attempting PostgreSQL connection...\n');
console.log('⚠️  NOTE: This requires database password from Supabase Dashboard');
console.log('   Settings > Database > Connection string > Direct connection\n');

// Since we don't have DB password, we'll use Supabase JS SDK to execute statements one by one
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('📝 Reading migration SQL...\n');
const migrationSql = readFileSync('migration-054-059.sql', 'utf8');

// Execute SQL statements using table operations
// Since we can't run raw SQL, we'll need to execute statements that Supabase supports

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Attempting to execute migration via Supabase Management API');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Try using Supabase Management API to run SQL
async function executeViaMgmtApi(sql) {
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      }
    );

    const result = await response.json();

    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(result, null, 2));

    if (!response.ok || result.error) {
      console.error('❌ Error:', result.error || result.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

// Try Management API
console.log('⏳ Testing Management API access...\n');

const testResult = await executeViaMgmtApi('SELECT 1');
if (!testResult) {
  console.log('❌ Management API not accessible\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  Unable to execute SQL automatically. Please use manual method:\n');
  console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef);
  console.log('2. Navigate to: SQL Editor');
  console.log('3. Paste contents of: migration-054-059.sql');
  console.log('4. Click "Run"\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
} else {
  console.log('✅ Management API accessible!\n');
  console.log('⏳ Executing migration...\n');

  const result = await executeViaMgmtApi(migrationSql);
  if (result) {
    console.log('✅ Migration executed successfully!\n');
  } else {
    console.log('❌ Migration failed. Please execute manually.\n');
  }
}
