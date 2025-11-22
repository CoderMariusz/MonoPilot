#!/usr/bin/env node

/**
 * Apply migration 012 patch (Update RLS for service role) via Supabase Management API
 * Enables integration tests using service role key
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=<your-token> node scripts/apply-migration-012-patch.mjs');
  console.error('   Or add to .env file (make sure .env is in .gitignore!)');
  process.exit(1);
}

console.log('🔄 Applying migration 012 patch (RLS for service role) via Management API...\\n');

// Read migration file
const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '012_patch_rls_for_service_role.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Migration patch failed:', response.status, response.statusText);
      console.error('Response:', errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 012 patch applied successfully!');
    console.log('\\n📋 Updated:');
    console.log('   - tax_codes_select_policy (allow service role)');
    console.log('   - tax_codes_insert_policy (allow service role)');
    console.log('   - tax_codes_update_policy (allow service role)');
    console.log('   - tax_codes_delete_policy (allow service role)');
    console.log('\\n🎯 Benefits:');
    console.log('   - Integration tests can now use service role key');
    console.log('   - Service role bypasses auth context requirements');
    console.log('   - Production policies remain secure for regular users\\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
