#!/usr/bin/env node
/**
 * Apply migration 107 - Fix Settings RLS Policies to PRODUCTION database
 * This script applies the RLS policies migration directly to Supabase PRODUCTION
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_REF = 'pgroxddbtaevdegnidaz'; // PRODUCTION
const ACCESS_TOKEN = 'sbp_11f65c1a940eb66ed8084ce71b04bdf026ee1b56';

const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '107_fix_settings_rls_policies.sql');

async function applyMigration() {
  try {
    console.log('📖 Reading migration 107 file...');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Applying migration to PRODUCTION Supabase (pgroxddbtaevdegnidaz)...');
    console.log('⚠️  WARNING: This will modify the PRODUCTION database!');

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Migration failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Migration 107 applied successfully to PRODUCTION!');
    console.log('Result:', result);

    console.log('\n📋 Next steps:');
    console.log('   1. Test Settings CRUD operations (Tax Codes, Warehouses, etc.)');
    console.log('   2. Verify all 8 Settings tables are working');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    console.error('\n📝 Manual application required:');
    console.error('   1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
    console.error('   2. Copy the contents of: apps/frontend/lib/supabase/migrations/107_fix_settings_rls_policies.sql');
    console.error('   3. Paste and run in the SQL editor');
    process.exit(1);
  }
}

applyMigration();
